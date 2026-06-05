<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { eventState } from '$lib/state/EventState.svelte';
	import { getTableStats } from '$lib/models/TableStats';
	import type { Invitation } from '$lib/models/Invitation';

	let eventId = $derived($page.params.event_rails_id);
	let tableId = $derived(Number($page.params.table_id));

	let table = $derived(eventState.tables.find(t => t.id === tableId));
	let stats = $derived(table ? getTableStats(table) : null);

	// Get invitations associated with this table
	let invitations = $derived.by(() => {
		if (!table) return [];
		const seatings = eventState.tableSeatings.filter(s => s.table_id === table.id);
		const arrivals = eventState.arrivals.filter(a => a.table_num === table.num);

		const invitationIds = new Set<number | string>([
			...seatings.map(s => s.invitation_id),
			...arrivals.map(a => a.invitation_id)
		]);

		return Array.from(invitationIds)
			.map(id => eventState.invitations.find(i => i.id === id))
			.filter((inv): inv is Invitation => !!inv)
			.sort((a, b) => a.title.localeCompare(b.title));
	});

	// Seated guest groups names
	let groupNames = $derived.by(() => {
		if (invitations.length === 0) return '';
		return Array.from(
			new Set(invitations.map(inv => inv.groupName).filter((name): name is string => !!name))
		).join(', ');
	});

	function getInvitationStats(inv: Invitation) {
		if (!table) {
			return { arrived: 0, arrivedOptioned: 0, arrivedNotInvited: 0, arrivedExpected: 0 };
		}
		const seatings = eventState.tableSeatings.filter(
			s => s.table_id === table.id && s.invitation_id === inv.id
		);
		const expected = seatings.reduce((sum, s) => sum + s.guests_count, 0);
		const optioned = seatings.reduce((sum, s) => sum + s.optioned_seats, 0);

		const dbArrived = eventState.arrivals
			.filter(a => a.table_num === table.num && a.invitation_id === inv.id)
			.reduce((sum, a) => sum + a.guests_count, 0);
		const pendingArrived = eventState.getPendingCount(inv.id, table.num);
		const arrived = dbArrived + pendingArrived;

		let arrivedOptioned = 0;
		if (arrived >= expected) {
			arrivedOptioned = optioned;
		} else if (arrived > expected - optioned) {
			arrivedOptioned = expected - arrived;
		}

		let arrivedNotInvited = 0;
		if (arrived > expected) {
			arrivedNotInvited = arrived - expected;
		}

		const arrivedExpected = arrived - arrivedOptioned - arrivedNotInvited;

		return {
			arrived,
			arrivedOptioned,
			arrivedNotInvited,
			arrivedExpected
		};
	}

	function goBack() {
		goto(`${base}/events/${eventId}/tables`);
	}
</script>

{#if !table || !stats}
	<div class="container text-center text-muted py-5">
		<div class="spinner-border spinner-border-sm"></div>
		<div class="mt-2">טוען שולחן...</div>
	</div>
{:else}
	<div class="container">
		<div class="card">
			<!-- Header -->
			<div class="card-header border-bottom bg-white d-flex align-items-center justify-content-between py-3">
				<div class="d-flex align-items-center">
					<button
						class="btn btn-link p-0 ml-3 text-dark"
						onclick={goBack}
						aria-label="חזרה"
					>
						<i class="far fa-arrow-right"></i>
					</button>
					<div>
						<h5 class="mb-0 d-inline font-weight-bold">שולחן {table.num}</h5>
						{#if stats.isBrideSide}
							<span class="badge badge-pill badge-light border mr-2" style="background-color: #f8d7da;">
								כלה
							</span>
						{/if}
						{#if stats.isGroomSide}
							<span class="badge badge-pill badge-light border mr-2" style="background-color: #dde8ff;">
								חתן
							</span>
						{/if}
						{#if groupNames}
							<div class="small text-muted mt-1">{groupNames}</div>
						{/if}
					</div>
				</div>

				<div class="small text-left">
					<strong>{table.seats_count}</strong> כסאות בשולחן
					<br />
					<strong>{stats.arrivedCount}</strong> אורחים הגיעו עד כה
					<br />
					צפי מקומות פנויים:
					<strong
						class="d-inline-block ltr font-weight-bold"
						class:text-success={stats.expectedAvailableSeats > 0}
						class:text-secondary={stats.expectedAvailableSeats === 0}
						class:text-danger={stats.expectedAvailableSeats < 0}
					>
						{stats.expectedAvailableSeats}
					</strong>
				</div>
			</div>

			<!-- Seated Invitations List -->
			{#if invitations.length === 0}
				<div class="card-body text-center text-muted py-4">אין הזמנות לשולחן זה</div>
			{:else}
				<div class="card-body p-0 rounded-bottom">
					<div class="list-group list-group-flush">
						{#each invitations as inv (inv.id)}
							{@const invStats = getInvitationStats(inv)}
							<button
								type="button"
								class="list-group-item list-group-item-action py-3"
								onclick={() => goto(`${base}/events/${eventId}/invitations/${inv.id}`)}
							>
								<div class="d-flex justify-content-between align-items-center">
									<div>
										<strong class="text-dark">{inv.title}</strong>
										{#if inv.badgeText}
											<span class="badge badge-light border mr-2">{inv.badgeText}</span>
										{/if}
									</div>

									<div class="small text-left">
										<strong>{invStats.arrived}</strong> אורחים הגיעו
										{#if invStats.arrivedExpected > 0 || invStats.arrivedOptioned > 0 || invStats.arrivedNotInvited > 0}
											<span>:</span>
											{#if invStats.arrivedExpected > 0}
												<strong class="text-success">{invStats.arrivedExpected}</strong>
											{/if}
											{#if invStats.arrivedExpected > 0 && (invStats.arrivedOptioned > 0 || invStats.arrivedNotInvited > 0)}
												<span>+</span>
											{/if}
											{#if invStats.arrivedOptioned > 0}
												<strong class="text-primary">{invStats.arrivedOptioned}</strong>
											{/if}
											{#if invStats.arrivedOptioned > 0 && invStats.arrivedNotInvited > 0}
												<span>+</span>
											{/if}
											{#if invStats.arrivedNotInvited > 0}
												<strong class="text-danger">{invStats.arrivedNotInvited}</strong>
											{/if}
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
