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
	/** Numbers and agencies that guide text names ({medical} etc. in prepare/guides.ts). */
	guide: { medical: string; fire: string; police: string; disaster: string; officials: { en: string; th: string } };
	air: 'thai-pcd' | 'who-it';
	weather: 'dems' | 'smhi';
	shelters: 'sample' | 'in-development' | 'link';
	shelterLink?: string;
};

export const COUNTRIES: Record<CountryCode, Country> = { TH: th, MM: mm, SE: se };
export const CODES = Object.keys(COUNTRIES) as CountryCode[];

/** Detection-only border towns, so a sparse place list can't push a border town to the wrong side. */
const ANCHORS: (Pt & { c: CountryCode })[] = [
	{ lat: 16.713, lon: 98.575, c: 'TH' }, // Mae Sot
	{ lat: 16.688, lon: 98.508, c: 'MM' }, // Myawaddy
	{ lat: 20.428, lon: 99.884, c: 'TH' }, // Mae Sai
	{ lat: 20.447, lon: 99.88, c: 'MM' }, // Tachileik
	{ lat: 9.962, lon: 98.638, c: 'TH' }, // Ranong
	{ lat: 9.983, lon: 98.55, c: 'MM' } // Kawthaung
];

const DETECT_KM = 300;
/** Nearest known place decides; nothing within 300 km → not a supported country. */
export function detectCountry(pt: Pt): CountryCode | null {
	let best: { c: CountryCode; km: number } | null = null;
	for (const a of ANCHORS) {
		const km = distanceKm(pt, a);
		if (!best || km < best.km) best = { c: a.c, km };
	}
	for (const c of CODES)
		for (const p of [COUNTRIES[c].defaultPlace, ...COUNTRIES[c].places]) {
			const km = distanceKm(pt, p);
			if (!best || km < best.km) best = { c, km };
		}
	return best && best.km <= DETECT_KM ? best.c : null;
}
