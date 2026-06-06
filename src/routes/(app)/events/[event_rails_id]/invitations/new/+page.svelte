<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { appState } from '$lib/state/AppState.svelte';
	import { eventState } from '$lib/state/EventState.svelte';
	import TableSelector from '$lib/components/TableSelector.svelte';

	let eventId = $derived($page.params.event_rails_id);

	let event = $derived(appState.todayEvents.find(e => e.id === Number(eventId)));
	let title = $state('');
	let side = $state(3); // Default to both (3)
	const sideOptions = [
		{ value: 1, label: 'חתן' },
		{ value: 2, label: 'כלה' },
		{ value: 3, label: 'חתן וכלה' }
	];
	let addedTables = $state<Array<{ tableNum: number; arrivedCount: number }>>([]);

	function handleTableSelect(num: number) {
		if (!addedTables.some(t => t.tableNum === num)) {
			addedTables = [...addedTables, { tableNum: num, arrivedCount: 1 }];
		}
	}

	function incrementTable(index: number) {
		addedTables[index].arrivedCount += 1;
	}

	function decrementTable(index: number) {
		if (addedTables[index].arrivedCount > 1) {
			addedTables[index].arrivedCount -= 1;
		}
	}

	function removeTable(index: number) {
		addedTables = addedTables.filter((_, i) => i !== index);
	}

	async function handleSave() {
		if (!title.trim()) return;

		await eventState.recordWalkIn(
			title,
			null,
			side,
			addedTables
		);

		// Navigate back
		goBack();
	}

	function goBack() {
		goto(`${base}/events/${eventId}/invitations`);
	}
</script>
<div class="card">
		<!-- Header -->
		<div class="card-header border-bottom bg-white d-flex align-items-center justify-content-between py-3">
			<div class="d-flex align-items-center">
				<h5 class="mb-0 d-inline font-weight-bold">הזמנה חדשה</h5>
			</div>
		</div>

		<!-- Form Body -->
		<div class="card-body">
			<!-- Name -->
			<div class="form-group floating-label">
				<input
					type="text"
					id="title"
					class="form-control"
					placeholder="true"
					autocomplete="off"
					bind:value={title}
				/>
				<label for="title" class="floating-label-default-behaviour">שם הזמנה</label>
			</div>


			<!-- Side (Marriage-specific) -->
			{#if event?.event_type === 'wedding'}
				<div class="form-group">
					<label class="font-weight-bold d-block">צד באירוע</label>
					<div class="btn-group w-100" role="group">
						{#each sideOptions as option}
							<button
								type="button"
								class="btn btn-light"
								class:active={side === option.value}
								onclick={() => side = option.value}
							>
								{option.label}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Tables Section -->
			<div class="form-group border-top pt-3">
				<label class="font-weight-bold d-block mb-3">הושבה והגעה לשולחנות</label>

				{#if addedTables.length > 0}
					<ul class="list-group mb-3">
						{#each addedTables as item, index}
							<li class="list-group-item d-flex align-items-center justify-content-between py-3">
								<div>
									<h6 class="mb-0 font-weight-bold">שולחן {item.tableNum}</h6>
								</div>
								<div class="d-flex align-items-center">
									<div class="d-flex align-items-center">
										<button
											type="button"
											class="btn btn-light p-1"
											onclick={() => decrementTable(index)}
											disabled={item.arrivedCount <= 1}
											aria-label="הפחת אורח"
										>
											<i class="far fa-minus px-2"></i>
										</button>
										<strong class="mx-3 d-inline-block" style="min-width: 24px; text-align: center;">
											{item.arrivedCount}
										</strong>
										<button
											type="button"
											class="btn btn-light p-1"
											onclick={() => incrementTable(index)}
											aria-label="הוסף אורח"
										>
											<i class="far fa-plus px-2"></i>
										</button>
									</div>
									<button
										type="button"
										class="btn btn-outline-danger btn-sm ml-3 border-0"
										onclick={() => removeTable(index)}
										aria-label="הסר שולחן"
									>
										<i class="far fa-trash-alt px-1"></i>
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}

				<TableSelector
					tables={eventState.tables}
					excludeNums={addedTables.map(t => t.tableNum)}
					onSelect={handleTableSelect}
				/>
			</div>
		</div>

		<!-- Footer -->
		<div class="card-footer d-flex justify-content-end bg-white border-top py-3">
			<button
				class="btn btn-light"
				onclick={handleSave}
				disabled={!title.trim()}
			>
				שמירה
			</button>
		</div>
	</div>


