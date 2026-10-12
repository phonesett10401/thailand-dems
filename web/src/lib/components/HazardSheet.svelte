<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { fmtDateTime } from '$lib/format';
	import { hazLine, hazName } from '$lib/labels';
	import type { Hazard } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { guideOf, stepsFor, tx } from '$lib/prepare/guides';
	import LevelBadge from './LevelBadge.svelte';
	import Sheet from './Sheet.svelte';

	let { hazard = $bindable(null) }: { hazard: Hazard | null } = $props();
	const steps = $derived(hazard ? stepsFor(hazard, hazard.level) : []);
	const guide = $derived(hazard ? guideOf(hazard) : null);
</script>

<Sheet
	bind:open={() => hazard !== null, (v) => { if (!v) hazard = null; }}
	title={hazard ? hazName(hazard.type) : ''}
>
	{#if hazard}
		<div class="flex flex-col gap-4">
			<LevelBadge level={hazard.level} />
			<p class="text-muted">{hazLine(hazard)}</p>
			{#if steps.length}
				<section>
					<h3 class="label mb-2">{m.now_steps()}</h3>
					<ol class="flex flex-col gap-2">
						{#each steps as s, i (i)}
							<li class="flex gap-3"><span class="lv-{hazard.level} lv-text font-mono text-xs">0{i + 1}</span>{tx(s)}</li>
						{/each}
					</ol>
				</section>
			{/if}
			{#if hazard.sample}<p class="rounded-lg border border-line p-3 text-sm text-muted">{m.hazard_sample_note()}</p>{/if}
			<p class="font-mono text-[11px] text-muted">
				{m.hazard_source({ source: hazard.source, time: hazard.time ? fmtDateTime(hazard.time) : '—' })}
				{#if hazard.km !== null}<br />{m.hazard_distance({ km: hazard.km.toFixed(0) })}{/if}
			</p>
			<div class="flex flex-wrap gap-2">
				{#if guide}
					<a href={localizeHref(`/prepare/${guide}`)} class="inline-flex min-h-11 items-center rounded-lg bg-text px-4 font-semibold text-bg">{m.hazard_guide()}</a>
				{/if}
				{#if hazard.url}
					<a href={hazard.url} target="_blank" rel="noopener" class="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-4 text-sm"
						><ExternalLink size={14} aria-hidden="true" />{m.hazard_open_source()}</a
					>
				{/if}
			</div>
		</div>
	{/if}
</Sheet>
