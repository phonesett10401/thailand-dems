<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';

	let { data } = $props();
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.login_volunteer_title()}</h1>
	<p class="mt-3">{m.signed_in_as({ who: data.email ?? '' })}</p>
	<p class="mt-2 text-muted">{m.volunteer_coming()}</p>
	<form method="POST" action="/auth/logout" class="mt-6">
		<button class="min-h-11 rounded-md border border-ink px-4 font-semibold">{m.sign_out()}</button>
	</form>
</div>
