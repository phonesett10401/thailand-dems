<script lang="ts">
	import { fmtTime } from '$lib/format';
	import { m } from '$lib/paraglide/messages.js';

	let { source, updatedAt }: { source: string; updatedAt: Date } = $props();
</script>

<p class="font-mono text-[11px] text-muted">{m.source_updated({ source, time: fmtTime(updatedAt) })}</p>
