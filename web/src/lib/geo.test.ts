import { describe, expect, it } from 'vitest';
import { distanceKm, occupancyPct, sortByDistance, toNum } from './geo';

describe('toNum', () => {
	it('parses MySQL decimal strings and rejects blanks', () => {
		expect(toNum('14.35200000')).toBe(14.352);
		expect(toNum(7)).toBe(7);
		expect(toNum('')).toBeNull();
		expect(toNum(null)).toBeNull();
		expect(toNum(undefined)).toBeNull();
		expect(toNum('abc')).toBeNull();
	});
});

describe('distanceKm', () => {
	it('Bangkok to Chiang Mai is about 580 km', () => {
		const d = distanceKm({ lat: 13.7563, lon: 100.5018 }, { lat: 18.7883, lon: 98.9853 });
		expect(d).toBeGreaterThan(570);
		expect(d).toBeLessThan(600);
	});
});

describe('sortByDistance', () => {
	const from = { lat: 13.75, lon: 100.5 };
	const rows = [
		{ n: 'far', lat: '18.78', lon: '98.98' },
		{ n: 'nocoords', lat: null, lon: '' },
		{ n: 'near', lat: '13.80', lon: '100.55' }
	];
	it('sorts nearest first and puts unknown locations last with km null', () => {
		const out = sortByDistance(rows, from, (r) => ({ lat: toNum(r.lat), lon: toNum(r.lon) }));
		expect(out.map((o) => o.item.n)).toEqual(['near', 'far', 'nocoords']);
		expect(out[2].km).toBeNull();
		expect(out[0].km).toBeLessThan(10);
	});
});

describe('occupancyPct', () => {
	it('rounds and clamps to 0..100', () => {
		expect(occupancyPct(520, 900)).toBe(58);
		expect(occupancyPct(1200, 900)).toBe(100);
		expect(occupancyPct(-5, 900)).toBe(0);
	});
	it('treats capacity 0 or less as full, never NaN', () => {
		expect(occupancyPct(0, 0)).toBe(100);
		expect(occupancyPct(10, -1)).toBe(100);
	});
});
