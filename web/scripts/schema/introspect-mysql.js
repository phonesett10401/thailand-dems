// Reads the live local MySQL schema (no data) into supabase/mysql-model.json.
import { mkdir, writeFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { loadEnvs, need } from '../db/env.js';

const { backend } = loadEnvs();
need(backend, 'DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME');
const db = await mysql.createConnection({
	host: backend.DATABASE_HOST,
	user: backend.DATABASE_USER,
	password: backend.DATABASE_PASSWORD,
	database: backend.DATABASE_NAME,
	port: Number(backend.DATABASE_PORT || 3306)
});
const schema = backend.DATABASE_NAME;
const q = async (s) => (await db.query(s, [schema]))[0];

const tables = await q(
	`select table_name as t from information_schema.tables where table_schema = ? and table_type = 'BASE TABLE' order by 1`
);
const cols = await q(`select table_name t, column_name name, data_type dataType, column_type columnType, is_nullable n,
  column_default def, extra as extra, generation_expression gen from information_schema.columns where table_schema = ? order by table_name, ordinal_position`);
const stats = await q(`select table_name t, index_name ix, non_unique nu, column_name c, seq_in_index s from information_schema.statistics
  where table_schema = ? order by table_name, index_name, seq_in_index`);
const fks = await q(`select k.table_name t, k.constraint_name name, k.column_name c, k.referenced_table_name rt, k.referenced_column_name rc,
  r.delete_rule del from information_schema.key_column_usage k join information_schema.referential_constraints r
  on r.constraint_schema = k.constraint_schema and r.constraint_name = k.constraint_name
  where k.table_schema = ? and k.referenced_table_name is not null order by k.table_name, k.constraint_name, k.ordinal_position`);
await db.end();

const groupIx = (t, unique) => {
	const by = new Map();
	for (const s of stats.filter((x) => x.t === t && x.ix !== 'PRIMARY' && Number(x.nu) === (unique ? 0 : 1))) {
		by.set(s.ix, [...(by.get(s.ix) ?? []), s.c]);
	}
	return [...by.values()];
};

const model = {
	tables: tables.map(({ t }) => {
		const fkBy = new Map();
		for (const f of fks.filter((x) => x.t === t)) {
			const e = fkBy.get(f.name) ?? { name: f.name, columns: [], refTable: f.rt, refColumns: [], onDelete: f.del };
			e.columns.push(f.c);
			e.refColumns.push(f.rc);
			fkBy.set(f.name, e);
		}
		return {
			name: t.toLowerCase(),
			columns: cols
				.filter((c) => c.t === t)
				.map((c) => ({
					name: c.name,
					dataType: c.dataType.toLowerCase(),
					// enum values keep their case ('Available' must stay 'Available')
					columnType: c.dataType.toLowerCase() === 'enum' ? c.columnType : c.columnType.toLowerCase(),
					nullable: c.n === 'YES',
					default: c.def,
					extra: c.extra ?? '',
					generation: c.gen ?? ''
				})),
			primaryKey: stats.filter((s) => s.t === t && s.ix === 'PRIMARY').map((s) => s.c),
			uniques: groupIx(t, true),
			indexes: groupIx(t, false),
			foreignKeys: [...fkBy.values()]
		};
	})
};

await mkdir(new URL('../../supabase/', import.meta.url), { recursive: true });
await writeFile(new URL('../../supabase/mysql-model.json', import.meta.url), JSON.stringify(model, null, '\t') + '\n');
console.log(
	`tables: ${model.tables.length}, columns: ${cols.length}, foreign keys: ${model.tables.reduce((n, t) => n + t.foreignKeys.length, 0)}`
);
