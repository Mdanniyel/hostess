/**
 * EventState — reactive state for the active event.
 *
 * Holds all event data in $state (populated via liveQuery from IndexedDB).
 * Provides computed properties and helper methods for the UI.
 * Triggers sync when an event is selected.
 *
 * The UI reads from here. It never touches IndexedDB or the network directly.
 */

import { liveQuery } from 'dexie';
import { db, type GroupRecord, type TableRecord, type TableSeatingRecord, type ActualArrivalRecord } from '../db';
import '../models/Invitation'; // registers mapToClass
import { Invitation } from '../models/Invitation';
import { getSyncEngine } from '../sync/syncEngineInstance';

class EventState {
  // --- Reactive data (populated by liveQuery) ---
  invitations = $state<Invitation[]>([]);
  groups = $state<GroupRecord[]>([]);
  tables = $state<TableRecord[]>([]);
  tableSeatings = $state<TableSeatingRecord[]>([]);
  arrivals = $state<ActualArrivalRecord[]>([]);

  // --- UI state ---
  searchQuery = $state('');
  isLoading = $state(false);
  activeEventId = $state<number | null>(null);

  // --- Derived ---
  filteredInvitations = $derived.by(() => this.computeFilteredInvitations());
  totalExpected = $derived(this.invitations.reduce((sum, inv) => sum + inv.expected_guests_count, 0));
  totalArrived = $derived(this.arrivals.reduce((sum, a) => sum + a.guests_count, 0));

  // --- Private ---
  private subscriptions: Array<{ unsubscribe(): void }> = [];

  /**
   * Load an event: trigger sync, set up liveQueries.
   * Called by the event layout when the route param changes.
   */
  async loadEvent(eventId: number): Promise<void> {
    // Clean up previous event subscriptions
    this.destroy();
    this.activeEventId = eventId;
    this.isLoading = true;

    // Set up liveQueries — they auto-update $state when IndexedDB changes
    this.subscriptions.push(
      liveQuery(() => db.invitations.where('event_id').equals(eventId).toArray())
        .subscribe({ next: (data) => { this.invitations = data as unknown as Invitation[]; } })
    );
    this.subscriptions.push(
      liveQuery(() => db.groups.where('event_id').equals(eventId).toArray())
        .subscribe({ next: (data) => { this.groups = data; } })
    );
    this.subscriptions.push(
      liveQuery(() => db.event_tables.toArray())
        .subscribe({ next: (data) => { this.tables = data; } })
    );
    this.subscriptions.push(
      liveQuery(() => db.table_seatings.toArray())
        .subscribe({ next: (data) => { this.tableSeatings = data; } })
    );
    this.subscriptions.push(
      liveQuery(() => db.actual_arrivals.where('event_id').equals(eventId).toArray())
        .subscribe({ next: (data) => { this.arrivals = data; } })
    );

    // Trigger initial sync to populate IndexedDB
    await this.syncFromServer(eventId);
    this.isLoading = false;
  }

  /** Clean up subscriptions when leaving the event */
  destroy(): void {
    // Flush any pending counts before cleanup
    this.flushPendingCounts();
    this.clearFlushTimer();
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    this.invitations = [];
    this.groups = [];
    this.tables = [];
    this.tableSeatings = [];
    this.arrivals = [];
    this.searchQuery = '';
    this.pendingCounts = {};
    this.activeEventId = null;
  }

  // --- Helpers for UI ---

  getArrivedCount(invitationId: number | string): number {
    const inv = this.invitations.find(i => i.id === invitationId);
    return inv ? inv.arrivedCount : 0;
  }

  getGroupName(groupId: number | null): string | null {
    if (!groupId) return null;
    return this.groups.find(g => g.id === groupId)?.name ?? null;
  }

  // --- Mutations (write to IndexedDB + outbound queue atomically) ---

  // Pending check-in counts per invitation+table, not yet saved to DB.
  // Key format: "invitationId:tableNum"
  pendingCounts: Record<string, number> = $state({});
  private flushTimerId: ReturnType<typeof setTimeout> | null = null;
  private readonly FLUSH_DELAY = 2000; // 2 seconds after last click

  /**
   * Increment or decrement the pending arrival count for a table.
   * Does NOT write to DB immediately — waits 8 seconds of inactivity then flushes.
   * This prevents creating 7 records when the user clicks +5 then -1 then +1.
   */
  adjustCount(invitationId: number | string, tableNum: number, delta: number): void {
    const key = `${invitationId}:${tableNum}`;
    this.pendingCounts[key] = (this.pendingCounts[key] ?? 0) + delta;
    this.scheduleFlush();
  }

  /**
   * Get the pending (unsaved) count for a specific invitation+table.
   * UI adds this to the DB value to show the "live" number.
   */
  getPendingCount(invitationId: number | string, tableNum: number): number {
    return this.pendingCounts[`${invitationId}:${tableNum}`] ?? 0;
  }

  /**
   * Returns true if there are any unsaved pending counts.
   */
  get hasPendingChanges(): boolean {
    return Object.values(this.pendingCounts).some(v => v !== 0);
  }

  /**
   * Flush all pending counts to DB immediately.
   * Called by the debounce timer, and also when navigating away from the screen.
   */
  async flushPendingCounts(): Promise<void> {
    this.clearFlushTimer();
    const entries = Object.entries(this.pendingCounts).filter(([_, count]) => count !== 0);
    if (entries.length === 0) return;

    // Clear pending state before writing (so UI shows "saved" state)
    const toFlush = [...entries];
    this.pendingCounts = {};

    for (const [key, guestsCount] of toFlush) {
      const [invitationId, tableNumStr] = key.split(':');
      const tableNum = Number(tableNumStr);
      const parsedInvId = isNaN(Number(invitationId)) ? invitationId : Number(invitationId);
      await this.writeCheckIn(parsedInvId, guestsCount, tableNum);
    }
  }

  private scheduleFlush(): void {
    this.clearFlushTimer();
    this.flushTimerId = setTimeout(() => this.flushPendingCounts(), this.FLUSH_DELAY);
  }

  private clearFlushTimer(): void {
    if (this.flushTimerId) {
      clearTimeout(this.flushTimerId);
      this.flushTimerId = null;
    }
  }

  /**
   * Low-level: write a single check-in record to DB + outbound queue.
   * Called by flushPendingCounts, not directly by UI.
   */
  private async writeCheckIn(invitationId: number | string, guestsCount: number, tableNum: number): Promise<void> {
    if (!this.activeEventId || guestsCount === 0) return;

    const uid = `chk_${crypto.randomUUID()}`;
    const now = Date.now();

    await db.transaction('rw', [db.actual_arrivals, db.outbound_sync_queue], async () => {
      await db.actual_arrivals.put({
        uid,
        id: null,
        event_id: this.activeEventId!,
        invitation_id: invitationId,
        table_num: tableNum,
        guests_count: guestsCount,
        tablet_uid: 'pwa_dev', // TODO: read from device_config
        created_at: now,
        updated_at: now
      });

      await db.outbound_sync_queue.add({
        event_id: this.activeEventId!,
        action_type: 'create_arrival',
        payload: {
          uid,
          invitation_id: invitationId,
          table_num: tableNum,
          guests_count: guestsCount,
          timestamp: now
        },
        created_at: now
      });
    });
  }

  /**
   * Legacy method kept for compatibility. Flushes immediately (no debounce).
   */
  async recordCheckIn(invitationId: number | string, guestsCount: number, tableNum: number): Promise<void> {
    await this.writeCheckIn(invitationId, guestsCount, tableNum);
  }

  /**
   * Record a new Walk-in invitation locally and queue sync mutations.
   */
  async recordWalkIn(
    title: string,
    phone: string | null,
    side: number,
    tables: Array<{ tableNum: number; arrivedCount: number }>
  ): Promise<string> {
    if (!this.activeEventId) throw new Error('No active event');

    const uuid = `inv_${crypto.randomUUID()}`;
    const now = Date.now();

    await db.transaction('rw', [db.invitations, db.actual_arrivals, db.outbound_sync_queue], async () => {
      const totalArrived = tables.reduce((sum, t) => sum + t.arrivedCount, 0);

      // 1. Create the invitation record locally
      await db.invitations.put({
        id: uuid,
        event_id: this.activeEventId!,
        title: title.trim(),
        phone: phone?.trim() || null,
        expected_guests_count: 0,
        arrived_guests_count_by_hostess: totalArrived,
        side: side,
        group_id: null,
        updated_at: now
      });

      // 2. Queue create_invitation in outbound queue
      await db.outbound_sync_queue.add({
        event_id: this.activeEventId!,
        action_type: 'create_invitation',
        payload: {
          id: uuid,
          title: title.trim(),
          phone: phone?.trim() || null,
          expected_guests_count: 0,
          side: side,
          group_id: null,
          timestamp: now
        },
        created_at: now
      });

      // 3. Queue create_arrival in outbound queue for each table
      for (const item of tables) {
        if (item.arrivedCount <= 0) continue;
        const arrivalUid = `chk_${crypto.randomUUID()}`;

        await db.actual_arrivals.put({
          uid: arrivalUid,
          id: null,
          event_id: this.activeEventId!,
          invitation_id: uuid,
          table_num: item.tableNum,
          guests_count: item.arrivedCount,
          tablet_uid: 'pwa_dev',
          created_at: now,
          updated_at: now
        });

        await db.outbound_sync_queue.add({
          event_id: this.activeEventId!,
          action_type: 'create_arrival',
          payload: {
            uid: arrivalUid,
            invitation_id: uuid,
            table_num: item.tableNum,
            guests_count: item.arrivedCount,
            timestamp: now
          },
          created_at: now
        });
      }
    });

    return uuid;
  }

  // --- Private ---

  private computeFilteredInvitations(): Invitation[] {
    if (!this.searchQuery.trim()) return this.invitations;
    const q = this.searchQuery.trim().toLowerCase();
    return this.invitations.filter(inv =>
      inv.title?.toLowerCase().includes(q) ||
      inv.phone?.includes(q)
    );
  }

  private async syncFromServer(eventId: number): Promise<void> {
    try {
      const engine = getSyncEngine();
      engine.setActiveEvent(eventId);
    } catch (err) {
      console.error('EventState: sync failed:', err);
    }
  }
}

export const eventState = new EventState();
