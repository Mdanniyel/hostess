/**
 * AppState — global reactive state for the application.
 *
 * Reads exclusively from IndexedDB via Dexie liveQuery.
 * Never calls the server directly — that's SyncEngine's job.
 * UI components read $state from here.
 */

import { liveQuery } from 'dexie';
import { db, type EventRecord } from '../db';

class AppState {
  /** Today's events, automatically kept in sync with IndexedDB */
  todayEvents = $state<EventRecord[]>([]);

  /** Browser network connectivity */
  isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);

  /** True while a sync operation is in progress */
  isSyncing = $state(false);

  /** Last sync error message, cleared on next success */
  syncError = $state<string | null>(null);

  constructor() {
    if (typeof window === 'undefined') return;

    // Subscribe to events table — updates automatically when login or sync writes to it
    liveQuery(() => db.events.toArray()).subscribe({
      next: (events) => {
        this.todayEvents = events;
        console.log('AppState: todayEvents updated from DB —', events.length, 'event(s)');
      },
      error: (err) => {
        console.error('AppState: liveQuery error on events table:', err);
      }
    });

    // Track browser online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
}

export const appState = new AppState();
