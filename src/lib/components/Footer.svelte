<script lang="ts">
	let { adjustSidebar = false } = $props();
</script>

<footer class={adjustSidebar ? 'adjust-to-sidebar' : ''} id="bottom-footer">
	<div class="container py-3 text-center text-muted small">
		<div class="pb-4 pb-sm-0 ltr">
			{new Date().getFullYear()} © iPlan - iplan.co.il
		</div>
	</div>
</footer>

<style>
	footer {
		border-top: 1px solid #ced4da;
	}
</style>
