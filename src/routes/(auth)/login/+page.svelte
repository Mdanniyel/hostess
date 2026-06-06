<script lang="ts">
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { authService } from '$lib/services/AuthService.svelte';
	import { longpress } from '$lib/actions/longpress';
	import { settingsService } from '$lib/services/settingsService.svelte';

	let username = $state('h1@demo.com');
	let password = $state('123456');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		e.stopPropagation(); // Prevents global jQuery/Rails form submit handlers from intercepting and hijacking this form
		isLoading = true;
		errorMessage = '';
		console.log('UI: Login attempt for:', username);

		if (!username.trim() || !password.trim()) {
			errorMessage = 'נא להזין אימייל וסיסמה';
			isLoading = false;
			return;
		}

		try {
			const result = await authService.login(username, password);
			console.log('UI: Login result received:', result);
			if (result.success) {
				console.log('UI: Redirecting to root...');
				await goto(`${base}/`);
			} else {
				console.warn('UI: Login failed with error:', result.error);
				errorMessage = result.error || 'שם המשתמש או הסיסמה אינם נכונים';
			}
		} catch (err: any) {
			console.error('UI: Login error caught in component:', err);
			errorMessage = err?.message || 'שגיאה לא צפויה התרחשה. נא לנסות שנית.';
		} finally {
			console.log('UI: handleLogin finally block reached. Setting isLoading to false.');
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>כניסה למערכת</title>
</svelte:head>

<main class="container">
	<div class="mx-auto">
		<div class="card" id="card">
			<div class="row no-gutters">
				<!-- Right Side: Branding/Lock -->
				<div class="col-24 col-md-9" id="side">
					<div id="side-content">
						<div 
							class="icon rounded-circle d-inline-block"
							use:longpress={() => settingsService.open()}
							style="cursor: pointer;"
						>
							<svg id="Icons" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42.44 46.85">
								<g id="Lock">
									<path
										id="Long_Shadow"
										data-name="Long Shadow"
										d="M42.44,25.71,19.36,2.63,17.7,4.14l-5.89-2.2L5.9,7.1V18.5L.58,31.4,16,46.85A31,31,0,0,0,42.44,25.71Z"
										style="opacity:0.15000000596046448;isolation:isolate"
									></path>
									<g id="Top">
										<path
											d="M13,0A9,9,0,0,0,4,9V23a9,9,0,0,0,18,0V9A9,9,0,0,0,13,0Zm5,23A5,5,0,0,1,8,23V9A5,5,0,0,1,18,9Z"
											style="fill:#fffcf2"
										></path>
									</g>
									<g id="Bottom">
										<rect y="14" width="26" height="18" rx="2" style="fill:#edc03d"></rect>
									</g>
									<g id="Holes">
										<path
											d="M16,22a3,3,0,1,0-4.87,2.32,2,2,0,1,0,3.75,1.39,2,2,0,0,0,0-1.39A3,3,0,0,0,16,22Z"
											style="fill:#344e5f"
										></path>
									</g>
								</g>
							</svg>
						</div>
						<div class="text d-none d-md-block">
							<h4 class="card-title">בואו נתחיל!</h4>
							<h6 class="card-subtitle">
								נא להכניס את האימייל של המשתמש ואת הסיסמא כדי להיכנס למערכת
							</h6>
							<i class="fas fa-chevron-circle-right"></i>
						</div>
					</div>
				</div>

				<!-- Left Side: Form Content -->
				<div class="col-24 col-md-15">
					<div class="card-body">
						<div class="container">
							<div class="text-sm-down-center">
								<h2 class="card-title">כניסה לאפליקציית ספקים</h2>
								<div class="card-subtitle text-muted">
									אפליקציה תפעולית למתחמי אירועים ובעלי מקצוע העוסקים בהפקת האירוע. למעבר למערכת
									iPlan המלאה
									<a href="/he-IL/corp/sign_in">נא ללחוץ כאן</a>
								</div>
							</div>

							{#if errorMessage}
								<div class="alert alert-danger py-2 small mt-3 animate-shake">
									{errorMessage}
								</div>
							{/if}

							<!-- Credentials Login Form -->
							<div class="email_pass_flow_wrapper mt-2">
								<form onsubmit={handleLogin} novalidate target="_self" data-spin-on-ajax="false">
									<div class="row mt-4">
										<div class="col-24">
											<div class="form-group floating-label {username ? 'has-value' : ''}">
												<input
													class="form-control form-control-lg"
													placeholder="true"
													type="email"
													id="model_email"
													bind:value={username}
													required
												/><label for="model_email">אימייל</label>
											</div>
										</div>
										<div class="col-24">
											<div class="form-group">
												<div class="input-group floating-label input-group-lg {password ? 'has-value' : ''}">
													<div class="input-group-main">
														<input
															class="form-control ltr"
															autocomplete="off"
															placeholder="true"
															type={showPassword ? 'text' : 'password'}
															id="model_password"
															bind:value={password}
															required
														/><label for="model_password">סיסמה</label>
													</div>
													<div class="input-group-append">
														<button
															name="button"
															type="button"
															class="btn btn-light"
															aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
															onclick={() => showPassword = !showPassword}
															><i class="fas {showPassword ? 'fa-eye-slash' : 'fa-eye'}"></i>
														</button>
													</div>
												</div>
											</div>
										</div>
									</div>
									<div class="row mt-4">
										<div class="col-24">
											<button type="submit" class="btn btn-light btn-block btn-lg" disabled={isLoading}>
												{#if isLoading}
													<i class="fas fa-spinner fa-spin me-2"></i> כניסה...
												{:else}
													כניסה
												{/if}
											</button>
										</div>
									</div>
								</form>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	main.container {
		background-color: inherit;
	}
</style>
