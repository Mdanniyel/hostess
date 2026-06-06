<script lang="ts">
	import { settingsService } from '$lib/services/settingsService.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let { children } = $props();
</script>

{@render children()}

{#if settingsService.isOpen}
	<SettingsModal />
{/if}

<style>
	:global(.form-control:focus),
	:global(input:focus),
	:global(select:focus),
	:global(textarea:focus) {
		outline: none !important;
		box-shadow: none !important;
		border-color: #ced4da !important;
		background-color: #fff !important;
	}

	:global(input),
	:global(button),
	:global(select),
	:global(textarea),
	:global(a) {
		-webkit-tap-highlight-color: transparent !important;
	}
</style>
