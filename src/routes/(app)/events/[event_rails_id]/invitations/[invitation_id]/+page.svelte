<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { eventState } from '$lib/state/EventState.svelte';
	import type { Invitation } from '$lib/models/Invitation';
	import TableSelector from '$lib/components/TableSelector.svelte';

	let eventId = $derived($page.params.event_rails_id);
	let invitationId = $derived($page.params.invitation_id);

	let invitation = $derived(
		eventState.invitations.find(i => String(i.id) === invitationId) as Invitation | undefined
	);

	// Debug: log tableEntries to understand the duplicate key
	$effect(() => {
		if (invitation) {
			console.log('Invitation tableEntries:', JSON.stringify(invitation.tableEntries));
			console.log('Invitation seatings:', JSON.stringify(invitation.seatings));
			console.log('All tableSeatings in state:', JSON.stringify(eventState.tableSeatings.filter(s => s.invitation_id === invitation.id)));
			console.log('All tables in state (ids):', eventState.tables.map(t => t.id));
		}
	});

		let additionalTableNums = $state<number[]>([]);

	// Combine tableEntries from invitation with local additional tables
	let allEntries = $derived.by(() => {
		if (!invitation) return [];
		const entries = [...invitation.tableEntries];
		const coveredNums = new Set(entries.map(e => e.tableNum));

		for (const num of additionalTableNums) {
			if (!coveredNums.has(num)) {
				const table = eventState.tables.find(t => t.num === num);
				entries.push({
					tableId: table?.id ?? 0,
					tableNum: num,
					expectedAtTable: 0,
					arrivedAtTable: 0
				});
				coveredNums.add(num);
			}
		}
		return entries.sort((a, b) => a.tableNum - b.tableNum);
	});

	function increment(tableNum: number) {
		if (!invitation) return;
		eventState.adjustCount(invitation.id, tableNum, 1);
	}

	function decrement(invId: number | string, tableNum: number, currentTotal: number) {
		if (currentTotal <= 0) return;
		eventState.adjustCount(invId, tableNum, -1);
	}

	// Get the displayed count for a table: DB value + pending (unsaved) delta
	function displayedCount(entry: { tableNum: number; arrivedAtTable: number }): number {
		if (!invitation) return 0;
		return entry.arrivedAtTable + eventState.getPendingCount(invitation.id, entry.tableNum);
	}
</script>

{#if !invitation}
	<div class="container text-center text-muted py-5">
		<div class="spinner-border spinner-border-sm"></div>
		<div class="mt-2">טוען...</div>
	</div>
{:else}
	<div class="container">
		<div class="card">
			<!-- Header -->
			<div class="card-header">
				<h5 class="mb-0 d-inline">{invitation.title}</h5>
				{#if invitation.badgeText}
					<span class="badge badge-light border ml-2">{invitation.badgeText}</span>
				{/if}
			</div>

			<!-- Table entries with steppers -->
			<ul class="list-group list-group-flush">
				{#each allEntries as entry, index (index)}
					{@const total = displayedCount(entry)}
					<li class="list-group-item d-flex align-items-center justify-content-between">
						<div>
							<h5 class="mb-0 d-inline font-weight-bold">
								{#if entry.tableId > 0}
									<a href="{base}/events/{eventId}/tables/{entry.tableId}" class="text-dark">
										שולחן {entry.tableNum}
									</a>
								{:else}
									שולחן {entry.tableNum}
								{/if}
							</h5>
							<div class="text-muted small">
								אורחים צפויים: <strong>{entry.expectedAtTable}</strong>
							</div>
						</div>
						<div>
							<div class="small text-muted mb-1">אורחים שהגיעו</div>
							<div class="d-flex align-items-center">
								<button
									type="button"
									class="btn btn-light p-1"
									onclick={() => decrement(invitation.id, entry.tableNum, total)}
									disabled={total <= 0}
									aria-label="הפחת אורח"
								>
									<i class="far fa-minus px-2"></i>
								</button>
								<strong class="mx-3 d-inline-block" style="min-width: 24px; text-align: center;">
									{total}
								</strong>
								<button
									type="button"
									class="btn btn-light p-1"
									onclick={() => increment(entry.tableNum)}
									aria-label="הוסף אורח"
								>
									<i class="far fa-plus px-2"></i>
								</button>
							</div>
						</div>
					</li>
				{/each}

				{#if allEntries.length === 0}
					<li class="list-group-item text-muted text-center py-3">
						אין שיבוץ שולחן להזמנה זו
					</li>
				{/if}

				<!-- Add Table Row -->
				<li class="list-group-item">
					<TableSelector
						tables={eventState.tables}
						excludeNums={allEntries.map(e => e.tableNum)}
						onSelect={(num) => {
							if (!additionalTableNums.includes(num)) {
								additionalTableNums = [...additionalTableNums, num];
							}
						}}
					/>
				</li>
			</ul>

			<!-- Pending indicator -->
			{#if eventState.hasPendingChanges}
				<div class="card-footer text-center small text-warning">
					<i class="far fa-clock mr-1"></i>שומר שינויים...
				</div>
			{:else}
				<!-- Status -->
				<div class="card-footer text-center small">
					{#if invitation.status === 'arrived'}
						<span class="text-success"><i class="far fa-check-circle mr-1"></i>כל המוזמנים הגיעו</span>
					{:else if invitation.status === 'partial'}
						<span class="text-warning"><i class="far fa-clock mr-1"></i>הגיעו {invitation.arrivedCount} מתוך {invitation.expected_guests_count}</span>
					{:else}
						<span class="text-muted"><i class="far fa-hourglass mr-1"></i>ממתינים להגעה</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
