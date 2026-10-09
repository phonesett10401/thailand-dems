<script lang="ts">
	import { CloudRain, Waves, Wind } from '@lucide/svelte';
	import { fmtDay } from '$lib/format';
	import { pm25Label, pm25Level } from '$lib/labels';
	import { m } from '$lib/paraglide/messages.js';
	import { LEVEL_STRIPE } from '$lib/severity';
	import { sourced } from '$lib/sources/http';
	import { getAir, getForecast, getRiver, pm25Band, type Air, type Forecast, type River } from '$lib/sources/openmeteo';
	import type { Pt, Sourced } from '$lib/types';
	import SourceStamp from './SourceStamp.svelte';

	let { place }: { place: Pt } = $props();

	let fc = $state<Sourced<Forecast> | null>(null);
	let air = $state<Sourced<Air> | null>(null);
	let river = $state<Sourced<River | null> | null>(null);
	let token = 0;

	function load(p: Pt) {
		const t = ++token;
		fc = air = river = null;
		sourced('Open-Meteo', () => getForecast(p)).then((r) => t === token && (fc = r));
		sourced('Open-Meteo', () => getAir(p)).then((r) => t === token && (air = r));
		sourced('Open-Meteo', () => getRiver(p)).then((r) => t === token && (river = r));
	}

	$effect(() => load({ lat: place.lat, lon: place.lon }));

	const failed = $derived([fc, air, river].some((x) => x && 'error' in x));
	const stamp = $derived(
		[fc, air, river].find((x) => x && 'data' in x) as { source: string; updatedAt: Date } | undefined
	);
</script>

<div class="grid grid-cols-3 gap-2">
	<div class="flex flex-col gap-1 rounded-xl bg-paper p-3">
		<span class="flex items-center gap-1 text-xs font-semibold text-muted"
			><Wind size={14} class="shrink-0" aria-hidden="true" />{m.pm25_title()}</span
		>
		{#if air && 'data' in air}
			{@const band = pm25Band(air.data.pm25)}
			<span class="font-mono text-xl font-medium">{air.data.pm25.toFixed(1)}<span class="text-xs"> µg/m³</span></span>
			<span class="flex items-center gap-1 text-xs"
				><span class="h-2 w-2 rounded-full {LEVEL_STRIPE[pm25Level(band)]}" aria-hidden="true"></span>{pm25Label(
					band
				)}</span
			>
		{:else}
			<span class="font-mono text-xl text-muted">—</span>
		{/if}
	</div>
	<div class="flex flex-col gap-1 rounded-xl bg-paper p-3">
		<span class="flex items-center gap-1 text-xs font-semibold text-muted"
			><CloudRain size={14} class="shrink-0" aria-hidden="true" />{m.rain_title()}</span
		>
		{#if fc && 'data' in fc}
			<span class="font-mono text-xl font-medium">{Math.max(...fc.data.hours.map((h) => h.rainChance))}%</span>
		{:else}
			<span class="font-mono text-xl text-muted">—</span>
		{/if}
	</div>
	<div class="flex flex-col gap-1 rounded-xl bg-paper p-3">
		<span class="flex items-center gap-1 text-xs font-semibold text-muted"
			><Waves size={14} class="shrink-0" aria-hidden="true" />{m.river_title()}</span
		>
		{#if river && 'data' in river}
			{#if river.data}
				<span class="text-xs leading-snug">
					{river.data.rising
						? m.river_rising({ peak: river.data.peak.toFixed(1), date: fmtDay(`${river.data.peakDate}T12:00:00Z`) })
						: m.river_steady({ today: river.data.today.toFixed(1) })}
				</span>
			{:else}
				<span class="text-xs text-muted">{m.river_none()}</span>
			{/if}
		{:else}
			<span class="font-mono text-xl text-muted">—</span>
		{/if}
	</div>
</div>
<p class="mt-1 text-[11px] text-muted">{m.river_note()}</p>
{#if failed}
	<p role="status" class="mt-1 text-sm text-alarm">
		{m.source_unavailable({ source: 'Open-Meteo' })}
		<button type="button" class="ml-1 font-semibold underline" onclick={() => load({ lat: place.lat, lon: place.lon })}
			>{m.retry()}</button
		>
	</p>
{:else if stamp}
	<SourceStamp source={stamp.source} updatedAt={stamp.updatedAt} />
{/if}
