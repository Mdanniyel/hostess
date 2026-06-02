/**
 * applySyncResponse — writes the server sync response to IndexedDB.
 *
 * This is a pure function (no side effects beyond DB writes).
 * Everything happens in ONE atomic Dexie transaction — if anything fails,
 * nothing is written (all-or-nothing).
 *
 * Called by SyncEngine.applyResponse() after a successful fetch.
 *
 * Steps:
 *   1. Delete accepted mutations from outbound_sync_queue
 *   2. Resolve IDs (replace UUID → Integer in invitations and related arrivals)
 *   3. Apply delta (bulkPut all changed entities)
 *   4. Update sync_states with new last_synced_at cursor
 *   5. Update events table if today_events was returned
 *   6. Handle rejected mutations (delete from queue)
 */

import { db } from '../db';
import type { SyncResponse } from '../api/SyncApi';

export async function applySyncResponse(response: SyncResponse): Promise<void> {
  await db.transaction('rw',
    [db.outbound_sync_queue, db.invitations, db.actual_arrivals,
     db.event_tables, db.table_seatings, db.groups, db.events, db.sync_states],
    async () => {

      // ─── Step 1: Remove accepted mutations from queue ───────────────────
      const acceptedIds = response.mutation_results.accepted;
      if (acceptedIds.length > 0) {
        await db.outbound_sync_queue.bulkDelete(acceptedIds);
      }

      // ─── Step 2: Resolve IDs (UUID → Integer) ──────────────────────────
      for (const [uuid, serverId] of Object.entries(response.resolved_ids)) {
        // 2a. Replace the invitation record: delete UUID key, put with Integer key
        const invitation = await db.invitations.get(uuid);
        if (invitation) {
          await db.invitations.delete(uuid);
          await db.invitations.put({ ...invitation, id: serverId });
        }

        // 2b. Update all arrivals pointing to this UUID
        const arrivals = await db.actual_arrivals
          .where('invitation_id').equals(uuid).toArray();
        for (const arrival of arrivals) {
          await db.actual_arrivals.update(arrival.uid, { invitation_id: serverId });
        }

        // 2c. Update pending queue items that reference this UUID
        const pendingItems = await db.outbound_sync_queue.toArray();
        for (const item of pendingItems) {
          if (item.payload?.invitation_id === uuid) {
            await db.outbound_sync_queue.update(item.id!, {
              payload: { ...item.payload, invitation_id: serverId }
            });
          }
        }
      }

      // ─── Step 3: Apply delta ────────────────────────────────────────────
      if (response.event_delta) {
        const delta = response.event_delta;

        if (delta.groups.length > 0) {
          await db.groups.bulkPut(delta.groups);
        }
        if (delta.tables.length > 0) {
          await db.event_tables.bulkPut(delta.tables);
        }
        if (delta.invitations.length > 0) {
          await db.invitations.bulkPut(delta.invitations);
        }
        if (delta.table_seatings.length > 0) {
          await db.table_seatings.bulkPut(delta.table_seatings);
        }
        if (delta.actual_arrivals.length > 0) {
          await db.actual_arrivals.bulkPut(delta.actual_arrivals.map(a => ({
            ...a,
            id: a.id ?? null // ensure id field exists even if server sends it
          })));
        }

        // ─── Step 4: Update sync cursor ─────────────────────────────────────
        await db.sync_states.put({
          event_id: delta.event_id,
          last_synced_at: delta.last_synced_at,
          status: 'synced'
        });
      }

      // ─── Step 5: Update events list (if returned) ─────────────────────────
      if (response.today_events) {
        await db.events.clear();
        await db.events.bulkPut(response.today_events);
      }

      // ─── Step 6: Remove rejected mutations from queue ─────────────────────
      if (response.mutation_results.rejected.length > 0) {
        const rejectedIds = response.mutation_results.rejected.map(r => r.action_id);
        await db.outbound_sync_queue.bulkDelete(rejectedIds);
      }
    }
  );
}
