<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authService } from '$lib/services/AuthService.svelte';
	import PageSpinner from '$lib/components/PageSpinner.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ModalTemplates from '$lib/components/ModalTemplates.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';

	let { children } = $props();

	// Reactive auth guard: redirect to login if session expires or user logs out
	$effect(() => {
		if (authService.isInitialized && !authService.isAuthenticated) {
			console.warn('Auth Guard (Reactive): User is not authenticated, redirecting to login');
			goto(`${base}/login`);
		}
	});

	onMount(() => {
		// Update base document body attributes for premium desktop-sidebar layouts
		document.body.setAttribute('data-inline-sidebar', 'open');
		document.body.setAttribute('data-push-sidebar', 'close');
		document.body.setAttribute('data-sidebar', 'static');
		document.body.setAttribute('data-state', 'loaded');
		document.body.classList.remove('login-page');
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="{base}/app.bundle.css" />
	<script src="{base}/app.bundle.js" defer></script>
</svelte:head>

<PageSpinner />

<Header />

{@render children()}

<!-- Bottom Footer wrapper adjust-to-sidebar -->
<Footer adjustSidebar={true} />

<!-- Sidebar Mask Overlay for mobile closure -->
<div id="sidebar-mask" class=""></div>

<Sidebar />


<ModalTemplates />


