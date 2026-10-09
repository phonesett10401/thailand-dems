<script lang="ts">
	import { MapPinOff } from '@lucide/svelte';
	import { Map as MlMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	// MapLibre looks for its worker next to its own file, which Vite's bundling moves.
	// Point it at the emitted worker file instead.
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
	import { untrack } from 'svelte';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import type { MapMarker, Pt } from '$lib/types';
	import EmptyState from './EmptyState.svelte';

	let {
		markers,
		center,
		zoom = 5,
		focus = null,
		onselect,
		class: klass = 'relative'
	}: {
		markers: MapMarker[];
		center: Pt;
		zoom?: number;
		focus?: Pt | null;
		onselect?: (id: string) => void;
		class?: string;
	} = $props();

	setWorkerUrl(workerUrl);

	let el: HTMLDivElement;
	let map = $state<MlMap | null>(null);
	let failed = $state(false);

	$effect(() => {
		const start = untrack(() => center);
		let mm: MlMap;
		try {
			mm = new MlMap({
				container: el,
				style: 'https://tiles.openfreemap.org/styles/positron',
				center: [start.lon, start.lat],
				zoom: untrack(() => zoom),
				attributionControl: { compact: true }
			});
		} catch {
			// No WebGL (old phones, some locked-down browsers): show a message, lists still work.
			failed = true;
			return;
		}
		mm.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
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
		if (map && focus) {
			map.flyTo({ center: [focus.lon, focus.lat], zoom: Math.max(map.getZoom(), 9), duration: ms(900) });
		}
	});
</script>

<!-- The caller sets positioning (`relative ...` or `fixed inset-0`) and size via `class`. -->
<div class={klass}>
	<!-- maplibre-gl.css forces position:relative on this element, so size it with h-full, not inset-0. -->
	<div bind:this={el} class="h-full w-full" class:hidden={failed}></div>
	{#if failed}
		<div class="absolute inset-0 flex items-center justify-center p-6">
			<EmptyState icon={MapPinOff} text={m.map_unavailable()} />
		</div>
	{/if}
</div>
