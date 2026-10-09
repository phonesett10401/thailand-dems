import { describe, expect, it } from 'vitest';
import usgs from './fixtures/usgs.json';
import { parseQuakes, quakeLevel } from './usgs';

describe('quakeLevel', () => {
	it('grades by magnitude', () => {
		expect(quakeLevel(6.2)).toBe('danger');
		expect(quakeLevel(5.0)).toBe('warning');
		expect(quakeLevel(4.4)).toBe('watch');
		expect(quakeLevel(3.1)).toBe('info');
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
			level: 'warning',
			lat: 4.9,
			lon: 95.1,
			time: new Date(1791070654235).toISOString(),
			current: false,
			url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd'
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
