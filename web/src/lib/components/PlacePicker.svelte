<script lang="ts">
	import { ChevronDown, LocateFixed } from '@lucide/svelte';
	import { here, places, setPlace, useGps } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let box: HTMLDetailsElement;
	let busy = $state(false);
	const name = $derived(
		here.place.via === 'gps' ? m.location_gps() : here.place.via === 'default' ? m.location_default() : here.place.name
	);

	async function gps() {
		busy = true;
		await useGps();
		busy = false;
		if (!here.error) box.open = false;
	}
	function pick(e: Event) {
		const p = places().find((x) => x.name === (e.currentTarget as HTMLSelectElement).value);
		if (p) {
			setPlace({ ...p, via: 'province' });
			box.open = false;
		}
	}
</script>

<details bind:this={box} class="relative min-w-0">
	<summary
		class="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-sm text-muted hover:text-text [&::-webkit-details-marker]:hidden"
		aria-label={m.place_change()}
	>
		<span class="max-w-24 sm:max-w-36 truncate">{name}</span><ChevronDown size={14} aria-hidden="true" />
	</summary>
	<div class="glass absolute top-12 left-0 z-40 flex w-64 flex-col gap-2 rounded-2xl bg-bg/90 p-3">
		<button
			type="button"
			onclick={gps}
			disabled={busy}
			class="flex min-h-11 items-center gap-2 rounded-lg bg-white/5 px-3 text-sm font-semibold disabled:opacity-50"
		>
			<LocateFixed size={16} aria-hidden="true" />{m.location_use_gps()}
		</button>
		<label class="flex flex-col gap-1 text-xs text-muted">
			{m.location_pick()}
			<select onchange={pick} class="min-h-11 rounded-lg border border-line bg-raised px-2 text-sm text-text">
				<option value="">{m.location_pick()}</option>
				{#each places() as p (p.name)}
					<option value={p.name} selected={here.place.via === 'province' && here.place.name === p.name}>{p.name}</option>
				{/each}
			</select>
		</label>
		{#if here.error}<p role="status" class="text-sm text-warning">{m.location_denied()}</p>{/if}
	</div>
</details>
