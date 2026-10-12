<script lang="ts">
	import { Languages, Phone, Search } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/config';
	import { currentCountry } from '$lib/country.svelte';
	import type { Overall } from '$lib/levels';
	import { places, setPlace } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '$lib/paraglide/runtime.js';
	import { activeTab, TABS } from '$lib/tabs';
	import type { Shelter } from '$lib/types';
	import Logo from './Logo.svelte';
	import PlacePicker from './PlacePicker.svelte';

	let { level }: { level: Overall } = $props();
	let shelters = $state<Shelter[]>([]);
	const current = $derived(deLocalizeHref(page.url.pathname));

	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
		const slash = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement;
			if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || t.isContentEditable) return;
			if (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return;
			const input = document.getElementById('top-search') as HTMLInputElement | null;
			if (!input || input.offsetParent === null) return;
			e.preventDefault();
			input.focus();
		};
		window.addEventListener('keydown', slash);
		return () => window.removeEventListener('keydown', slash);
	});

	function search(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const q = input.value.trim();
		const p = places().find((x) => x.name === q);
		const s = shelters.find((x) => x.ShelterName === q);
		if (p) setPlace({ ...p, via: 'province' });
		else if (s) goto(localizeHref(`/shelters?focus=${s.ShelterID}`));
		else return;
		input.value = '';
		input.blur();
	}
</script>

<div class="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 md:gap-3 md:px-4">
	<a href={localizeHref('/')} class="flex min-h-11 items-center gap-2 font-bold tracking-tight">
		<Logo {level} size={26} /><span class="sr-only sm:not-sr-only">DEMS</span>
		<span class="flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase {level === 'unknown' ? 'text-muted' : 'text-warning'}">
			<span class="size-1.5 rounded-full {level === 'unknown' ? 'bg-unknown' : 'bg-warning shadow-[0_0_0_3px_rgb(255_69_58/0.2)]'}" aria-hidden="true"></span><span class="hidden sm:inline">{m.live_label()}</span>
		</span>
	</a>
	<PlacePicker />
	<label class="ml-2 hidden min-h-11 w-48 items-center xl:w-72 gap-2 rounded-lg border border-line bg-raised px-3 text-sm text-muted lg:flex">
		<Search size={14} aria-hidden="true" />
		<span class="sr-only">{m.search_label()}</span>
		<input id="top-search" list="top-search-list" placeholder={m.search_label()} onchange={search} class="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-muted" />
		<kbd class="rounded border border-line px-1 font-mono text-[10px]">/</kbd>
	</label>
	<datalist id="top-search-list">
		{#each places() as p (p.name)}<option value={p.name}></option>{/each}
		{#each shelters as s (s.ShelterID)}<option value={s.ShelterName}></option>{/each}
	</datalist>
	<nav aria-label={m.tabs_label()} class="ml-2 hidden gap-1 md:flex">
		{#each TABS as t (t.path)}
			<a
				href={localizeHref(t.path)}
				aria-current={activeTab(current, t.path) ? 'page' : undefined}
				class="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium {activeTab(current, t.path) ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}"
				>{t.label()}</a
			>
		{/each}
	</nav>
	<div class="ml-auto flex items-center gap-2">
		<a href={localizeHref('/about')} aria-label={m.demo_chip_aria()} class="inline-flex min-h-11 shrink-0 items-center rounded-full border border-line px-2.5 font-mono text-[10px] tracking-[0.1em] text-muted uppercase">{m.demo_chip()}</a>
		<!-- Three language links don't fit beside the tabs; the full switch is on More. -->
		<a href={localizeHref('/more')} aria-label={m.more_language()} class="hidden size-11 shrink-0 items-center justify-center rounded-lg border border-line text-muted hover:text-text md:inline-flex"><Languages size={16} aria-hidden="true" /></a>
		<a
			href="tel:{currentCountry().sos}"
			aria-label={m.sos_aria({ num: currentCountry().sos })}
			class="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e5251b] px-3 text-xs font-bold text-white shadow-[0_4px_18px_rgb(229_37_27/0.35)]"
		>
			<Phone size={13} aria-hidden="true" />SOS · {currentCountry().sos}
		</a>
	</div>
</div>
