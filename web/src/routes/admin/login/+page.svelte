<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let { form } = $props();
</script>

<LoginForm title={m.login_admin_title()} idLabel={m.login_email()} idName="email" idType="email" error={form?.error} />
