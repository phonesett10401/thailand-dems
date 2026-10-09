import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/public';
import { paraglideMiddleware } from '$lib/paraglide/server.js';

const i18n: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) =>
		resolve(
			{ ...event, request },
			{ transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale) }
		)
	);

const auth: Handle = async ({ event, resolve }) => {
	event.locals.supabase = null;
	event.locals.user = null;
	if (env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		const supabase = createServerClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookies) =>
					cookies.forEach(({ name, value, options }) => event.cookies.set(name, value, { ...options, path: '/' }))
			}
		});
		event.locals.supabase = supabase;
		// getClaims() verifies the JWT; never trust getSession() for authorization.
		const { data } = await supabase.auth.getClaims();
		const c = data?.claims;
		if (c?.sub) {
			const role = (c.app_metadata as { role?: string } | undefined)?.role;
			event.locals.user = {
				id: c.sub,
				email: c.email ?? null,
				role: role === 'admin' || role === 'volunteer' ? role : null
			};
		}
	}
	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};

export const handle = sequence(i18n, auth);
