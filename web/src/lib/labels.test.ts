import { describe, expect, it } from 'vitest';
import type { Hazard } from './levels';
import { markerLabel, nearestOpen, nowTitle } from './labels';
import type { Shelter } from './types';

describe('nowTitle', () => {
	it('joins up to three hazard names, sentence case', () => {
		expect(nowTitle(['smoke'])).toBe('Haze near you');
		expect(nowTitle(['smoke', 'flood'])).toBe('Haze and flooding');
		expect(nowTitle(['smoke', 'heat', 'earthquake', 'rain'])).toBe('Haze, extreme heat and earthquake');
		expect(nowTitle(['smoke', 'smoke'])).toBe('Haze near you');
	});
});

describe('nearestOpen', () => {
	const s = (id: number, lat: string | null, status: Shelter['Status'] = 'Available'): Shelter => ({
		ShelterID: id, ShelterName: `S${id}`, ShelterType: 't', Address: 'a', City: 'c', Latitude: lat, Longitude: lat === null ? null : '100.5', Capacity: 10, CurrentOccupancy: 0, Status: status, Facilities: null
	});
	it('skips full and position-less shelters', () => {
		const r = nearestOpen([s(1, '13.76', 'Full'), s(2, null), s(3, '14.5')], { lat: 13.75, lon: 100.5 });
		expect(r?.s.ShelterID).toBe(3);
		expect(nearestOpen([s(2, null)], { lat: 13.75, lon: 100.5 })).toBeNull();
	});
});

describe('markerLabel', () => {
	const h = (o: Partial<Hazard>): Hazard => ({ id: 'x', type: 'flood', level: 'warning', name: null, value: null, km: null, lat: 1, lon: 1, time: null, source: 's', sample: false, url: null, ...o });
	it('names type, place and level; tags samples', () => {
		expect(markerLabel(h({ name: 'Ayutthaya' }))).toBe('Flooding: Ayutthaya · Warning');
		expect(markerLabel(h({ level: 'watch', sample: true }))).toBe('Flooding · Watch · Sample');
	});
});
