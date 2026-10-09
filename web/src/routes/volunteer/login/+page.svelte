<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { form } = $props();
</script>

<LoginForm
	title={m.login_volunteer_title()}
	idLabel={m.login_username()}
	idName="username"
	idType="text"
	error={form?.error}
/>
