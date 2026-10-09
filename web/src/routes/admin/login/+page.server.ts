import { fail, redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';
import { localizeHref } from '$lib/paraglide/runtime.js';

export const actions = {
	default: async ({ request, locals }) => {
		const f = await request.formData();
		const email = String(f.get('email') ?? '').trim();
		const password = String(f.get('password') ?? '');
		if (!email || !password) return fail(400, { error: m.login_required() });
		if (!locals.supabase) return fail(503, { error: m.login_failed() });
		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error || !data.user) return fail(400, { error: m.login_failed() });
		if ((data.user.app_metadata as { role?: string }).role !== 'admin') {
			await locals.supabase.auth.signOut();
			return fail(403, { error: m.login_wrong_role() });
		}
		redirect(303, localizeHref('/admin'));
	}
};
