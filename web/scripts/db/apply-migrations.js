// Applies supabase/migrations/*.sql in name order, each once, each in its own transaction.
import { readdir, readFile } from 'node:fs/promises';
import postgres from 'postgres';
import { loadEnvs, need } from './env.js';

const { web } = loadEnvs();
need(web, 'DATABASE_URL');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const sql = postgres(web.DATABASE_URL, { prepare: false, max: 1, onnotice: () => {} });

await sql`create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())`;
await sql`alter table public.schema_migrations enable row level security`;
await sql`revoke all on public.schema_migrations from anon, authenticated`;

const dir = new URL('../../supabase/migrations/', import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith('.sql') && (!only || f.startsWith(only))).sort();
const done = new Set((await sql`select name from public.schema_migrations`).map((r) => r.name));

for (const f of files) {
	if (done.has(f)) {
		console.log(`skip    ${f}`);
		continue;
	}
	const text = await readFile(new URL(f, dir), 'utf8');
	await sql.begin(async (tx) => {
		await tx.unsafe(text);
		await tx`insert into public.schema_migrations (name) values (${f})`;
	});
	console.log(`applied ${f}`);
}
const [{ n }] = await sql`select count(*)::int n from information_schema.tables where table_schema = 'public'`;
console.log(`public tables: ${n}`);
await sql.end();
