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
			</div>
			<div class="small text-muted">
				הגיעו <strong class="text-dark">{eventState.totalArrived}</strong> / {eventState.totalExpected}
			</div>
		</div>

		<!-- Search -->
		<div class="px-3 py-2 border-bottom sticky-search">
			<div class="input-group">
				<input
					type="text"
					name="name"
					class="form-control"
					placeholder="חיפוש לפי שם..."
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
					הקלידו שם כדי לחפש מוזמנים
				</div>
			{:else if eventState.filteredInvitations.length === 0}
				<div class="text-center p-3">
					<div class="mb-3">
						<i class="far fa-search-minus fa-2x text-muted mb-2 d-block"></i>
						<span class="text-muted d-block">לא נמצאו תוצאות עבור "{eventState.searchQuery}"</span>
					</div>
					<a
						href="{base}/events/{eventId}/invitations/new"
						class="btn btn-light"
					>
						<i class="far fa-plus mr-1"></i>הזמנה חדשה
					</a>
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
			<div class="card-footer small text-muted sticky-footer">
				מוצגות {eventState.filteredInvitations.length} מתוך {eventState.invitations.length} הזמנות
			</div>
		{/if}
	</div>
</div>

<style>
	input[type="text"]::-webkit-search-cancel-button {
		-webkit-appearance: none;
		appearance: none;
	}

	.sticky-search {
		background-color: rgba(255, 255, 255, 0.8);
		-webkit-backdrop-filter: blur(2rem);
		backdrop-filter: blur(2rem);
		border-bottom: 1px solid #ced4da !important;
		position: sticky;
		top: var(--layout-headers-height, 0px);
		z-index: 1019;
	}

	.sticky-footer {
		background-color: rgba(255, 255, 255, 0.8);
		-webkit-backdrop-filter: blur(2rem);
		backdrop-filter: blur(2rem);
		position: sticky;
		bottom: 0;
		z-index: 1018;
	}
</style>
