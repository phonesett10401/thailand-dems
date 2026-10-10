<script lang="ts">
	import { distanceKm } from '$lib/geo';
	import { pm25Label } from '$lib/labels';
	import { T, type Feeds } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';
	import { pm25Band } from '$lib/sources/openmeteo';
	import type { Pt } from '$lib/types';

	let { feeds, at }: { feeds: Feeds | null; at: Pt } = $props();
	const day = $derived(feeds?.forecast?.days[0]);
	const quakes = $derived(
		feeds?.quakes?.filter((q) => distanceKm(at, q) <= T.quakeKm && Date.now() - Date.parse(q.time) <= T.quakeHours * 3600_000).length
	);
</script>

<div class="grid grid-cols-2 gap-2.5">
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_rain()}</div>
		<div class="mt-1 text-2xl font-semibold tracking-tight">{day ? day.rain.toFixed(0) : '—'}<span class="ml-1 text-xs text-muted">mm</span></div>
	</div>
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_air()}</div>
		<div class="mt-1 text-2xl font-semibold tracking-tight">{feeds?.air ? feeds.air.pm25.toFixed(1) : '—'}<span class="ml-1 text-xs text-muted">µg/m³</span></div>
		{#if feeds?.air}<div class="text-xs text-muted">{pm25Label(pm25Band(feeds.air.pm25))}</div>{/if}
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
