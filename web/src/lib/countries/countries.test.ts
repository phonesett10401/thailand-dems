import { describe, expect, it } from 'vitest';
import { distanceKm } from '$lib/geo';
import { COUNTRIES, detectCountry, type CountryCode } from './index';

const codes = Object.keys(COUNTRIES) as CountryCode[];

describe('country files', () => {
	it.each(codes)('%s has places, a default place, an SOS number and a map view', (c) => {
		const k = COUNTRIES[c];
		expect(k.places.length).toBeGreaterThan(10);
		expect(k.sos).toMatch(/^\d+$/);
		expect(k.numbers.length).toBeGreaterThan(0);
		for (const p of [k.defaultPlace, ...k.places]) {
			expect(Number.isFinite(p.lat) && Number.isFinite(p.lon)).toBe(true);
			expect(p.name.trim()).not.toBe('');
		}
	});
	it('Myanmar lists its 15 states, regions and Naypyidaw', () => expect(COUNTRIES.MM.places).toHaveLength(15));
	it('Sweden lists its 21 counties, each with an SMHI area id', () => {
		expect(COUNTRIES.SE.places).toHaveLength(21);
		expect(new Set(COUNTRIES.SE.places.map((p) => p.smhiId)).size).toBe(21);
	});
	it('only Sweden takes weather from SMHI', () => {
		expect(COUNTRIES.SE.weather).toBe('smhi');
		expect(COUNTRIES.TH.weather).toBe('dems');
		expect(COUNTRIES.MM.weather).toBe('dems');
	});
});

describe('detectCountry', () => {
	it('finds the country of a point', () => {
		expect(detectCountry({ lat: 18.79, lon: 98.98 })).toBe('TH'); // Chiang Mai
		expect(detectCountry({ lat: 21.96, lon: 96.09 })).toBe('MM'); // Mandalay
		expect(detectCountry({ lat: 57.71, lon: 11.97 })).toBe('SE'); // Gothenburg
	});
	it('border towns go to their own side', () => {
		expect(detectCountry({ lat: 16.713, lon: 98.575 })).toBe('TH'); // Mae Sot
	});
	it('a point far from every supported country is null', () => {
		expect(detectCountry({ lat: 48.86, lon: 2.35 })).toBeNull(); // Paris
	});
	it('default places sit within their own country', () => {
		for (const c of codes) expect(detectCountry(COUNTRIES[c].defaultPlace)).toBe(c);
	});
	it('every place is closest to a place of its own country', () => {
		for (const c of codes) for (const p of COUNTRIES[c].places) expect(detectCountry(p)).toBe(c);
	});
	it('distance helper sanity', () => expect(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeGreaterThan(100));
});
