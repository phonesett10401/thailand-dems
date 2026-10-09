<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
</script>

<span
	class="inline-block rounded-sm bg-ink px-1.5 py-0.5 align-middle font-mono text-[10px] font-medium tracking-wider text-paper"
	title={m.sample_hint()}
>
	{m.sample()}<span class="sr-only">: {m.sample_hint()}</span>
</span>
