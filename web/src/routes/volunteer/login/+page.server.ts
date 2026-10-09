import { fail, redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';
import { localizeHref } from '$lib/paraglide/runtime.js';
import { sql } from '$lib/server/db';

export const actions = {
	default: async ({ request, locals }) => {
		const f = await request.formData();
		const username = String(f.get('username') ?? '').trim();
		const password = String(f.get('password') ?? '');
		if (!username || !password) return fail(400, { error: m.login_required() });
		if (!locals.supabase) return fail(503, { error: m.login_failed() });
		const [row] = await sql()`
			select u.email from public.volunteer_accounts va join auth.users u on u.id = va.user_id
			where va.username = ${username} and va.is_active`;
		if (!row) return fail(400, { error: m.login_failed() });
		const { data, error } = await locals.supabase.auth.signInWithPassword({ email: row.email, password });
		if (error || (data.user?.app_metadata as { role?: string } | undefined)?.role !== 'volunteer') {
			if (!error) await locals.supabase.auth.signOut();
			return fail(400, { error: m.login_failed() });
		}
		redirect(303, localizeHref('/volunteer'));
	}
};
