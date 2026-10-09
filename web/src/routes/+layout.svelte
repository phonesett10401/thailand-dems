<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import Shell from '$lib/components/Shell.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<Shell>{@render children()}</Shell>
