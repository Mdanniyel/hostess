<script lang="ts">
	import { appState } from '$lib/state/AppState.svelte';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';

	// Format a JS timestamp (ms) as a Hebrew locale date/time string
	function formatEventDate(timestamp: number | null): string {
		if (!timestamp) return '';
		return new Intl.DateTimeFormat('he-IL', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(timestamp));
	}

	// Format a JS timestamp as a Hebrew weekday name
	function formatWeekday(timestamp: number | null): string {
		if (!timestamp) return '';
		return new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(new Date(timestamp));
	}

	const apiBaseUrl = import.meta.env.VITE_API_URL || '';
	function getImageUrl(url: string | null): string {
		if (!url) return '';
		if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
			return url;
		}
		return `${apiBaseUrl}${url}`;
	}
</script>
<main class="adjust-to-sidebar">
	<div class="container">
		<div class="d-flex flex-column" style="gap: 1rem;">
		<!-- Today's Events Card -->
		<div class="card">
			<h5 class="card-header mb-0">
				אירועים שמתרחשים היום
				{#if !appState.isOnline}
					<span class="badge badge-secondary ml-2" title="אין חיבור לאינטרנט">
						<i class="fas fa-wifi-slash"></i> לא מחובר
					</span>
				{/if}
			</h5>

			<div class="list-group list-group-flush">
				{#if appState.todayEvents.length === 0}
					<!-- Empty state -->
					<div class="list-group-item text-muted text-center py-3">
						<i class="far fa-calendar-times fa-2x mb-2 d-block"></i>
						אין אירועים מתוכננים להיום
					</div>
				{:else}
					<!-- Event list — populated by liveQuery on IndexedDB (written during login) -->
					{#each appState.todayEvents as event (event.id)}
						<button
							type="button"
							class="list-group-item list-group-item-action text-start"
							onclick={() => goto(`${base}/events/${event.id}/invitations`)}
						>
							<div class="d-flex" style="gap: 1rem;">
								{#if event.photo_url}
									<img
										style="max-height: 48px; max-width: 48px; object-fit: cover;"
										class="img-circle mt-1"
										alt=""
										src={getImageUrl(event.photo_url)}
									/>
								{:else}
									<div
										class="img-circle mt-1 d-flex align-items-center justify-content-center bg-light"
										style="min-width:48px; height:48px;"
									>
										<i class="far fa-calendar-alt text-muted"></i>
									</div>
								{/if}

								<div>
									<h5 class="mb-1">{event.sp_event_title}</h5>
									<span>{formatEventDate(event.start_at)}</span>
									&nbsp;
									<span class="small">{formatWeekday(event.start_at)}</span>
									<span class="small text-muted">&nbsp; {event.event_type} </span>
								</div>
							</div>
						</button>
					{/each}
				{/if}
			</div>

			{#if appState.syncError}
				<div class="card-footer border-0">
					<span class="small text-warning">{appState.syncError}</span>
				</div>
			{/if}
		</div>

		<!-- Support Card -->
		<div class="card shadow-sm">
			<h5 class="card-header">שירות ותמיכה</h5>
			<div class="card-body p-0">
				<div class="list-group list-group-flush">
					<a class="list-group-item list-group-item-action" href="tel:039580020">
						<div class="d-flex align-items-center">
							<i class="fas fa-phone-alt mr-2 fa-fw"></i>
							<strong>תמיכה טלפונית:</strong>
							<span class="ml-2">03-9580020</span>
						</div>
						<p class="mb-0 text-muted small">תרגישו חופשי לפנות אלינו בכל שאלה או בעיה</p>
					</a>
					<a
						class="list-group-item list-group-item-action"
						target="_blank"
						href="/he-IL/front/contact?contact_matter=help&to=vendor"
					>
						<div class="d-flex align-items-center">
							<i class="fas fa-envelope mr-2 fa-fw"></i>
							<strong>פנייה באתר:</strong>
							<span class="ml-2 text-primary">טופס פנייה</span>
						</div>
						<p class="mb-0 text-muted small">צרו איתנו קשר בכל נושא באמצעות פתיחת פנייה באתר</p>
					</a>
				</div>
			</div>
			<div class="card-footer">
				<div class="small text-muted">גרסה: 1.0.0</div>
			</div>
		</div>
	</div>
</div>
</main>
