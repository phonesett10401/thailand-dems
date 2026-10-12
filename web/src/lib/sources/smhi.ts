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

export type SmhiGuide = 'storm' | 'snow' | 'flood' | 'heat' | 'cold';
/** Real SMHI event codes (metadata/events.json): THUNDER WIND WIND_MOUNTAINS STRONG_COOLING SNOW BLACK_ICE RAIN HIGH_TEMPERATURES WIND_SEA ICE_ACCRETION LOW_SEA_LEVEL HIGH_SEALEVEL WATER_SHORTAGE HIGH_FLOW FLOODING FIRE. */
export const guideForSmhi = (code: string): SmhiGuide | null =>
	/WIND|THUNDER/.test(code) ? 'storm' : /SNOW/.test(code) ? 'snow' : /RAIN|FLOOD|FLOW|SEALEVEL/.test(code) ? 'flood' : /HIGH_TEMP/.test(code) ? 'heat' : /COOLING/.test(code) ? 'cold' : null;

/** The SMHI event code of an official hazard (id `smhi-<CODE>-<areaId>[-<n>]`). */
export const smhiCode = (h: { type: string; id: string }): string | null => (h.type === 'official' ? (h.id.split('-')[1] ?? null) : null);
