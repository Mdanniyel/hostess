<script lang="ts">
	import type { TableRecord } from '$lib/db';

	interface Props {
		tables: TableRecord[];
		excludeNums?: number[];
		onSelect: (num: number) => void;
		onCancel?: () => void;
	}

	let { tables, excludeNums = [], onSelect, onCancel }: Props = $props();

	let showAddSelect = $state(false);
	let selectedTableNum = $state<number | null>(null);

	let availableTables = $derived(
		[...tables]
			.filter(t => !excludeNums.includes(t.num))
			.sort((a, b) => a.num - b.num)
	);

	function handleAdd() {
		if (selectedTableNum === null) return;
		onSelect(selectedTableNum);
		showAddSelect = false;
		selectedTableNum = null;
	}

	function handleCancel() {
		showAddSelect = false;
		selectedTableNum = null;
		if (onCancel) onCancel();
	}
</script>

{#if !showAddSelect}
	<button
		type="button"
		class="btn btn-light btn-block"
		onclick={() => { showAddSelect = true; }}
	>
		<i class="far fa-plus mr-1"></i>הוספת שולחן
	</button>
{:else}
	<div class="input-group">
		<select
			class="custom-select"
			bind:value={selectedTableNum}
			aria-label="בחר שולחן"
		>
			<option value={null}>בחר שולחן...</option>
			{#each availableTables as table}
				<option value={table.num}>שולחן {table.num}</option>
			{/each}
		</select>
		<div class="input-group-append">
			<button
				class="btn btn-light"
				type="button"
				onclick={handleAdd}
				disabled={selectedTableNum === null}
			>
				הוסף
			</button>
			<button
				class="btn btn-danger"
				type="button"
				onclick={handleCancel}
			>
				ביטול
			</button>
		</div>
	</div>
{/if}
