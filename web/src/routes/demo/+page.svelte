<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, Volume2, VolumeX } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { thresholdRows } from '$lib/thresholds';

	// Keep in sync with the .demo-frame media query below.
	const TALL = '(max-width: 767px) and (orientation: portrait)';
	let video: HTMLVideoElement;
	let muted = $state(true);
	let poster = $state<string>();

	onMount(() => {
		poster = matchMedia(TALL).matches ? '/demo/poster-9x16.jpg' : '/demo/poster-16x9.jpg';
		if (!matchMedia('(prefers-reduced-motion: reduce)').matches) video.play().catch(() => {});
	});

	function toggleSound() {
		muted = !muted;
		if (!muted) video.play().catch(() => {});
	}

	const roles = [
		{ name: m.demo_role_citizen, body: m.demo_role_citizen_body, live: true },
		{ name: m.demo_role_volunteer, body: m.demo_role_volunteer_body, live: false },
		{ name: m.demo_role_admin, body: m.demo_role_admin_body, live: false }
	];
	const hood = [
		{ title: m.demo_hood_arch, body: m.demo_hood_arch_body, chain: [m.demo_arch_1, m.demo_arch_2, m.demo_arch_3] },
		{ title: m.demo_hood_flow, body: m.demo_hood_flow_body, chain: [m.demo_flow_1, m.demo_flow_2, m.demo_flow_3, m.demo_flow_4], rows: true },
		{ title: m.demo_hood_db, body: m.demo_hood_db_body },
		{ title: m.demo_hood_tests, body: m.demo_hood_tests_body },
		{ title: m.demo_hood_data, body: m.demo_hood_data_body },
		{ title: m.demo_hood_history, body: m.demo_hood_history_body }
	];
</script>

<svelte:head><title>{m.demo_title()} · DEMS Thailand</title></svelte:head>

<div class="page max-w-4xl">
	<div class="demo-frame relative mx-auto overflow-hidden rounded-3xl border border-line bg-black">
		<!-- svelte-ignore a11y_media_has_caption (captions are burned into the video; it has no speech) -->
		<video bind:this={video} bind:muted class="h-full w-full object-cover" loop playsinline controls preload="metadata" {poster} aria-label={m.demo_video_label()}>
			<source media={TALL} src="/demo/demo-9x16.mp4" type="video/mp4" />
			<source src="/demo/demo-16x9.mp4" type="video/mp4" />
		</video>
		<button type="button" onclick={toggleSound} aria-pressed={!muted} aria-label={m.demo_sound()} class="glass absolute top-3 right-3 flex min-h-11 min-w-11 items-center justify-center rounded-full bg-bg/70">
			{#if muted}<VolumeX size={18} aria-hidden="true" />{:else}<Volume2 size={18} aria-hidden="true" />{/if}
		</button>
	</div>

	<h1 class="headline mt-8 text-4xl">{m.demo_title()}</h1>
	<ul class="mt-4 flex flex-col gap-2 text-[#c9c9cf]">
		{#each [m.demo_lead_1(), m.demo_lead_2(), m.demo_lead_3()] as t (t)}<li>{t}</li>{/each}
	</ul>
	<p class="glass mt-4 rounded-2xl px-4 py-3 text-sm text-muted">{m.demo_honest()}</p>
	<a href={localizeHref('/')} class="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-text px-6 font-semibold text-bg">
		{m.demo_try()}<ArrowRight size={18} aria-hidden="true" />
	</a>

	<section class="mt-10">
		<h2 class="label mb-3">{m.demo_roles_title()}</h2>
		<ul class="grid gap-3 sm:grid-cols-3">
			{#each roles as r (r.name)}
				<li class="glass rounded-2xl p-4 {r.live ? '' : 'opacity-80'}">
					<div class="flex items-center justify-between gap-2">
						<h3 class="font-semibold">{r.name()}</h3>
						<span class="label {r.live ? 'text-safe' : ''}">{r.live ? m.demo_live() : m.demo_phase2()}</span>
					</div>
					<p class="mt-2 text-sm text-[#c9c9cf]">{r.body()}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section class="mt-10">
		<h2 class="label">{m.demo_hood_title()}</h2>
		<p class="mt-1 mb-3 text-sm text-muted">{m.demo_hood_intro()}</p>
		<div class="flex flex-col gap-2">
			{#each hood as h (h.title)}
				<details class="glass rounded-2xl">
					<summary class="flex min-h-14 cursor-pointer items-center px-4 font-semibold">{h.title()}</summary>
					<div class="px-4 pb-4 text-sm text-[#c9c9cf]">
						{#if h.chain}
							<ol class="mb-3 flex flex-wrap items-center gap-2 text-xs">
								{#each h.chain as c, i (c)}
									<li class="rounded-full border border-line px-3 py-1.5 text-text">{c()}</li>
									{#if i < h.chain.length - 1}<li aria-hidden="true" class="text-muted">→</li>{/if}
								{/each}
							</ol>
						{/if}
						<p>{h.body()}</p>
						{#if h.rows}
							<h3 class="label mt-3 mb-1">{m.demo_thresholds()}</h3>
							<ul class="flex flex-col gap-1 font-mono text-xs text-muted">
								{#each thresholdRows() as r (r)}<li>{r}</li>{/each}
							</ul>
						{/if}
					</div>
				</details>
			{/each}
		</div>
	</section>
</div>

<style>
	.demo-frame {
		aspect-ratio: 16 / 9;
		width: 100%;
	}
	@media (max-width: 767px) and (orientation: portrait) {
		.demo-frame {
			aspect-ratio: 9 / 16;
			width: min(100%, calc(78svh * 9 / 16));
		}
	}
</style>
