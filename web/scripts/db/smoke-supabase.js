// Live checks against Supabase. Prints pass/fail lines only.
import { readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { pgTable } from '../schema/names.js';
import { loadEnvs, need } from './env.js';

const { web } = loadEnvs();
need(web, 'DATABASE_URL', 'PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_PUBLISHABLE_KEY');
const sql = postgres(web.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });
const model = JSON.parse(await readFile(new URL('../../supabase/mysql-model.json', import.meta.url), 'utf8'));
const base = web.PUBLIC_SUPABASE_URL.replace(/\/$/, '');
let failures = 0;
const check = (ok, label) => {
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
	if (!ok) failures++;
};

// 1. Every table exists (row counts for a by-eye comparison with the migration report).
for (const t of model.tables) {
	const [{ n }] = await sql`select count(*)::int n from ${sql('public.' + pgTable(t.name))}`;
	console.log(`      ${pgTable(t.name).padEnd(30)} ${n} rows`);
}

// 2. Triggers fire (inside a transaction that is always rolled back).
class Rollback extends Error {}
try {
	await sql.begin(async (tx) => {
		const [s] = await tx`insert into public.shelters (shelter_name, shelter_type, address, city, capacity, current_occupancy, status)
		  values ('smoke', 'Evacuation Center', 'x', 'x', 10, 15, 'Available') returning status, current_occupancy`;
		check(s.status === 'Full' && s.current_occupancy === 10, 'shelter insert trigger caps occupancy and sets Full');
		const [r] = await tx`insert into public.relief_supplies (supply_name, category, unit, total_quantity, allocated_quantity, minimum_threshold)
		  values ('smoke', 'Food', 'boxes', 5, 5, 1) returning status`;
		check(r.status === 'Out of Stock', 'supply status trigger marks Out of Stock');
		const [inactive] = await tx`select agency_id from public.agencies where status <> 'Active' limit 1`;
		if (inactive) {
			let blocked = false;
			try {
				await tx.savepoint(
					(sp) =>
						sp`insert into public.agency_activations (agency_id, disaster_id, status)
						   values (${inactive.agency_id}, (select min(disaster_id) from public.disasters), 'Requested')`
				);
			} catch {
				blocked = true;
			}
			check(blocked, 'activation of inactive agency is rejected');
		} else {
			console.log('SKIP  no inactive agency to test activation validation');
		}
		throw new Rollback();
	});
} catch (e) {
	if (!(e instanceof Rollback)) check(false, `trigger checks crashed: ${e.message}`);
}

// 2b. An absurdly overfull shelter is clamped, not an error (numeric overflow fix).
try {
	await sql.begin(async (tx) => {
		const [s] = await tx`insert into public.shelters (shelter_name, shelter_type, address, city, capacity, current_occupancy)
		  values ('smoke', 'Evacuation Center', 'x', 'x', 100, 0) returning shelter_id`;
		const [u] = await tx`update public.shelters set current_occupancy = 1500 where shelter_id = ${s.shelter_id}
		  returning current_occupancy, status`;
		check(u.current_occupancy === 100 && u.status === 'Full', 'overfull shelter update is clamped to capacity');
		throw new Rollback();
	});
} catch (e) {
	if (!(e instanceof Rollback)) check(false, `overfull shelter update failed: ${e.message}`);
}

// 2c. Rate limit holds under concurrency: 4 used, two simultaneous requests → exactly one gets the 5th slot.
{
	const hash = `smoke-${Date.now()}-${Math.random()}`;
	const pool = postgres(web.DATABASE_URL, { prepare: false, max: 4, onnotice: () => {} });
	try {
		await pool`insert into public.report_rate_limits (ip_hash) select ${hash} from generate_series(1, 4)`;
		const attempt = () =>
			pool.begin(async (tx) => {
				const [{ ok }] = await tx`select public.reserve_report_slot(${hash}, 5, 10) as ok`;
				await tx`select pg_sleep(0.3)`; // widen the race window
				return ok;
			});
		const results = await Promise.all([attempt(), attempt(), attempt()]);
		check(results.filter(Boolean).length === 1, `concurrent rate limit grants exactly one slot (got ${results.filter(Boolean).length})`);
	} catch (e) {
		check(false, `concurrent rate limit check failed: ${e.message}`);
	} finally {
		await pool`delete from public.report_rate_limits where ip_hash = ${hash}`;
		await pool.end();
	}
}

// 2d. The anonymous Data API cannot call the rate-limit function.
{
	const res = await fetch(`${base}/rest/v1/rpc/reserve_report_slot`, {
		method: 'POST',
		headers: { apikey: web.PUBLIC_SUPABASE_PUBLISHABLE_KEY, 'content-type': 'application/json' },
		body: JSON.stringify({ p_hash: 'x', p_max: 5, p_window_minutes: 10 })
	});
	check(!res.ok, `Data API cannot call reserve_report_slot (HTTP ${res.status})`);
}

// 3. The publishable key cannot read tables through the Data API.
for (const t of ['shelters', 'user_reports', 'volunteer_accounts']) {
	const res = await fetch(`${base}/rest/v1/${t}?select=*&limit=1`, {
		headers: { apikey: web.PUBLIC_SUPABASE_PUBLISHABLE_KEY }
	});
	const body = res.ok ? await res.json() : [];
	check(!res.ok || body.length === 0, `Data API cannot read ${t} with the publishable key (HTTP ${res.status})`);
}

// 4. Sign-ups are disabled.
const settings = await (
	await fetch(`${base}/auth/v1/settings`, { headers: { apikey: web.PUBLIC_SUPABASE_PUBLISHABLE_KEY } })
).json();
check(settings.disable_signup === true, 'public sign-ups are disabled');

await sql.end();
process.exitCode = failures ? 1 : 0;
