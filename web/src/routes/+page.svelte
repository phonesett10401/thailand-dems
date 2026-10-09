<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
</script>

<h1 class="p-6 text-2xl font-bold text-alarm" data-locale={getLocale()}>{m.app_name()}</h1>
