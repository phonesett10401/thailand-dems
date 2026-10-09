import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { requireRole } from '$lib/server/auth';
import { sql } from '$lib/server/db';
import { insertReport, listReports } from '$lib/server/queries';
import { ipHash, RATE, rateLimitSalt } from '$lib/server/rate-limit';
import { parseReport } from '$lib/server/report-input';

export const POST = async ({ request, getClientAddress }) => {
	const parsed = parseReport(await request.json().catch(() => null));
	if (!parsed.ok) error(400, parsed.error);
	const hash = ipHash(getClientAddress(), rateLimitSalt(env.SUPABASE_SECRET_KEY));
	const id = await sql().begin(async (tx) => {
		// Atomic check-and-reserve under a per-IP lock (supabase/migrations/0003_review_fixes.sql).
		const [{ ok }] = await tx`select public.reserve_report_slot(${hash}, ${RATE.max}, ${RATE.windowMinutes}) as ok`;
		if (!ok) return null;
		return insertReport(tx as never, parsed.value);
	});
	if (id === null) error(429, 'Too many reports');
	return json({ reportId: id }, { status: 201 });
};

export const GET = async ({ locals }) => {
	requireRole(locals, 'admin');
	return json(await listReports(sql()));
};
