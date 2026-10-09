<script lang="ts">
	import { enhance } from '$app/forms';
	import { m } from '$lib/paraglide/messages.js';

	let {
		title,
		idLabel,
		idName,
		idType,
		error = null
	}: {
		title: string;
		idLabel: string;
		idName: 'email' | 'username';
		idType: 'email' | 'text';
		error?: string | null;
	} = $props();
	let busy = $state(false);
	const field = 'w-full rounded-md border border-ink bg-white px-3 py-2';
</script>

<div class="page max-w-md">
	<h1 class="text-2xl font-bold">{title}</h1>
	<form
		method="POST"
		class="mt-6 flex flex-col gap-4"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
			};
		}}
	>
		<label class="flex flex-col gap-1">
			<span>{idLabel}</span>
			<input name={idName} type={idType} autocomplete={idName === 'email' ? 'email' : 'username'} class={field} />
		</label>
		<label class="flex flex-col gap-1">
			<span>{m.login_password()}</span>
			<input name="password" type="password" autocomplete="current-password" class={field} />
		</label>
		{#if error}<p role="alert" class="text-sm text-alarm">{error}</p>{/if}
		<button
			type="submit"
			disabled={busy}
			class="min-h-12 rounded-md bg-ink px-4 font-semibold text-paper disabled:opacity-60"
		>
			{m.login_submit()}
		</button>
	</form>
</div>
