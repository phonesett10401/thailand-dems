<script lang="ts">
	// Slot for the future in-browser assistant (WebLLM + RAG, Model Lab repo src/lib/assistant/).
	// That work replaces this file's body; nothing else in the app needs to change.
	import { MessagesSquare } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import Sheet from './Sheet.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Sheet bind:open title={m.assistant_title()}>
	<div class="flex flex-col items-center gap-3 py-8 text-center">
		<MessagesSquare size={40} aria-hidden="true" class="text-muted" />
		<p class="max-w-xs text-muted">{m.assistant_coming_soon()}</p>
	</div>
</Sheet>
