// One-off copy: local MySQL → Supabase. Refuses to run twice. Prints counts only.
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import postgres from 'postgres';
import { pgTable, toSnake } from '../schema/names.js';
import { loadEnvs, need } from './env.js';
import { assertEmpty, enforceForeignKeys, isBlankReport, transformRows } from './transform.js';

const OPTS = { dropColumns: { volunteeraccounts: ['Password'] } };
const { web, backend } = loadEnvs();
need(web, 'DATABASE_URL');
need(backend, 'DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME');

const model = JSON.parse(await readFile(new URL('../../supabase/mysql-model.json', import.meta.url), 'utf8'));
const my = await mysql.createConnection({
	host: backend.DATABASE_HOST,
	user: backend.DATABASE_USER,
	password: backend.DATABASE_PASSWORD,
	database: backend.DATABASE_NAME,
	port: Number(backend.DATABASE_PORT || 3306),
	dateStrings: ['DATE'] // calendar dates stay calendar dates; timestamps keep their instant
});
const pg = postgres(web.DATABASE_URL, { prepare: false, max: 1 });

const before = {};
for (const t of model.tables) {
	const [{ n }] = await pg`select count(*)::int n from ${pg('public.' + pgTable(t.name))}`;
	before[pgTable(t.name)] = n;
}
assertEmpty(before);

const sourceCounts = {};
let data = {};
for (const t of model.tables) {
	const [rows] = await my.query(`select * from \`${t.name}\``);
	sourceCounts[pgTable(t.name)] = rows.length;
	const source = t.name === 'userreports' ? rows.filter((r) => !isBlankReport(r)) : rows;
	data[pgTable(t.name)] = transformRows(t.name, source, model, OPTS);
}
data = enforceForeignKeys(data, model);

const report = [];
await pg.begin(async (tx) => {
	await tx`set constraints all deferred`;
	for (const t of model.tables) {
		const table = pgTable(t.name);
		const out = data[table];
		for (let i = 0; i < out.length; i += 500) {
			await tx`insert into ${tx('public.' + table)} ${tx(out.slice(i, i + 500))}`;
		}
		const pk = t.columns.find((c) => c.extra?.includes('auto_increment'));
		if (pk) {
			const col = toSnake(pk.name);
			await tx.unsafe(
				`select setval(pg_get_serial_sequence('public.${table}', '${col}'), coalesce((select max(${col}) from public.${table}), 1), (select count(*) > 0 from public.${table}))`
			);
		}
		report.push([table, sourceCounts[table], out.length]);
	}
});
await my.end();
await pg.end();

for (const [t, from, to] of report) {
	console.log(
		`${t.padEnd(30)} mysql ${String(from).padStart(4)}  →  postgres ${String(to).padStart(4)}${from !== to ? '  (dropped ' + (from - to) + ')' : ''}`
	);
}
