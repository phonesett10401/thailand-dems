<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, getLocale, localizeHref } from '$lib/paraglide/runtime.js';

	const other = getLocale() === 'en' ? 'th' : 'en';
	const href = $derived(localizeHref(deLocalizeHref(page.url.pathname), { locale: other }));
</script>

<!-- Full reload: messages are rendered once per load, so switching language reloads the page. -->
<a
	{href}
	hreflang={other}
	lang={other}
	data-sveltekit-reload
	class="inline-flex min-h-9 items-center rounded-lg border border-line px-2.5 font-mono text-xs font-medium text-muted hover:text-text"
>
	{m.lang_switch_label()}
</a>
