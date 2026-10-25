<script lang="ts">
	import { levelWord } from '$lib/labels';
	import type { Overall } from '$lib/levels';

	let { level, small = false }: { level: Overall; small?: boolean } = $props();
	const MARK: Record<Overall, string> = { safe: '●', watch: '●', warning: '▲', unknown: '?' };
</script>

<span
	class="lv-{level} lv-bg inline-flex items-center gap-1.5 self-start rounded-md font-bold
		{level === 'unknown' ? 'text-white' : 'text-bg'} {small ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}"
	class:pulse={level === 'warning'}
>
	<span aria-hidden="true">{MARK[level]}</span>{levelWord(level)}
</span>
