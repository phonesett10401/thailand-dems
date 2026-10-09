<script lang="ts">
	import { Navigation, PhoneCall } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import { api } from '$lib/config';
	import { sortByDistance, toNum } from '$lib/geo';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { EvacRoute, Shelter } from '$lib/types';

	let shelters = $state<Shelter[]>([]);
	let routes = $state<EvacRoute[] | null>(null);

	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
		api.evacuationRoutes().then((r) => (routes = r.data));
	});

	const nearest = $derived(
		sortByDistance(
			shelters.filter((s) => s.Status === 'Available'),
			here.place,
			(s) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) })
		)
			.filter((x) => x.km !== null)
			.slice(0, 3)
	);
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.evac_title()}</h1>
	<p class="mt-3 flex items-start gap-2 rounded-xl bg-alarm p-3 text-sm font-semibold text-white">
		<PhoneCall size={18} aria-hidden="true" class="mt-0.5 shrink-0" />{m.emergency_call_first()}
	</p>
	<p class="mt-3">{m.evac_intro()}</p>
	<div class="mt-3"><LocationPicker /></div>

	<h2 class="mt-6 flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
		{m.evac_nearest()} <SampleBadge />
	</h2>
	<ul class="mt-2 divide-y divide-rule">
		{#each nearest as { item: s, km } (s.ShelterID)}
			<li class="flex items-center justify-between gap-3 py-3">
				<span>
					<span class="block font-semibold">{s.ShelterName}</span>
					<span class="font-mono text-xs text-muted">{m.home_shelter_distance({ km: km!.toFixed(1) })}</span>
				</span>
				<a
					href={`https://www.google.com/maps/dir/?api=1&destination=${toNum(s.Latitude)},${toNum(s.Longitude)}`}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md bg-ink px-3 text-sm font-semibold text-paper"
				>
					<Navigation size={16} aria-hidden="true" />{m.shelter_directions()}
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-8 flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
		{m.evac_routes()} <SampleBadge />
	</h2>
	{#if routes === null}
		<p class="mt-2 text-sm text-muted">{m.loading()}</p>
	{:else}
		<ul class="mt-2 divide-y divide-rule">
			{#each routes as r (r.RouteID)}
				<li class="py-3">
					<p class="font-semibold">{r.RouteName}</p>
					<p class="text-sm">{r.StartPoint} → {r.EndPoint}</p>
					<p class="font-mono text-xs text-muted">
						{m.evac_route_meta({ km: r.Distance, min: r.EstimatedTime, status: r.Status })}
					</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>
