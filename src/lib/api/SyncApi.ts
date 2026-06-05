/**
 * SyncApi — HTTP layer for the checkin API.
 *
 * The ONLY class that performs network requests.
 * Does not know about IndexedDB, Svelte, or SyncEngine.
 * Translates parameters into fetch calls and returns parsed JSON.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types — Request
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncRequestPayload {
  meta: {
    tablet_uid: string;
    app_version: string;
  };
  pull: {
    today_events: boolean;
    event_delta: { event_id: number; last_synced_at: number | null } | null;
  };
  mutations: SyncMutation[];
}

export interface SyncMutation {
  action_id: number;
  event_id: number;
  action_type: 'create_arrival' | 'create_invitation';
  payload: Record<string, any>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types — Response
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncResponse {
  meta: {
    status: string;
    last_synced_at: number | null; // ms
  };
  today_events?: EventShellResponse[];
  event_delta?: EventDeltaResponse;
  resolved_ids: Record<string, number>; // "inv_uuid" => server integer ID
  mutation_results: {
    accepted: number[]; // action_ids
    rejected: Array<{ action_id: number; error: string; message: string }>;
  };
}

export interface EventShellResponse {
  id: number;
  sp_event_title: string;
  event_type: string;
  start_at: number; // ms
  status: string;
  photo_url: string | null;
  has_sketch?: boolean;
  sketch_url?: string | null;
  sketch_blob?: Blob | null;
  updated_at: number; // ms
}

export interface EventDeltaResponse {
  event_id: number;
  last_synced_at: number; // ms — client must store this for next request
  groups: Array<{ id: number; event_id: number; name: string; color_index: number; updated_at: number }>;
  tables: Array<{ id: number; num: number; name: string | null; seats_count: number; optioned: boolean; seating_restricted: boolean; updated_at: number }>;
  invitations: Array<{ id: number; event_id: number; title: string; phone: string | null; expected_guests_count: number; arrived_guests_count_by_hostess: number; side: number; group_id: number | null; updated_at: number }>;
  table_seatings: Array<{ id: number; table_id: number; invitation_id: number; guests_count: number; guests_names: string | null; optioned_seats: number; vip_seats: number; baby_chairs: number; wheel_chairs: number; glat_meals: number; vegetarian_meals: number; vegan_meals: number; gluten_meals: number; child_meals: number; updated_at: number }>;
  actual_arrivals: Array<{ id: number; uid: string; event_id: number; invitation_id: number; table_num: number; guests_count: number; tablet_uid: string; created_at: number; updated_at: number }>;
  directives: Array<{ type: string; payload: any }>;
}

export interface LoginResponse {
  session: {
    access_token: string;
    expires_at: number; // ms
    account_id: number;
    account_email: string;
    service_provider_id: number;
    service_provider_name: string;
  };
  today_events: EventShellResponse[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Error
// ─────────────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public statusCode: number;
  public errorCode: string | null;

  constructor(statusCode: number, message: string, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode ?? null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────────────────────────────────────

export class SyncApi {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * POST /api/apps/checkin/v1/sessions
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${this.baseUrl}/api/apps/checkin/v1/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message || 'Login failed', body.error);
    }

    return res.json();
  }

  /**
   * POST /api/apps/checkin/v1/sync
   */
  async sync(payload: SyncRequestPayload, options: { signal: AbortSignal; token: string }): Promise<SyncResponse> {
    const res = await fetch(`${this.baseUrl}/api/apps/checkin/v1/sync?auth_token=${options.token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: options.signal
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.message || `Sync failed (${res.status})`, body.error);
    }

    return res.json();
  }

  /**
   * DELETE /api/apps/checkin/v1/sessions
   * Best-effort — client wipes local data regardless.
   */
  async logout(token: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/apps/checkin/v1/sessions?auth_token=${token}`, {
        method: 'DELETE'
      });
    } catch {
      // Ignore — logout is best-effort
    }
  }
}
