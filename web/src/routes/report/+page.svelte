<script lang="ts">
	import { CircleCheck, LocateFixed, PhoneCall } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { api } from '$lib/config';
	import { reportSeverityLabel, reportTypeLabel } from '$lib/labels';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { emptyForm, toReportInput, validateStep, type StepErrors } from '$lib/report';
	import { REPORT_SEVERITIES, REPORT_TYPES } from '$lib/types';

	let form = $state(emptyForm());
	let step = $state<1 | 2 | 3 | 'done'>(1);
	let errors = $state<StepErrors>({});
	let sending = $state(false);
	let failure = $state<'offline' | 'rejected' | null>(null);
	let gpsError = $state(false);

	const msg = (e: 'required' | 'short' | undefined) =>
		e === 'required' ? m.report_required() : e === 'short' ? m.report_description_short() : '';

	function next() {
		if (step !== 1 && step !== 2) return;
		errors = validateStep(step, form);
		if (Object.keys(errors).length === 0) step = step === 1 ? 2 : 3;
	}
	function back() {
		failure = null;
		if (step === 2) step = 1;
		else if (step === 3) step = 2;
	}
	function gps() {
		gpsError = false;
		if (!('geolocation' in navigator)) {
			gpsError = true;
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(p) => {
				form.lat = p.coords.latitude;
				form.lon = p.coords.longitude;
			},
			() => (gpsError = true),
			{ timeout: 10_000 }
		);
	}
	async function submit() {
		if (sending) return;
		sending = true;
		failure = null;
		const r = await api.submitReport(toReportInput(form));
		sending = false;
		if (r.ok) step = 'done';
		else failure = r.reason;
	}
	function again() {
		form = emptyForm();
		errors = {};
		step = 1;
	}
	function onsubmit(e: SubmitEvent) {
		e.preventDefault();
		if (step === 3) submit();
		else next();
	}
	const field = 'w-full rounded-md border border-ink bg-white px-3 py-2';
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.report_title()}</h1>
	<p class="mt-3 flex items-start gap-2 rounded-xl bg-alarm p-3 text-sm font-semibold text-white">
		<PhoneCall size={18} aria-hidden="true" class="mt-0.5 shrink-0" />{m.emergency_call_first()}
	</p>

	{#if step === 'done'}
		<section class="mt-8 flex flex-col items-center gap-3 text-center" in:fly={{ y: 12, duration: ms(220) }}>
			<CircleCheck size={48} aria-hidden="true" />
			<h2 class="text-xl font-bold">{m.report_done_title()}</h2>
			<p>{m.report_done_body()}</p>
			<button type="button" onclick={again} class="rounded-md border border-ink px-4 py-2 font-semibold"
				>{m.report_again()}</button
			>
		</section>
	{:else}
		<p class="mt-4 font-mono text-xs text-muted">{m.report_step({ n: step })}</p>
		<form class="mt-2 flex flex-col gap-4" {onsubmit} novalidate>
			{#if step === 1}
				<fieldset>
					<legend class="font-semibold">{m.report_what()} — {m.report_type_label()}</legend>
					<div class="mt-2 grid grid-cols-2 gap-2">
						{#each REPORT_TYPES as t (t)}
							<label
								class="flex min-h-11 items-center gap-2 rounded-md border border-rule px-3 has-checked:border-ink has-checked:bg-ink has-checked:text-paper"
							>
								<input type="radio" name="type" value={t} bind:group={form.type} class="accent-ink" />{reportTypeLabel(t)}
							</label>
						{/each}
					</div>
					{#if errors.type}<p class="mt-1 text-sm text-alarm" role="alert">{msg(errors.type)}</p>{/if}
				</fieldset>
				<fieldset>
					<legend class="font-semibold">{m.report_severity_label()}</legend>
					<div class="mt-2 grid grid-cols-2 gap-2">
						{#each REPORT_SEVERITIES as s (s)}
							<label
								class="flex min-h-11 items-center gap-2 rounded-md border border-rule px-3 has-checked:border-ink has-checked:bg-ink has-checked:text-paper"
							>
								<input
									type="radio"
									name="severity"
									value={s}
									bind:group={form.severity}
									class="accent-ink"
								/>{reportSeverityLabel(s)}
							</label>
						{/each}
					</div>
					{#if errors.severity}<p class="mt-1 text-sm text-alarm" role="alert">{msg(errors.severity)}</p>{/if}
				</fieldset>
				<label class="flex flex-col gap-1">
					<span class="font-semibold">{m.report_description_label()}</span>
					<textarea bind:value={form.description} rows="4" maxlength="2000" class={field}></textarea>
					{#if errors.description}<span class="text-sm text-alarm" role="alert">{msg(errors.description)}</span>{/if}
				</label>
			{:else if step === 2}
				<h2 class="font-semibold">{m.report_where()}</h2>
				<label class="flex flex-col gap-1">
					<span>{m.report_location_label()}</span>
					<input bind:value={form.place} maxlength="255" class={field} />
				</label>
				<button
					type="button"
					onclick={gps}
					class="inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-ink px-3 font-semibold"
				>
					<LocateFixed size={16} aria-hidden="true" />{m.report_use_gps()}
				</button>
				{#if form.lat !== null && form.lon !== null}
					<p class="font-mono text-sm">{m.report_gps_set({ lat: form.lat.toFixed(4), lon: form.lon.toFixed(4) })}</p>
				{/if}
				{#if gpsError}<p class="text-sm text-alarm" role="status">{m.location_denied()}</p>{/if}
				{#if errors.place}<p class="text-sm text-alarm" role="alert">{msg(errors.place)}</p>{/if}
			{:else}
				<h2 class="font-semibold">{m.report_contact()}</h2>
				<p class="text-sm text-muted">{m.report_contact_note()}</p>
				<label class="flex flex-col gap-1"
					><span>{m.report_name()}</span><input
						bind:value={form.name}
						maxlength="100"
						autocomplete="name"
						class={field}
					/></label
				>
				<label class="flex flex-col gap-1"
					><span>{m.report_email()}</span><input
						type="email"
						bind:value={form.email}
						maxlength="100"
						autocomplete="email"
						class={field}
					/></label
				>
				<label class="flex flex-col gap-1"
					><span>{m.report_phone()}</span><input
						type="tel"
						bind:value={form.phone}
						maxlength="20"
						autocomplete="tel"
						class={field}
					/></label
				>
				{#if failure}
					<p class="rounded-md border border-alarm p-3 text-sm text-alarm" role="alert">
						{failure === 'offline' ? m.report_error_offline() : m.report_error_rejected()}
					</p>
				{/if}
			{/if}

			<div class="flex gap-2">
				{#if step !== 1}
					<button type="button" onclick={back} class="min-h-12 rounded-md border border-ink px-4 font-semibold"
						>{m.report_back()}</button
					>
				{/if}
				{#if step === 3}
					<button
						type="submit"
						disabled={sending}
						class="min-h-12 flex-1 rounded-md bg-ink px-4 font-semibold text-paper disabled:opacity-60"
					>
						{sending ? m.report_sending() : m.report_submit()}
					</button>
				{:else}
					<button type="submit" class="min-h-12 flex-1 rounded-md bg-ink px-4 font-semibold text-paper"
						>{m.report_next()}</button
					>
				{/if}
			</div>
		</form>
	{/if}
</div>
