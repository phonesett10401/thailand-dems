<script lang="ts">
	import { WifiOff } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { status } from '$lib/status.svelte';
</script>

{#if status.offline}
	<div
		role="status"
		class="flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-sm font-semibold text-paper"
		transition:slide={{ duration: ms(200) }}
	>
		<WifiOff size={16} aria-hidden="true" />{m.offline_banner()}
	</div>
{/if}
