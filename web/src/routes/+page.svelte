<script lang="ts">
	import { CloudSun, Route, Tent, TriangleAlert } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import AlertBanner from '$lib/components/AlertBanner.svelte';
	import BottomSheet from '$lib/components/BottomSheet.svelte';
	import Conditions from '$lib/components/Conditions.svelte';
	import EventList from '$lib/components/EventList.svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import SourceStamp from '$lib/components/SourceStamp.svelte';
	import { pickBanner } from '$lib/banner';
	import { api } from '$lib/config';
	import { sortByDistance, toNum } from '$lib/geo';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { getGdacs } from '$lib/sources/gdacs';
	import { sourced } from '$lib/sources/http';
	import { getQuakes } from '$lib/sources/usgs';
	import type { DbAlert, HazardEvent, MapMarker, Shelter, Sourced } from '$lib/types';

	let shelters = $state<Shelter[]>([]);
	let alerts = $state<DbAlert[] | null>(null);
	let gdacs = $state<Sourced<HazardEvent[]> | null>(null);
	let quakes = $state<Sourced<HazardEvent[]> | null>(null);

	function loadLive() {
		gdacs = quakes = null;
		sourced('GDACS', getGdacs).then((r) => (gdacs = r));
		sourced('USGS', getQuakes).then((r) => (quakes = r));
	}
	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
		api.alerts().then((r) => (alerts = r.data));
		loadLive();
	});

	const ok = (s: Sourced<HazardEvent[]> | null) => (s && 'data' in s ? s.data : []);
	const events = $derived([...ok(gdacs), ...ok(quakes)].sort((a, b) => b.time.localeCompare(a.time)));
	const banner = $derived(alerts && gdacs ? pickBanner(ok(gdacs), alerts) : null);
	const coords = (s: Shelter) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) });
	const nearest = $derived(
		sortByDistance(
			shelters.filter((s) => s.Status === 'Available'),
			here.place,
			coords
		).find((x) => x.km !== null)
	);

	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...shelters.flatMap((s): MapMarker[] => {
			const c = coords(s);
			return c.lat === null || c.lon === null
				? []
				: [{ id: `S${s.ShelterID}`, kind: 'shelter', lat: c.lat, lon: c.lon, label: s.ShelterName }];
		}),
		...events.map(
			(e): MapMarker => ({
				id: e.id,
				kind: e.source === 'USGS' ? 'quake' : 'hazard',
				lat: e.lat,
				lon: e.lon,
				label: e.title
			})
		)
	]);
</script>

<MapView class="fixed inset-0" {markers} center={here.place} zoom={6} focus={here.place} />

<div class="fixed inset-x-3 top-[calc(var(--header-h)+0.75rem)] z-20 md:right-4 md:left-auto md:w-[26rem]">
	{#if banner}<AlertBanner {banner} />{/if}
</div>

<BottomSheet label={m.sheet_toggle()}>
	<div class="flex flex-col gap-3">
		{#if nearest}
			<ActionButton
				primary
				href={localizeHref('/shelters')}
				icon={Tent}
				label={m.home_find_shelter()}
				sub={m.home_shelter_distance({ km: nearest.km!.toFixed(1) })}
			/>
		{:else}
			<ActionButton
				primary
				href={localizeHref('/shelters')}
				icon={Tent}
				label={m.home_find_shelter()}
				sub={m.home_no_shelter()}
			/>
		{/if}
		<div class="grid grid-cols-3 gap-2">
			<ActionButton stacked href={localizeHref('/evacuation')} icon={Route} label={m.home_evacuation()} />
			<ActionButton stacked href={localizeHref('/report')} icon={TriangleAlert} label={m.home_report()} />
			<ActionButton stacked href={localizeHref('/weather')} icon={CloudSun} label={m.home_weather()} />
		</div>
		<p class="text-xs text-muted"><SampleBadge /> {m.shelters_sample_note()}</p>

		<h2 class="mt-2 text-sm font-bold">{m.home_conditions()}</h2>
		<LocationPicker />
		<Conditions place={here.place} />

		<h2 class="mt-2 text-sm font-bold">{m.home_nearby_events()}</h2>
		{#if events.length}
			<EventList {events} limit={5} />
		{:else if gdacs && quakes}
			<p class="text-sm text-muted">{m.events_empty()}</p>
		{/if}
		{#each [gdacs, quakes] as s}
			{#if s && 'error' in s}
				<p class="text-sm text-alarm">
					{m.source_unavailable({ source: s.source })}
					<button type="button" class="ml-1 font-semibold underline" onclick={loadLive}>{m.retry()}</button>
				</p>
			{:else if s}
				<SourceStamp source={s.source} updatedAt={s.updatedAt} />
			{/if}
		{/each}
	</div>
</BottomSheet>
