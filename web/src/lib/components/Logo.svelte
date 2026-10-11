<script lang="ts">
	import type { Overall } from '$lib/levels';
	import { ARC, BODY, LEVEL_HEX, SHIELD } from '$lib/logo';

	let { level = 'warning', size = 24 }: { level?: Overall; size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" class="shrink-0">
	<path d={SHIELD} fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" />
	<path
		d={ARC}
		fill="none"
		stroke={LEVEL_HEX[level]}
		stroke-width="4"
		stroke-linecap="round"
		class:pulse={level === 'warning'}
	/>
	<circle cx="32" cy="31" r="4.6" fill="currentColor" />
	<path d={BODY} fill="currentColor" />
</svg>
