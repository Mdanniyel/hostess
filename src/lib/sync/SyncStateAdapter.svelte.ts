/**
 * SyncStateAdapter — Thin Svelte 5 wrapper around SyncEngine.
 *
 * This is the ONLY file in the sync layer that imports Svelte.
 * It bridges the pure-TypeScript SyncEngine with Svelte's reactive system ($state).
 *
 * Responsibilities:
 *   - Holds reactive $state variables that UI components can read
 *   - Listens to SyncEngine events and updates $state accordingly
 *   - Exposes methods that UI components can call (forceSync, initialize, destroy)
 *
 * Does NOT:
 *   - Contain any sync logic (that's SyncEngine's job)
 *   - Access IndexedDB directly
 *   - Make network requests
 *
 * Usage in Svelte components:
 *   import { syncState } from '$lib/sync/SyncStateAdapter.svelte';
 *   {#if syncState.isSyncing} ... {/if}
 *   <button onclick={() => syncState.forceSync()}>Sync Now</button>
 */

import { SyncEngine, type SyncEngineConfig } from './SyncEngine';
import type { HostessDatabase } from '../db';
import type { SyncApi } from '../api/SyncApi';

// ─────────────────────────────────────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────────────────────────────────────

class SyncStateAdapter {
  // --- Reactive state (read by UI components) ---

  /** Whether a sync request is currently in-flight */
  isSyncing: boolean = $state(false);

  /** Timestamp of the last successful sync (from server clock) */
  lastSyncedAt: number | null = $state(null);

  /** Number of mutations waiting in the outbound queue */
  queueLength: number = $state(0);

  /** Last sync error message (null if last sync was successful) */
  lastError: string | null = $state(null);

  // --- Private ---
  private engine: SyncEngine | null = null;

  /**
   * Creates the SyncEngine instance and wires up event listeners.
   * Called once during app initialization (after login).
   *
   * @param db - Dexie database instance
   * @param api - SyncApi instance
   * @param config - Engine configuration
   */
  setup(db: HostessDatabase, api: SyncApi, config: SyncEngineConfig): void {
    // TODO: implement — create SyncEngine, register event listeners that update $state
  }

  /**
   * Starts sync for a specific event.
   * Delegates to SyncEngine.initialize(eventId).
   *
   * @param eventId - The event to start syncing
   */
  initialize(eventId: number): void {
    // TODO: implement
  }

  /**
   * Stops sync and cleans up.
   * Delegates to SyncEngine.destroy().
   */
  destroy(): void {
    // TODO: implement
  }

  /**
   * Flushes pending data and refreshes event list.
   * Delegates to SyncEngine.returnToLobby().
   */
  async returnToLobby(): Promise<void> {
    // TODO: implement
  }

  /**
   * Forces an immediate sync cycle.
   * Delegates to SyncEngine.forceSync().
   */
  async forceSync(): Promise<void> {
    // TODO: implement
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton Export
// ─────────────────────────────────────────────────────────────────────────────

/** Global singleton — import this in Svelte components to read sync state */
export const syncState = new SyncStateAdapter();
