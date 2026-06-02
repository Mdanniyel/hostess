<script lang="ts">
	import { settingsService } from '$lib/services/settingsService.svelte';

	const initialUrl = settingsService.currentApiUrl;
	let selectedHost = $state(initialUrl);
	let customHost = $state('');
	let isCustom = $state(false);

	const predefinedHosts = [
		{ label: 'ייצור (iplan.co.il)', value: 'https://iplan.co.il' },
		{ label: 'Staging 2', value: 'https://staging2.iplan.co.il' },
		{ label: 'Staging 3', value: 'https://staging3.iplan.co.il' },
		{ label: 'שרת פיתוח ברשת (192.168.10.66)', value: 'http://192.168.10.66:3000' },
		{ label: 'מנהרה מקומית (iplan.casa)', value: 'https://devl-tunnel-daniel-levi-lvhme3000.iplan.casa' },
		{ label: 'פיתוח מקומי (lvh.me)', value: 'http://lvh.me:3000' }
	];

	// Initialize state
	const matchingPredefined = predefinedHosts.find(h => h.value === initialUrl);
	if (initialUrl && !matchingPredefined) {
		isCustom = true;
		customHost = initialUrl;
	} else if (!initialUrl) {
		// Default to production
		selectedHost = predefinedHosts[0].value;
	}

	function handleSave() {
		const targetHost = isCustom ? customHost.trim() : selectedHost;
		settingsService.saveHost(targetHost);
	}

	function handleCancel() {
		settingsService.close();
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="modal-overlay" onclick={handleCancel} role="presentation">
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="modal-container" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-header">
			<h5 id="modal-title" class="modal-title">הגדרות שרת API</h5>
			<button class="close-btn" onclick={handleCancel} aria-label="סגור">&times;</button>
		</div>
		<div class="modal-body">
			<p class="desc-text">בחרו את שרת ה-API שאליו האפליקציה תתחבר:</p>
			
			<div class="options-list">
				{#each predefinedHosts as host}
					<label class="radio-label">
						<input 
							type="radio" 
							name="api-host" 
							value={host.value} 
							checked={!isCustom && selectedHost === host.value}
							onchange={() => { isCustom = false; selectedHost = host.value; }}
						/>
						<span class="radio-text">{host.label}</span>
					</label>
				{/each}

				<label class="radio-label">
					<input 
						type="radio" 
						name="api-host" 
						value="custom" 
						checked={isCustom}
						onchange={() => isCustom = true}
					/>
					<span class="radio-text">שרת מותאם אישית</span>
				</label>
			</div>

			{#if isCustom}
				<div class="custom-input-group animate-fade-in">
					<input 
						type="url" 
						class="form-input" 
						placeholder="https://example.com" 
						bind:value={customHost}
						dir="ltr"
					/>
				</div>
			{/if}
		</div>
		<div class="modal-footer">
			<button class="btn btn-save" onclick={handleSave}>שמור והפעל מחדש</button>
			<button class="btn btn-cancel" onclick={handleCancel}>ביטול</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(15, 23, 42, 0.6);
		backdrop-filter: blur(8px);
		z-index: 99999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
	}

	.modal-container {
		background: #ffffff;
		border-radius: 16px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		width: 100%;
		max-width: 440px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border: 1px solid rgba(226, 232, 240, 0.8);
		direction: rtl;
		text-align: right;
	}

	.modal-header {
		padding: 18px 24px;
		border-bottom: 1px solid #f1f5f9;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: #0f172a;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: #94a3b8;
		cursor: pointer;
		line-height: 1;
		padding: 0;
	}
	.close-btn:hover {
		color: #475569;
	}

	.modal-body {
		padding: 24px;
		color: #334155;
	}

	.desc-text {
		font-size: 0.95rem;
		margin-bottom: 16px;
		color: #475569;
	}

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		padding: 10px 12px;
		border-radius: 8px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		transition: all 0.2s ease;
	}
	.radio-label:hover {
		background: #f1f5f9;
		border-color: #cbd5e1;
	}

	.radio-text {
		font-size: 0.92rem;
		color: #334155;
	}

	.custom-input-group {
		margin-top: 14px;
	}

	.form-input {
		width: 100%;
		padding: 10px 14px;
		border-radius: 8px;
		border: 1px solid #cbd5e1;
		font-size: 0.95rem;
		box-sizing: border-box;
		outline: none;
		transition: border-color 0.2s;
	}
	.form-input:focus {
		border-color: #2e4a7d;
		box-shadow: 0 0 0 3px rgba(46, 74, 125, 0.15);
	}

	.modal-footer {
		padding: 18px 24px;
		border-top: 1px solid #f1f5f9;
		display: flex;
		gap: 12px;
		justify-content: flex-start;
	}

	.btn {
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn-save {
		background: #2e4a7d;
		color: white;
	}
	.btn-save:hover {
		background: #1e335a;
	}

	.btn-cancel {
		background: #f1f5f9;
		color: #475569;
	}
	.btn-cancel:hover {
		background: #e2e8f0;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.animate-fade-in {
		animation: fadeIn 0.2s ease forwards;
	}
</style>
