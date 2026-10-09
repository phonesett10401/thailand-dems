<script lang="ts">
	import { Droplets } from '@lucide/svelte';
	import Conditions from '$lib/components/Conditions.svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import SourceStamp from '$lib/components/SourceStamp.svelte';
	import { fmtDay, fmtHour } from '$lib/format';
	import { wxIcon, wxLabel } from '$lib/labels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { sourced } from '$lib/sources/http';
	import { getForecast, type Forecast } from '$lib/sources/openmeteo';
	import type { Pt, Sourced } from '$lib/types';
	import { weatherKey } from '$lib/weather-codes';

	let fc = $state<Sourced<Forecast> | null>(null);
	let token = 0;

	function load(p: Pt) {
		const t = ++token;
		fc = null;
		sourced('Open-Meteo', () => getForecast(p)).then((r) => t === token && (fc = r));
	}
	$effect(() => load({ lat: here.place.lat, lon: here.place.lon }));
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.weather_title()}</h1>
	<div class="mt-3"><LocationPicker /></div>

	{#if fc === null}
		<p class="mt-6 text-sm text-muted">{m.loading()}</p>
	{:else if 'error' in fc}
		<p role="status" class="mt-6 text-sm text-alarm">
			{m.source_unavailable({ source: fc.source })}
			<button
				type="button"
				class="ml-1 font-semibold underline"
				onclick={() => load({ lat: here.place.lat, lon: here.place.lon })}>{m.retry()}</button
			>
		</p>
	{:else}
		{@const now = fc.data.now}
		{@const NowIcon = wxIcon(weatherKey(now.code))}
		<section class="mt-6 flex items-center gap-4" aria-label={m.weather_now()}>
			<NowIcon size={56} aria-hidden="true" />
			<div>
				<p class="font-mono text-5xl font-medium">{Math.round(now.temp)}°</p>
				<p class="font-semibold">{wxLabel(weatherKey(now.code))}</p>
				<p class="text-sm text-muted">{m.weather_wind({ speed: now.wind })}</p>
			</div>
		</section>

		<h2 class="mt-8 text-sm font-bold tracking-wide uppercase">{m.weather_next24()}</h2>
		<ol class="mt-2 flex gap-2 overflow-x-auto pb-2">
			{#each fc.data.hours.filter((_, i) => i % 3 === 0) as h (h.time.getTime())}
				<li class="flex min-w-16 flex-col items-center rounded-xl border border-rule px-2 py-2 text-sm">
					<span class="font-mono text-xs text-muted">{fmtHour(h.time)}</span>
					<span class="font-mono font-medium">{Math.round(h.temp)}°</span>
					<span class="flex items-center gap-0.5 text-xs"
						><Droplets size={12} class="shrink-0" aria-hidden="true" />{h.rainChance}%</span
					>
				</li>
			{/each}
		</ol>

		<h2 class="mt-6 text-sm font-bold tracking-wide uppercase">{m.weather_7day()}</h2>
		<ul class="mt-2 divide-y divide-rule">
			{#each fc.data.days as d (d.date.getTime())}
				{@const DayIcon = wxIcon(weatherKey(d.code))}
				<li class="flex items-center gap-3 py-2">
					<span class="w-20 font-mono text-sm">{fmtDay(d.date)}</span>
					<DayIcon size={20} class="shrink-0" aria-hidden="true" />
					<span class="flex-1 text-sm">{wxLabel(weatherKey(d.code))}</span>
					<span class="font-mono text-sm">{Math.round(d.min)}° / {Math.round(d.max)}°</span>
					<span class="w-16 text-right font-mono text-xs text-muted">{m.weather_rain_mm({ mm: d.rain.toFixed(1) })}</span>
				</li>
			{/each}
		</ul>
		<SourceStamp source={fc.source} updatedAt={fc.updatedAt} />
	{/if}

	<h2 class="mt-8 text-sm font-bold tracking-wide uppercase">{m.home_conditions()}</h2>
	<div class="mt-2 rounded-2xl bg-rule/40 p-2"><Conditions place={here.place} /></div>
</div>
