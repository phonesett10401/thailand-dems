<script lang="ts">
	import { ChevronRight, Globe, Info, Languages, MessagesSquare, PlayCircle, ShieldUser, TriangleAlert } from '@lucide/svelte';
	import CountryPicker from '$lib/components/CountryPicker.svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';

	const row = 'glass flex min-h-14 items-center gap-3 rounded-2xl px-4';
</script>

<div class="page max-w-xl">
	<h1 class="headline text-4xl">{m.more_title()}</h1>
	<ul class="mt-6 flex flex-col gap-2">
		<li><a href={localizeHref('/report')} class={row}><TriangleAlert size={18} class="text-warning" aria-hidden="true" /><span class="flex-1">{m.more_report()}</span><ChevronRight size={16} aria-hidden="true" /></a></li>
		<li class={row}><Languages size={18} aria-hidden="true" /><span class="flex-1">{m.more_language()}</span><LangToggle /></li>
		<li class="{row} flex-wrap py-3"><Globe size={18} aria-hidden="true" /><span class="flex-1">{m.country_label()}</span><CountryPicker /></li>
		<li><a href={localizeHref('/about')} class={row}><Info size={18} aria-hidden="true" /><span class="flex-1">{m.more_about()}</span><ChevronRight size={16} aria-hidden="true" /></a></li>
		<li><a href={localizeHref('/demo')} class={row}><PlayCircle size={18} aria-hidden="true" /><span class="flex-1">{m.more_demo()}</span><ChevronRight size={16} aria-hidden="true" /></a></li>
		<li class={row}><MessagesSquare size={18} aria-hidden="true" /><span class="flex-1 opacity-60">{m.more_ask()}</span><span class="label">{m.coming_soon()}</span></li>
		<li class="{row} flex-wrap py-3">
			<ShieldUser size={18} aria-hidden="true" /><span class="flex-1">{m.more_staff()}</span>
			<a href={localizeHref('/admin/login')} class="min-h-11 rounded-lg border border-line px-3 py-2.5 text-sm">{m.more_admin()}</a>
			<a href={localizeHref('/volunteer/login')} class="min-h-11 rounded-lg border border-line px-3 py-2.5 text-sm">{m.more_volunteer()}</a>
		</li>
	</ul>
</div>
