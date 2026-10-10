<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import Chip from '$lib/components/Chip.svelte';
	import HazardList from '$lib/components/HazardList.svelte';
	import HazardSheet from '$lib/components/HazardSheet.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import { api } from '$lib/config';
	import { toNum } from '$lib/geo';
	import { live } from '$lib/hazards.svelte';
	import { hazName } from '$lib/labels';
	import { collect, type Hazard, type HazardType } from '$lib/levels';
	import { here } from '$lib/location.svelte';
	import { LEVEL_HEX } from '$lib/logo';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import type { MapMarker, Shelter } from '$lib/types';
	import { ZONE_KM } from '$lib/zones';

	const wide = new MediaQuery('min-width: 1024px');
	let shelters = $state<Shelter[]>([]);
	let picked = $state<Hazard | null>(null);
	let hidden = $state<Set<string>>(new Set());
	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
	});

	// Map = "what is happening anywhere": every current hazard, not only those near you.
	const all = $derived(live.feeds ? collect(live.feeds, here.place, Date.now(), false) : []);
	const types = $derived([...new Set(all.map((h) => h.type))] as HazardType[]);
	const shown = $derived(all.filter((h) => !hidden.has(h.type)));
	const toggle = (k: string) => {
		const n = new Set(hidden);
		if (n.has(k)) n.delete(k);
		else n.add(k);
		hidden = n;
	};
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...shown.flatMap((h): MapMarker[] =>
			h.lat === null || h.lon === null ? [] : [{ id: h.id, kind: h.sample ? 'sample' : h.level, lat: h.lat, lon: h.lon, label: hazName(h.type) }]
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
			.filter((h) => h.lat !== null && h.lon !== null && h.level !== 'safe')
			.map((h) => ({ id: h.id, lat: h.lat!, lon: h.lon!, km: ZONE_KM[h.type] ?? 10, color: LEVEL_HEX[h.level] }))
	);
	function select(id: string) {
		if (id.startsWith('S')) {
			goto(localizeHref(`/shelters?focus=${id.slice(1)}`));
			return;
		}
		picked = all.find((h) => h.id === id) ?? null;
	}
</script>

<div class="fixed inset-x-0 top-[var(--header-h)] bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 lg:grid lg:grid-cols-[360px_1fr]">
	{#if wide.current}
		<aside class="overflow-y-auto border-r border-line p-4">
			<h1 class="label mb-3">{m.map_all_hazards()}</h1>
			{#if shown.length}<HazardList hazards={shown} onselect={(h) => (picked = h)} />{:else}<p class="text-sm text-muted">{m.map_none()}</p>{/if}
		</aside>
	{/if}
	<div class="relative h-full">
		<MapView class="relative h-full" {markers} {areas} center={here.place} zoom={6} onselect={select} />
		<div role="group" aria-label={m.map_layers()} class="absolute inset-x-3 top-3 flex gap-1.5 overflow-x-auto pb-1">
			{#each types as t (t)}
				<Chip on={!hidden.has(t)} color={LEVEL_HEX.watch} onclick={() => toggle(t)}>{hazName(t)}</Chip>
			{/each}
			<Chip on={!hidden.has('shelters')} color="#f2f2f4" onclick={() => toggle('shelters')}>{m.map_shelters()}</Chip>
		</div>
		<a
			href={localizeHref('/report')}
			class="absolute right-3 bottom-24 flex min-h-11 items-center gap-1.5 rounded-full bg-text px-4 text-sm font-semibold text-bg shadow-lg md:bottom-28"
		>
			<TriangleAlert size={16} aria-hidden="true" />{m.map_report()}
		</a>
	</div>
</div>

<HazardSheet bind:hazard={picked} />
