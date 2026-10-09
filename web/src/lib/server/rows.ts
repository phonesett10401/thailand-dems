import { COLUMN_NAMES } from './column-names';

export function pascalize(row: Record<string, unknown>): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(row)) out[COLUMN_NAMES[k] ?? k] = v;
	return out;
}
