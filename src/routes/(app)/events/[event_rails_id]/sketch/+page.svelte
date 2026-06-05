<script lang="ts">
	import { appState } from '$lib/state/AppState.svelte';
	import { db } from '$lib/db';
	import { page } from '$app/stores';
	import { onDestroy } from 'svelte';
	import { downloadSketchBlob } from '$lib/sync/sketchDownloader';

	let eventRailsId = $derived(Number($page.params.event_rails_id));
	let eventRecord = $derived(appState.todayEvents.find((e) => e.id === eventRailsId));

	// State for zooming & panning
	let scale = $state(1);
	let offsetX = $state(0);
	let offsetY = $state(0);
	let isDragging = $state(false);

	let startX = 0;
	let startY = 0;

	// Pinch-to-zoom state
	let initialDistance = 0;
	let initialScale = 1;

	// Object URL logic for the blob preview
	let objectUrl = $state<string | null>(null);

	$effect(() => {
		if (eventRecord?.sketch_blob) {
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
			objectUrl = URL.createObjectURL(eventRecord.sketch_blob);
			// Reset zoom coordinates when changing events/sketches
			resetZoom();
		} else {
			if (objectUrl) {
				URL.revokeObjectURL(objectUrl);
			}
			objectUrl = null;
		}
	});

	onDestroy(() => {
		if (objectUrl) {
			URL.revokeObjectURL(objectUrl);
		}
	});

	// Element reference for wheel handler binding
	let containerElement = $state<HTMLDivElement | null>(null);

	$effect(() => {
		const el = containerElement;
		if (!el) return;

		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			const zoomFactor = 1.1;
			if (e.deltaY < 0) {
				// Zoom In
				scale = Math.min(scale * zoomFactor, 5);
			} else {
				// Zoom Out
				scale = Math.max(scale / zoomFactor, 0.5);
			}
		};

		el.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			el.removeEventListener('wheel', onWheel);
		};
	});

	// Zoom In / Out / Reset Controls
	function zoomIn() {
		scale = Math.min(scale * 1.2, 5);
	}

	function zoomOut() {
		scale = Math.max(scale / 1.2, 0.5);
	}

	function resetZoom() {
		scale = 1;
		offsetX = 0;
		offsetY = 0;
	}

	// Mouse handlers
	function handleMouseDown(e: MouseEvent) {
		if (!objectUrl) return;
		isDragging = true;
		startX = e.clientX - offsetX;
		startY = e.clientY - offsetY;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging) return;
		offsetX = e.clientX - startX;
		offsetY = e.clientY - startY;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Touch handlers
	function handleTouchStart(e: TouchEvent) {
		if (!objectUrl) return;
		if (e.touches.length === 1) {
			isDragging = true;
			startX = e.touches[0].clientX - offsetX;
			startY = e.touches[0].clientY - offsetY;
		} else if (e.touches.length === 2) {
			isDragging = false;
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			initialDistance = Math.sqrt(dx * dx + dy * dy);
			initialScale = scale;
		}
	}

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 1 && isDragging) {
			offsetX = e.touches[0].clientX - startX;
			offsetY = e.touches[0].clientY - startY;
		} else if (e.touches.length === 2) {
			const dx = e.touches[0].clientX - e.touches[1].clientX;
			const dy = e.touches[0].clientY - e.touches[1].clientY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			if (initialDistance > 0) {
				const factor = distance / initialDistance;
				scale = Math.min(Math.max(initialScale * factor, 0.5), 5);
			}
		}
	}

	function handleTouchEnd() {
		isDragging = false;
		initialDistance = 0;
	}

	// Retry download logic
	let isRetrying = $state(false);
	let retryError = $state<string | null>(null);

	async function handleRetryDownload() {
		if (!eventRecord?.sketch_url) return;
		isRetrying = true;
		retryError = null;
		try {
			const session = await db.sessions.get('current');
			const blob = await downloadSketchBlob(eventRecord.sketch_url, session?.access_token || null);
			if (blob) {
				await db.events.update(eventRecord.id, { sketch_blob: blob });
				retryError = null;
			} else {
				retryError = 'הורדת הסקיצה נכשלה. אנא ודאו שאתם מחוברים לאינטרנט.';
			}
		} catch (err: any) {
			retryError = err.message || 'שגיאה לא צפויה בעת הורדת הסקיצה.';
		} finally {
			isRetrying = false;
		}
	}
</script>

<div class="container py-3">
	<div class="card shadow-sm border-0 rounded-3 overflow-hidden">
		<!-- Header -->
		<div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
			<h5 class="card-title mb-0 font-weight-bold">
				סקיצה - {eventRecord?.sp_event_title || 'טוען...'}
			</h5>
			{#if eventRecord?.sketch_url && !eventRecord.sketch_blob}
				<button 
					class="btn btn-outline-primary btn-sm rounded-pill px-3" 
					disabled={isRetrying}
					onclick={handleRetryDownload}
				>
					{#if isRetrying}
						<i class="far fa-spinner-third fa-spin me-1"></i> מוריד...
					{:else}
						<i class="far fa-cloud-download me-1"></i> הורד סקיצה
					{/if}
				</button>
			{/if}
		</div>

		<!-- Body -->
		<div class="card-body p-0 position-relative bg-light d-flex flex-column align-items-center justify-content-center" style="min-height: 450px;">
			{#if !eventRecord}
				<div class="p-4 text-center text-muted">
					<i class="far fa-circle-notch fa-spin fa-2x mb-3 text-primary d-block"></i>
					טוען נתוני אירוע...
				</div>
			{:else if !eventRecord.has_sketch}
				<div class="p-5 text-center w-100">
					<div class="alert alert-warning border-0 shadow-sm mx-auto" style="max-width: 500px;">
						<i class="far fa-exclamation-triangle fa-2x mb-3 d-block text-warning"></i>
						<strong>עדיין לא נוצרה סקיצה לאירוע זה.</strong>
						<p class="mb-0 mt-2 text-muted small">ניתן להוסיף סקיצה במערכת הניהול הראשי במחשב.</p>
					</div>
				</div>
			{:else if !eventRecord.sketch_url}
				<div class="p-5 text-center w-100">
					<div class="alert alert-warning border-0 shadow-sm mx-auto" style="max-width: 500px;">
						<i class="far fa-image fa-2x mb-3 d-block text-warning"></i>
						<strong>קיימת סקיצה לאירוע, אך התמונה המקדימה שלה חסרה בשרת.</strong>
						<p class="mb-0 mt-2 text-muted small">יש להיכנס למערכת הניהול הראשי ולשמור את הסקיצה כדי לייצר את התמונה המקדימה.</p>
					</div>
				</div>
			{:else if !objectUrl}
				<div class="p-5 text-center w-100">
					<div class="alert alert-info border-0 shadow-sm mx-auto" style="max-width: 500px;">
						<i class="far fa-cloud-download fa-2x mb-3 d-block text-info"></i>
						<strong>הסקיצה לא זמינה במכשיר.</strong>
						{#if retryError}
							<div class="text-danger mt-2 small">{retryError}</div>
						{:else}
							<p class="mb-0 mt-2 text-muted small">לחצו על כפתור "הורד סקיצה" כדי להוריד ולשמור אותה לשימוש במצב אופליין.</p>
						{/if}
						<button 
							class="btn btn-primary mt-3 px-4 rounded-pill shadow-sm"
							disabled={isRetrying}
							onclick={handleRetryDownload}
						>
							{#if isRetrying}
								<i class="far fa-spinner-third fa-spin me-1"></i> מוריד...
							{:else}
								<i class="far fa-cloud-download me-1"></i> הורד סקיצה כעת
							{/if}
						</button>
					</div>
				</div>
			{:else}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div 
					bind:this={containerElement}
					class="sketch-container"
					role="presentation"
					onmousedown={handleMouseDown}
					onmousemove={handleMouseMove}
					onmouseup={handleMouseUp}
					onmouseleave={handleMouseUp}
					ontouchstart={handleTouchStart}
					ontouchmove={handleTouchMove}
					ontouchend={handleTouchEnd}
					ontouchcancel={handleTouchEnd}
				>
					<!-- Floating Zoom Toolbar -->
					<div class="zoom-controls">
						<button class="btn btn-white border shadow-sm btn-zoom" onclick={zoomIn} aria-label="הגדל">
							<i class="far fa-plus"></i>
						</button>
						<button class="btn btn-white border shadow-sm btn-zoom" onclick={zoomOut} aria-label="הקטן">
							<i class="far fa-minus"></i>
						</button>
						<button class="btn btn-white border shadow-sm btn-zoom" onclick={resetZoom} aria-label="התאם למסך">
							<i class="far fa-expand"></i>
						</button>
					</div>

					<!-- Pannable / Zoomable Wrapper -->
					<div 
						class="sketch-image-wrapper"
						style="transform: translate({offsetX}px, {offsetY}px) scale({scale});"
					>
						<img 
							src={objectUrl} 
							alt="סקיצת אירוע" 
							class="sketch-image shadow"
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.sketch-container {
		position: relative;
		width: 100%;
		height: calc(100vh - 200px);
		min-height: 480px;
		overflow: hidden;
		background-color: #eef2f5;
		cursor: grab;
		user-select: none;
		touch-action: none;
	}

	.sketch-container:active {
		cursor: grabbing;
	}

	.sketch-image-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		transform-origin: center center;
		transition: transform 0.05s linear;
	}

	.sketch-image {
		max-width: 95%;
		max-height: 95%;
		object-fit: contain;
		pointer-events: none;
		border-radius: 4px;
		background-color: #fff;
	}

	.zoom-controls {
		position: absolute;
		top: 15px;
		left: 15px; /* In RTL, place on the left for easy reach without blocking right text */
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 10;
	}

	.btn-zoom {
		width: 42px;
		height: 42px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px !important;
		font-size: 1.1rem;
		background-color: #ffffff;
		color: #495057;
		transition: all 0.2s ease;
	}

	.btn-zoom:hover {
		background-color: #f8f9fa;
		color: #212529;
		transform: scale(1.05);
	}

	.btn-zoom:active {
		transform: scale(0.95);
	}
</style>
