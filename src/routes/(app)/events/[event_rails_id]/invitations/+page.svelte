<script lang="ts">
	import { eventState } from '$lib/state/EventState.svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	let eventId = $derived($page.params.event_rails_id);
</script>

<div class="container">
	<div class="card">
		<div class="card-header d-flex justify-content-between align-items-center">
			<div class="d-flex align-items-center">
				<h5 class="card-title mb-0">הזמנות</h5>
				<a
					href="{base}/events/{eventId}/invitations/new"
					class="btn btn-outline-primary btn-sm mr-3"
				>
					<i class="far fa-plus mr-1"></i>הזמנה חדשה
				</a>
			</div>
			<div class="small text-muted">
				הגיעו <strong class="text-dark">{eventState.totalArrived}</strong> / {eventState.totalExpected}
			</div>
		</div>

		<!-- Search -->
		<div class="px-3 py-2 border-bottom">
			<div class="input-group">
				<input
					type="text"
					class="form-control"
					placeholder="חיפוש לפי שם או טלפון..."
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					bind:value={eventState.searchQuery}
				/>
				{#if eventState.searchQuery}
					<div class="input-group-append">
						<button class="btn btn-light" onclick={() => eventState.searchQuery = ''} aria-label="נקה חיפוש">
							<i class="far fa-times"></i>
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- List -->
		<div class="invitations-list">
			{#if eventState.isLoading && eventState.invitations.length === 0}
				<div class="text-center text-muted py-4">
					<div class="spinner-border spinner-border-sm"></div>
					<div class="mt-2">טוען הזמנות...</div>
				</div>
			{:else if !eventState.searchQuery.trim()}
				<div class="text-center text-muted py-4">
					<i class="far fa-search fa-2x mb-2 d-block"></i>
					הקלידו שם או טלפון כדי לחפש מוזמנים
				</div>
			{:else if eventState.filteredInvitations.length === 0}
				<div class="text-center text-muted py-4">
					לא נמצאו תוצאות עבור "{eventState.searchQuery}"
				</div>
			{:else}
				<div class="list-group list-group-flush">
					{#each eventState.filteredInvitations as inv (inv.id)}
						<button
							type="button"
							class="list-group-item list-group-item-action text-start"
							onclick={() => goto(`${base}/events/${eventId}/invitations/${inv.id}`)}
						>
							<div class="d-flex justify-content-between align-items-center">
								<div>
									<strong>{inv.title}</strong>
									{#if inv.badgeText}
										<br/>
										<span class="badge badge-light border">{inv.badgeText}</span>
									{/if}
								</div>
								<div class="text-end">
									<strong>{inv.expected_guests_count}</strong>
									<span class="text-muted small">צפויים</span>
									<br/>
									<strong class:text-success={inv.arrivedCount >= inv.expected_guests_count && inv.arrivedCount > 0}
									        class:text-danger={inv.arrivedCount > inv.expected_guests_count}>
										{inv.arrivedCount}
									</strong>
									<span class="text-muted small">הגיעו</span>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		{#if eventState.searchQuery.trim()}
			<div class="card-footer small text-muted">
				מוצגות {eventState.filteredInvitations.length} מתוך {eventState.invitations.length} הזמנות
			</div>
		{/if}
	</div>
</div>

<style>
	.invitations-list {
		overflow-y: auto;
		min-height: auto;
		max-height: calc(100vh - 250px);
	}

	input[type="text"]::-webkit-search-cancel-button {
		-webkit-appearance: none;
		appearance: none;
	}
</style>
