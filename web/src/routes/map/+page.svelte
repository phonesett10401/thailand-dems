<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';
		import { goto } from '$app/navigation';
	import Chip from '$lib/components/Chip.svelte';
	import HazardList from '$lib/components/HazardList.svelte';
	import HazardSheet from '$lib/components/HazardSheet.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import { api } from '$lib/config';
	import { toNum } from '$lib/geo';
	import { live } from '$lib/hazards.svelte';
	import { hazName, markerLabel, smhiEventName } from '$lib/labels';
	import { country, currentCountry } from '$lib/country.svelte';
	import { detectCountry } from '$lib/countries';
	import { smhiAreaFor } from '$lib/countries/se';
	import { buildZones, zoneHazard } from '$lib/sources/smhi';
	import { collect, type Hazard, type HazardType, RANK, worst } from '$lib/levels';
	import { here } from '$lib/location.svelte';
	import { LEVEL_HEX } from '$lib/logo';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import type { MapMarker, Shelter } from '$lib/types';
	import { ZONE_KM } from '$lib/zones';

	let shelters = $state<Shelter[]>([]);
	let picked = $state<Hazard | null>(null);
	let listOn = $state(false);
	let failed = $state(false); // no WebGL: show the list so nothing is lost
	const showList = $derived(listOn || failed);
	let hidden = $state<Set<string>>(new Set());
	// Reload when the country changes: shelters belong to one country.
	$effect(() => {
		void country.code;
		api.shelters().then((r) => (shelters = r.data));
	});

	// Map = "what is happening anywhere": every current hazard, not only those near you.
	// Readings for your own spot (haze, heat, rain, river) have no place of their own: they live on Now, not here.
	const all = $derived(live.feeds ? collect(live.feeds, here.place, Date.now(), false, currentCountry(), country.code === 'SE' ? smhiAreaFor(here.place) : undefined).filter((h) => h.lat !== null && h.lon !== null && detectCountry({ lat: h.lat, lon: h.lon }) === country.code) : []);
	const countryName = $derived({ TH: m.country_TH, MM: m.country_MM, SE: m.country_SE }[country.code]());
	const view = $derived(
		here.place.via === 'default' ? { center: currentCountry().view, zoom: currentCountry().view.zoom } : { center: here.place, zoom: 6 }
	);
	const types = $derived([...new Set(all.map((h) => h.type))] as HazardType[]);
	const chipColor = (t: string) => {
		const lv = all.filter((h) => h.type === t && !h.sample).map((h) => h.level);
		return lv.length ? LEVEL_HEX[worst(lv)] : LEVEL_HEX.unknown;
	};
	const shown = $derived(all.filter((h) => !hidden.has(h.type)));
	// SMHI's own warning areas, drawn exactly as SMHI gives them. Display only: they never change your level.
	const smhiOn = $derived(currentCountry().weather === 'smhi');
	const zones = $derived(smhiOn && live.feeds?.smhi ? buildZones(live.feeds.smhi, Date.now()) : []);
	const zoneHaz = $derived(zones.map((z) => ({ z, h: zoneHazard(z) })).sort((a, b) => RANK[b.h.level] - RANK[a.h.level]));
	const zoneEvents = $derived([...new Set(zones.map((z) => z.event))]);
	const eventColor = (e: string) => LEVEL_HEX[worst(zones.filter((z) => z.event === e).map((z) => z.level))];
	const shownZones = $derived(zoneHaz.filter(({ z }) => !hidden.has(`smhi:${z.event}`)));
	const listed = $derived([...shownZones.map((x) => x.h), ...shown]);
	const drawn = $derived(shownZones.flatMap(({ z, h }) => (z.geometry ? [{ id: h.id, color: LEVEL_HEX[h.level], geometry: z.geometry }] : [])));
	const toggle = (k: string) => {
		const n = new Set(hidden);
		if (n.has(k)) n.delete(k);
		else n.add(k);
		hidden = n;
	};
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...shown.flatMap((h): MapMarker[] =>
			h.lat === null || h.lon === null ? [] : [{ id: h.id, kind: h.sample ? 'sample' : h.level, lat: h.lat, lon: h.lon, label: markerLabel(h) }]
		),
		...(hidden.has('shelters')
			? []
			: shelters.flatMap((s): MapMarker[] => {
					const lat = toNum(s.Latitude);
					const lon = toNum(s.Longitude);
					return lat === null || lon === null ? [] : [{ id: `S${s.ShelterID}`, kind: 'shelter', lat, lon, label: s.ShelterName }];
				}))
	]);
	const areas = $derived(
		shown
			.filter((h) => h.lat !== null && h.lon !== null && h.level !== 'safe' && !h.sample)
			.map((h) => ({ id: h.id, lat: h.lat!, lon: h.lon!, km: ZONE_KM[h.type] ?? 10, color: LEVEL_HEX[h.level] }))
	);
	function select(id: string) {
		if (id.startsWith('S')) {
			goto(localizeHref(`/shelters?focus=${id.slice(1)}`));
			return;
		}
		picked = all.find((h) => h.id === id) ?? zoneHaz.find((x) => x.h.id === id)?.h ?? null;
	}
</script>

<div class="fixed inset-x-0 top-[var(--header-h)] bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 lg:grid lg:grid-cols-[360px_1fr]">
	<aside class="hidden overflow-y-auto border-r border-line p-4 lg:block">
		<h1 class="label mb-3">{m.map_all_hazards({ country: countryName })}</h1>
		{#if listed.length}<HazardList hazards={listed} onselect={(h) => (picked = h)} />{:else}<p class="text-sm text-muted">{smhiOn && live.feeds?.smhi && !zones.length ? m.map_smhi_none() : m.map_none()}</p>{/if}
	</aside>
	<div class="relative h-full">
		<MapView class="relative h-full" bind:failed {markers} {areas} zones={drawn} center={view.center} zoom={view.zoom} onselect={select} />
		<div role="group" aria-label={m.map_layers()} class="chip-row absolute inset-x-0 top-2 px-3">
			{#if !failed}<span class="contents lg:hidden"><Chip on={showList} onclick={() => (listOn = !listOn)}>{m.map_list()}</Chip></span>{/if}
			{#each types as t (t)}
				<Chip on={!hidden.has(t)} color={chipColor(t)} onclick={() => toggle(t)}>{hazName(t)}</Chip>
			{/each}
			{#each zoneEvents as e (e)}
				<Chip on={!hidden.has(`smhi:${e}`)} color={eventColor(e)} onclick={() => toggle(`smhi:${e}`)}>{smhiEventName(zones.find((z) => z.event === e)?.code ?? null, e)}</Chip>
			{/each}
			{#if currentCountry().shelters === 'sample'}<Chip on={!hidden.has('shelters')} color="#f2f2f4" onclick={() => toggle('shelters')}>{m.map_shelters()}</Chip>{/if}
		</div>
		<p class="glass pointer-events-none absolute top-16 left-3 max-w-[16rem] rounded-xl bg-bg/70 px-3 py-1.5 text-xs leading-snug text-muted">{m.map_scope({ country: countryName })}</p>
		{#if showList}
			<div class="glass absolute inset-x-3 {failed ? 'bottom-40' : 'bottom-3'} max-h-[55%] overflow-y-auto rounded-2xl bg-bg/80 p-3 lg:hidden">
				{#if listed.length}<HazardList hazards={listed} onselect={(h) => (picked = h)} />{:else}<p class="text-sm text-muted">{smhiOn && live.feeds?.smhi && !zones.length ? m.map_smhi_none() : m.map_none()}</p>{/if}
			</div>
		{/if}
		<a
			href={localizeHref('/report')}
			class:max-lg:hidden={listOn}
			class="absolute left-3 bottom-12 flex min-h-11 items-center gap-1.5 rounded-full bg-text px-4 text-sm font-semibold text-bg shadow-lg"
		>
			<TriangleAlert size={16} aria-hidden="true" />{m.map_report()}
		</a>
	</div>
</div>

<HazardSheet bind:hazard={picked} />
