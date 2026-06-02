/**
 * AuthService — manages login, logout, and session state.
 *
 * Reads/writes the session from IndexedDB (db.sessions).
 * Uses SyncApi for network calls.
 * Exposes reactive $state for the UI to read.
 */

import { db, type SessionRecord } from '$lib/db';
import { SyncApi, ApiError } from '$lib/api/SyncApi';
import { applyLoginResponse } from '$lib/sync/applyLoginResponse';
import { getApiUrl } from '$lib/services/hostConfig';

const api = new SyncApi(getApiUrl());

class AuthService {
  currentSession = $state<SessionRecord | null>(null);
  isAuthenticated = $derived(this.currentSession !== null);

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadSession();
    }
  }

  /**
   * Restores session from IndexedDB on app startup.
   * If session exists and hasn't expired, sets currentSession.
   * If expired or missing, clears state.
   */
  async loadSession(): Promise<void> {
    try {
      const session = await db.sessions.get('current');
      if (session && session.expires_at > Date.now()) {
        this.currentSession = session;
      } else if (session) {
        // Expired — clean up
        await db.sessions.delete('current');
        this.currentSession = null;
      }
    } catch (err) {
      console.error('AuthService: Failed to load session:', err);
    }
  }

  /**
   * Authenticates with the server. On success, saves session + today_events to IndexedDB.
   * Returns { success: true } or { success: false, error: string }.
   */
  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await api.login(email, password);

      // Write session + events to IndexedDB in one transaction
      await applyLoginResponse(response);

      // Update reactive state
      this.currentSession = await db.sessions.get('current') ?? null;

      return { success: true };
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          return { success: false, error: 'שם המשתמש או הסיסמה אינם נכונים' };
        }
        return { success: false, error: err.message };
      }
      return { success: false, error: 'לא ניתן להתחבר לשרת. אנא ודאו שאתם מחוברים לאינטרנט ונסו שנית.' };
    }
  }

  /**
   * Logs out: revokes token on server (best-effort), wipes all local data.
   */
  async logout(): Promise<void> {
    const token = this.currentSession?.access_token;

    // Best-effort server logout
    if (token) {
      await api.logout(token);
    }

    // Wipe all local data
    await db.delete();
    await db.open();

    this.currentSession = null;
  }
}

export const authService = new AuthService();
