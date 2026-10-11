<script lang="ts">
	import { Bike, Car, Footprints, Navigation } from '@lucide/svelte';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import MapView from '$lib/components/MapView.svelte';
	import { api } from '$lib/config';
	import { distanceKm, toNum } from '$lib/geo';
	import { live } from '$lib/hazards.svelte';
	import { here } from '$lib/location.svelte';
	import { LEVEL_HEX } from '$lib/logo';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { bearing, compass, currentStep, getRoute, nearestIndex, offRoute, stepText, type Mode, type RouteFail, type RouteRes } from '$lib/route';
	import type { MapMarker, Pt, Shelter } from '$lib/types';
	import { zonesFrom, type Zone } from '$lib/zones';

	const to = page.url.searchParams.get('to') ?? '';
	let mode = $state<Mode>((['foot', 'car', 'bike'].includes(page.url.searchParams.get('mode') ?? '') ? page.url.searchParams.get('mode') : 'foot') as Mode);
	let dest = $state<{ name: string; at: Pt } | null>(null);
	let result = $state<{ ok: true; data: RouteRes } | { ok: false; reason: RouteFail } | null>(null);
	let me = $state<Pt | null>(null);
	let watchId = $state<number | null>(null);
	let seq = 0; // drops a slow answer that a newer request has replaced

	onMount(async () => {
		if (to.startsWith('shelter:')) {
			const id = Number(to.slice(8));
			const s = (await api.shelters()).data.find((x: Shelter) => x.ShelterID === id);
			const lat = toNum(s?.Latitude);
			const lon = toNum(s?.Longitude);
			if (s && lat !== null && lon !== null) dest = { name: s.ShelterName, at: { lat, lon } };
		} else {
			const [lat, lon] = to.split(',').map(Number);
			if (Number.isFinite(lat) && Number.isFinite(lon)) dest = { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, at: { lat, lon } };
		}
	});

	const zones = $derived(zonesFrom(live.a?.hazards ?? []));
	const zoneKey = $derived(JSON.stringify(zones));
	// The zones the shown route was actually requested with (hazards may arrive after the first request).
	let sentZones = $state<Zone[]>([]);
	let gpsError = $state(false);
	async function load() {
		if (!dest) return;
		const mine = ++seq;
		result = null;
		sentZones = zones;
		const r = await getRoute({ from: me ?? here.place, to: dest.at, mode, avoid: zones });
		if (mine === seq) result = r;
	}
	// Reload when the destination or mode changes; `me` is read inside load() untracked; new hazards re-request.
	$effect(() => {
		void dest;
		void mode;
		void zoneKey;
		untrack(load);
	});

	const route = $derived(result?.ok ? result.data : null);
	const idx = $derived(route && me ? nearestIndex(route.line, me) : 0);
	const stepNow = $derived(route ? currentStep(route.steps, idx) : 0);
	const off = $derived(!!(route && me && offRoute(route.line, me)));

	function start() {
		gpsError = false;
		if (!('geolocation' in navigator)) {
			gpsError = true;
			return;
		}
		watchId = navigator.geolocation.watchPosition(
			(p) => (me = { lat: p.coords.latitude, lon: p.coords.longitude }),
			() => {
				stop();
				gpsError = true;
			},
			{
				enableHighAccuracy: true,
				maximumAge: 5000
			}
		);
	}
	function stop() {
		if (watchId !== null) navigator.geolocation.clearWatch(watchId);
		watchId = null;
		me = null;
	}
	onDestroy(stop);

	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: (me ?? here.place).lat, lon: (me ?? here.place).lon, label: m.location_label() },
		...(dest ? [{ id: 'dest', kind: 'shelter' as const, lat: dest.at.lat, lon: dest.at.lon, label: dest.name }] : [])
	]);
	const lines = $derived(route ? [{ id: 'route', coords: route.line, color: '#0a84ff' }] : []);
	const areas = $derived(zones.map((z, i) => ({ id: `z${i}`, ...z, color: LEVEL_HEX.warning })));
	const DIR = { n: m.dir_n, ne: m.dir_ne, e: m.dir_e, se: m.dir_se, s: m.dir_s, sw: m.dir_sw, w: m.dir_w, nw: m.dir_nw };
	const straight = $derived(dest ? { km: distanceKm(me ?? here.place, dest.at).toFixed(1), dir: DIR[compass(bearing(me ?? here.place, dest.at))]() } : null);
	const MODES: [Mode, () => string, typeof Footprints][] = [
		['foot', m.mode_foot, Footprints],
		['car', m.mode_car, Car],
		['bike', m.mode_bike, Bike]
	];
</script>

{#snippet panel()}
	{#if !dest}
		<p class="text-muted">{m.route_no_dest()}</p>
		<a href={localizeHref('/shelters')} class="mt-3 inline-flex min-h-11 items-center rounded-lg bg-text px-4 font-semibold text-bg">{m.route_pick_shelter()}</a>
	{:else}
		<h1 class="headline text-2xl">{m.route_title({ name: dest.name })}</h1>
		<div role="group" aria-label={m.route_mode()} class="mt-3 grid grid-cols-3 gap-1.5">
			{#each MODES as [k, label, Icon] (k)}
				<button type="button" aria-pressed={mode === k} onclick={() => (mode = k)} class="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border text-sm {mode === k ? 'border-white/30 bg-white/10' : 'border-line text-muted'}">
					<Icon size={16} aria-hidden="true" />{label()}
				</button>
			{/each}
		</div>
		{#if result === null}
			<p class="mt-4 text-sm text-muted" role="status">{m.route_loading()}</p>
		{:else if route}
			<p class="mt-4 text-3xl font-semibold tracking-tight">{m.route_summary({ km: (route.distance / 1000).toFixed(1), min: Math.max(1, Math.round(route.duration / 60)) })}</p>
			{#if route.avoided}<p class="mt-1 text-sm text-safe">{m.route_avoided({ count: sentZones.length })}</p>{:else if sentZones.length}<p class="mt-1 text-sm text-watch">{m.route_not_avoided()}</p>{/if}
			<div class="mt-3 flex gap-2">
				{#if watchId === null}
					<button type="button" onclick={start} class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-text font-semibold text-bg"><Navigation size={16} aria-hidden="true" />{m.route_start()}</button>
				{:else}
					<button type="button" onclick={stop} class="min-h-11 flex-1 rounded-xl border border-line font-semibold">{m.route_stop()}</button>
				{/if}
			</div>
			{#if gpsError}<p class="mt-2 text-sm" role="status">{m.route_gps_error()}</p>{/if}
			{#if off}<button type="button" onclick={load} class="mt-2 min-h-11 w-full rounded-xl bg-watch font-semibold text-bg">{m.route_recalc()}</button>{/if}
			<h2 class="label mt-5 mb-2">{m.route_steps()}</h2>
			<ol class="flex flex-col gap-1">
				{#each route.steps as s, i (i)}
					<li class="flex justify-between gap-3 rounded-lg px-2 py-2 text-sm {i === stepNow && me ? 'bg-info/15 text-text' : ''}" aria-current={i === stepNow && me ? 'step' : undefined}>
						<span>{stepText(s, dest.name)}</span><span class="shrink-0 font-mono text-xs text-muted">{s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${Math.round(s.distance)} m`}</span>
					</li>
				{/each}
			</ol>
			<p class="mt-4 text-xs text-muted">{m.route_attribution()}</p>
		{:else if !result.ok}
			<p class="mt-4 text-sm" role="alert">
				{result.reason === 'limited' ? m.route_limited() : result.reason === 'outside' ? m.route_outside() : m.route_fallback({ km: straight!.km, dir: straight!.dir })}
			</p>
			<a href="https://www.google.com/maps/dir/?api=1&destination={dest.at.lat},{dest.at.lon}" target="_blank" rel="noopener" class="mt-2 inline-flex min-h-11 items-center text-sm text-muted underline">{m.shelter_gmaps()}</a>
		{/if}
	{/if}
{/snippet}

<div class="lg:fixed lg:inset-x-0 lg:top-[var(--header-h)] lg:bottom-0 lg:grid lg:grid-cols-[400px_1fr]">
	<div class="page pt-[calc(var(--header-h)+42vh+1rem)] lg:m-0 lg:max-w-none lg:overflow-y-auto lg:border-r lg:border-line lg:p-5">{@render panel()}</div>
	<!-- One map for both layouts: pinned under the header on phones, the second grid column on desktop. -->
	<MapView class="fixed inset-x-0 top-[var(--header-h)] h-[42vh] lg:relative lg:inset-auto lg:h-full" {markers} {lines} {areas} center={here.place} zoom={12} fit={route?.line ?? null} />
</div>
