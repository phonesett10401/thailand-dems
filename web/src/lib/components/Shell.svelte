<script lang="ts">
	import { House, Info, Map as MapIcon, MessagesSquare, Tent, TriangleAlert } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '$lib/paraglide/runtime.js';
	import type { IconComponent } from '$lib/types';
	import AssistantSheet from './AssistantSheet.svelte';
	import LangToggle from './LangToggle.svelte';
	import OfflineBanner from './OfflineBanner.svelte';

	let { children }: { children: Snippet } = $props();
	let assistantOpen = $state(false);
	let headerH = $state(56);

	const tabs: { path: string; label: () => string; icon: IconComponent }[] = [
		{ path: '/', label: m.nav_home, icon: House },
		{ path: '/disasters', label: m.nav_map, icon: MapIcon },
		{ path: '/shelters', label: m.nav_shelters, icon: Tent },
		{ path: '/report', label: m.nav_report, icon: TriangleAlert },
		{ path: '/info', label: m.nav_info, icon: Info }
	];
	const current = $derived(deLocalizeHref(page.url.pathname));
	const active = (p: string) => (p === '/' ? current === '/' : current.startsWith(p));

	$effect(() => {
		document.documentElement.style.setProperty('--header-h', `${headerH}px`);
	});
</script>

<header bind:clientHeight={headerH} class="glass fixed inset-x-0 top-0 z-30 border-x-0 border-t-0">
	<div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
		<a href={localizeHref('/')} class="font-bold tracking-tight">{m.app_name()}</a>
		<nav aria-label={m.tabs_label()} class="ml-6 hidden gap-1 md:flex">
			{#each tabs as t (t.path)}
				<a
					href={localizeHref(t.path)}
					aria-current={active(t.path) ? 'page' : undefined}
					class="rounded-md px-3 py-1.5 text-sm font-semibold {active(t.path) ? 'bg-ink text-paper' : 'hover:bg-ink/10'}"
				>
					{t.label()}
				</a>
			{/each}
		</nav>
		<div class="ml-auto flex items-center gap-2">
			<LangToggle />
			<button
				type="button"
				onclick={() => (assistantOpen = true)}
				class="flex items-center gap-1.5 rounded-md border border-ink px-2.5 py-1.5 text-sm font-semibold"
			>
				<MessagesSquare size={16} aria-hidden="true" />{m.assistant_button()}
			</button>
		</div>
	</div>
	<OfflineBanner />
</header>

<main>{@render children()}</main>

<nav
	aria-label={m.tabs_label()}
	class="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<ul class="grid grid-cols-5">
		{#each tabs as t (t.path)}
			<li>
				<a
					href={localizeHref(t.path)}
					aria-current={active(t.path) ? 'page' : undefined}
					class="flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold {active(t.path)
						? 'text-ink'
						: 'text-muted'}"
				>
					<t.icon size={22} strokeWidth={active(t.path) ? 2.4 : 1.8} aria-hidden="true" />
					{t.label()}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<AssistantSheet bind:open={assistantOpen} />
