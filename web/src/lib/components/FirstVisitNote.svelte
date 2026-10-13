<script lang="ts">
	import { Info } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { callParams } from '$lib/country.svelte';
	import { m } from '$lib/paraglide/messages.js';

	const KEY = 'dems.seen-note';
	let show = $state(false);

	onMount(() => {
		try {
			show = localStorage.getItem(KEY) !== '1';
		} catch {
			show = true; // storage blocked: show it, it just won't be remembered
		}
	});
	function ok() {
		show = false;
		try {
			localStorage.setItem(KEY, '1');
		} catch {
			// private mode: fine
		}
	}
</script>

{#if show}
	<aside
		role="note"
		class="glass fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex items-start gap-3 rounded-2xl bg-bg/85 p-4 text-sm md:right-auto md:bottom-4 md:left-4 md:max-w-md"
	>
		<Info size={18} class="mt-0.5 shrink-0 text-info" aria-hidden="true" />
		<p class="flex-1 leading-relaxed">{m.first_visit_body(callParams())}</p>
		<button type="button" onclick={ok} class="min-h-11 shrink-0 rounded-lg bg-text px-3 font-semibold text-bg">{m.first_visit_ok()}</button>
	</aside>
{/if}
