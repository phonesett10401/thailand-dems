<script lang="ts">
	import { LEVEL_CLASS } from '$lib/severity';
	import type { Level } from '$lib/types';

	let { level, label }: { level: Level; label: string } = $props();
</script>

<span class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold {LEVEL_CLASS[level]}"
	>{label}</span
>
