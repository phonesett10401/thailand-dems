<script lang="ts">
		import { MediaQuery } from 'svelte/reactivity';
	import HazardSheet from '$lib/components/HazardSheet.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import NowPanel from '$lib/components/NowPanel.svelte';
	import { api } from '$lib/config';
	import { country, currentCountry } from '$lib/country.svelte';
	import { fmtHour, fmtTime } from '$lib/format';
	import { occupancyPct, sortByDistance, toNum } from '$lib/geo';
	import { currentLevel, live } from '$lib/hazards.svelte';
	import { hazName, markerLabel, nearestOpen } from '$lib/labels';
	import type { Hazard } from '$lib/levels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import type { MapMarker, Shelter } from '$lib/types';

	const wide = new MediaQuery('min-width: 1024px');
	let shelters = $state<Shelter[]>([]);
	let picked = $state<Hazard | null>(null);
	// Reload when the country changes: shelters belong to one country.
	$effect(() => {
		void country.code;
		api.shelters().then((r) => (shelters = r.data));
	});

	const level = $derived(currentLevel());
	const nearest = $derived(nearestOpen(shelters, here.place));
	const coords = (s: Shelter) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) });
	const closest = $derived(sortByDistance(shelters, here.place, coords).filter((x) => x.km !== null).slice(0, 3));
	const hours = $derived(live.feeds?.forecast?.hours ?? []);
	const recent = $derived(
		(live.a?.hazards ?? []).filter((h) => !h.sample && h.name && h.time).sort((a, b) => b.time!.localeCompare(a.time!)).slice(0, 4)
	);
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...(live.a?.hazards ?? []).flatMap((h): MapMarker[] =>
			h.lat === null || h.lon === null ? [] : [{ id: h.id, kind: h.sample ? 'sample' : h.level, lat: h.lat, lon: h.lon, label: markerLabel(h) }]
		),
		...shelters.flatMap((s): MapMarker[] => {
			const c = coords(s);
			return c.lat === null || c.lon === null ? [] : [{ id: `S${s.ShelterID}`, kind: 'shelter', lat: c.lat, lon: c.lon, label: s.ShelterName }];
		})
	]);
	const select = (id: string) => (picked = live.a?.hazards.find((h) => h.id === id) ?? null);
</script>

{#if wide.current}
	<div class="fixed inset-x-0 top-[var(--header-h)] bottom-0 grid grid-cols-[400px_1fr]">
		<aside class="lv-{level} sky overflow-y-auto border-r border-line p-5">
			<NowPanel {level} a={live.a} feeds={live.feeds} {nearest} onselect={(h) => (picked = h)} />
		</aside>
		<section class="grid min-h-0 grid-rows-[1fr_220px]">
			<MapView class="relative" {markers} center={here.place} zoom={8} focus={here.place} onselect={select} />
			<div class="grid grid-cols-[1.35fr_1fr_1fr] gap-3 border-t border-line p-3">
				<div class="glass flex flex-col gap-2 rounded-2xl p-3.5">
					{#if currentCountry().shelters === 'link'}
						<h2 class="label">{m.shelters_se_title()}</h2>
						<p class="text-xs text-muted">{m.shelters_se_body()}</p>
						<a href={currentCountry().shelterLink} target="_blank" rel="noopener" class="mt-auto inline-flex min-h-11 items-center self-start rounded-lg bg-white/10 px-4 text-sm font-semibold">{m.shelters_se_cta()}</a>
					{:else if currentCountry().shelters === 'in-development'}
						<h2 class="label">{m.shelters_dev_title()}</h2>
						<p class="text-xs text-muted">{m.shelters_dev_body()}</p>
					{:else}
					<div class="flex justify-between"><h2 class="label">{m.now_shelters()}</h2><a class="grid min-h-11 min-w-11 place-items-center text-xs text-muted" href={localizeHref('/shelters')} aria-label={m.now_all_shelters()}>→</a></div>
					{#each closest as { item: s, km } (s.ShelterID)}
						{@const pct = occupancyPct(s.CurrentOccupancy, s.Capacity)}
						<div class="grid grid-cols-[1fr_64px_56px] items-center gap-3 text-sm">
							<span class="truncate">{s.ShelterName}</span>
							<span class="h-1.5 overflow-hidden rounded-full bg-white/10"><i class="block h-full {pct >= 90 ? 'bg-warning' : pct >= 70 ? 'bg-watch' : 'bg-safe'}" style="width:{pct}%"></i></span>
							<span class="text-right font-mono text-xs text-muted">{km!.toFixed(1)} km</span>
						</div>
					{/each}
					{/if}
				</div>
				<div class="glass flex flex-col gap-2 rounded-2xl p-3.5">
					<h2 class="label">{m.now_rain24()}</h2>
					<div class="flex flex-1 items-end gap-[3px]" aria-hidden="true">
						{#each hours as h (h.time.getTime())}
							<i class="flex-1 rounded-t-sm bg-gradient-to-b from-info to-info/30" style="height:{Math.max(4, h.rainChance)}%" title="{fmtHour(h.time)}: {h.rainChance}%"></i>
						{/each}
					</div>
				</div>
				<div class="glass flex flex-col gap-2 rounded-2xl p-3.5">
					<h2 class="label">{m.now_recent()}</h2>
					{#each recent as h (h.id)}
						<div class="grid grid-cols-[44px_1fr] gap-2 text-xs"><span class="font-mono text-muted">{fmtTime(h.time!)}</span><span class="truncate">{hazName(h.type)} · {h.name ?? ''}</span></div>
					{:else}
						<p class="text-xs text-muted">{m.now_recent_none()}</p>
					{/each}
				</div>
			</div>
		</section>
	</div>
{:else}
	<div class="lv-{level} sky page max-w-xl">
		<NowPanel {level} a={live.a} feeds={live.feeds} {nearest} onselect={(h) => (picked = h)} />
	</div>
{/if}

<HazardSheet bind:hazard={picked} />
