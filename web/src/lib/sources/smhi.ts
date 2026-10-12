import type { FetchFn } from './http';

export type SmhiWarning = { areaId: number; level: 'watch' | 'warning'; event: string; code: string; start: string; end: string | null };
const LEVEL: Record<string, SmhiWarning['level']> = { YELLOW: 'watch', ORANGE: 'warning', RED: 'warning' };

export function normaliseSmhi(raw: unknown): SmhiWarning[] {
	if (!Array.isArray(raw)) return [];
	const out: SmhiWarning[] = [];
	for (const w of raw) {
		const event = w?.event?.en, code = w?.event?.code;
		if (typeof event !== 'string' || typeof code !== 'string' || !Array.isArray(w.warningAreas)) continue;
		for (const a of w.warningAreas) {
			const level = LEVEL[a?.warningLevel?.code];
			if (!level || !Array.isArray(a.affectedAreas)) continue;
			for (const area of a.affectedAreas)
				if (Number.isInteger(area?.id)) out.push({ areaId: area.id, level, event, code, start: a.approximateStart ?? '', end: a.approximateEnd ?? null });
		}
	}
	return out;
}

/** Browser side: our own cached proxy, never SMHI directly. */
export async function getSmhi(fetchFn: FetchFn = (u, i) => fetch(u, i)): Promise<SmhiWarning[]> {
	const res = await fetchFn('/api/warnings/se', { signal: AbortSignal.timeout(6000) });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return (await res.json()) as SmhiWarning[];
}
