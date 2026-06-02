/**
 * Local database schema (IndexedDB via Dexie.js).
 *
 * This file defines:
 *   1. TypeScript interfaces for every table (matching the server JSON exactly)
 *   2. The Dexie database class with typed tables
 *   3. The singleton db instance used throughout the app
 */

import Dexie, { type Table } from 'dexie';

// ─────────────────────────────────────────────────────────────────────────────
// Record Types — match the JSON the server sends
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionRecord {
  id: string; // always 'current'
  access_token: string;
  expires_at: number; // ms
  account_id: number;
  account_email: string;
  service_provider_id: number;
  service_provider_name: string;
  person_name?: string;
}

export interface DeviceConfigRecord {
  id: string; // always 'current'
  tablet_uid: string;
  enable_audio_feedback: boolean;
}

export interface SyncStateRecord {
  event_id: number;
  last_synced_at: number; // ms — value from server, used as cursor for next sync
  status: 'synced' | 'error';
}

export interface EventRecord {
  id: number;
  sp_event_title: string;
  event_type: string;
  start_at: number; // ms
  status: string;
  photo_url: string | null;
  updated_at: number; // ms
}

export interface GroupRecord {
  id: number;
  event_id: number;
  name: string;
  color_index: number;
  updated_at: number; // ms
}

export interface TableRecord {
  id: number;
  num: number;
  name: string | null;
  seats_count: number;
  optioned: boolean;
  seating_restricted: boolean;
  updated_at: number; // ms
}

export interface InvitationRecord {
  id: number | string; // Integer from server, or "inv_<uuid>" for local walk-ins
  event_id: number;
  title: string;
  phone: string | null;
  expected_guests_count: number;
  arrived_guests_count_by_hostess: number;
  side: number;
  group_id: number | null;
  updated_at: number; // ms
}

export interface TableSeatingRecord {
  id: number;
  table_id: number;
  invitation_id: number;
  guests_count: number;
  guests_names: string | null;
  optioned_seats: number;
  vip_seats: number;
  baby_chairs: number;
  wheel_chairs: number;
  glat_meals: number;
  vegetarian_meals: number;
  vegan_meals: number;
  gluten_meals: number;
  child_meals: number;
  updated_at: number; // ms
}

export interface ActualArrivalRecord {
  uid: string; // PK — "chk_<uuid>", generated client-side
  id: number | null; // server ID, null until synced
  event_id: number;
  invitation_id: number | string; // Integer or "inv_<uuid>" for unsynced walk-ins
  table_num: number;
  guests_count: number; // positive = check-in, negative = cancellation
  tablet_uid: string;
  created_at: number; // ms
  updated_at: number; // ms
}

export interface OutboundQueueRecord {
  id?: number; // auto-increment
  event_id: number;
  action_type: 'create_arrival' | 'create_invitation';
  payload: Record<string, any>;
  created_at: number; // ms
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Class
// ─────────────────────────────────────────────────────────────────────────────

class HostessDatabase extends Dexie {
  sessions!: Table<SessionRecord, string>;
  device_config!: Table<DeviceConfigRecord, string>;
  sync_states!: Table<SyncStateRecord, number>;
  events!: Table<EventRecord, number>;
  groups!: Table<GroupRecord, number>;
  event_tables!: Table<TableRecord, number>;
  invitations!: Table<InvitationRecord, number | string>;
  table_seatings!: Table<TableSeatingRecord, number>;
  actual_arrivals!: Table<ActualArrivalRecord, string>;
  outbound_sync_queue!: Table<OutboundQueueRecord, number>;

  constructor() {
    super('HostessDB');
    this.version(1).stores({
      sessions: 'id',
      device_config: 'id',
      sync_states: 'event_id',
      events: 'id',
      groups: 'id, event_id',
      event_tables: 'id, num',
      invitations: 'id, event_id, group_id',
      table_seatings: 'id, table_id, invitation_id',
      actual_arrivals: 'uid, event_id, invitation_id',
      outbound_sync_queue: '++id, event_id'
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

export const db = new HostessDatabase();
export type { HostessDatabase };
