import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime.js';

export const load = ({ locals }) => {
	if (locals.user?.role !== 'volunteer') redirect(303, localizeHref('/volunteer/login'));
	return { email: locals.user.email };
};
