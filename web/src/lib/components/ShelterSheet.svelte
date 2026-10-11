<script lang="ts">
	import { Navigation } from '@lucide/svelte';
	import { shelterStatusLabel } from '$lib/labels';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import type { ShelterRow } from '$lib/shelters';
	import Sheet from './Sheet.svelte';

	let { row = $bindable(null) }: { row: ShelterRow | null } = $props();
</script>

<Sheet bind:open={() => row !== null, (v) => { if (!v) row = null; }} title={row?.s.ShelterName ?? ''}>
	{#if row}
		<div class="flex flex-col gap-4">
			<p class="text-sm text-muted">{row.s.Address}, {row.s.City} · <span class="label">{m.sample_tag()}</span></p>
			<p class="text-sm">{shelterStatusLabel(row.s.Status)}{#if row.km !== null} · <span class="font-mono">{row.km.toFixed(1)} km</span>{/if}</p>
			<div>
				<div class="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
					<i class="block h-full {row.pct >= 90 ? 'bg-warning' : row.pct >= 70 ? 'bg-watch' : 'bg-safe'}" style="width:{row.pct}%"></i>
				</div>
				<p class="mt-1 text-xs text-muted">{m.shelter_capacity({ occupied: row.s.CurrentOccupancy, capacity: row.s.Capacity })}</p>
			</div>
			{#if row.s.Facilities}
				<div><h3 class="label mb-1">{m.shelter_facilities()}</h3><p class="text-sm">{row.s.Facilities}</p></div>
			{/if}
			{#if row.lat !== null && row.lon !== null}
				<a href={localizeHref(`/route?to=shelter:${row.s.ShelterID}`)} class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-text font-semibold text-bg">
					<Navigation size={18} aria-hidden="true" />{m.shelter_route()}
				</a>
				<a href="https://www.google.com/maps/dir/?api=1&destination={row.lat},{row.lon}" target="_blank" rel="noopener" class="inline-flex min-h-11 items-center self-center text-xs text-muted underline">{m.shelter_gmaps()}</a>
			{/if}
		</div>
	{/if}
</Sheet>
