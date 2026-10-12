import { distanceKm } from '$lib/geo';
import type { Pt } from '$lib/types';
import { mm } from './mm';
import { se } from './se';
import { th } from './th';

export type CountryCode = 'TH' | 'MM' | 'SE';
export type CountryPlace = Pt & { name: string; smhiId?: number };
export type Country = {
	code: CountryCode;
	flag: string;
	view: Pt & { zoom: number };
	defaultPlace: CountryPlace;
	places: CountryPlace[];
	sos: string;
	numbers: { tel: string; key: string }[]; // key → m.num_<key>() label
	air: 'thai-pcd' | 'who-it';
	weather: 'dems' | 'smhi';
	shelters: 'sample' | 'in-development' | 'link';
	shelterLink?: string;
};

export const COUNTRIES: Record<CountryCode, Country> = { TH: th, MM: mm, SE: se };
export const CODES = Object.keys(COUNTRIES) as CountryCode[];

const DETECT_KM = 300;
/** Nearest known place decides; nothing within 300 km → not a supported country. */
export function detectCountry(pt: Pt): CountryCode | null {
	let best: { c: CountryCode; km: number } | null = null;
	for (const c of CODES)
		for (const p of [COUNTRIES[c].defaultPlace, ...COUNTRIES[c].places]) {
			const km = distanceKm(pt, p);
			if (!best || km < best.km) best = { c, km };
		}
	return best && best.km <= DETECT_KM ? best.c : null;
}
