/**
 * Invitation model — every record from the invitations table becomes an instance of this class.
 *
 * Dexie's mapToClass ensures that db.invitations.get(id) returns an Invitation instance.
 * The model accesses related data through the eventState singleton.
 */

import { db } from '../db';
import type { ActualArrivalRecord, TableSeatingRecord } from '../db';
import { eventState } from '../state/EventState.svelte';

export class Invitation {
  id!: number | string;
  event_id!: number;
  title!: string;
  phone!: string | null;
  expected_guests_count!: number;
  arrived_guests_count_by_hostess!: number;
  side!: number;
  group_id!: number | null;
  updated_at!: number;

  get isWalkIn(): boolean {
    return typeof this.id === 'string' && (this.id as string).startsWith('inv_');
  }

  get arrivals(): ActualArrivalRecord[] {
    return eventState.arrivals.filter(a => a.invitation_id === this.id);
  }

  get arrivedCount(): number {
    return this.arrivals.reduce((sum, a) => sum + a.guests_count, 0);
  }

  get remainingCount(): number {
    return Math.max(0, this.expected_guests_count - this.arrivedCount);
  }

  get status(): 'pending' | 'partial' | 'arrived' {
    const arrived = this.arrivedCount;
    if (arrived === 0) return 'pending';
    if (arrived >= this.expected_guests_count) return 'arrived';
    return 'partial';
  }

  get sideLabel(): string | null {
    if (this.side === 1) return 'חתן';
    if (this.side === 2) return 'כלה';
    if (this.side === 3) return 'חתן וכלה';
    return null;
  }

  get groupName(): string | null {
    if (!this.group_id) return null;
    return eventState.groups.find(g => g.id === this.group_id)?.name ?? null;
  }

  get badgeText(): string | null {
    const parts = [this.sideLabel, this.groupName].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : null;
  }

  get seatings(): TableSeatingRecord[] {
    if (this.isWalkIn) return [];
    return eventState.tableSeatings.filter(s => s.invitation_id === this.id);
  }

  get primaryTableNum(): number | null {
    const seating = this.seatings[0];
    if (seating) {
      const table = eventState.tables.find(t => t.id === seating.table_id);
      return table?.num ?? null;
    }
    const arrival = this.arrivals[0];
    return arrival?.table_num ?? null;
  }

  /**
   * Table entries for the check-in form, grouped by table.
   * Multiple seatings at the same table are merged into one entry
   * with summed expected count.
   */
  get tableEntries(): Array<{ tableId: number; tableNum: number; expectedAtTable: number; arrivedAtTable: number }> {
    const grouped = new Map<number, { tableId: number; tableNum: number; expectedAtTable: number }>();

    for (const s of this.seatings) {
      const table = eventState.tables.find(t => t.id === s.table_id);
      const tableNum = table?.num ?? 0;

      if (grouped.has(s.table_id)) {
        grouped.get(s.table_id)!.expectedAtTable += s.guests_count;
      } else {
        grouped.set(s.table_id, { tableId: s.table_id, tableNum, expectedAtTable: s.guests_count });
      }
    }

    const entries = Array.from(grouped.values()).map(entry => ({
      ...entry,
      arrivedAtTable: Math.max(0, this.arrivals
        .filter(a => a.table_num === entry.tableNum)
        .reduce((sum, a) => sum + a.guests_count, 0))
    }));

    const coveredTableNums = new Set(entries.map(e => e.tableNum));
    const arrivalTableNums = Array.from(new Set(this.arrivals.map(a => a.table_num)));

    for (const num of arrivalTableNums) {
      if (!coveredTableNums.has(num)) {
        const table = eventState.tables.find(t => t.num === num);
        const tableId = table?.id ?? 0;
        const arrivedAtTable = Math.max(0, this.arrivals
          .filter(a => a.table_num === num)
          .reduce((sum, a) => sum + a.guests_count, 0));

        if (arrivedAtTable > 0) {
          entries.push({
            tableId,
            tableNum: num,
            expectedAtTable: 0,
            arrivedAtTable
          });
        }
      }
    }

    return entries;
  }
}

db.invitations.mapToClass(Invitation);
