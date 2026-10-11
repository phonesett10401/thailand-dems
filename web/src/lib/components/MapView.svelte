<script lang="ts">
	import { MapPinOff } from '@lucide/svelte';
	import { type GeoJSONSource, LngLatBounds, Map as MlMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	// MapLibre looks for its worker next to its own file, which Vite's bundling moves.
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
	import { untrack } from 'svelte';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import type { MapMarker, Pt } from '$lib/types';
	import { circle } from '$lib/zones';
	import EmptyState from './EmptyState.svelte';

	type Area = { id: string; lat: number; lon: number; km: number; color: string };
	type Line = { id: string; coords: [number, number][]; color: string };
	let {
		markers,
		center,
		zoom = 5,
		focus = null,
		onselect,
		areas = [],
		lines = [],
		fit = null,
		failed = $bindable(false),
		class: klass = 'relative'
	}: {
		markers: MapMarker[];
		center: Pt;
		zoom?: number;
		focus?: Pt | null;
		onselect?: (id: string) => void;
		areas?: Area[];
		lines?: Line[];
		fit?: [number, number][] | null;
		failed?: boolean;
		class?: string;
	} = $props();

	setWorkerUrl(workerUrl);

	let el: HTMLDivElement;
	let map = $state<MlMap | null>(null);
	let ready = $state(false);
	const empty = { type: 'FeatureCollection' as const, features: [] };

	$effect(() => {
		const start = untrack(() => center);
		let mm: MlMap;
		try {
			mm = new MlMap({
				container: el,
				style: 'https://tiles.openfreemap.org/styles/dark',
				center: [start.lon, start.lat],
				zoom: untrack(() => zoom),
				attributionControl: { compact: true }
			});
		} catch {
			failed = true; // no WebGL: lists still work
			return;
		}
		mm.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
		mm.on('load', () => {
			mm.addSource('areas', { type: 'geojson', data: empty });
			mm.addLayer({ id: 'areas-fill', type: 'fill', source: 'areas', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.16 } });
			mm.addLayer({ id: 'areas-edge', type: 'line', source: 'areas', paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-opacity': 0.7 } });
			mm.addSource('lines', { type: 'geojson', data: empty });
			mm.addLayer({
				id: 'lines',
				type: 'line',
				source: 'lines',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: { 'line-color': ['get', 'color'], 'line-width': 5 }
			});
			ready = true;
		});
		map = mm;
		return () => mm.remove();
	});

	$effect(() => {
		const mm = map;
		if (!mm) return;
		const added = markers.map((mk) => {
			const dot = document.createElement('button');
			dot.type = 'button';
			dot.className = `map-dot map-dot-${mk.kind}`;
			dot.setAttribute('aria-label', mk.label);
			dot.title = mk.label;
			dot.addEventListener('click', () => onselect?.(mk.id));
			return new Marker({ element: dot }).setLngLat([mk.lon, mk.lat]).addTo(mm);
		});
		return () => added.forEach((a) => a.remove());
	});

	$effect(() => {
		if (!map || !ready) return;
		(map.getSource('areas') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: areas.map((a) => ({ type: 'Feature', properties: { color: a.color }, geometry: { type: 'Polygon', coordinates: [circle(a, 48)] } }))
		});
		(map.getSource('lines') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: lines.map((l) => ({ type: 'Feature', properties: { color: l.color }, geometry: { type: 'LineString', coordinates: l.coords } }))
		});
	});

	$effect(() => {
		if (map && focus) map.flyTo({ center: [focus.lon, focus.lat], zoom: Math.max(map.getZoom(), 9), duration: ms(900) });
	});
	$effect(() => {
		if (!map || !fit || fit.length < 2) return;
		const b = fit.reduce((acc, p) => acc.extend(p), new LngLatBounds(fit[0], fit[0]));
		map.fitBounds(b, { padding: 60, duration: ms(700) });
	});
</script>

<!-- The caller sets positioning and size via `class`. -->
<div class={klass}>
	<!-- maplibre-gl.css forces position:relative on this element, so size it with h-full, not inset-0. -->
	<div bind:this={el} class="h-full w-full" class:hidden={failed}></div>
	{#if failed}
		<div class="absolute inset-0 flex items-center justify-center p-6">
			<EmptyState icon={MapPinOff} text={m.map_unavailable()} />
		</div>
	{/if}
</div>
