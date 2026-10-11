<script lang="ts">
	import { ArrowRight, TriangleAlert } from '@lucide/svelte';
	import { fmtTime } from '$lib/format';
	import { feedName, hazName, nowTitle } from '$lib/labels';
	import type { Assessment, FeedKey, Feeds, Hazard, HazardType, Overall } from '$lib/levels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { stepsFor, tx } from '$lib/prepare/guides';
	import type { Shelter } from '$lib/types';
	import ConditionTiles from './ConditionTiles.svelte';
	import HazardList from './HazardList.svelte';
	import LevelBadge from './LevelBadge.svelte';
	import LevelScale from './LevelScale.svelte';

	let {
		level,
		a,
		feeds,
		nearest,
		onselect
	}: {
		level: Overall;
		a: Assessment | null;
		feeds: Feeds | null;
		nearest: { s: Shelter; km: number } | null;
		onselect: (h: Hazard) => void;
	} = $props();

	const place = $derived(
		here.place.via === 'gps' ? m.location_gps() : here.place.via === 'default' ? m.location_default() : here.place.name
	);
	const active = $derived(a ? a.hazards.filter((h) => !h.sample && h.level !== 'safe') : []);
	const QUIET: HazardType[] = ['flood', 'storm', 'earthquake', 'smoke', 'heat'];
	const NEEDS: Partial<Record<HazardType, FeedKey[]>> = {
		smoke: ['air'],
		heat: ['forecast'],
		flood: ['river', 'gdacs'],
		storm: ['gdacs'],
		earthquake: ['quakes']
	};
	// a type whose feed failed is unknown, not quiet
	const quiet = $derived(
		a && level !== 'unknown'
			? QUIET.filter((t) => !a.hazards.some((h) => h.type === t) && !NEEDS[t]?.some((k) => a.failed.includes(k))).map(hazName)
			: []
	);
	const checking = $derived(a === null); // assess() always returns an Assessment once a refresh finishes
	const title = $derived(
		checking ? m.now_checking_title() : level === 'unknown' ? m.now_unknown_title() : level === 'safe' ? m.now_safe_title() : nowTitle(active.map((h) => h.type))
	);
	const reason = $derived(
		level === 'unknown'
			? a
				? m.now_unknown_body({ time: fmtTime(new Date(a.checkedAt)) })
				: m.now_unknown_never()
			: level === 'safe'
				? m.now_safe_body({ place })
				: active.length === 1
					? m.now_reason_1()
					: m.now_reason_n({ count: active.length })
	);
	const steps = $derived(level === 'warning' && active[0] ? stepsFor(active[0].type, 'warning') : []);
	const shelterHref = $derived(nearest ? localizeHref(`/route?to=shelter:${nearest.s.ShelterID}`) : localizeHref('/shelters'));
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-baseline justify-between gap-2 text-sm text-muted">
		<span>{place}</span>
		{#if a}<span class="font-mono text-[11px]">{m.now_updated({ time: fmtTime(new Date(a.checkedAt)) })}</span>{/if}
	</div>
	{#if !checking}<LevelBadge {level} />{/if}
	<h1 class="headline text-[2.4rem]">{title}</h1>
	{#if !checking}<p class="-mt-1 text-[15px] leading-snug text-[#c9c9cf]">{reason}</p>{/if}
	{#if a && a.failed.length && level !== 'unknown'}
		<p class="text-xs text-watch">{m.now_partial({ feeds: a.failed.map(feedName).join(', ') })}</p>
	{/if}
	<p class="text-xs text-muted">{m.now_guidance()}</p>
	{#if !checking}<LevelScale {level} />{/if}
	{#if steps.length}
		<section class="lv-warning">
			<h2 class="label mb-2">{m.now_steps()}</h2>
			<ol class="flex flex-col gap-1.5 text-[15px]">
				{#each steps as s, i (i)}
					<li class="flex gap-3"><span class="lv-text font-mono text-xs">0{i + 1}</span>{tx(s)}</li>
				{/each}
			</ol>
		</section>
	{/if}
	{#if a}<HazardList hazards={a.hazards} {quiet} {onselect} />{/if}
	<ConditionTiles {feeds} at={here.place} />
	<a
		href={shelterHref}
		class="flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 font-bold {level === 'warning'
			? 'bg-[#e5251b] text-white shadow-[0_8px_30px_rgb(229_37_27/0.35)]'
			: 'bg-text text-bg'}"
	>
		<span class="flex-1">
			{nearest ? (level === 'warning' ? m.now_shelter_go() : m.now_shelter()) : m.now_shelter_none()}
			{#if nearest}<small class="block text-xs font-medium opacity-75">{m.now_shelter_sub({ name: nearest.s.ShelterName, km: nearest.km.toFixed(1) })}</small>{/if}
		</span>
		<ArrowRight size={20} aria-hidden="true" />
	</a>
	<a href={localizeHref('/report')} class="flex min-h-11 items-center gap-2 self-start text-sm text-muted hover:text-text">
		<TriangleAlert size={16} aria-hidden="true" />{m.now_report()}
	</a>
</div>
