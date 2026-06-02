/**
 * applyLoginResponse — saves the login response to IndexedDB.
 *
 * Called after a successful login. Stores:
 *   1. Session record (token, account info)
 *   2. Today's events list
 *
 * Both writes happen in one atomic transaction.
 */

import { db } from '../db';
import type { LoginResponse } from '../api/SyncApi';

export async function applyLoginResponse(response: LoginResponse): Promise<void> {
  await db.transaction('rw', [db.sessions, db.events], async () => {
    // Store session
    await db.sessions.put({
      id: 'current',
      access_token: response.session.access_token,
      expires_at: response.session.expires_at,
      account_id: response.session.account_id,
      account_email: response.session.account_email,
      service_provider_id: response.session.service_provider_id,
      service_provider_name: response.session.service_provider_name
    });

    // Store today's events
    await db.events.clear();
    await db.events.bulkPut(response.today_events);
  });
}
