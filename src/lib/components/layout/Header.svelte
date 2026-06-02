<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { longpress } from '$lib/actions/longpress';
	import { settingsService } from '$lib/services/settingsService.svelte';
</script>

<!-- Header wrapper adjust-to-sidebar -->
<header class="adjust-to-sidebar" id="top-header">
	<nav class="navbar bg-striped navbar-dark navbar-expand-lg text-white">
		<button 
			name="button" 
			type="button" 
			class="navbar-toggler d-block d-lg-none" 
			data-toggle-sidebar="push"
			aria-label="Toggle Menu Mobile"
		>
			<span class="navbar-toggler-icon"></span>
		</button>
		<button 
			name="button" 
			type="button" 
			class="navbar-toggler d-none d-lg-block" 
			data-toggle-sidebar="inline"
			aria-label="Toggle Menu Desktop"
		>
			<span class="navbar-toggler-icon"></span>
		</button>
		<div class="navbar-nav ml-auto">
			<img 
				class="rounded-circle bg-white navbar-image" 
				src="https://iplan-uuc-production.s3.amazonaws.com/public/corp/companies/4/logo_thumb.jpg?1450771519" 
				alt="iPlan Logo"
				use:longpress={() => settingsService.open()}
				style="cursor: pointer;"
			/>
		</div>
	</nav>

	<div id="breadcrumbs">
		<div class="container">
			<ol class="breadcrumb bg-transparent breadcrumbs-count-1">
				<li class="breadcrumb-item text-truncate">
					<span class="text-muted">
						{#if $page.url.pathname.includes('/events')}
							אירועים
						{:else}
							תמונת מצב
						{/if}
					</span>
				</li>
				<li class="breadcrumb-item ml-auto"></li>
			</ol>
		</div>
	</div>
</header>
