import { describe, expect, it } from 'vitest';
import { distanceKm } from '$lib/geo';
import { smhiAreaFor } from './se';
import { areaName, SE_AREAS } from './se-areas';
import { overwriteGetLocale } from '$lib/paraglide/runtime.js';
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
	it.each(codes)('%s default place has a name in every language', (c) => {
		const n = COUNTRIES[c].defaultPlace.names;
		for (const l of ['en', 'th', 'my'] as const) expect(n[l].trim()).not.toBe('');
		expect(n.en).toBe(COUNTRIES[c].defaultPlace.name);
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
		expect(detectCountry({ lat: 16.688, lon: 98.508 })).toBe('MM'); // Myawaddy
		expect(detectCountry({ lat: 20.428, lon: 99.884 })).toBe('TH'); // Mae Sai
		expect(detectCountry({ lat: 20.447, lon: 99.88 })).toBe('MM'); // Tachileik
		expect(detectCountry({ lat: 9.962, lon: 98.638 })).toBe('TH'); // Ranong
		expect(detectCountry({ lat: 9.983, lon: 98.55 })).toBe('MM'); // Kawthaung
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

describe('smhiAreaFor', () => {
	it('picks the county of the nearest SE place', () => {
		expect(smhiAreaFor({ lat: 57.7089, lon: 11.9746 })).toBe(14); // Gothenburg
		expect(smhiAreaFor({ lat: 59.33, lon: 18.07 })).toBe(1);
	});
});

describe('localised place and area names', () => {
	const langs = ['en', 'th', 'my'] as const;
	it('every SE county and SMHI sea district has en/th/my names', () => {
		const ids = [...COUNTRIES.SE.places.map((p) => p.smhiId!), ...Array.from({ length: 18 }, (_, i) => 41 + i)];
		for (const id of ids) for (const l of langs) expect(SE_AREAS[id]?.[l]?.trim(), `${id} ${l}`).toBeTruthy();
	});
	it('areaName follows the locale and falls back to SMHI English', () => {
		try {
			expect(areaName(56, 'Kattegat')).toBe('Kattegat');
			overwriteGetLocale(() => 'my');
			expect(areaName(56, 'Kattegat')).toMatch(/[က-႟]/);
			expect(areaName(999, 'Nowhere Bay')).toBe('Nowhere Bay');
			expect(areaName(undefined, 'Nowhere Bay')).toBe('Nowhere Bay');
		} finally {
			overwriteGetLocale(() => 'en');
		}
	});
	it.each(['SE', 'MM'] as const)('%s places carry en/th/my names, en = name', (c) => {
		for (const p of COUNTRIES[c].places) {
			for (const l of langs) expect(p.names?.[l]?.trim(), `${p.name} ${l}`).toBeTruthy();
			expect(p.names!.en).toBe(p.name);
		}
	});
	it('Myanmar places use official Burmese names in Myanmar script', () => {
		for (const p of COUNTRIES.MM.places) expect(p.names!.my).toMatch(/^[က-႟ ]+$/);
		const my = (n: string) => COUNTRIES.MM.places.find((p) => p.name === n)!.names!.my;
		expect(my('Yangon Region')).toBe('ရန်ကုန်တိုင်းဒေသကြီး');
		expect(my('Shan State')).toBe('ရှမ်းပြည်နယ်');
		expect(my('Naypyidaw Union Territory')).toBe('နေပြည်တော် ပြည်ထောင်စုနယ်မြေ');
	});
});
