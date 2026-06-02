<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { authService } from '$lib/services/AuthService.svelte';

	async function handleLogout() {
		console.log('Sidebar: Sign out triggered');
		await authService.logout();
		goto(`${base}/login`);
	}
</script>

<!-- Left/Right navigation Sidebar -->
<nav class="text-white" id="sidebar">
	<div class="sidebar-header">
		<div class="navbar-brand-wrapper">
			<div class="container-fluid">
				<a class="navbar-brand" href="{base}/"><i class="icon-iplan-events"></i></a>
				<button 
					name="button" 
					type="button" 
					class="close" 
					data-toggle-sidebar="push"
				>×</button>
			</div>
		</div>
	</div>
	<div class="sidebar-body border-bottom border-top">
		<div class="menu list-group list-group-dark list-group-flush">
			<a 
				title="תמונת מצב" 
				class="list-group-item list-group-item-action text-truncate level-0" 
				class:active={$page.url.pathname === `${base}/` || $page.url.pathname === `${base}`}
				href="{base}/"
			>
				<i class="fal mr-1 fa-home"></i> תמונת מצב
			</a>
			<a 
				title="אירועים" 
				class="list-group-item list-group-item-action text-truncate level-0" 
				class:active={$page.url.pathname.startsWith(`${base}/events`)}
				href="{base}/events"
			>
				<i class="fal mr-1 fa-glass-martini"></i> אירועים
			</a>
		</div>
	</div>
	<div class="sidebar-footer d-flex align-items-center px-3">
		<img 
			class="img-responsive rounded-circle mr-1" 
			src="https://iplan-uuc-production.s3.amazonaws.com/public/people/263297/profile_photo_thumb.jpg?1567519727" 
			alt="Profile"
		/>
		<div class="overflow-hidden flex-grow-1 py-3">
			<div class="text-truncate mx-2">
				{authService.currentSession?.person_name || 'מארחת iPlan'}
			</div>
		</div>
		<button 
			type="button" 
			class="btn btn-outline-light btn-sm flex-shrink-0" 
			onclick={handleLogout}
		>
			<i class="far fa-sign-out"></i> יציאה
		</button>
	</div>
</nav>
