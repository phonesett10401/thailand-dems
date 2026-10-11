<script lang="ts">
	import { levelWord } from '$lib/labels';
	import { RANK, type Lvl, type Overall } from '$lib/levels';

	let { level }: { level: Overall } = $props();
	const STEPS: Lvl[] = ['safe', 'watch', 'warning'];
</script>

<div class="lv-{level}" aria-hidden="true">
	<div class="grid grid-cols-3 gap-1">
		{#each STEPS as s (s)}
			<i class="block h-1.5 rounded-full {RANK[s] <= RANK[level] ? 'lv-bg shadow-[0_0_10px_var(--lv)]' : 'bg-white/10'}"></i>
		{/each}
	</div>
	<div class="label mt-1.5 grid grid-cols-3">
		{#each STEPS as s (s)}<span>{levelWord(s)}</span>{/each}
	</div>
</div>
