<script lang="ts">
	import type { Snippet } from 'svelte';

	let { on, color, onclick, children }: { on: boolean; color?: string; onclick: () => void; children: Snippet } = $props();
</script>

<button
	type="button"
	aria-pressed={on}
	{onclick}
	class="glass inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-bg/60 px-3 text-xs whitespace-nowrap {on ? 'border-white/25 text-text' : 'text-muted'}"
>
	{#if color}<i class="size-2 rounded-full" style="background:{color}" aria-hidden="true"></i>{/if}
	{@render children()}
</button>
