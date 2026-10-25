<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
</script>

<div class="page max-w-xl">
	<h1 class="headline text-4xl">{m.error_title()}</h1>
	<p class="mt-2 text-muted">{page.status} {page.error?.message}</p>
	<div class="mt-6 flex flex-wrap gap-3">
		<a href={localizeHref('/')} class="inline-flex min-h-11 items-center rounded-lg bg-white/10 px-4 text-sm font-medium">{m.error_home()}</a>
		<a href={localizeHref('/shelters')} class="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium">{m.nav_shelters()}</a>
	</div>
</div>
