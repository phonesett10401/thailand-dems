import provinces from '$lib/sample/provinces.json';
import type { Pt } from './types';

export type Place = Pt & { name: string; via: 'default' | 'gps' | 'province' };

const KEY = 'dems.place';
const BANGKOK: Place = { lat: 13.7563, lon: 100.5018, name: 'Bangkok', via: 'default' };

export const PROVINCES = (provinces as { Province: string; Latitude: string; Longitude: string }[]).map((p) => ({
	name: p.Province,
	lat: Number(p.Latitude),
	lon: Number(p.Longitude)
}));

/** Only a chosen province is remembered; GPS positions are never stored. */
function saved(): Place | null {
	try {
		const s = localStorage.getItem(KEY);
		return s ? (JSON.parse(s) as Place) : null;
	} catch {
		return null;
	}
}

export const here = $state<{ place: Place; error: boolean }>({ place: saved() ?? BANGKOK, error: false });

export function setPlace(p: Place): void {
	here.place = p;
	here.error = false;
	if (p.via === 'province') {
		try {
			localStorage.setItem(KEY, JSON.stringify(p));
		} catch {
			// private mode: fine, just not remembered
		}
	}
}

export function useGps(): Promise<void> {
	return new Promise((resolve) => {
		if (!('geolocation' in navigator)) {
			here.error = true;
			return resolve();
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setPlace({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'gps', via: 'gps' });
				resolve();
			},
			() => {
				here.error = true;
				resolve();
			},
			{ timeout: 10_000, maximumAge: 600_000 }
		);
	});
}
