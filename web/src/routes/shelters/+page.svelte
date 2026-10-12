<script lang="ts">
		import { MediaQuery } from 'svelte/reactivity';
	import { page } from '$app/state';
	import Chip from '$lib/components/Chip.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import ShelterSheet from '$lib/components/ShelterSheet.svelte';
	import { api } from '$lib/config';
	import { shelterStatusLabel } from '$lib/labels';
	import { country, currentCountry } from '$lib/country.svelte';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { applyFilters, shelterRows, type Filter, type ShelterRow } from '$lib/shelters';
	import type { EvacRoute, MapMarker, Shelter } from '$lib/types';

	// Only the map depends on width; the list is rendered once and laid out with CSS (no pre-hydration flash).
	const wide = new MediaQuery('min-width: 1024px');
	let shelters = $state<Shelter[] | null>(null);
	let routes = $state<EvacRoute[]>([]);
	let on = $state<Set<Filter>>(new Set());
	let picked = $state<ShelterRow | null>(null);
	const FILTERS: [Filter, () => string][] = [
		['open', m.f_open],
		['space', m.f_space],
		['medical', m.f_medical],
		['pets', m.f_pets],
		['cleanAir', m.f_cleanAir]
	];

	// Reload when the country changes (the GPS banner can switch it while this page is open).
	$effect(() => {
		void country.code;
		api.shelters().then((r) => {
			shelters = r.data;
			const focus = Number(page.url.searchParams.get('focus'));
			if (focus) picked = shelterRows(r.data, here.place).find((x) => x.s.ShelterID === focus) ?? null;
		});
		api.evacuationRoutes().then((r) => (routes = r.data));
	});

	const rows = $derived(shelters ? applyFilters(shelterRows(shelters, here.place), on) : []);
	const toggle = (f: Filter) => {
		const n = new Set(on);
		if (n.has(f)) n.delete(f);
		else n.add(f);
		on = n;
	};
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...rows.flatMap((r): MapMarker[] => (r.lat === null || r.lon === null ? [] : [{ id: String(r.s.ShelterID), kind: 'shelter', lat: r.lat, lon: r.lon, label: r.s.ShelterName }]))
	]);
	const view = $derived(
		here.place.via === 'default' ? { center: currentCountry().view, zoom: currentCountry().view.zoom } : { center: here.place, zoom: 7 }
	);
	const select = (id: string) => (picked = rows.find((r) => String(r.s.ShelterID) === id) ?? null);
	const facName = { medical: m.f_medical, pets: m.f_pets, cleanAir: m.f_cleanAir };
</script>

<div class="lg:fixed lg:inset-x-0 lg:top-[var(--header-h)] lg:bottom-0 lg:grid lg:grid-cols-[420px_1fr]">
	<div class="page lg:m-0 lg:max-w-none lg:overflow-y-auto lg:border-r lg:border-line lg:p-5">
		<h1 class="headline text-3xl">{m.shelters_title()}</h1>
		{#if currentCountry().shelters === 'in-development'}
			<div class="glass mt-4 rounded-2xl p-4">
				<h2 class="font-semibold">{m.shelters_dev_title()}</h2>
				<p class="mt-1 text-sm text-muted">{m.shelters_dev_body()}</p>
			</div>
		{:else if currentCountry().shelters === 'link'}
			<div class="glass mt-4 rounded-2xl p-4">
				<h2 class="font-semibold">{m.shelters_se_title()}</h2>
				<p class="mt-1 text-sm text-muted">{m.shelters_se_body()}</p>
				<a href={currentCountry().shelterLink} target="_blank" rel="noopener" class="mt-3 inline-flex min-h-11 items-center rounded-lg bg-white/10 px-4 text-sm font-semibold">{m.shelters_se_cta()}</a>
			</div>
		{:else}
		<p class="mt-1 text-xs text-muted">{m.shelters_sample_note()}</p>
		<p class="mt-1 text-xs text-muted">{m.shelters_th_note()}</p>
		<div role="group" aria-label={m.shelters_filters()} class="chip-row mt-2 -mx-4 px-4 lg:-mx-5 lg:px-5">
			{#each FILTERS as [f, label] (f)}<Chip on={on.has(f)} onclick={() => toggle(f)}>{label()}</Chip>{/each}
		</div>
		{#if shelters === null}
			<p class="mt-4 text-sm text-muted">{m.loading()}</p>
		{:else if rows.length === 0}
			<p class="mt-4 text-sm text-muted">{m.shelters_none()}</p>
		{:else}
			<ul class="mt-3 flex flex-col gap-2.5">
				{#each rows as r (r.s.ShelterID)}
					<li>
						<button type="button" onclick={() => (picked = r)} class="glass flex min-h-11 w-full flex-col gap-2 rounded-2xl p-3.5 text-left hover:bg-white/[0.07]">
							<span class="flex items-start justify-between gap-3">
								<span><span class="block font-semibold">{r.s.ShelterName}</span><span class="block text-xs text-muted">{r.s.City} · {shelterStatusLabel(r.s.Status)}</span></span>
								<span class="font-mono text-sm" data-km={r.km ?? undefined}>{r.km === null ? m.shelter_distance_unknown() : `${r.km.toFixed(1)} km`}</span>
							</span>
							<span class="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
								<i class="block h-full {r.pct >= 90 ? 'bg-warning' : r.pct >= 70 ? 'bg-watch' : 'bg-safe'}" style="width:{r.pct}%"></i>
							</span>
							{#if r.facilities.length}
								<span class="flex flex-wrap gap-1">{#each r.facilities as f (f)}<span class="label rounded border border-line px-1.5 py-0.5">{facName[f]()}</span>{/each}</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
		{#if routes.length}
			<section class="mt-8">
				<h2 class="label mb-2">{m.evac_list_title()} · {m.sample_tag()}</h2>
				<ul class="flex flex-col gap-1.5 text-sm">
					{#each routes as r (r.RouteID)}
						<li class="rounded-xl border border-line p-3"><b class="font-semibold">{r.RouteName}</b><br /><span class="text-xs text-muted">{m.evac_line({ from: r.StartPoint, to: r.EndPoint, km: r.Distance, min: r.EstimatedTime })}</span></li>
					{/each}
				</ul>
			</section>
		{/if}
		{/if}
	</div>
	{#if wide.current && currentCountry().shelters === 'sample'}
		<MapView class="relative h-full" {markers} center={view.center} zoom={view.zoom} onselect={select} />
	{/if}
</div>

<ShelterSheet bind:row={picked} />
