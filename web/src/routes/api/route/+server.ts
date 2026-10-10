import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sql } from '$lib/server/db';
import { ipHash, rateLimitSalt } from '$lib/server/rate-limit';
import { orsRoute, parseRouteReq, ROUTE_RATE } from '$lib/server/route';

export const POST = async ({ request, getClientAddress }) => {
	const parsed = parseRouteReq(await request.json().catch(() => null));
	if (!parsed.ok) error(400, parsed.error);
	if (!env.ORS_API_KEY) error(503, 'Routing is not configured');
	const hash = `route:${ipHash(getClientAddress(), rateLimitSalt(env.SUPABASE_SECRET_KEY))}`;
	const [{ ok }] = await sql()`select public.reserve_report_slot(${hash}, ${ROUTE_RATE.max}, ${ROUTE_RATE.windowMinutes}) as ok`;
	if (!ok) error(429, 'Too many route requests');
	const route = await orsRoute(parsed.value, env.ORS_API_KEY);
	if (!route) error(503, 'Routing unavailable');
	return json(route);
};
