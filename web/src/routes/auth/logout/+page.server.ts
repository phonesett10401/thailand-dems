import { redirect } from '@sveltejs/kit';
import { localizeHref } from '$lib/paraglide/runtime.js';

export const actions = {
	default: async ({ locals }) => {
		await locals.supabase?.auth.signOut();
		redirect(303, localizeHref('/'));
	}
};
