<script lang="ts">
	import { LocateFixed } from '@lucide/svelte';
	import { here, PROVINCES, setPlace, useGps } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let busy = $state(false);
	const name = $derived(
		here.place.via === 'gps' ? m.location_gps() : here.place.via === 'default' ? m.location_default() : here.place.name
	);

	async function gps() {
		busy = true;
		await useGps();
		busy = false;
	}
	function pick(e: Event) {
		const p = PROVINCES.find((x) => x.name === (e.currentTarget as HTMLSelectElement).value);
		if (p) setPlace({ ...p, via: 'province' });
	}
</script>

<div class="flex flex-wrap items-center gap-2 text-sm">
	<span class="font-semibold">{m.location_label()}: {name}</span>
	<button
		type="button"
		onclick={gps}
		disabled={busy}
		class="inline-flex min-h-9 items-center gap-1 rounded-md border border-ink px-2 font-semibold disabled:opacity-50"
	>
		<LocateFixed size={14} aria-hidden="true" />{m.location_use_gps()}
	</button>
	<label class="inline-flex">
		<span class="sr-only">{m.location_pick()}</span>
		<select onchange={pick} class="min-h-9 rounded-md border border-ink bg-paper px-2">
			<option value="">{m.location_pick()}</option>
			{#each PROVINCES as p (p.name)}
				<option value={p.name} selected={here.place.via === 'province' && here.place.name === p.name}>{p.name}</option>
			{/each}
		</select>
	</label>
	{#if here.error}<p role="status" class="w-full text-alarm">{m.location_denied()}</p>{/if}
</div>
