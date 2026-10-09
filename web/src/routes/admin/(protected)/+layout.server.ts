import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime.js';

export const load = ({ locals }) => {
	if (locals.user?.role !== 'admin') redirect(303, localizeHref('/admin/login'));
	return { email: locals.user.email };
};
