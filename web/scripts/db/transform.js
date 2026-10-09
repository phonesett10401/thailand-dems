import { dropTestRecords } from '../scrub.js';
import { pgTable, toSnake } from '../schema/names.js';

export function transformRows(table, rows, model, opts = {}) {
	const t = model.tables.find((x) => x.name === table);
	if (!t) throw new Error(`Unknown table ${table}`);
	const drop = new Set(opts.dropColumns?.[table] ?? []);
	const cols = t.columns.filter((c) => !c.generation && !drop.has(c.name));
	return dropTestRecords(rows).map((row) => {
		const out = {};
		for (const c of cols) {
			const v = row[c.name];
			out[toSnake(c.name)] = c.columnType === 'tinyint(1)' && v !== null && v !== undefined ? Boolean(Number(v)) : v;
		}
		return out;
	});
}

/**
 * Dropping test rows can orphan children. Apply each foreign key's own ON DELETE rule
 * (SET NULL or CASCADE) until nothing changes, so the copy never violates a constraint.
 * `data` is keyed by Postgres table name with snake_case rows (output of transformRows).
 */
export function enforceForeignKeys(data, model) {
	const out = Object.fromEntries(Object.entries(data).map(([t, rows]) => [t, rows.map((r) => ({ ...r }))]));
	for (let changed = true; changed; ) {
		changed = false;
		for (const t of model.tables) {
			const table = pgTable(t.name);
			for (const fk of t.foreignKeys) {
				if (fk.columns.length !== 1) continue; // all DEMS foreign keys are single-column
				const col = toSnake(fk.columns[0]);
				const parent = pgTable(fk.refTable);
				const refCol = toSnake(fk.refColumns[0]);
				const alive = new Set((out[parent] ?? []).map((r) => r[refCol]));
				const before = out[table]?.length ?? 0;
				out[table] = (out[table] ?? []).flatMap((r) => {
					if (r[col] === null || r[col] === undefined || alive.has(r[col])) return [r];
					changed = true;
					return fk.onDelete.toUpperCase() === 'SET NULL' ? [{ ...r, [col]: null }] : [];
				});
				if (out[table].length !== before) changed = true;
			}
		}
	}
	return out;
}

export function isBlankReport(row) {
	return ['UserName', 'UserEmail', 'UserPhone', 'Description', 'ReportedLocation'].every(
		(k) => row[k] === null || row[k] === undefined || String(row[k]).trim() === ''
	);
}

export function assertEmpty(counts) {
	const full = Object.entries(counts)
		.filter(([, n]) => n > 0)
		.map(([t]) => t);
	if (full.length) throw new Error(`Target already has data in: ${full.join(', ')}. Refusing to import twice.`);
}
