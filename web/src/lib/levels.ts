import type { Country } from './countries';
import { distanceKm, toNum } from './geo';
import { guideForSmhi, SMHI_URL, smhiCode, smhiLevel, type SmhiWarning } from './sources/smhi';
import type { Air, Forecast, River } from './sources/openmeteo';
import type { DbAlert, Disaster, HazardEvent, HazardKind, Pt } from './types';

const safeUrl = (u: string | null | undefined) => (u?.startsWith('https://') ? u : null);

export type Lvl = 'safe' | 'watch' | 'warning';
export type Overall = Lvl | 'unknown';
export type HazardType =
	| 'flood'
	| 'rain'
	| 'storm'
	| 'smoke'
	| 'heat'
	| 'earthquake'
	| 'tsunami'
	| 'landslide'
	| 'drought'
	| 'wildfire'
	| 'volcano'
	| 'chemical'
	| 'official'
	| 'other';
export type Hazard = {
	id: string;
	type: HazardType;
	level: Lvl;
	name: string | null;
	value: number | null;
	km: number | null;
	lat: number | null;
	lon: number | null;
	time: string | null;
	source: string;
	sample: boolean;
	url: string | null;
	/** Official SMHI zones: the areas it covers (SMHI id + English name). */
	areas?: { id?: number; en: string }[];
};
export type FeedKey = 'air' | 'forecast' | 'river' | 'gdacs' | 'quakes' | 'smhi';
/** A live feed that is `undefined` failed to load. `river: null` means no river at this point. */
export type Feeds = {
	air?: Air;
	forecast?: Forecast;
	river?: River | null;
	gdacs?: HazardEvent[];
	quakes?: HazardEvent[];
	smhi?: SmhiWarning[];
	disasters: Disaster[];
	alerts: DbAlert[];
};
export type Assessment = { level: Overall; hazards: Hazard[]; failed: FeedKey[]; checkedAt: number };

/** Every number here comes from spec §4.2. */
export const T = {
	pm25: [37.5, 75] as [number, number], // Thai PCD: above 37.5 / above 75
	heat: [41, 54] as [number, number], // Thai heat index danger bands, inclusive
	rain: [35, 90] as [number, number], // TMD heavy / very heavy, inclusive
	quake: [4.5, 6] as [number, number],
	quakeKm: 300,
	quakeHours: 24,
	gdacsKm: 300,
	cycloneKm: 500,
	sampleKm: 100,
	staleMs: 3 * 3600_000
};

export const RANK: Record<Overall, number> = { unknown: -1, safe: 0, watch: 1, warning: 2 };
export const worst = (ls: Lvl[]): Lvl => ls.reduce<Lvl>((a, b) => (RANK[b] > RANK[a] ? b : a), 'safe');

const over = (v: number, [w, x]: [number, number], inclusive: boolean): Lvl => {
	const above = (t: number) => (inclusive ? v >= t : v > t);
	return above(x) ? 'warning' : above(w) ? 'watch' : 'safe';
};

const GDACS_TYPE: Record<HazardKind, HazardType> = {
	flood: 'flood',
	cyclone: 'storm',
	earthquake: 'earthquake',
	drought: 'drought',
	wildfire: 'wildfire',
	volcano: 'volcano',
	other: 'other'
};

const DISASTER_TYPE: Record<string, HazardType> = {
	Flood: 'flood',
	Earthquake: 'earthquake',
	'Industrial Accident': 'chemical',
	Tsunami: 'tsunami',
	Landslide: 'landslide',
	Hurricane: 'storm',
	Tornado: 'storm',
	Wildfire: 'wildfire',
	Drought: 'drought'
};
const SEVERITY: Record<string, Lvl> = {
	Catastrophic: 'warning',
	Critical: 'warning',
	Emergency: 'warning',
	Severe: 'watch',
	Moderate: 'watch',
	Warning: 'watch'
};

const live = (h: Omit<Hazard, 'sample'>): Hazard => ({ ...h, sample: false });

export function collect(f: Feeds, at: Pt, now: number, near: boolean, c: Country, smhiArea?: number): Hazard[] {
	const out: Hazard[] = [];
	const here = { km: null, lat: null, lon: null, name: null, url: null };
	const today = new Date(now).toISOString();

	if (f.air) {
		const level = over(f.air.pm25, T.pm25, false);
		if (level !== 'safe') out.push(live({ ...here, id: 'air', type: 'smoke', level, value: f.air.pm25, time: f.air.time.toISOString(), source: c.air === 'thai-pcd' ? 'Open-Meteo' : 'Open-Meteo (WHO interim target)' }));
	}
	if (c.weather === 'dems') {
		const day = f.forecast?.days[0];
		if (day) {
			const heat = day.feels === null ? 'safe' : over(day.feels, T.heat, true);
			if (heat !== 'safe') out.push(live({ ...here, id: 'heat', type: 'heat', level: heat, value: day.feels, time: today, source: 'Open-Meteo' }));
			const rain = over(day.rain, T.rain, true);
			if (rain !== 'safe') out.push(live({ ...here, id: 'rain', type: 'rain', level: rain, value: day.rain, time: today, source: 'Open-Meteo' }));
		}
		if (f.river?.rising) {
			out.push(live({ ...here, id: 'river', type: 'flood', level: 'watch', value: f.river.peak, time: today, source: 'Open-Meteo river model' }));
		}
	}
	if (c.weather === 'smhi' && smhiArea !== undefined) {
		const seen = new Map<string, number>();
		for (const w of f.smhi ?? []) {
			if (w.areaId !== smhiArea || (w.end !== null && Date.parse(w.end) < now)) continue;
			const base = `smhi-${w.code}-${w.areaId}`;
			const n = seen.get(base) ?? 0;
			seen.set(base, n + 1);
			const level = smhiLevel(w, now);
			out.push(live({ ...here, id: n ? `${base}-${n}` : base, type: 'official', level, name: w.event, value: null, time: w.start, source: 'SMHI', url: SMHI_URL }));
		}
	}

	for (const q of f.quakes ?? []) {
		const km = distanceKm(at, q);
		const fresh = now - Date.parse(q.time) <= T.quakeHours * 3600_000;
		const level = over(q.mag ?? 0, T.quake, true);
		if (near && (km > T.quakeKm || !fresh || level === 'safe')) continue;
		out.push(live({ id: q.id, type: 'earthquake', level, name: q.title, value: q.mag ?? null, km, lat: q.lat, lon: q.lon, time: q.time, source: 'USGS', url: safeUrl(q.url) }));
	}
	for (const g of f.gdacs ?? []) {
		if (!g.current) continue;
		const km = distanceKm(at, g);
		if (near && km > (g.kind === 'cyclone' ? T.cycloneKm : T.gdacsKm)) continue;
		out.push(live({ id: g.id, type: GDACS_TYPE[g.kind], level: g.level, name: g.title, value: null, km, lat: g.lat, lon: g.lon, time: g.time, source: 'GDACS', url: safeUrl(g.url) }));
	}

	for (const d of f.disasters) {
		const lat = toNum(d.Latitude);
		const lon = toNum(d.Longitude);
		if (d.Status !== 'Active' || lat === null || lon === null) continue;
		const km = distanceKm(at, { lat, lon });
		if (near && km > T.sampleKm) continue;
		const alerts = f.alerts.filter((a) => a.Status === 'Active' && (a as { DisasterID?: number }).DisasterID === d.DisasterID);
		const level = worst([SEVERITY[d.Severity] ?? 'safe', ...alerts.map((a) => SEVERITY[a.Severity] ?? 'safe')]);
		if (level === 'safe') continue;
		out.push({ id: `D${d.DisasterID}`, type: DISASTER_TYPE[d.DisasterType] ?? 'other', level, name: d.DisasterName, value: null, km, lat, lon, time: d.StartDate, source: 'DEMS sample', sample: true, url: null });
	}

	return out
		.map((h, i) => ({ h, i }))
		.sort((a, b) => Number(a.h.sample) - Number(b.h.sample) || RANK[b.h.level] - RANK[a.h.level] || a.i - b.i)
		.map((x) => x.h);
}

const feedsFor = (c: Country): FeedKey[] => (c.weather === 'smhi' ? ['air', 'gdacs', 'quakes', 'smhi'] : ['air', 'forecast', 'river', 'gdacs', 'quakes']);

export function assess(f: Feeds, at: Pt, now: number, c: Country, smhiArea?: number): Assessment {
	const feeds = feedsFor(c);
	const failed = feeds.filter((k) => f[k] === undefined);
	const hazards = collect(f, at, now, true, c, smhiArea);
	const level: Overall = failed.length === feeds.length ? 'unknown' : worst(hazards.filter((h) => !h.sample).map((h) => h.level));
	return { level, hazards, failed, checkedAt: now };
}

export const shown = (a: Assessment, now: number): Overall => (now - a.checkedAt > T.staleMs ? 'unknown' : a.level);

/** A total failure after a good load keeps the last hazards on screen, marked unknown. */
export function keepLast(prev: Assessment | null, next: Assessment): Assessment {
	if (next.level !== 'unknown' || !prev || prev === next) return next;
	return { ...prev, level: 'unknown', failed: next.failed };
}

/** Types the Now screen may call "quiet" for this country, each needing its feeds to have loaded. */
export function quietTypes(a: Assessment, c: Country): HazardType[] {
	const need: Partial<Record<HazardType, FeedKey[]>> =
		c.weather === 'smhi'
			? { flood: ['gdacs', 'smhi'], storm: ['gdacs', 'smhi'], earthquake: ['quakes'], smoke: ['air'] }
			: { flood: ['river', 'gdacs'], storm: ['gdacs'], earthquake: ['quakes'], smoke: ['air'], heat: ['forecast'] };
	const official: (string | null)[] = a.hazards.filter((h) => h.type === 'official').map((h) => guideForSmhi(smhiCode(h) ?? ''));
	return (Object.keys(need) as HazardType[]).filter((t) => !a.hazards.some((h) => h.type === t) && !official.includes(t) && !need[t]!.some((k) => a.failed.includes(k)));
}
