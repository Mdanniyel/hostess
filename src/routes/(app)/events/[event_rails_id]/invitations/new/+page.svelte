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
	let phone = $state('');
	let side = $state('3'); // Default to both (3)
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
			phone.trim() || null,
			Number(side),
			addedTables
		);

		// Navigate back
		goBack();
	}

	function goBack() {
		goto(`${base}/events/${eventId}/invitations`);
	}
</script>

<div class="container text-right">
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
				<h5 class="mb-0 d-inline font-weight-bold">הזמנה חדשה (Walk-In)</h5>
			</div>
		</div>

		<!-- Form Body -->
		<div class="card-body">
			<!-- Name -->
			<div class="form-group">
				<label for="title" class="font-weight-bold">שם האורח / הזמנה עבור</label>
				<input
					type="text"
					id="title"
					class="form-control"
					placeholder="הזן שם האורח..."
					bind:value={title}
					autocomplete="off"
				/>
			</div>

			<!-- Phone -->
			<div class="form-group">
				<label for="phone" class="font-weight-bold">טלפון (אופציונלי)</label>
				<input
					type="tel"
					id="phone"
					class="form-control text-left"
					placeholder="הזן מספר טלפון..."
					bind:value={phone}
					dir="ltr"
					autocomplete="off"
				/>
			</div>

			<!-- Side (Marriage-specific) -->
			{#if event?.event_type === 'wedding'}
				<div class="form-group">
					<label class="font-weight-bold d-block">צד באירוע</label>
					<div class="d-flex justify-content-start mt-1">
						<label class="radio-label ml-4">
							<input type="radio" name="side" value="1" bind:group={side} />
							<span class="mr-2">חתן</span>
						</label>
						<label class="radio-label ml-4">
							<input type="radio" name="side" value="2" bind:group={side} />
							<span class="mr-2">כלה</span>
						</label>
						<label class="radio-label">
							<input type="radio" name="side" value="3" bind:group={side} />
							<span class="mr-2">חתן וכלה</span>
						</label>
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
		<div class="card-footer d-flex justify-content-start bg-white border-top py-3">
			<button
				class="btn btn-primary"
				onclick={handleSave}
				disabled={!title.trim()}
			>
				שמור והגעה
			</button>
			<button
				class="btn btn-light border mr-2"
				onclick={goBack}
			>
				ביטול
			</button>
		</div>
	</div>
</div>

<style>
	.radio-label {
		display: inline-flex;
		align-items: center;
		cursor: pointer;
	}
</style>
