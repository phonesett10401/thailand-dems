import { describe, expect, it } from 'vitest';
import type { Hazard } from './levels';
import { circle, zonesFrom } from './zones';

const h = (over: Partial<Hazard>): Hazard => ({
	id: Math.random().toString(),
	type: 'flood',
	level: 'warning',
	name: null,
	value: null,
	km: 5,
	lat: 13.8,
	lon: 100.5,
	time: null,
	source: 'GDACS',
	sample: false,
	url: null,
	...over
});

describe('zonesFrom', () => {
	it('keeps only live Warning hazards that block roads and have a position', () => {
		const zs = zonesFrom([
			h({ type: 'flood' }),
			h({ type: 'smoke' }),
			h({ type: 'storm', level: 'watch' }),
			h({ type: 'chemical', sample: true }),
			h({ type: 'landslide', lat: null, lon: null })
		]);
		expect(zs).toEqual([{ lat: 13.8, lon: 100.5, km: 10 }]);
	});
	it('caps at 10, nearest first', () => {
		const zs = zonesFrom(Array.from({ length: 14 }, (_, i) => h({ km: 14 - i, lat: 13 + i / 100 })));
		expect(zs).toHaveLength(10);
		expect(zs[0].lat).toBeCloseTo(13.13);
	});
});

describe('circle', () => {
	it('is a closed ring with the right radius', () => {
		const ring = circle({ lat: 13.75, lon: 100.5, km: 10 }, 16);
		expect(ring).toHaveLength(17);
		expect(ring[0]).toEqual(ring[16]);
		const [lon, lat] = ring[4]; // 90° = due north
		expect(lon).toBeCloseTo(100.5, 5);
		expect((lat - 13.75) * 111.32).toBeCloseTo(10, 1);
	});
});
