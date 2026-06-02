/**
 * Singleton SyncEngine instance.
 *
 * Created lazily on first access (after login, when session exists).
 * Destroyed on logout.
 */

import { db } from '../db';
import { SyncApi } from '../api/SyncApi';
import { SyncEngine } from './SyncEngine';
import { getApiUrl } from '../services/hostConfig';

let instance: SyncEngine | null = null;

export function getSyncEngine(): SyncEngine {
  if (!instance) {
    instance = new SyncEngine({
      db,
      api: new SyncApi(getApiUrl()),
      config: {
        appVersion: '2.0.0',
        networkTimeout: 3000,
        heartbeatInterval: 5 * 60 * 1000, // 5 minutes
        maxRetryDelay: 30000
      }
    });
  }
  return instance;
}

export function destroySyncEngine(): void {
  if (instance) {
    instance.destroy();
    instance = null;
  }
}
