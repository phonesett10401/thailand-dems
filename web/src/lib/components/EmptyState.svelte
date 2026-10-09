<script lang="ts">
	import type { IconComponent } from '$lib/types';

	let {
		icon: Icon,
		text,
		actionLabel,
		onaction
	}: { icon: IconComponent; text: string; actionLabel?: string; onaction?: () => void } = $props();
</script>

<div
	class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-rule px-4 py-6 text-center text-sm text-muted"
>
	<Icon size={28} aria-hidden="true" />
	<p>{text}</p>
	{#if actionLabel && onaction}
		<button type="button" onclick={onaction} class="rounded-md border border-ink px-3 py-1.5 font-semibold text-ink">
			{actionLabel}
		</button>
	{/if}
</div>
