<script lang="ts">
	import { distanceKm } from '$lib/geo';
	import { pm25Label, rainLabel } from '$lib/labels';
	import { T, type Feeds } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';
	import { pm25Band, rainBand, type Pm25Band } from '$lib/sources/openmeteo';
	import type { Pt } from '$lib/types';

	let { feeds, at }: { feeds: Feeds | null; at: Pt } = $props();
	const day = $derived(feeds?.forecast?.days[0]);
	const quakes = $derived(
		feeds?.quakes?.filter((q) => distanceKm(at, q) <= T.quakeKm && Date.now() - Date.parse(q.time) <= T.quakeHours * 3600_000).length
	);
	const AIR_TONE: Record<Pm25Band, string> = { very_good: 'text-safe', good: 'text-safe', moderate: '', unhealthy_some: 'text-watch', unhealthy: 'text-warning' };
</script>

<div class="grid grid-cols-2 gap-2.5">
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_rain()}</div>
		<div class="mt-1 text-xl font-semibold">{day ? rainLabel(rainBand(day.rain)) : '—'}</div>
		{#if day}<div class="text-xs text-muted">{m.weather_rain_mm({ mm: day.rain.toFixed(0) })}</div>{/if}
	</div>
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_air()}</div>
		<div class="mt-1 text-xl font-semibold {feeds?.air ? AIR_TONE[pm25Band(feeds.air.pm25)] : ''}">{feeds?.air ? pm25Label(pm25Band(feeds.air.pm25)) : '—'}</div>
		{#if feeds?.air}<div class="text-xs text-muted">{m.line_pm25({ value: feeds.air.pm25.toFixed(1) })}</div>{/if}
	</div>
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_river()}</div>
		<div class="mt-1 text-xl font-semibold {feeds?.river?.rising ? 'text-watch' : ''}">
			{feeds?.river === undefined ? '—' : feeds.river === null ? m.tile_none() : feeds.river.rising ? m.tile_rising() : m.tile_normal()}
		</div>
	</div>
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_quakes()}</div>
		<div class="mt-1 text-xl font-semibold">{quakes === undefined ? '—' : quakes === 0 ? m.tile_none() : quakes}</div>
	</div>
</div>
