import { eventState } from '../state/EventState.svelte';
import type { TableRecord } from '../db';

export interface TableStats {
  table: TableRecord;
  arrivedCount: number;
  expectedCount: number;
  optionedCount: number;
  arrivedOptionedCount: number;
  arrivedNotInvitedCount: number;
  tappedCount: number;
  expectedAvailableSeats: number;
  currentExpectedCount: number;
  isBrideSide: boolean;
  isGroomSide: boolean;
  progressCertain: number;
  progressOptioned: number;
  progressNotInvited: number;
  progressAbnormal: boolean;
}

export function getTableStats(table: TableRecord): TableStats {
  const tableNum = table.num;
  const tableId = table.id;

  // Find invitations that either:
  // 1) Have a table seating at this table
  // 2) Have actual arrivals at this table num
  const seatings = eventState.tableSeatings.filter(s => s.table_id === tableId);
  const arrivals = eventState.arrivals.filter(a => a.table_num === tableNum);

  const invitationIds = new Set<number | string>([
    ...seatings.map(s => s.invitation_id),
    ...arrivals.map(a => a.invitation_id)
  ]);

  let arrivedCount = 0;
  let expectedCount = 0;
  let optionedCount = 0;
  let arrivedOptionedCount = 0;
  let arrivedNotInvitedCount = 0;
  let tappedCount = 0;

  let isBrideSide = false;
  let isGroomSide = false;

  for (const invId of invitationIds) {
    const invitation = eventState.invitations.find(i => i.id === invId);
    if (!invitation) continue;

    // Check side
    if (invitation.side === 1 || invitation.side === 3) {
      isGroomSide = true;
    }
    if (invitation.side === 2 || invitation.side === 3) {
      isBrideSide = true;
    }

    // Expected guests count for invitation at this table
    const invSeatings = seatings.filter(s => s.invitation_id === invId);
    const invExpected = invSeatings.reduce((sum, s) => sum + s.guests_count, 0);
    const invOptioned = invSeatings.reduce((sum, s) => sum + s.optioned_seats, 0);

    // Arrived guests count (DB + pending)
    const dbArrived = arrivals.filter(a => a.invitation_id === invId).reduce((sum, a) => sum + a.guests_count, 0);
    const pendingArrived = eventState.getPendingCount(invId, tableNum);
    const invArrived = dbArrived + pendingArrived;

    // Arrived optioned guests count
    let invArrivedOptioned = 0;
    if (invArrived >= invExpected) {
      invArrivedOptioned = invOptioned;
    } else if (invArrived > invExpected - invOptioned) {
      invArrivedOptioned = invExpected - invArrived;
    }

    // Arrived not invited guests count
    let invArrivedNotInvited = 0;
    if (invArrived > invExpected) {
      invArrivedNotInvited = invArrived - invExpected;
    }

    // Tapped guests count
    let invTapped = 0;
    if (invArrived > 0 && invArrived < invExpected) {
      invTapped = invExpected - invArrived;
    }

    arrivedCount += invArrived;
    expectedCount += invExpected;
    optionedCount += invOptioned;
    arrivedOptionedCount += invArrivedOptioned;
    arrivedNotInvitedCount += invArrivedNotInvited;
    tappedCount += invTapped;
  }

  // expected_available_seats = seats_count - expectedCount + tappedCount - arrivedNotInvitedCount
  const expectedAvailableSeats = table.seats_count - expectedCount + tappedCount - arrivedNotInvitedCount;

  // current_expected_guests_count = seats_count - expectedAvailableSeats - arrivedCount, capped at 0
  let currentExpectedCount = table.seats_count - expectedAvailableSeats - arrivedCount;
  if (currentExpectedCount < 0) currentExpectedCount = 0;

  // Progress calculations (from Haml _grid.html.haml)
  const arrivedExpectedGuestsCount = arrivedCount - arrivedOptionedCount - arrivedNotInvitedCount;

  let arrivedCertainProgress = table.seats_count > 0 ? (arrivedExpectedGuestsCount / table.seats_count) * 100 : 0;
  let arrivedOptionedProgress = table.seats_count > 0 ? (arrivedOptionedCount / table.seats_count) * 100 : 0;
  let arrivedNotInvitedProgress = table.seats_count > 0 ? (arrivedNotInvitedCount / table.seats_count) * 100 : 0;
  let progressAbnormal = false;

  if (arrivedCertainProgress + arrivedOptionedProgress + arrivedNotInvitedProgress > 100) {
    const ratio = (arrivedCertainProgress + arrivedOptionedProgress + arrivedNotInvitedProgress) / 100;
    arrivedCertainProgress = arrivedCertainProgress / ratio;
    arrivedOptionedProgress = arrivedOptionedProgress / ratio;
    arrivedNotInvitedProgress = arrivedNotInvitedProgress / ratio;
    progressAbnormal = true;
  }

  return {
    table,
    arrivedCount,
    expectedCount,
    optionedCount,
    arrivedOptionedCount,
    arrivedNotInvitedCount,
    tappedCount,
    expectedAvailableSeats,
    currentExpectedCount,
    isBrideSide,
    isGroomSide,
    progressCertain: arrivedCertainProgress,
    progressOptioned: arrivedOptionedProgress,
    progressNotInvited: arrivedNotInvitedProgress,
    progressAbnormal
  };
}
