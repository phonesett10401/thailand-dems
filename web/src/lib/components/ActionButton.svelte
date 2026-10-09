<script lang="ts">
	import type { IconComponent } from '$lib/types';

	let {
		href,
		icon: Icon,
		label,
		sub,
		primary = false,
		stacked = false
	}: {
		href: string;
		icon: IconComponent;
		label: string;
		sub?: string;
		primary?: boolean;
		/** Icon above the label, for narrow multi-column rows. */
		stacked?: boolean;
	} = $props();
</script>

<a
	{href}
	class="flex min-h-14 rounded-xl font-semibold {stacked
		? 'flex-col items-center justify-center gap-1 px-2 py-2 text-center text-xs'
		: 'items-center gap-3 px-4 py-3'} {primary ? 'bg-ink text-paper' : 'border border-ink bg-paper'}"
>
	<Icon size={22} class="shrink-0" aria-hidden="true" />
	<span class="flex flex-col leading-tight">
		{label}
		{#if sub}<span class="text-xs font-normal opacity-80">{sub}</span>{/if}
	</span>
</a>
