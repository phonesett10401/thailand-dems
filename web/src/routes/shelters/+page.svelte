<script lang="ts">
	import { List, Map as MapIcon, MapPin, Navigation } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import StatusPill from '$lib/components/StatusPill.svelte';
	import { api } from '$lib/config';
	import { occupancyPct, sortByDistance, toNum } from '$lib/geo';
	import { shelterStatusLabel, shelterStatusLevel } from '$lib/labels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { MapMarker, Pt, Shelter } from '$lib/types';

	let shelters = $state<Shelter[] | null>(null);
	let view = $state<'list' | 'map'>('list');
	let focus = $state<Pt | null>(null);

	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
	});

	const coords = (s: Shelter) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) });
	const sorted = $derived(shelters ? sortByDistance(shelters, here.place, coords) : []);
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...sorted.flatMap(({ item: s }): MapMarker[] => {
			const c = coords(s);
			return c.lat === null || c.lon === null
				? []
				: [{ id: `S${s.ShelterID}`, kind: 'shelter', lat: c.lat, lon: c.lon, label: s.ShelterName }];
		})
	]);
	const directions = (p: Pt) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;

	function showOnMap(s: Shelter) {
		const c = coords(s);
		if (c.lat === null || c.lon === null) return;
		focus = { lat: c.lat, lon: c.lon };
		view = 'map';
	}
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.shelters_title()}</h1>
	<p class="mt-1 text-sm text-muted"><SampleBadge /> {m.shelters_sample_note()}</p>
	<div class="mt-3"><LocationPicker /></div>

	<div class="mt-3 inline-flex rounded-md border border-ink" role="group" aria-label={m.view_label()}>
		<button
			type="button"
			aria-pressed={view === 'list'}
			onclick={() => (view = 'list')}
			class="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold {view === 'list' ? 'bg-ink text-paper' : ''}"
		>
			<List size={16} aria-hidden="true" />{m.view_list()}
		</button>
		<button
			type="button"
			aria-pressed={view === 'map'}
			onclick={() => (view = 'map')}
			class="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold {view === 'map' ? 'bg-ink text-paper' : ''}"
		>
			<MapIcon size={16} aria-hidden="true" />{m.view_map()}
		</button>
	</div>

	{#if view === 'map'}
		<MapView
			class="relative mt-4 h-[60vh] overflow-hidden rounded-xl border border-rule"
			{markers}
			center={here.place}
			zoom={8}
			{focus}
		/>
	{:else if shelters === null}
		<p class="mt-4 text-sm text-muted">{m.loading()}</p>
	{:else}
		<ul class="mt-4 flex flex-col gap-3">
			{#each sorted as { item: s, km } (s.ShelterID)}
				{@const pct = occupancyPct(s.CurrentOccupancy, s.Capacity)}
				{@const c = coords(s)}
				<li class="rounded-xl border border-rule bg-white/60 p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold">{s.ShelterName}</p>
							<p class="text-xs text-muted">{s.Address}, {s.City}</p>
						</div>
						<StatusPill level={shelterStatusLevel(s.Status)} label={shelterStatusLabel(s.Status)} />
					</div>
					<p class="mt-2 font-mono text-sm" data-km={km ?? undefined}>
						{km === null ? m.shelter_distance_unknown() : m.home_shelter_distance({ km: km.toFixed(1) })}
					</p>
					<div class="mt-2 h-2 overflow-hidden rounded-full bg-rule" aria-hidden="true">
						<div class="h-full {pct >= 90 ? 'bg-alarm' : 'bg-ink'}" style="width: {pct}%"></div>
					</div>
					<p class="mt-1 text-xs text-muted">
						{m.shelter_capacity({ occupied: s.CurrentOccupancy, capacity: s.Capacity })}
					</p>
					{#if c.lat !== null && c.lon !== null}
						<div class="mt-3 flex gap-2">
							<a
								href={directions({ lat: c.lat, lon: c.lon })}
								target="_blank"
								rel="noopener"
								class="inline-flex min-h-10 items-center gap-1 rounded-md bg-ink px-3 text-sm font-semibold text-paper"
							>
								<Navigation size={16} aria-hidden="true" />{m.shelter_directions()}
							</a>
							<button
								type="button"
								onclick={() => showOnMap(s)}
								class="inline-flex min-h-10 items-center gap-1 rounded-md border border-ink px-3 text-sm font-semibold"
							>
								<MapPin size={16} aria-hidden="true" />{m.shelter_on_map()}
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
