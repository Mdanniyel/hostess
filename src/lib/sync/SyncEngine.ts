/**
 * SyncEngine — the application's bidirectional sync loop.
 *
 * Created once after login. Lives until logout.
 * Sends one unified request that pushes mutations and pulls delta.
 *
 * WHO CALLS IT?  AppState (setActiveEvent, clearActiveEvent, destroy)
 * WHAT DOES IT CALL?  SyncApi (fetch) and Dexie (IndexedDB read/write via applySyncResponse)
 */

import { liveQuery } from 'dexie';
import type { HostessDatabase } from '../db';
import type { SyncApi, SyncRequestPayload, SyncResponse } from '../api/SyncApi';
import { applySyncResponse } from './applySyncResponse';

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncEngineConfig {
  appVersion: string;
  networkTimeout: number;    // ms, default 3000
  heartbeatInterval: number; // ms, default 15000
  maxRetryDelay: number;     // ms, default 30000
}

export interface SyncEngineDeps {
  db: HostessDatabase;
  api: SyncApi;
  config: SyncEngineConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────────────────────────────────────

export class SyncEngine {
  private db: HostessDatabase;
  private api: SyncApi;
  private config: SyncEngineConfig;

  private isSyncing = false;
  private activeEventId: number | null = null;
  private heartbeatTimerId: ReturnType<typeof setInterval> | null = null;
  private retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private retryDelay: number;
  private queueSubscription: { unsubscribe(): void } | null = null;
  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor(deps: SyncEngineDeps) {
    this.db = deps.db;
    this.api = deps.api;
    this.config = deps.config;
    this.retryDelay = 5000;

    this.setupQueueObserver();
    this.setupNetworkListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Public
  // ═══════════════════════════════════════════════════════════════════════════

  setActiveEvent(eventId: number): void {
    this.activeEventId = eventId;
    this.startHeartbeat();
    this.processSync();
  }

  clearActiveEvent(): void {
    this.activeEventId = null;
    this.stopHeartbeat();
  }

  async refreshEventList(): Promise<void> {
    await this.processSync({ refreshEvents: true });
  }

  async forceSync(): Promise<void> {
    await this.processSync();
  }

  destroy(): void {
    this.stopHeartbeat();
    this.clearRetry();
    this.queueSubscription?.unsubscribe();
    this.queueSubscription = null;
    this.teardownNetworkListeners();
    this.activeEventId = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Core sync loop
  // ═══════════════════════════════════════════════════════════════════════════

  private async processSync(options?: { refreshEvents?: boolean }): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;
    this.emit('sync:start');

    try {
      // 1. Read queue
      const queueItems = await this.db.outbound_sync_queue.toArray();

      // 2. Read sync cursor
      let lastSyncedAt: number | null = null;
      if (this.activeEventId) {
        const syncState = await this.db.sync_states.get(this.activeEventId);
        lastSyncedAt = syncState?.last_synced_at ?? null;
      }

      // 3. Read session
      const session = await this.db.sessions.get('current');
      if (!session?.access_token) {
        this.isSyncing = false;
        return;
      }

      // 4. Read device config
      const deviceConfig = await this.db.device_config.get('current');
      const tabletUid = deviceConfig?.tablet_uid ?? 'pwa_unknown';

      // 5. Build payload
      const payload: SyncRequestPayload = {
        meta: {
          tablet_uid: tabletUid,
          app_version: this.config.appVersion
        },
        pull: {
          today_events: options?.refreshEvents ?? false,
          event_delta: this.activeEventId
            ? { event_id: this.activeEventId, last_synced_at: lastSyncedAt }
            : null
        },
        mutations: queueItems.map(item => ({
          action_id: item.id!,
          event_id: item.event_id,
          action_type: item.action_type,
          payload: item.payload
        }))
      };

      // 6. Send with timeout (Lie-Fi protection)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.networkTimeout);

      const response = await this.api.sync(payload, {
        signal: controller.signal,
        token: session.access_token
      });

      clearTimeout(timeoutId);

      // 7. Apply response to IndexedDB
      await applySyncResponse(response);

      // 8. Success — reset retry
      this.retryDelay = 5000;
      this.emit('sync:complete', { success: true });

      // 9. Update queue count
      const newCount = await this.db.outbound_sync_queue.count();
      this.emit('sync:queue-changed', { length: newCount });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.emit('sync:error', { message: 'Network timeout (Lie-Fi)' });
      } else if (err.statusCode === 401) {
        this.emit('directive:force-logout', { reason: 'session_expired' });
        this.isSyncing = false;
        return;
      } else {
        this.emit('sync:error', { message: err.message || 'Sync failed' });
      }
      this.emit('sync:complete', { success: false });
      this.scheduleRetry();
    } finally {
      this.isSyncing = false;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Timers & observers
  // ═══════════════════════════════════════════════════════════════════════════

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimerId = setInterval(() => {
      if (!this.isSyncing && navigator.onLine) {
        this.processSync();
      }
    }, this.config.heartbeatInterval); // 5 minutes
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimerId) {
      clearInterval(this.heartbeatTimerId);
      this.heartbeatTimerId = null;
    }
  }

  private scheduleRetry(): void {
    this.clearRetry();
    this.retryTimeoutId = setTimeout(() => {
      this.processSync();
    }, this.retryDelay);
    this.retryDelay = Math.min(this.retryDelay * 2, this.config.maxRetryDelay);
  }

  private clearRetry(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
      this.retryTimeoutId = null;
    }
  }

  private setupQueueObserver(): void {
    const observable = liveQuery(() => this.db.outbound_sync_queue.count());
    this.queueSubscription = observable.subscribe(count => {
      this.emit('sync:queue-changed', { length: count });
      // Instant push: new item in queue + online + not already syncing
      if (count > 0 && navigator.onLine && !this.isSyncing) {
        this.processSync();
      }
    });
  }

  private setupNetworkListeners(): void {
    this.onlineHandler = () => {
      this.clearRetry();
      this.retryDelay = 5000;
      this.processSync();
    };
    this.offlineHandler = () => {
      this.stopHeartbeat();
      this.clearRetry();
    };
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
  }

  private teardownNetworkListeners(): void {
    if (this.onlineHandler) window.removeEventListener('online', this.onlineHandler);
    if (this.offlineHandler) window.removeEventListener('offline', this.offlineHandler);
    this.onlineHandler = null;
    this.offlineHandler = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EventEmitter
  // ═══════════════════════════════════════════════════════════════════════════

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const cbs = this.listeners.get(event);
    if (cbs) this.listeners.set(event, cbs.filter(cb => cb !== callback));
  }

  private emit(event: string, data?: any): void {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach(cb => cb(data));
  }
}
