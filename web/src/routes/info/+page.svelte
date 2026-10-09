<script lang="ts">
	import { CloudSun, Phone, Route } from '@lucide/svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';

	const numbers = [
		{ n: '1669', label: m.num_1669 },
		{ n: '191', label: m.num_191 },
		{ n: '199', label: m.num_199 },
		{ n: '1784', label: m.num_1784 }
	];
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.info_title()}</h1>

	<h2 class="mt-6 text-sm font-bold tracking-wide uppercase">{m.info_numbers()}</h2>
	<ul class="mt-2 grid gap-2 sm:grid-cols-2">
		{#each numbers as x (x.n)}
			<li>
				<a href={`tel:${x.n}`} class="flex min-h-16 items-center gap-3 rounded-xl bg-ink px-4 text-paper">
					<Phone size={22} class="shrink-0" aria-hidden="true" />
					<span class="font-mono text-2xl font-medium">{x.n}</span>
					<span class="text-sm">{x.label()}</span>
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-8 text-sm font-bold tracking-wide uppercase">{m.info_more()}</h2>
	<div class="mt-2 grid gap-2 sm:grid-cols-2">
		<ActionButton href={localizeHref('/weather')} icon={CloudSun} label={m.home_weather()} />
		<ActionButton href={localizeHref('/evacuation')} icon={Route} label={m.home_evacuation()} />
	</div>

	<section id="about" class="mt-10 rounded-2xl border border-rule p-5">
		<h2 class="text-lg font-bold">{m.about_title()}</h2>
		<p class="mt-2">{m.about_intro()}</p>
		<h3 class="mt-4 font-semibold">{m.about_real()}</h3>
		<ul class="mt-1 list-disc pl-5 text-sm">
			<li>{m.about_real_weather()}</li>
			<li>{m.about_real_events()}</li>
			<li>{m.about_real_quakes()}</li>
			<li>{m.about_real_map()}</li>
		</ul>
		<h3 class="mt-4 flex items-center gap-2 font-semibold">{m.about_sample()} <SampleBadge /></h3>
		<ul class="mt-1 list-disc pl-5 text-sm">
			<li>{m.about_sample_shelters()}</li>
			<li>{m.about_sample_disasters()}</li>
			<li>{m.about_sample_routes()}</li>
		</ul>
		<p class="mt-4 text-sm">{m.about_reports()}</p>
		<p class="mt-2 text-sm text-muted">{m.about_th_note()}</p>
	</section>
</div>
