<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';

	let { open = $bindable(false), title, children }: { open?: boolean; title: string; children: Snippet } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay forceMount>
			{#snippet child({ props, open: isOpen })}
				{#if isOpen}
					<div {...props} class="fixed inset-0 z-40 bg-ink/40" transition:fade={{ duration: ms(150) }}></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>
		<Dialog.Content forceMount>
			{#snippet child({ props, open: isOpen })}
				{#if isOpen}
					<div
						{...props}
						class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-none md:rounded-l-3xl"
						transition:fly={{ y: 40, duration: ms(220) }}
					>
						<div class="mb-3 flex items-center justify-between gap-4">
							<Dialog.Title class="text-lg font-bold">{title}</Dialog.Title>
							<Dialog.Close class="rounded-md p-2 hover:bg-ink/10" aria-label={m.close()}>
								<X size={20} aria-hidden="true" />
							</Dialog.Close>
						</div>
						{@render children()}
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
