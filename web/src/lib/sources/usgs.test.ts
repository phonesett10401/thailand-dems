import { describe, expect, it } from 'vitest';
import usgs from './fixtures/usgs.json';
import { COUNTRIES } from '../countries';
import { parseQuakes, quakeLevel, usgsUrl } from './usgs';

describe('quakeLevel', () => {
	it('grades by magnitude', () => {
		expect(quakeLevel(6.2)).toBe('warning');
		expect(quakeLevel(5.0)).toBe('watch');
		expect(quakeLevel(4.4)).toBe('safe');
		expect(quakeLevel(3.1)).toBe('safe');
	});
});

describe('parseQuakes', () => {
	it('maps GeoJSON features to hazard events', () => {
		const out = parseQuakes(usgs, 1791520000000);
		expect(out[0]).toEqual({
			id: 'USGS-us7000abcd',
			source: 'USGS',
			kind: 'earthquake',
			title: 'M5.3 · 81 km SSW of Banda Aceh, Indonesia',
			level: 'watch',
			lat: 4.9,
			lon: 95.1,
			time: new Date(1791070654235).toISOString(),
			current: false,
			url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd',
			mag: 5.3
		});
	});
	it('treats a missing magnitude as 0 and marks events from the last 3 days as current', () => {
		const out = parseQuakes(usgs, 1791520000000);
		expect(out[1].title).toBe('M0.0 · Myanmar');
		expect(out[1].current).toBe(true);
	});
	it('drops duplicate event ids (a keyed list would crash on them)', () => {
		const raw = { features: [usgs.features[0], usgs.features[0], usgs.features[1]] };
		expect(parseQuakes(raw, 1791520000000).map((e) => e.id)).toEqual(['USGS-us7000abcd', 'USGS-us7000efgh']);
	});
	it('handles null input', () => {
		expect(parseQuakes(null)).toEqual([]);
	});
});

describe('usgsUrl', () => {
	it('uses the quake box of the country', () => {
		const now = new Date('2026-10-13T00:00:00Z');
		expect(usgsUrl(COUNTRIES.SE, now)).toContain('minlatitude=53&maxlatitude=71&minlongitude=8&maxlongitude=26');
		expect(usgsUrl(COUNTRIES.MM, now)).toContain('minlatitude=8&maxlatitude=30&minlongitude=90&maxlongitude=103');
		expect(usgsUrl(COUNTRIES.TH, now)).toContain('minlatitude=4&maxlatitude=22&minlongitude=95&maxlongitude=107');
	});
});
