import type { Hazard, Lvl } from '../levels';
import type { FetchFn } from './http';

export type SmhiGeometry = { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown[] };
/** One row per affected area; rows of the same SMHI warning area share zoneId, areas and geometry. */
export type SmhiWarning = {
	areaId: number;
	level: 'watch' | 'warning';
	event: string;
	code: string;
	start: string;
	end: string | null;
	zoneId?: number;
	areas?: string[];
	/** SMHI area ids, in the same order as `areas` (for names in the reader's language). */
	areaIds?: number[];
	geometry?: SmhiGeometry;
};
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
			const g = a.area?.geometry;
			const geo = (g?.type === 'Polygon' || g?.type === 'MultiPolygon') && Array.isArray(g.coordinates) ? { geometry: g as SmhiGeometry } : {};
			const zone = Number.isInteger(a.id) ? { zoneId: a.id as number } : {};
			const named = a.affectedAreas.filter((x: { en?: unknown }) => typeof x?.en === 'string');
			const areas: string[] = named.map((x: { en: string }) => x.en);
			const areaIds: number[] = named.map((x: { id?: unknown }) => x.id);
			for (const area of a.affectedAreas)
				if (Number.isInteger(area?.id)) out.push({ areaId: area.id, level, event, code, start: a.approximateStart ?? '', end: a.approximateEnd ?? null, ...zone, areas, areaIds, ...geo });
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

/** A warning starting more than a day from now is a heads-up, not a live warning. */
export const smhiLevel = (w: { level: SmhiWarning['level']; start: string }, now: number): SmhiWarning['level'] =>
	Date.parse(w.start) - now > 24 * 3600e3 ? 'watch' : w.level;

export const SMHI_URL = 'https://www.smhi.se/vader/varningar-och-brandrisk';

export type SmhiZone = { zoneId: number; event: string; code: string; level: Lvl; start: string; areas: string[]; areaIds?: number[]; geometry?: SmhiGeometry };
/** One zone per SMHI warning area that has not expired. Display only; a user's level still comes from `collect`. */
export function buildZones(rows: SmhiWarning[], now: number): SmhiZone[] {
	const zones = new Map<number, SmhiZone>();
	for (const w of rows) {
		if (w.zoneId === undefined || zones.has(w.zoneId) || (w.end !== null && Date.parse(w.end) < now)) continue;
		zones.set(w.zoneId, { zoneId: w.zoneId, event: w.event, code: w.code, level: smhiLevel(w, now), start: w.start, areas: w.areas ?? [], areaIds: w.areaIds, geometry: w.geometry });
	}
	return [...zones.values()];
}

export const zoneHazard = (z: SmhiZone): Hazard => ({
	id: `smhi-${z.code}-z${z.zoneId}`,
	type: 'official',
	level: z.level,
	name: z.event,
	value: null,
	km: null,
	lat: null,
	lon: null,
	time: z.start,
	source: 'SMHI',
	sample: false,
	url: SMHI_URL,
	areas: z.areas.map((en, i) => ({ id: z.areaIds?.[i], en }))
});
