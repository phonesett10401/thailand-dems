<script lang="ts">
	import { CircleCheck, ExternalLink } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import type { Banner } from '$lib/banner';
	import { fmtDateTime } from '$lib/format';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { levelOf } from '$lib/severity';
	import SampleBadge from './SampleBadge.svelte';

	let { banner }: { banner: Banner } = $props();

	const tone = $derived(
		banner.kind === 'live' ? banner.event.level : banner.kind === 'sample' ? levelOf(banner.alert.Severity) : 'info'
	);
	const solid = $derived(
		tone === 'danger' ? 'bg-alarm text-white' : tone === 'warning' ? 'bg-caution text-ink' : 'bg-ink text-paper'
	);
</script>

{#if banner.kind === 'none'}
	<div
		role="status"
		class="flex items-center gap-2 rounded-xl border border-rule bg-paper px-4 py-3 text-sm font-semibold"
		in:fly={{ y: -12, duration: ms(220) }}
	>
		<CircleCheck size={18} aria-hidden="true" />{m.banner_none()}
	</div>
{:else}
	<div role="alert" class="rounded-xl px-4 py-3 shadow-sm {solid}" in:fly={{ y: -12, duration: ms(220) }}>
		{#if banner.kind === 'live'}
			<p class="font-mono text-[11px] font-medium tracking-wider uppercase opacity-90">
				{m.banner_live_source()} · {fmtDateTime(banner.event.time)}
			</p>
			<p class="text-base leading-snug font-bold">{banner.event.title}</p>
			<a
				href={banner.event.url}
				target="_blank"
				rel="noopener"
				class="mt-1 inline-flex items-center gap-1 text-sm underline"
			>
				{m.open_source_link()}<ExternalLink size={14} aria-hidden="true" />
			</a>
		{:else}
			<p class="font-mono text-[11px] font-medium tracking-wider uppercase opacity-90">
				{banner.alert.AffectedRegion} <SampleBadge />
			</p>
			<p class="text-base leading-snug font-bold">{banner.alert.Title}</p>
			<p class="text-sm opacity-90">{banner.alert.Message}</p>
		{/if}
	</div>
{/if}
