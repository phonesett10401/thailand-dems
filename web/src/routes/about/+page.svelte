<script lang="ts">
	import { thresholdRows } from '$lib/thresholds';
	import { PlayCircle } from '@lucide/svelte';
	import { callParams } from '$lib/country.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';

	const rows = thresholdRows();
</script>

<div class="page max-w-2xl">
	<h1 class="headline text-4xl">{m.about_title()}</h1>
	<p class="mt-3 text-soft">{m.about_intro()}</p>
	<a href={localizeHref('/demo')} class="glass mt-4 inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold">
		<PlayCircle size={18} aria-hidden="true" />{m.about_demo_link()}
	</a>

	<section class="mt-8">
		<h2 class="label mb-2">{m.about_real()}</h2>
		<ul class="glass divide-y divide-line rounded-2xl text-sm">
			{#each [m.about_real_weather(), m.about_real_smhi(), m.about_real_events(), m.about_real_quakes(), m.about_real_map(), m.about_real_routes()] as t (t)}<li class="px-4 py-3">{t}</li>{/each}
		</ul>
	</section>
	<section class="mt-6">
		<h2 class="label mb-2">{m.about_sample()}</h2>
		<ul class="glass divide-y divide-line rounded-2xl text-sm">
			{#each [m.about_sample_shelters(), m.about_sample_disasters(), m.about_sample_routes(), m.about_reports()] as t (t)}<li class="px-4 py-3">{t}</li>{/each}
		</ul>
	</section>
	<section class="mt-6">
		<h2 class="label mb-2">{m.about_levels_title()}</h2>
		<p class="text-sm text-soft">{m.about_levels_body()}</p>
		<ul class="mt-3 flex flex-col gap-1.5 font-mono text-xs text-muted">
			{#each rows as r (r)}<li>{r}</li>{/each}
		</ul>
	</section>
	<section class="mt-6">
		<h2 class="label mb-2">{m.about_limits_title()}</h2>
		<p class="text-sm text-soft">{m.about_limits_body(callParams())}</p>
	</section>
	<p class="mt-6 text-xs text-muted">{m.about_th_note()}</p>
</div>
