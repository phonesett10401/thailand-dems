import { describe, expect, it } from 'vitest';
import gdacs from './fixtures/gdacs.json';
import { parseGdacs } from './gdacs';

describe('parseGdacs', () => {
	it('maps events, newest first, with UTC times', () => {
		const out = parseGdacs(gdacs);
		expect(out.map((e) => e.id)).toEqual(['GDACS-FL-1103621', 'GDACS-TC-1001229']);
		expect(out[0]).toEqual({
			id: 'GDACS-FL-1103621',
			source: 'GDACS',
			kind: 'flood',
			title: 'Flood in Thailand',
			level: 'warning',
			lat: 6.3345,
			lon: 101.141,
			time: '2025-11-17T01:00:00.000Z',
			current: false,
			url: 'https://www.gdacs.org/report.aspx?eventid=1103621&episodeid=2&eventtype=FL'
		});
	});
	it('returns [] for a 204 (null) response', () => {
		expect(parseGdacs(null)).toEqual([]);
	});
	it('drops duplicates, unknown event types and non-point geometry', () => {
		const f = gdacs.features[0];
		const raw = {
			features: [
				f,
				f,
				{ ...f, properties: { ...f.properties, eventtype: 'XX', eventid: 2 } },
				{ ...f, geometry: { type: 'Polygon', coordinates: [] }, properties: { ...f.properties, eventid: 3 } }
			]
		};
		expect(parseGdacs(raw as never)).toHaveLength(1);
	});
});
