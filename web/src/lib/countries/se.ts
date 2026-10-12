import { distanceKm } from '$lib/geo';
import type { Pt } from '$lib/types';
import type { Country } from './index';

export const MCF_SHELTERS = 'https://www.mcf.se/sv/amnesomraden/beredskap-for-kris-och-krig/befolkningsskydd/skyddsrum-och-andra-skyddade-platser/';

export const se: Country = {
	code: 'SE',
	flag: '🇸🇪',
	timeZone: 'Europe/Stockholm',
	view: { lat: 62.0, lon: 16.0, zoom: 4 },
	defaultPlace: { name: 'Stockholm', lat: 59.3293, lon: 18.0686, smhiId: 1 },
	places: [
		{ name: 'Blekinge County', lat: 56.1612, lon: 15.5869, smhiId: 10 },
		{ name: 'Dalarna County', lat: 60.6065, lon: 15.6355, smhiId: 20 },
		{ name: 'Gotland County', lat: 57.6348, lon: 18.2948, smhiId: 9 },
		{ name: 'Gävleborg County', lat: 60.6749, lon: 17.1413, smhiId: 21 },
		{ name: 'Halland County', lat: 56.6745, lon: 12.8578, smhiId: 13 },
		{ name: 'Jämtland County', lat: 63.1767, lon: 14.6361, smhiId: 23 },
		{ name: 'Jönköping County', lat: 57.7826, lon: 14.1618, smhiId: 6 },
		{ name: 'Kalmar County', lat: 56.6634, lon: 16.3568, smhiId: 8 },
		{ name: 'Kronoberg County', lat: 56.879, lon: 14.8059, smhiId: 7 },
		{ name: 'Norrbotten County', lat: 65.5848, lon: 22.1547, smhiId: 25 },
		{ name: 'Skåne County', lat: 55.605, lon: 13.0038, smhiId: 12 },
		{ name: 'Stockholm County', lat: 59.3293, lon: 18.0686, smhiId: 1 },
		{ name: 'Södermanland County', lat: 58.7531, lon: 17.0086, smhiId: 4 },
		{ name: 'Uppsala County', lat: 59.8586, lon: 17.6389, smhiId: 3 },
		{ name: 'Värmland County', lat: 59.3793, lon: 13.5036, smhiId: 17 },
		{ name: 'Västerbotten County', lat: 63.8258, lon: 20.263, smhiId: 24 },
		{ name: 'Västernorrland County', lat: 62.6323, lon: 17.9379, smhiId: 22 },
		{ name: 'Västmanland County', lat: 59.6099, lon: 16.5448, smhiId: 19 },
		{ name: 'Västra Götaland County', lat: 57.7089, lon: 11.9746, smhiId: 14 },
		{ name: 'Örebro County', lat: 59.2753, lon: 15.2134, smhiId: 18 },
		{ name: 'Östergötland County', lat: 58.4108, lon: 15.6214, smhiId: 5 }
	],
	sos: '112',
	numbers: [
		{ tel: '112', key: 'se_112' },
		{ tel: '1177', key: 'se_1177' },
		{ tel: '11414', key: 'se_11414' },
		{ tel: '11313', key: 'se_11313' }
	],
	guide: { medical: '112', fire: '112', police: '112', disaster: '112', officials: { en: 'SMHI and your municipality', th: 'SMHI และเทศบาลของคุณ', my: 'SMHI နှင့် သင်နေထိုင်ရာ မြို့နယ်အုပ်ချုပ်ရေး' } },
	air: 'who-it',
	weather: 'smhi',
	shelters: 'link',
	shelterLink: MCF_SHELTERS
};

/** SMHI county id of the nearest SE place (a GPS fix has no county of its own). */
export function smhiAreaFor(pt: Pt): number {
	let best = se.defaultPlace;
	for (const p of se.places) if (distanceKm(pt, p) < distanceKm(pt, best)) best = p;
	return best.smhiId!;
}
