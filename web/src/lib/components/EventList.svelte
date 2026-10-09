<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import { fmtDateTime } from '$lib/format';
	import { kindLabel } from '$lib/labels';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { LEVEL_STRIPE } from '$lib/severity';
	import type { HazardEvent } from '$lib/types';

	let {
		events,
		limit = Infinity,
		onselect
	}: { events: HazardEvent[]; limit?: number; onselect?: (e: HazardEvent) => void } = $props();
</script>

<ul class="divide-y divide-rule">
	{#each events.slice(0, limit) as e (e.id)}
		<li animate:flip={{ duration: ms(200) }}>
			{#snippet body()}
				<span class="w-1.5 self-stretch rounded-sm {LEVEL_STRIPE[e.level]}" aria-hidden="true"></span>
				<span class="flex min-w-0 flex-1 flex-col">
					<span class="font-semibold">{e.title}</span>
					<span class="font-mono text-[11px] text-muted">
						{kindLabel(e.kind)} · {fmtDateTime(e.time)} · {e.source}
						{#if e.current}<span class="ml-1 rounded bg-alarm px-1 text-white">{m.event_current()}</span>{/if}
					</span>
				</span>
			{/snippet}
			{#if onselect}
				<button type="button" onclick={() => onselect(e)} class="flex w-full gap-3 py-3 text-left">
					{@render body()}
				</button>
			{:else}
				<a href={e.url} target="_blank" rel="noopener" class="flex gap-3 py-3">
					{@render body()}<ExternalLink size={16} aria-hidden="true" class="mt-1 shrink-0 text-muted" />
				</a>
			{/if}
		</li>
	{/each}
</ul>
