<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { longpress } from '$lib/actions/longpress';
	import { settingsService } from '$lib/services/settingsService.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
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
				class="navbar-image"
				src="{base}/iplan-logo.svg"
				alt="iPlan Logo"
				use:longpress={() => settingsService.open()}
				style="cursor: pointer; filter: invert(1);"
			/>
		</div>
	</nav>

	<Breadcrumbs />
</header>
