<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, getLocale, localizeHref } from '$lib/paraglide/runtime.js';

	// Each language is named in itself, so it is not translated.
	const LANGS = [
		{ l: 'en', name: 'EN' },
		{ l: 'th', name: 'ไทย' },
		{ l: 'my', name: 'မြန်မာ' }
	] as const;
	const path = $derived(deLocalizeHref(page.url.pathname));
</script>

<!-- Full reload: messages are rendered once per load, so switching language reloads the page. -->
<div role="group" aria-label={m.more_language()} class="inline-flex rounded-lg border border-line">
	{#each LANGS as { l, name } (l)}
		<a
			href={localizeHref(path, { locale: l })}
			hreflang={l}
			lang={l}
			aria-current={getLocale() === l ? 'true' : undefined}
			data-sveltekit-reload
			class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-medium {getLocale() === l ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}"
		>
			{name}
		</a>
	{/each}
</div>
