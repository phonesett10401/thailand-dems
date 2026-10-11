<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { GUIDE, GUIDES, tx } from '$lib/prepare/guides';

	let { data } = $props();
	const g = $derived(GUIDE[data.id]);
	const PHASES = [
		['before', m.prep_before],
		['during', m.prep_during],
		['after', m.prep_after]
	] as const;
</script>

<div class="page max-w-5xl lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
	<nav class="hidden lg:block" aria-label={m.prep_guides()}>
		<ul class="sticky top-[calc(var(--header-h)+1.25rem)] flex flex-col gap-0.5">
			{#each GUIDES as id (id)}
				<li><a href={localizeHref(`/prepare/${id}`)} aria-current={id === data.id ? 'page' : undefined} class="block rounded-lg px-3 py-2 text-sm {id === data.id ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}">{tx(GUIDE[id].title)}</a></li>
			{/each}
		</ul>
	</nav>
	<article>
		<a href={localizeHref('/prepare')} class="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted lg:hidden"><ArrowLeft size={16} aria-hidden="true" />{m.prep_back()}</a>
		<h1 class="headline text-4xl">{tx(g.title)}</h1>
		<p class="mt-2 text-muted">{tx(g.summary)}</p>
		{#each PHASES as [key, label] (key)}
			<section class="mt-8">
				<h2 class="label mb-3 {key === 'during' ? 'text-warning' : ''}">{label()}</h2>
				<ol class="flex flex-col gap-2.5">
					{#each g[key] as item, i (i)}
						<li class="flex gap-3"><span class="font-mono text-xs text-muted">0{i + 1}</span>{tx(item)}</li>
					{/each}
				</ol>
			</section>
		{/each}
	</article>
</div>
