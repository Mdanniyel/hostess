<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { db } from '$lib/db';
	import PageSpinner from '$lib/components/PageSpinner.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import ModalTemplates from '$lib/components/ModalTemplates.svelte';

	let { children } = $props();

	onMount(() => {
		// Set body classes for login styling and spinner removal
		document.body.setAttribute('data-state', 'loaded');
		document.body.classList.add('login-page');

		// Redirect to app root if already authenticated
		db.sessions.get('current').then((session) => {
			if (session) {
				console.log('Auth Guard: Active session exists, redirecting to app root');
				goto(`${base}/`);
			}
		});

		// Clean up body classes when leaving the route
		return () => {
			document.body.classList.remove('login-page');
		};
	});
</script>

<svelte:head>
	<link rel="stylesheet" href="{base}/login.bundle.css" />
	<script src="{base}/login.bundle.js" defer></script>
</svelte:head>

<PageSpinner />

<header id="top-header">
	<div class="bg-dark text-light d-none" id="pwa-install">
		<div class="container d-flex align-items-center">
			<div class="alert my-0">
				<div class="font-weight-bolder">עוד לא הורדתם את האפליקציה?</div>
				<div class="small">לחצו על כפתור ההודדה ועקבו אחרי ההוראות</div>
			</div>
			<button
				name="button"
				type="button"
				class="ml-auto btn btn-outline-light"
				data-action="install"
				><i class="fas fa-download fa-fw mr-1"></i>
				הורדה
			</button>
		</div>
	</div>
</header>

{@render children()}

<Footer />

<div class="modal" id="ios-pwa-install-modal" tabindex="-1">
	<div class="modal-dialog h-auto">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title">
					<i class="fab fa-app-store-ios"></i>
					התקנת אפליקציה
				</h5>
				<button name="button" type="button" class="close" data-dismiss="modal"
					><span>×</span>
				</button>
			</div>
			<div class="modal-body">
				<ol>
					<li>
						לחצו על כפתור השיתוף (Share) בספארי
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							style="width:1em;height:1em;vertical-align:middle;position: relative; top: -2px"
							><g fill="#141414" fill-rule="nonzero"
								><path
									d="m6 6c.27614237 0 .5.22385763.5.5s-.22385763.5-.5.5c-.55228475 0-1 .44771525-1 1 0 .27614237-.22385763.5-.5.5s-.5-.22385763-.5-.5c0-1.1045695.8954305-2 2-2z"
								></path><path
									d="m6 7c-.27614237 0-.5-.22385763-.5-.5s.22385763-.5.5-.5h2.5c.27614237 0 .5.22385763.5.5s-.22385763.5-.5.5z"
								></path><path
									d="m6 22c-.27614237 0-.5-.2238576-.5-.5s.22385763-.5.5-.5h12c.2761424 0 .5.2238576.5.5s-.2238576.5-.5.5z"
								></path><path
									d="m15.5 7c-.2761424 0-.5-.22385763-.5-.5s.2238576-.5.5-.5h2.5c.2761424 0 .5.22385763.5.5s-.2238576.5-.5.5z"
								></path><path
									d="m4 8c0-.27614237.22385763-.5.5-.5s.5.22385763.5.5v12c0 .2761424-.22385763.5-.5.5s-.5-.2238576-.5-.5z"
								></path><path
									d="m19 8c0-.27614237.2238576-.5.5-.5s.5.22385763.5.5v12c0 .2761424-.2238576.5-.5.5s-.5-.2238576-.5-.5z"
								></path><path
									d="m20 8c0 .27614237-.2238576.5-.5.5s-.5-.22385763-.5-.5c0-.55228475-.4477153-1-1-1-.2761424 0-.5-.22385763-.5-.5s.2238576-.5.5-.5c1.1045695 0 2 .8954305 2 2z"
								></path><path
									d="m4 20c0-.2761424.22385763-.5.5-.5s.5.2238576.5.5c0 .5522847.44771525 1 1 1 .27614237 0 .5.2238576.5.5s-.22385763.5-.5.5c-1.1045695 0-2-.8954305-2-2z"
								></path><path
									d="m18 22c-.2761424 0-.5-.2238576-.5-.5s.2238576-.5.5-.5c.5522847 0 1-.4477153 1-1 0-.2761424.2238576-.5.5-.5s.5.2238576.5.5c0 1.1045695-.8954305 2-2 2z"
								></path><path
									d="m11.5.5c0-.27614237.2238576-.5.5-.5s.5.22385763.5.5v14c0 .2761424-.2238576.5-.5.5s-.5-.2238576-.5-.5z"
								></path><path
									d="m12 1.20710678-2.64644661 2.64644661c-.19526215.19526215-.51184463.19526215-.70710678 0s-.19526215-.51184463 0-.70710678l2.99999999-3c.1952622-.19526215.5118446-.19526215.7071068 0l3 3c.1952621.19526215.1952621.51184463 0 .70710678-.1952622.19526215-.5118446.19526215-.7071068 0z"
								></path></g
							></svg
						>
					</li>
					<li>בחרו "הוספה למסך הבית" (Add to Home Screen)</li>
				</ol>
			</div>
			<div class="modal-footer">
				<button name="button" type="button" class="btn-block btn btn-light" data-dismiss="modal"
					>close</button
				>
			</div>
		</div>
	</div>
</div>

<ModalTemplates />

<header class="bg-warning" id="environment-header">
	<div class="container"></div>
</header>
