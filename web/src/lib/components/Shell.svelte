<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { clock, currentLevel, refresh } from '$lib/hazards.svelte';
	import { country } from '$lib/country.svelte';
	import { here } from '$lib/location.svelte';
	import { faviconHref } from '$lib/logo';
	import FirstVisitNote from './FirstVisitNote.svelte';
	import TabBar from './TabBar.svelte';
	import TopBar from './TopBar.svelte';

	let { children }: { children: Snippet } = $props();
	let headerH = $state(56);
	const level = $derived(currentLevel());

	onMount(() => {
		const tick = setInterval(() => (clock.now = Date.now()), 60_000);
		const reload = setInterval(refresh, 10 * 60_000);
		return () => {
			clearInterval(tick);
			clearInterval(reload);
		};
	});
	// Reload whenever the chosen place changes (refresh reads here.place before its first await).
	$effect(() => {
		void here.place;
		void country.code;
		refresh();
	});
	$effect(() => {
		document.documentElement.style.setProperty('--header-h', `${headerH}px`);
	});
	$effect(() => {
		const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
		if (link) link.href = faviconHref(level);
	});
</script>

<header bind:clientHeight={headerH} class="glass fixed inset-x-0 top-0 z-30 border-x-0 border-t-0 bg-bg/70">
	<TopBar {level} />
</header>

<main>{@render children()}</main>

<FirstVisitNote />
<TabBar />
