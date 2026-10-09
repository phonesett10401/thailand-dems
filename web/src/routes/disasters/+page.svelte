<script lang="ts">
	import { ExternalLink, List, Map as MapIcon } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import EventList from '$lib/components/EventList.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import SourceStamp from '$lib/components/SourceStamp.svelte';
	import StatusPill from '$lib/components/StatusPill.svelte';
	import { api } from '$lib/config';
	import { fmtDate, fmtDateTime } from '$lib/format';
	import { toNum } from '$lib/geo';
	import { kindLabel, levelLabel } from '$lib/labels';
	import { here } from '$lib/location.svelte';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { kindOf, levelOf } from '$lib/severity';
	import { getGdacs } from '$lib/sources/gdacs';
	import { sourced } from '$lib/sources/http';
	import { getQuakes } from '$lib/sources/usgs';
	import type { Disaster, HazardEvent, HazardKind, MapMarker, Sourced } from '$lib/types';

	let gdacs = $state<Sourced<HazardEvent[]> | null>(null);
	let quakes = $state<Sourced<HazardEvent[]> | null>(null);
	let disasters = $state<Disaster[]>([]);
	let kind = $state<'all' | HazardKind>('all');
	let view = $state<'list' | 'map'>('list');
	let selected = $state<{ type: 'event'; e: HazardEvent } | { type: 'sample'; d: Disaster } | null>(null);
	let sheetOpen = $state(false);

	function loadLive() {
		gdacs = quakes = null;
		sourced('GDACS', getGdacs).then((r) => (gdacs = r));
		sourced('USGS', getQuakes).then((r) => (quakes = r));
	}
	onMount(() => {
		loadLive();
		api.disasters().then((r) => (disasters = r.data));
	});

	const ok = (s: Sourced<HazardEvent[]> | null) => (s && 'data' in s ? s.data : []);
	const allLive = $derived([...ok(gdacs), ...ok(quakes)].sort((a, b) => b.time.localeCompare(a.time)));
	const live = $derived(allLive.filter((e) => kind === 'all' || e.kind === kind));
	const sample = $derived(disasters.filter((d) => kind === 'all' || kindOf(d.DisasterType) === kind));
	const kinds = $derived([
		...new Set<HazardKind>([...allLive.map((e) => e.kind), ...disasters.map((d) => kindOf(d.DisasterType))])
	]);

	const markers = $derived<MapMarker[]>([
		...live.map(
			(e): MapMarker => ({
				id: e.id,
				kind: e.source === 'USGS' ? 'quake' : 'hazard',
				lat: e.lat,
				lon: e.lon,
				label: e.title
			})
		),
		...sample.flatMap((d): MapMarker[] => {
			const lat = toNum(d.Latitude);
			const lon = toNum(d.Longitude);
			return lat === null || lon === null
				? []
				: [{ id: `D${d.DisasterID}`, kind: 'sample', lat, lon, label: d.DisasterName }];
		})
	]);

	function openEvent(e: HazardEvent) {
		selected = { type: 'event', e };
		sheetOpen = true;
	}
	function openSample(d: Disaster) {
		selected = { type: 'sample', d };
		sheetOpen = true;
	}
	function onMarker(id: string) {
		const e = live.find((x) => x.id === id);
		if (e) return openEvent(e);
		const d = sample.find((x) => `D${x.DisasterID}` === id);
		if (d) openSample(d);
	}
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.disasters_title()}</h1>

	<div class="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={m.filter_label()}>
		{#each ['all', ...kinds] as k (k)}
			<button
				type="button"
				aria-pressed={kind === k}
				onclick={() => (kind = k as typeof kind)}
				class="rounded-full border border-ink px-3 py-1 text-sm font-semibold {kind === k ? 'bg-ink text-paper' : ''}"
			>
				{k === 'all' ? m.filter_all() : kindLabel(k as HazardKind)}
			</button>
		{/each}
	</div>

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
			zoom={5}
			onselect={onMarker}
		/>
	{:else}
		<section class="mt-6" aria-label={m.events_live()}>
			<h2 class="text-sm font-bold tracking-wide uppercase">{m.events_live()}</h2>
			{#if live.length}
				<EventList events={live} onselect={openEvent} />
			{:else if gdacs && quakes}
				<p class="py-3 text-sm text-muted">{m.events_empty()}</p>
			{:else}
				<p class="py-3 text-sm text-muted">{m.loading()}</p>
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
		</section>

		<section class="mt-8" aria-label={m.events_sample()}>
			<h2 class="flex items-center gap-2 text-sm font-bold tracking-wide uppercase">
				{m.events_sample()} <SampleBadge />
			</h2>
			<ul class="divide-y divide-rule">
				{#each sample as d (d.DisasterID)}
					<li animate:flip={{ duration: ms(200) }}>
						<button type="button" onclick={() => openSample(d)} class="flex w-full items-start gap-3 py-3 text-left">
							<StatusPill level={levelOf(d.Severity)} label={levelLabel(levelOf(d.Severity))} />
							<span class="flex flex-col">
								<span class="font-semibold">{d.DisasterName}</span>
								<span class="text-xs text-muted"
									>{kindLabel(kindOf(d.DisasterType))} · {d.AffectedRegion} · {fmtDate(d.StartDate)}</span
								>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<Sheet bind:open={sheetOpen} title={selected?.type === 'event' ? selected.e.title : (selected?.d.DisasterName ?? '')}>
	{#if selected?.type === 'event'}
		<div class="flex flex-col gap-2 text-sm">
			<StatusPill level={selected.e.level} label={levelLabel(selected.e.level)} />
			<p>{kindLabel(selected.e.kind)} · {fmtDateTime(selected.e.time)} · {selected.e.source}</p>
			<a
				href={selected.e.url}
				target="_blank"
				rel="noopener"
				class="inline-flex items-center gap-1 font-semibold underline"
			>
				{m.open_source_link()}<ExternalLink size={14} aria-hidden="true" />
			</a>
		</div>
	{:else if selected?.type === 'sample'}
		<div class="flex flex-col gap-2 text-sm">
			<p><SampleBadge /></p>
			<StatusPill level={levelOf(selected.d.Severity)} label={levelLabel(levelOf(selected.d.Severity))} />
			<p>{kindLabel(kindOf(selected.d.DisasterType))} · {selected.d.AffectedRegion} · {fmtDate(selected.d.StartDate)}</p>
			{#if selected.d.Description}<p>{selected.d.Description}</p>{/if}
		</div>
	{/if}
</Sheet>
