<script lang="ts">
	import { T } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';

	const rows = [
		m.about_row_pm25({ w: T.pm25[0], x: T.pm25[1] }),
		m.about_row_heat({ w: T.heat[0], x: T.heat[1] }),
		m.about_row_rain({ w: T.rain[0], x: T.rain[1] }),
		m.about_row_quake({ km: T.quakeKm, w: T.quake[0], x: T.quake[1] }),
		m.about_row_gdacs({ km: T.gdacsKm }),
		m.about_row_river(),
		m.about_row_sample()
	];
</script>

<div class="page max-w-2xl">
	<h1 class="headline text-4xl">{m.about_title()}</h1>
	<p class="mt-3 text-[#c9c9cf]">{m.about_intro()}</p>

	<section class="mt-8">
		<h2 class="label mb-2">{m.about_real()}</h2>
		<ul class="glass divide-y divide-line rounded-2xl text-sm">
			{#each [m.about_real_weather(), m.about_real_events(), m.about_real_quakes(), m.about_real_map()] as t (t)}<li class="px-4 py-3">{t}</li>{/each}
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
		<p class="text-sm text-[#c9c9cf]">{m.about_levels_body()}</p>
		<ul class="mt-3 flex flex-col gap-1.5 font-mono text-xs text-muted">
			{#each rows as r (r)}<li>{r}</li>{/each}
		</ul>
	</section>
	<section class="mt-6">
		<h2 class="label mb-2">{m.about_limits_title()}</h2>
		<p class="text-sm text-[#c9c9cf]">{m.about_limits_body()}</p>
	</section>
	<p class="mt-6 text-xs text-muted">{m.about_th_note()}</p>
</div>
