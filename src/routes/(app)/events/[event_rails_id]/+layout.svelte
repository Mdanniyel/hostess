<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { eventState } from '$lib/state/EventState.svelte';

	let { children } = $props();

	let eventRailsId = $derived($page.params.event_rails_id);

	// Load event data when the route param changes
	$effect(() => {
		const id = Number(eventRailsId);
		if (id && id !== eventState.activeEventId) {
			eventState.loadEvent(id);
		}
	});
</script>

<!-- Sub navigation -->
<nav class="adjust-to-sidebar" id="sub-nav">
	<div class="container">
		<div class="row">
			<a 
				class="w-100 text-center" 
				class:active={$page.url.pathname.includes('/invitations')}
				href="{base}/events/{eventRailsId}/invitations"
			>
				<i class="fal fa-fw mx-auto mb-1 d-block fa-envelope-open-text"></i>
				הזמנות
			</a>
			<a 
				class="w-100 text-center" 
				class:active={$page.url.pathname.includes('/arrival')}
				href="{base}/events/{eventRailsId}/arrival"
			>
				<i class="fal fa-fw mx-auto mb-1 d-block fa-users"></i>
				הגעה
			</a>
			<a 
				class="w-100 text-center" 
				class:active={$page.url.pathname.includes('/tables')}
				href="{base}/events/{eventRailsId}/tables"
			>
				<i class="fal fa-fw mx-auto mb-1 d-block icon-iplan-table-with-chairs"></i>
				שולחנות
			</a>
			<a 
				class="w-100 text-center" 
				class:active={$page.url.pathname.includes('/sketch')}
				href="{base}/events/{eventRailsId}/sketch"
			>
				<i class="fal fa-fw mx-auto mb-1 d-block fa-map"></i>
				סקיצה
			</a>
		</div>
	</div>
</nav>

<!-- Main content container wrapper -->
<main class="adjust-to-sidebar">
	<div class="container">
		{@render children()}
	</div>
</main>
