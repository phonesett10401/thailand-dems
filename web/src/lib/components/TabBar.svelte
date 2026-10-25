<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '$lib/paraglide/runtime.js';
	import { activeTab, TABS } from '$lib/tabs';

	const current = $derived(deLocalizeHref(page.url.pathname));
</script>

<nav
	aria-label={m.tabs_label()}
	class="glass fixed inset-x-0 bottom-0 z-30 border-x-0 border-b-0 bg-bg/95 pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<ul class="grid grid-cols-5">
		{#each TABS as t (t.path)}
			{@const on = activeTab(current, t.path)}
			<li>
				<a
					href={localizeHref(t.path)}
					aria-current={on ? 'page' : undefined}
					class="flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium {on ? 'text-text' : 'text-muted'}"
				>
					<t.icon size={22} strokeWidth={on ? 2.2 : 1.7} aria-hidden="true" />
					{t.label()}
				</a>
			</li>
		{/each}
	</ul>
</nav>
