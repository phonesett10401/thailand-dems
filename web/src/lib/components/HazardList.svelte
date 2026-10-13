<script lang="ts">
	import { HAZ_CODE, hazLine, hazTitle, levelWord } from '$lib/labels';
	import type { Hazard } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';

	let { hazards, quiet = [], onselect }: { hazards: Hazard[]; quiet?: string[]; onselect: (h: Hazard) => void } = $props();
</script>

<ul class="glass divide-y divide-line overflow-hidden rounded-2xl">
	{#each hazards as h (h.id)}
		<li>
			<button
				type="button"
				onclick={() => onselect(h)}
				class="lv-{h.level} flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
			>
				<span class="lv-bg grid size-8 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-bold text-bg" aria-hidden="true"
					>{HAZ_CODE[h.type]}</span
				>
				<span class="min-w-0 flex-1">
					<span class="block font-semibold"
						>{hazTitle(h)}{#if h.type === 'official'}<span class="label lv-text ml-2 inline-block rounded border border-current px-1 py-px whitespace-nowrap">{m.official_badge()}</span>{/if}{#if h.sample}<span class="label ml-2 rounded border border-line px-1 py-px">{m.sample_tag()}</span>{/if}</span
					>
					<span class="block truncate text-xs text-muted">{hazLine(h)}</span>
				</span>
				<span class="lv-text font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">{levelWord(h.level)}</span>
			</button>
		</li>
	{/each}
	{#if quiet.length}
		<li class="flex items-center gap-3 px-3 py-2.5 text-muted">
			<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 font-mono text-[11px] text-muted" aria-hidden="true">~</span>
			<span class="text-sm"><b class="font-semibold text-muted">{quiet.join(' · ')}</b> <span class="text-muted">{m.now_quiet()}</span></span>
		</li>
	{/if}
</ul>
