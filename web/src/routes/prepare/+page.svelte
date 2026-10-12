<script lang="ts">
	import { Check, Phone } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { live } from '$lib/hazards.svelte';
	import { hazName, numLabel, showTel } from '$lib/labels';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { loadChecks, saveChecks, toggled } from '$lib/prepare/checklist';
	import { country, currentCountry } from '$lib/country.svelte';
	import Chip from '$lib/components/Chip.svelte';
	import { bagFor, defaultKit, GUIDE, GUIDES, KIT_NOTE, KITS, tx, type KitId } from '$lib/prepare/guides';

	let done = $state(new Set<string>());
	let kit = $state<KitId | null>(null);
	let auto = $state<KitId | null>(null); // the kit picked from a live hazard, until the user picks a chip
	let settled = false; // the default is set once, then the user's choice wins
	function pick(k: KitId | null) {
		settled = true;
		kit = k;
		auto = null;
	}
	$effect(() => {
		if (settled || !live.a) return;
		settled = true;
		auto = kit = defaultKit(live.a.hazards);
	});
	const kitName = (k: KitId) => (k === 'cold' ? m.haz_cold() : hazName(k));
	onMount(() => (done = loadChecks()));
	const items = $derived(bagFor(kit));
	const note = $derived(kit ? KIT_NOTE[kit] : undefined);
	function flip(id: string) {
		done = toggled(done, id);
		saveChecks(done);
	}
	function reset() {
		done = new Set();
		saveChecks(done);
	}
</script>

<div class="page max-w-4xl">
	<h1 class="headline text-4xl">{m.prep_title()}</h1>
	<p class="mt-2 max-w-xl text-muted">{m.prep_intro()}</p>

	<h2 class="label mt-8 mb-3">{m.prep_guides()}</h2>
	<ul class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
		{#each GUIDES as id (id)}
			<li>
				<a href={localizeHref(`/prepare/${id}`)} class="glass flex h-full flex-col gap-1 rounded-2xl p-4 hover:bg-white/[0.07]">
					<span class="font-semibold">{tx(GUIDE[id].title)}</span>
					<span class="text-sm text-muted">{tx(GUIDE[id].summary)}</span>
				</a>
			</li>
		{/each}
	</ul>

	<div class="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
		<section>
			<div class="mb-3 flex items-baseline justify-between">
				<h2 class="label">{m.prep_bag()}</h2>
				<span class="font-mono text-xs text-muted" role="status">{m.prep_bag_count({ done: items.filter((i) => done.has(i.id)).length, total: items.length })}</span>
			</div>
			<div role="group" aria-label={m.prep_kit_label()} class="mb-2 flex flex-wrap gap-2">
				<Chip on={kit === null} onclick={() => pick(null)}>{m.prep_kit_basics()}</Chip>
				{#each KITS.filter((k) => k !== 'cold' || country.code === 'SE') as k (k)}
					<Chip on={kit === k} onclick={() => pick(k)}>{kitName(k)}</Chip>
				{/each}
			</div>
			{#if auto}<p class="mb-2 text-xs text-muted">{m.prep_kit_auto({ hazard: kitName(auto) })}</p>{/if}
			{#if note}<p class="mb-2 rounded-xl border border-warning/40 px-3 py-2 text-sm text-warning">{tx(note)}</p>{/if}
			<ul class="glass divide-y divide-line rounded-2xl">
				{#each items as item (item.id)}
					<li>
						<label class="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm">
							<input type="checkbox" class="peer sr-only" checked={done.has(item.id)} onchange={() => flip(item.id)} />
							<span class="grid size-5 shrink-0 place-items-center rounded-md border border-muted peer-checked:border-safe peer-checked:bg-safe peer-focus-visible:outline-2 peer-focus-visible:outline-info" aria-hidden="true">
								{#if done.has(item.id)}<Check size={14} class="text-bg" />{/if}
							</span>
							<span class={done.has(item.id) ? 'text-muted line-through' : ''}>{tx(item.text)}</span>
						</label>
					</li>
				{/each}
			</ul>
			<div class="mt-2 flex items-center justify-between text-xs text-muted">
				<span>{m.prep_bag_note()}</span>
				<button type="button" onclick={reset} class="min-h-11 min-w-11 px-2 underline">{m.prep_bag_reset()}</button>
			</div>
		</section>
		<section>
			<h2 class="label mb-3">{m.prep_numbers()}</h2>
			<ul class="flex flex-col gap-2">
				{#each currentCountry().numbers as n (n.tel)}
					<li>
						<a href="tel:{n.tel}" aria-label={m.prep_call({ tel: n.tel, name: numLabel(n.key) })} class="glass flex min-h-14 items-center gap-3 rounded-2xl px-4">
							<Phone size={16} class="text-warning" aria-hidden="true" />
							<span class="font-mono text-xl font-semibold">{showTel(n.tel)}</span>
							<span class="text-sm text-muted">{numLabel(n.key)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</div>
