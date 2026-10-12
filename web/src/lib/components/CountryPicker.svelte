<script lang="ts">
	import { CODES, COUNTRIES, type CountryCode } from '$lib/countries';
	import { country } from '$lib/country.svelte';
	import { switchCountry } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';

	const NAME: Record<CountryCode, () => string> = { TH: m.country_TH, MM: m.country_MM, SE: m.country_SE };
</script>

<div role="radiogroup" aria-label={m.country_label()} class="flex flex-wrap gap-1.5">
	{#each CODES as c (c)}
		<button
			type="button"
			role="radio"
			aria-checked={country.code === c}
			onclick={() => switchCountry(c)}
			class="min-h-11 rounded-lg border px-3 text-sm {country.code === c ? 'border-text bg-white/10 font-semibold text-text' : 'border-line text-muted'}"
		>
			<span aria-hidden="true">{COUNTRIES[c].flag}</span> {NAME[c]()}
		</button>
	{/each}
</div>
