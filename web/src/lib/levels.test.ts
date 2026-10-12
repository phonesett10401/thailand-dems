import { describe, expect, it } from 'vitest';
import { COUNTRIES } from './countries';
import type { SmhiWarning } from './sources/smhi';
import { assess, collect, keepLast, quietTypes, shown, T, worst, type Feeds } from './levels';
import type { Air, Forecast } from './sources/openmeteo';
import type { Disaster, HazardEvent } from './types';

const TH = COUNTRIES.TH;
const BKK = { lat: 13.7563, lon: 100.5018 };
const NOW = Date.parse('2026-10-10T06:00:00Z');
const air = (pm25: number): Air => ({ time: new Date(NOW), pm25, aqi: 0 });
const fc = (rain: number, feels: number | null): Forecast => ({
	now: { time: new Date(NOW), temp: 30, precip: 0, wind: 5, code: 0 },
	hours: [],
	days: [{ date: new Date(NOW), code: 0, max: 33, min: 25, rain, feels }]
});
const calm = (): Feeds => ({ air: air(10), forecast: fc(0, 33), river: null, gdacs: [], quakes: [], disasters: [], alerts: [] });
const quake = (mag: number, lat: number, lon: number, hoursAgo: number): HazardEvent => ({
	id: `Q${mag}${lat}`,
	source: 'USGS',
	kind: 'earthquake',
	title: `M${mag}`,
	level: 'watch',
	lat,
	lon,
	time: new Date(NOW - hoursAgo * 3600_000).toISOString(),
	current: true,
	url: 'u',
	mag
});
const gd = (kind: HazardEvent['kind'], level: HazardEvent['level'], lat: number, lon: number, current = true): HazardEvent => ({
	id: `G${kind}${lat}`,
	source: 'GDACS',
	kind,
	title: `${kind} event`,
	level,
	lat,
	lon,
	time: new Date(NOW).toISOString(),
	current,
	url: 'u'
});
const levelOfType = (f: Feeds, type: string) => assess(f, BKK, NOW, TH).hazards.find((h) => h.type === type)?.level ?? 'safe';

describe('thresholds', () => {
	it('PM2.5: >37.5 watch, >75 warning (Thai PCD bands)', () => {
		expect(levelOfType({ ...calm(), air: air(37.5) }, 'smoke')).toBe('safe');
		expect(levelOfType({ ...calm(), air: air(37.6) }, 'smoke')).toBe('watch');
		expect(levelOfType({ ...calm(), air: air(75) }, 'smoke')).toBe('watch');
		expect(levelOfType({ ...calm(), air: air(75.1) }, 'smoke')).toBe('warning');
	});
	it('heat (feels-like max): >=41 watch, >=54 warning', () => {
		expect(levelOfType({ ...calm(), forecast: fc(0, 40.9) }, 'heat')).toBe('safe');
		expect(levelOfType({ ...calm(), forecast: fc(0, 41) }, 'heat')).toBe('watch');
		expect(levelOfType({ ...calm(), forecast: fc(0, 54) }, 'heat')).toBe('warning');
		expect(levelOfType({ ...calm(), forecast: fc(0, null) }, 'heat')).toBe('safe');
	});
	it('rain today: >=35 mm watch, >=90 mm warning', () => {
		expect(levelOfType({ ...calm(), forecast: fc(34.9, 33) }, 'rain')).toBe('safe');
		expect(levelOfType({ ...calm(), forecast: fc(35, 33) }, 'rain')).toBe('watch');
		expect(levelOfType({ ...calm(), forecast: fc(90, 33) }, 'rain')).toBe('warning');
	});
	it('quakes: M4.5+ within 300 km in 24 h watch, M6+ warning; older or farther ignored', () => {
		const near = { lat: 14.5, lon: 100.5 }; // ~83 km
		expect(levelOfType({ ...calm(), quakes: [quake(4.4, near.lat, near.lon, 1)] }, 'earthquake')).toBe('safe');
		expect(levelOfType({ ...calm(), quakes: [quake(4.5, near.lat, near.lon, 1)] }, 'earthquake')).toBe('watch');
		expect(levelOfType({ ...calm(), quakes: [quake(6, near.lat, near.lon, 1)] }, 'earthquake')).toBe('warning');
		expect(levelOfType({ ...calm(), quakes: [quake(6, near.lat, near.lon, 25)] }, 'earthquake')).toBe('safe');
		expect(levelOfType({ ...calm(), quakes: [quake(6, 20.5, 100.5, 1)] }, 'earthquake')).toBe('safe'); // ~750 km
	});
	it('GDACS: red warning, orange watch, green listed as safe; only current events in range', () => {
		const a = assess({ ...calm(), gdacs: [gd('flood', 'warning', 14, 100.6), gd('wildfire', 'watch', 14.2, 100.6), gd('drought', 'safe', 14.1, 100.6)] }, BKK, NOW, TH);
		expect(a.hazards.map((h) => [h.type, h.level])).toEqual([
			['flood', 'warning'],
			['wildfire', 'watch'],
			['drought', 'safe']
		]);
		expect(assess({ ...calm(), gdacs: [gd('flood', 'warning', 14, 100.6, false)] }, BKK, NOW, TH).hazards).toEqual([]);
		expect(assess({ ...calm(), gdacs: [gd('flood', 'warning', 18.8, 99)] }, BKK, NOW, TH).hazards).toEqual([]); // ~580 km
		expect(assess({ ...calm(), gdacs: [gd('cyclone', 'warning', 16.5, 104)] }, BKK, NOW, TH).hazards[0].type).toBe('storm'); // ~480 km, inside 500
	});
	it('river model: rising is watch, never warning', () => {
		expect(levelOfType({ ...calm(), river: { today: 1, peak: 50, peakDate: '2026-10-12', rising: true } }, 'flood')).toBe('watch');
		expect(levelOfType({ ...calm(), river: { today: 5, peak: 5, peakDate: '2026-10-10', rising: false } }, 'flood')).toBe('safe');
	});
});

describe('overall level', () => {
	it('the worst live hazard wins', () => {
		const a = assess({ ...calm(), air: air(80), forecast: fc(40, 33) }, BKK, NOW, TH);
		expect(a.level).toBe('warning');
		expect(a.hazards.map((h) => h.type)).toEqual(['smoke', 'rain']);
	});
	it('sample disasters are listed but never raise the level', () => {
		const spill: Disaster = { DisasterID: 10, DisasterName: 'Chonburi Hazmat Spill', DisasterType: 'Industrial Accident', Severity: 'Catastrophic', Description: null, AffectedRegion: 'Chonburi', Latitude: '13.3611', Longitude: '100.9847', StartDate: '2025-01-01', Status: 'Active', EstimatedAffectedPopulation: null };
		const a = assess({ ...calm(), disasters: [spill] }, BKK, NOW, TH);
		expect(a.level).toBe('safe');
		expect(a.hazards[0]).toMatchObject({ type: 'chemical', level: 'warning', sample: true });
	});
	it('a sample disaster takes the worst of its own severity and its active alerts', () => {
		const flood: Disaster = { DisasterID: 1, DisasterName: 'Bangkok Flooding', DisasterType: 'Flood', Severity: 'Moderate', Description: null, AffectedRegion: 'Bangkok', Latitude: '13.75', Longitude: '100.5', StartDate: '2025-01-01', Status: 'Active', EstimatedAffectedPopulation: null };
		const alert = { AlertID: 1, AlertType: 'x', Severity: 'Critical' as const, Title: 't', Message: 'm', AffectedRegion: 'Bangkok', IssuedAt: '2025-01-01', ExpiresAt: null, Status: 'Active', DisasterID: 1 };
		expect(assess({ ...calm(), disasters: [flood], alerts: [alert] }, BKK, NOW, TH).hazards[0].level).toBe('warning');
	});
	it('every live feed failed → unknown, never safe; failed feeds are named', () => {
		const a = assess({ disasters: [], alerts: [] }, BKK, NOW, TH);
		expect(a.level).toBe('unknown');
		expect(a.failed).toEqual(['air', 'forecast', 'river', 'gdacs', 'quakes']);
	});
	it('a partial failure still computes the level from what loaded', () => {
		const a = assess({ ...calm(), air: undefined, forecast: fc(95, 33) }, BKK, NOW, TH);
		expect(a.level).toBe('warning');
		expect(a.failed).toEqual(['air']);
	});
	it('nothing found → safe', () => {
		expect(assess(calm(), BKK, NOW, TH).level).toBe('safe');
	});
});

describe('staleness and keep-last', () => {
	it('data older than 3 hours shows unknown', () => {
		const a = assess(calm(), BKK, NOW, TH);
		expect(shown(a, NOW + T.staleMs)).toBe('safe');
		expect(shown(a, NOW + T.staleMs + 1)).toBe('unknown');
	});
	it('a total failure after a good load keeps the last hazards and their time', () => {
		const good = assess({ ...calm(), air: air(80) }, BKK, NOW, TH);
		const bad = assess({ disasters: [], alerts: [] }, BKK, NOW + 60_000, TH);
		const kept = keepLast(good, bad);
		expect(kept.level).toBe('unknown');
		expect(kept.hazards).toEqual(good.hazards);
		expect(kept.checkedAt).toBe(NOW);
		expect(keepLast(null, bad)).toBe(bad);
		expect(keepLast(good, good)).toBe(good);
	});
});

describe('collect (map view)', () => {
	it('near=false keeps far live events and sample disasters with distances', () => {
		const far = { ...calm(), gdacs: [gd('flood', 'warning', 18.8, 99)] };
		const all = collect(far, BKK, NOW, false, TH);
		expect(all).toHaveLength(1);
		expect(all[0].km).toBeGreaterThan(500);
	});
});

describe('feed links', () => {
	it('keeps https urls and drops anything else', () => {
		const f = { ...calm(), quakes: [{ ...quake(5, 13.8, 100.5, 1), url: 'javascript:alert(1)' }], gdacs: [{ ...gd('flood', 'warning', 13.8, 100.5), url: 'https://gdacs.org/x' }] };
		const urls = Object.fromEntries(collect(f, BKK, NOW, true, TH).map((h) => [h.source, h.url]));
		expect(urls).toEqual({ USGS: null, GDACS: 'https://gdacs.org/x' });
	});
});

describe('worst', () => {
	it('ranks warning > watch > safe', () => {
		expect(worst([])).toBe('safe');
		expect(worst(['watch', 'safe', 'warning'])).toBe('warning');
	});
});

describe('countries', () => {
	const STO = { lat: 59.3293, lon: 18.0686 };
	const wind = (areaId: number, level: 'watch' | 'warning' = 'warning', code = 'WIND'): SmhiWarning => ({ areaId, level, event: 'Wind', code, start: '2026-10-13T06:00:00.000Z', end: null });
	const hot = (): Feeds => ({ ...calm(), forecast: fc(95, 55), smhi: [] });
	const types = (hs: { type: string }[]) => hs.map((h) => h.type);

	it('TH keeps heat and rain rules', () => {
		expect(types(assess(hot(), BKK, NOW, TH).hazards)).toEqual(expect.arrayContaining(['heat', 'rain']));
	});
	it('SE ignores heat and rain, and uses SMHI warnings for its own area', () => {
		const se = COUNTRIES.SE;
		expect(types(assess(hot(), STO, NOW, se, 1).hazards)).toEqual([]);
		const a = assess({ ...hot(), smhi: [wind(1)] }, STO, NOW, se, 1);
		expect(a.hazards).toHaveLength(1);
		expect(a.hazards[0]).toMatchObject({ type: 'official', level: 'warning', name: 'Wind', source: 'SMHI', km: null, lat: null, lon: null });
		expect(a.level).toBe('warning');
	});
	it('SE ignores warnings for other areas', () => {
		expect(assess({ ...calm(), smhi: [wind(14)] }, STO, NOW, COUNTRIES.SE, 1).hazards).toEqual([]);
	});
	it('SE official ids are unique per code and area', () => {
		const ids = assess({ ...calm(), smhi: [wind(1), wind(1), wind(1, 'watch', 'RAIN')] }, STO, NOW, COUNTRIES.SE, 1).hazards.map((h) => h.id);
		expect(new Set(ids).size).toBe(3);
		expect(ids).toContain('smhi-RAIN-1');
		expect(ids).toContain('smhi-WIND-1-1');
		expect(ids.every((i) => i.split('-')[1] === 'WIND' || i.split('-')[1] === 'RAIN')).toBe(true);
	});
	it('SE with SMHI down: named as failed, level from the other feeds, not unknown', () => {
		const a = assess({ ...calm(), smhi: undefined }, STO, NOW, COUNTRIES.SE, 1);
		expect(a.failed).toEqual(['smhi']);
		expect(a.level).toBe('safe');
	});
	it('SE with every feed failed → unknown', () => {
		const a = assess({ disasters: [], alerts: [] }, STO, NOW, COUNTRIES.SE, 1);
		expect(a.level).toBe('unknown');
		expect(a.failed).toEqual(['air', 'gdacs', 'quakes', 'smhi']);
	});
	it('MM: PM2.5 41.2 is Watch and the source names the WHO target; TH keeps Open-Meteo', () => {
		const mm = assess({ ...calm(), air: air(41.2) }, BKK, NOW, COUNTRIES.MM).hazards[0];
		expect(mm).toMatchObject({ type: 'smoke', level: 'watch', source: 'Open-Meteo (WHO interim target)' });
		expect(assess({ ...calm(), air: air(41.2) }, BKK, NOW, TH).hazards[0].source).toBe('Open-Meteo');
	});
	it('SE ignores a rising river (DEMS weather rules are off)', () => {
		const f = { ...calm(), river: { today: 1, peak: 50, peakDate: '2026-10-12', rising: true }, smhi: [] };
		expect(assess(f, STO, NOW, COUNTRIES.SE, 1).hazards).toEqual([]);
	});
	it('SE ignores expired SMHI warnings', () => {
		const old = { ...wind(1), end: new Date(NOW - 1000).toISOString() };
		const live = { ...wind(1, 'watch', 'SNOW'), end: new Date(NOW + 1000).toISOString() };
		const h = assess({ ...calm(), smhi: [old, live] }, STO, NOW, COUNTRIES.SE, 1).hazards;
		expect(h.map((x) => x.id)).toEqual(['smhi-SNOW-1']);
	});
	it('quiet list: SE never calls heat quiet, and not flood/storm while SMHI is down', () => {
		const se = COUNTRIES.SE;
		expect(quietTypes(assess({ ...calm(), smhi: [] }, STO, NOW, se, 1), se)).not.toContain('heat');
		expect(quietTypes(assess({ ...calm(), smhi: [] }, STO, NOW, se, 1), se)).toContain('flood');
		const down = quietTypes(assess({ ...calm(), smhi: undefined }, STO, NOW, se, 1), se);
		expect(down).not.toContain('flood');
		expect(down).not.toContain('storm');
		expect(down).toContain('earthquake');
		const warn = (code: string): SmhiWarning => ({ code, areaId: 1, level: 'watch', event: code, start: '2026-10-10T00:00:00Z', end: null } as SmhiWarning);
		const q = (code: string) => quietTypes(assess({ ...calm(), smhi: [warn(code)] }, STO, NOW, se, 1), se);
		expect(q('RAIN')).not.toContain('flood');
		expect(q('WIND')).not.toContain('storm');
		expect(q('RAIN')).toContain('storm');
		expect(q('WATER_SHORTAGE')).toContain('flood');
		expect(quietTypes(assess(calm(), BKK, NOW, TH), TH)).toEqual(['flood', 'storm', 'earthquake', 'smoke', 'heat']);
	});
});
