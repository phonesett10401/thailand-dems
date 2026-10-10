import { describe, expect, it } from 'vitest';
import sample from './sample/shelters.json';
import { applyFilters, shelterRows } from './shelters';
import type { Shelter } from './types';

const BKK = { lat: 13.7563, lon: 100.5018 };
const list = sample as Shelter[];

describe('shelterRows', () => {
	it('sorts by distance and puts shelters without a position last', () => {
		const noPos = { ...list[0], ShelterID: 999, Latitude: null, Longitude: null };
		const rows = shelterRows([noPos, ...list], BKK);
		expect(rows[0].s.City).toBe('Bangkok');
		expect(rows.at(-1)!.s.ShelterID).toBe(999);
		expect(rows.at(-1)!.km).toBeNull();
	});
	it('reads facilities from the free-text column', () => {
		const rows = shelterRows(list, BKK);
		const by = (name: string) => rows.find((r) => r.s.ShelterName === name)!.facilities;
		expect(by('Chiang Mai University Shelter')).toContain('cleanAir');
		expect(by('Phuket Convention Center')).toContain('pets');
		expect(by('Krabi Sports Complex')).toContain('medical'); // "First aid"
		expect(by('Patong Beach Emergency Shelter')).toContain('medical');
	});
});

describe('applyFilters', () => {
	const rows = shelterRows(list, BKK);
	it('no filters returns everything', () => {
		expect(applyFilters(rows, new Set())).toHaveLength(list.length);
	});
	it('open hides full shelters; has space needs open and under 90 % full', () => {
		expect(applyFilters(rows, new Set(['open'])).some((r) => r.s.Status === 'Full')).toBe(false);
		expect(applyFilters(rows, new Set(['space'])).every((r) => r.s.Status === 'Available' && r.pct < 90)).toBe(true);
	});
	it('filters combine with AND', () => {
		const r = applyFilters(rows, new Set(['pets', 'open']));
		expect(r).toEqual([]); // the only pet-friendly sample shelter is Full
	});
});
