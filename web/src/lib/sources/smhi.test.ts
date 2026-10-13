import { describe, expect, it } from 'vitest';
import raw from './fixtures/smhi-warnings.json';
import { buildZones, normaliseSmhi, smhiLevel, zoneHazard } from './smhi';

describe('normaliseSmhi', () => {
	const w = normaliseSmhi(raw);
	it('maps Yellow → watch and Orange/Red → warning, one row per affected area', () => {
		expect(w.filter((x) => x.areaId === 1)).toEqual([expect.objectContaining({ level: 'warning', event: 'Wind', code: 'WIND' })]);
		expect(w.filter((x) => x.code === 'SNOW').map((x) => x.areaId).sort()).toEqual([24, 25]);
		expect(w.find((x) => x.code === 'RAIN')?.level).toBe('warning');
	});
	it('ignores MESSAGE and any unknown level', () => expect(w.some((x) => x.code === 'WATER_SHORTAGE')).toBe(false));
	it('survives junk', () => {
		expect(normaliseSmhi(null)).toEqual([]);
		expect(normaliseSmhi([{ nope: 1 }])).toEqual([]);
	});
	it('rows of one warning area share its id, names and exact geometry', () => {
		const snow = w.filter((x) => x.code === 'SNOW');
		expect(snow.map((x) => x.zoneId)).toEqual([102, 102]);
		expect(snow[0].geometry?.type).toBe('MultiPolygon');
		expect(snow[0].geometry).toBe(snow[1].geometry);
		expect(snow[0].areas).toEqual(['Norrbotten County', 'Västerbotten County']);
		expect(snow[0].areaIds).toEqual([25, 24]);
		expect(w.find((x) => x.code === 'WIND')?.geometry?.type).toBe('Polygon');
	});
	it('omits geometry when missing or not a polygon', () => {
		expect(w.find((x) => x.code === 'RAIN')?.geometry).toBeUndefined();
		const bad = [{ event: { en: 'Wind', code: 'WIND' }, warningAreas: [{ id: 9, area: { geometry: { type: 'Point', coordinates: [1, 2] } }, warningLevel: { code: 'YELLOW' }, affectedAreas: [{ id: 1, en: 'X' }] }] }];
		expect(normaliseSmhi(bad)[0].geometry).toBeUndefined();
	});
});

describe('zones', () => {
	const now = Date.parse('2026-10-13T12:00:00Z');
	const rows = normaliseSmhi(raw);
	it('smhiLevel: more than 24 h ahead is only a watch', () => {
		expect(smhiLevel({ level: 'warning', start: '2026-10-13T06:00:00Z' }, now)).toBe('warning');
		expect(smhiLevel({ level: 'warning', start: '2026-10-15T06:00:00Z' }, now)).toBe('watch');
	});
	it('one zone per warning area, expired dropped', () => {
		const z = buildZones(rows, now);
		expect(z.map((x) => x.zoneId).sort()).toEqual([101, 102, 104]);
		expect(z.find((x) => x.zoneId === 102)).toMatchObject({ event: 'Snow', level: 'watch', areas: ['Norrbotten County', 'Västerbotten County'] });
		expect(buildZones(rows, Date.parse('2026-10-14T00:00:00Z')).map((x) => x.zoneId)).toEqual([102, 104]); // wind ended 13th 20:00
	});
	it('zoneHazard is an official hazard without a point', () => {
		const h = zoneHazard(buildZones(rows, now).find((x) => x.zoneId === 101)!);
		expect(h).toMatchObject({ type: 'official', name: 'Wind', level: 'warning', source: 'SMHI', lat: null, lon: null, id: 'smhi-WIND-z101' });
		expect(zoneHazard(buildZones(rows, now).find((x) => x.zoneId === 102)!).areas).toEqual([{ id: 25, en: 'Norrbotten County' }, { id: 24, en: 'Västerbotten County' }]);
	});
});
