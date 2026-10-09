<script lang="ts">
	import type { IconComponent } from '$lib/types';

	let {
		href,
		icon: Icon,
		label,
		sub,
		primary = false
	}: { href: string; icon: IconComponent; label: string; sub?: string; primary?: boolean } = $props();
</script>

<a
	{href}
	class="flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 font-semibold {primary
		? 'bg-ink text-paper'
		: 'border border-ink bg-paper'}"
>
	<Icon size={22} aria-hidden="true" />
	<span class="flex flex-col leading-tight">
		{label}
		{#if sub}<span class="text-xs font-normal opacity-80">{sub}</span>{/if}
	</span>
</a>
