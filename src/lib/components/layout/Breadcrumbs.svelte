<script lang="ts">
	import { page } from '$app/stores';
	import { eventState } from '$lib/state/EventState.svelte';
</script>

<div id="breadcrumbs">
	<div class="container">
		<ol class="breadcrumb bg-transparent breadcrumbs-count-1">
			{#if $page.url.pathname.includes('/events')}
				{#if eventState.activeEvent}
					<li class="breadcrumb-item text-truncate">
						<span class="text-muted">{eventState.activeEventTitle}</span>
					</li>
					<li class="breadcrumb-item ml-auto">
						<div class="d-flex h-100 gap-2 align-items-center">
							<div class="badge badge-light border">
								<span>{eventState.activeEventDateFormatted}</span>
								<span class="text-muted opacity-6"> | </span>
								<span>{eventState.activeEventTimeFormatted}</span>
								<span class="text-muted opacity-6"> | </span>
								<span>{eventState.activeEventDayOfWeek}</span>
							</div>
							{#if eventState.activeEventType}
								<div class="badge badge-light border">{eventState.activeEventType}</div>
							{/if}
						</div>
					</li>
				{:else}
					<li class="breadcrumb-item text-truncate">
						<span class="text-muted">טוען אירוע...</span>
					</li>
					<li class="breadcrumb-item ml-auto"></li>
				{/if}
			{:else}
				<li class="breadcrumb-item text-truncate">
					<span class="text-muted"> תמונת מצב </span>
				</li>
				<li class="breadcrumb-item ml-auto"></li>
			{/if}
		</ol>
	</div>
</div>
