<script lang="ts">
	import { country, dismissSuggestion, suggestCountry, suggestion } from '$lib/country.svelte';
	import { here, setPlace, switchCountry } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';

	const NAME = { TH: m.country_TH, MM: m.country_MM, SE: m.country_SE };

	// The user is physically there, so the GPS position stays the place (switchCountry would reset it to a default).
	function change() {
		const code = suggestion.code;
		if (!code) return;
		const gps = here.place;
		switchCountry(code);
		setPlace(gps);
		suggestCountry(null);
	}
</script>

{#if suggestion.code && suggestion.code !== country.code}
	<div role="status" class="glass mx-auto flex max-w-xl flex-wrap items-center gap-2 rounded-2xl bg-bg/90 px-3 py-2 text-sm">
		<span class="min-w-0 flex-1">{m.country_banner({ country: NAME[suggestion.code]() })}</span>
		<button type="button" onclick={change} class="min-h-11 rounded-lg bg-white/10 px-3 font-semibold">{m.country_switch()}</button>
		<button type="button" onclick={dismissSuggestion} class="min-h-11 rounded-lg border border-line px-3 text-muted">{m.country_not_now()}</button>
	</div>
{/if}
