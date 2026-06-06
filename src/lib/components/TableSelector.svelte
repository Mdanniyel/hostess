<script lang="ts">
	import type { TableRecord } from '$lib/db';
	import { eventState } from '$lib/state/EventState.svelte';
	import { getTableStats } from '$lib/models/TableStats';

	interface Props {
		tables: TableRecord[];
		excludeNums?: number[];
		onSelect: (num: number) => void;
		onCancel?: () => void;
	}

	let { tables, excludeNums = [], onSelect, onCancel }: Props = $props();

	let showFilterMenu = $state(false);
	let selectedFilter = $state<
		'all' | 'with_problems' | 'available_1' | 'available_2' | 'available_3' | 'available_4' | 'available_5' | 'available_6' | 'available_7'
	>('all');
	let searchQuery = $state('');

	const filterLabels = {
		all: 'הכל',
		with_problems: 'עם בעיות',
		available_1: 'פנוי 1+',
		available_2: 'פנוי 2+',
		available_3: 'פנוי 3+',
		available_4: 'פנוי 4+',
		available_5: 'פנוי 5+',
		available_6: 'פנוי 6+',
		available_7: 'פנוי 7+'
	};

	let filteredTables = $derived.by(() => {
		// Filter out tables that are already assigned to this invitation
		let list = tables
			.filter(t => !excludeNums.includes(t.num))
			.map(getTableStats);

		// Free text search (search by table number or table name)
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			list = list.filter(
				item =>
					item.table.num.toString().includes(q) ||
					(item.table.name && item.table.name.toLowerCase().includes(q))
			);
		}

		// Apply selected filter
		if (selectedFilter === 'with_problems') {
			list = list.filter(item => item.arrivedCount > item.table.seats_count);
		} else if (selectedFilter.startsWith('available_')) {
			const minAvailable = parseInt(selectedFilter.split('_')[1], 10);
			list = list.filter(item => item.expectedAvailableSeats >= minAvailable);
		}

		// Sort by table number ascending
		return list.sort((a, b) => a.table.num - b.table.num);
	});

	function handleSelect(num: number) {
		onSelect(num);
		// Close the Bootstrap modal programmatically
		const closeBtn = document.querySelector('#modal-select-table .close') as HTMLButtonElement | null;
		closeBtn?.click();
	}
</script>

<button
	type="button"
	class="btn btn-light btn-block"
	data-toggle="modal"
	data-modal-dialog-class="modal-right modal-fs-only-xs"
	data-target="#modal-select-table"
>
	<i class="far fa-plus mr-1"></i>הוספת שולחן
</button>

<div
	class="modal fade"
	id="modal-select-table"
	tabindex="-1"
	style="display: none;"
	aria-hidden="true"
	dir="rtl"
>
	<div class="modal-dialog" data-template="modal-content">
		<div class="modal-content">
			<!-- Header -->
			<div class="modal-header d-flex justify-content-between align-items-center">
				<h5 class="modal-title">בחירת שולחן להזמנה</h5>
				<button name="button" type="button" class="close ml-0 mr-2" data-dismiss="modal">
					<span>×</span>
				</button>
			</div>

			<!-- Search & Filter -->
			<div class="px-3 py-2 border-bottom d-flex align-items-center">
				<div class="input-group flex-grow-1">
					<input
						type="text"
						class="form-control"
						placeholder="חיפוש לפי מספר שולחן או שם..."
						autocomplete="off"
						autocorrect="off"
						autocapitalize="off"
						bind:value={searchQuery}
					/>
					{#if searchQuery}
						<div class="input-group-append">
							<button
								class="btn btn-light"
								onclick={() => (searchQuery = '')}
								aria-label="נקה חיפוש"
							>
								<i class="far fa-times"></i>
							</button>
						</div>
					{/if}
				</div>

				<!-- Filter Dropdown -->
				<div class="dropdown ml-2 position-relative">
					<button
						class="btn btn-light dropdown-toggle border"
						type="button"
						style="white-space: nowrap;"
						onclick={() => (showFilterMenu = !showFilterMenu)}
						aria-haspopup="true"
						aria-expanded={showFilterMenu}
					>
						{filterLabels[selectedFilter]}
					</button>

					{#if showFilterMenu}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="dropdown-backdrop" onclick={() => (showFilterMenu = false)}></div>
						<div class="dropdown-menu dropdown-menu-right show position-absolute filter-dropdown-menu">
							<button
								class="dropdown-item"
								class:active={selectedFilter === 'all'}
								onclick={() => {
									selectedFilter = 'all';
									showFilterMenu = false;
								}}
							>
								הכל
							</button>
							<button
								class="dropdown-item"
								class:active={selectedFilter === 'with_problems'}
								onclick={() => {
									selectedFilter = 'with_problems';
									showFilterMenu = false;
								}}
							>
								עם בעיות
							</button>
							<div class="dropdown-divider"></div>
							<h6 class="dropdown-header">סינון פנויים</h6>
							{#each [1, 2, 3, 4, 5, 6, 7] as i}
								<button
									class="dropdown-item"
									class:active={selectedFilter === `available_${i}`}
									onclick={() => {
										selectedFilter = `available_${i}` as any;
										showFilterMenu = false;
									}}
								>
									פנוי {i}+
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Modal Body (Tables List) -->
			<div class="modal-body p-0" style="overflow-y: auto; max-height: calc(100vh - 180px);">
				{#if eventState.isLoading && tables.length === 0}
					<div class="text-center text-muted py-4">
						<div class="spinner-border spinner-border-sm"></div>
						<div class="mt-2">טוען שולחנות...</div>
					</div>
				{:else if filteredTables.length === 0}
					<div class="text-center text-muted py-4">לא נמצאו שולחנות תואמים</div>
				{:else}
					<div class="list-group list-group-flush">
						{#each filteredTables as stats (stats.table.id)}
							<button
								type="button"
								class="list-group-item list-group-item-action py-3"
								onclick={() => handleSelect(stats.table.num)}
							>
								<!-- Top Row: Table details -->
								<div class="d-flex justify-content-between align-items-center mb-2">
									<div>
										<strong class="text-dark" style="font-size: 1.1rem;">
											שולחן {stats.table.num}
										</strong>
										{#if stats.table.name}
											<span class="text-muted small mr-1">({stats.table.name})</span>
										{/if}
										{#if stats.isBrideSide}
											<span class="badge badge-pill badge-light border mr-1" style="background-color: #f8d7da;">
												כלה
											</span>
										{/if}
										{#if stats.isGroomSide}
											<span class="badge badge-pill badge-light border mr-1" style="background-color: #dde8ff;">
												חתן
											</span>
										{/if}
									</div>

									<div class="small">
										צפי מקומות פנויים:
										<strong
											class="d-inline-block ltr font-weight-bold ml-1"
											class:text-success={stats.expectedAvailableSeats > 0}
											class:text-secondary={stats.expectedAvailableSeats === 0}
											class:text-danger={stats.expectedAvailableSeats < 0}
										>
											{stats.expectedAvailableSeats}
										</strong>
									</div>
								</div>

								<!-- Mid Row: Summary counts -->
								<div class="text-muted small mb-2">
									הגיעו עד עכשיו <strong>{stats.arrivedCount}</strong> אורחים, צפויים להגיע עוד
									<strong>{stats.currentExpectedCount}</strong> אורחים (מתוך {stats.table.seats_count} כסאות)
								</div>

								<!-- Bottom Row: Progress bar -->
								<div class="progress" style="height: 10px; border-radius: 5px;">
									{#if stats.progressCertain > 0}
										<div
											class="progress-bar bg-success"
											role="progressbar"
											style="width: {stats.progressCertain}%"
											aria-valuenow={stats.progressCertain}
											aria-valuemin={0}
											aria-valuemax={100}
										></div>
									{/if}
									{#if stats.progressOptioned > 0}
										<div
											class="progress-bar bg-primary"
											role="progressbar"
											style="width: {stats.progressOptioned}%"
											aria-valuenow={stats.progressOptioned}
											aria-valuemin={0}
											aria-valuemax={100}
										></div>
									{/if}
									{#if stats.progressNotInvited > 0}
										<div
											class="progress-bar bg-danger"
											role="progressbar"
											style="width: {stats.progressNotInvited}%"
											aria-valuenow={stats.progressNotInvited}
											aria-valuemin={0}
											aria-valuemax={100}
										></div>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-footer justify-content-center">
				{#if filteredTables.length > 0}
					<span class="small text-muted text-center">
						מציג {filteredTables.length} מתוך {tables.length - excludeNums.length} שולחנות
					</span>
				{:else}
					<span class="small text-muted text-center">
						לא נמצאו שולחנות תואמים
					</span>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.dropdown-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 9999;
	}

	.dropdown-item {
		cursor: pointer;
	}

	.filter-dropdown-menu {
		left: 0;
		right: auto;
		min-width: 150px;
		z-index: 10000;
	}
</style>
