import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { requireRole } from '$lib/server/auth';
import { sql } from '$lib/server/db';
import { insertReport, listReports } from '$lib/server/queries';
import { allowed, ipHash, RATE } from '$lib/server/rate-limit';
import { parseReport } from '$lib/server/report-input';

export const POST = async ({ request, getClientAddress }) => {
	const parsed = parseReport(await request.json().catch(() => null));
	if (!parsed.ok) error(400, parsed.error);
	const db = sql();
	const hash = ipHash(getClientAddress(), env.SUPABASE_SECRET_KEY ?? 'dev');
	const id = await db.begin(async (tx) => {
		await tx`delete from public.report_rate_limits where created_at < now() - interval '1 day'`;
		const [{ n }] = await tx`select count(*)::int n from public.report_rate_limits
		  where ip_hash = ${hash} and created_at > now() - make_interval(mins => ${RATE.windowMinutes})`;
		if (!allowed(n)) return null;
		await tx`insert into public.report_rate_limits (ip_hash) values (${hash})`;
		return insertReport(tx as never, parsed.value);
	});
	if (id === null) error(429, 'Too many reports');
	return json({ reportId: id }, { status: 201 });
};

export const GET = async ({ locals }) => {
	requireRole(locals, 'admin');
	return json(await listReports(sql()));
};
