<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { ms } from '$lib/motion';
	import { nearestSnap } from '$lib/sheet';

	let { label, children }: { label: string; children: Snippet } = $props();

	const snaps = () => [168, Math.round(window.innerHeight * 0.5), Math.round(window.innerHeight * 0.85)];
	const instant = ms(1) === 0;
	const height = new Spring(168, { stiffness: 0.18, damping: 0.75 });
	let index = $state(0);
	let drag: { startY: number; startH: number; lastY: number; lastT: number; v: number } | null = null;

	function go(i: number) {
		index = i;
		height.set(snaps()[i], { instant });
	}
	function down(e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		drag = { startY: e.clientY, startH: height.current, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
	}
	function move(e: PointerEvent) {
		if (!drag) return;
		const dt = e.timeStamp - drag.lastT || 1;
		drag.v = (drag.lastY - e.clientY) / dt;
		drag.lastY = e.clientY;
		drag.lastT = e.timeStamp;
		const s = snaps();
		height.set(Math.min(s[2], Math.max(s[0], drag.startH + (drag.startY - e.clientY))), { instant: true });
	}
	function up() {
		if (!drag) return;
		const tap = Math.abs(drag.lastY - drag.startY) < 6;
		const v = drag.v;
		drag = null;
		go(tap ? (index + 1) % 3 : nearestSnap(height.current, snaps(), v));
	}
	function key(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			go((index + 1) % 3);
		}
	}
</script>

<!-- Phone: draggable glass sheet above the tab bar. Desktop: fixed glass side panel. -->
<section
	aria-label={label}
	class="glass fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex flex-col rounded-t-3xl md:top-[calc(var(--header-h)+1rem)] md:right-auto md:bottom-4 md:left-4 md:h-auto! md:w-96 md:rounded-3xl"
	style="height: {height.current}px"
>
	<button
		type="button"
		class="mx-auto block shrink-0 touch-none px-8 py-3 md:hidden"
		aria-label={label}
		aria-expanded={index > 0}
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
		onkeydown={key}
	>
		<span class="block h-1 w-10 rounded bg-muted/60"></span>
	</button>
	<div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:pt-4">{@render children()}</div>
</section>
