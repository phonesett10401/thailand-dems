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
	class="rounded-md border border-ink px-2.5 py-1.5 font-mono text-xs font-medium"
>
	{m.lang_switch_label()}
</a>
