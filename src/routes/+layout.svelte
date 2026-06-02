<script lang="ts">
	import { settingsService } from '$lib/services/settingsService.svelte';
	import SettingsModal from '$lib/components/SettingsModal.svelte';

	let { children } = $props();
</script>

{@render children()}

{#if settingsService.isOpen}
	<SettingsModal />
{/if}
