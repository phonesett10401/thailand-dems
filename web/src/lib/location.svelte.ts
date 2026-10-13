import { currentCountry, setCountry } from './country.svelte';
import type { CountryCode } from './countries';
import type { Pt } from './types';

export type Place = Pt & { name: string; via: 'default' | 'gps' | 'province' };

const OLD_KEY = 'dems.place';
const key = (code: CountryCode) => `dems.place.${code}`;

/** One-time: the pre-countries single key becomes Thailand's. */
function migrate(): void {
	try {
		const old = localStorage.getItem(OLD_KEY);
		if (old === null) return;
		if (localStorage.getItem(key('TH')) === null) localStorage.setItem(key('TH'), old);
		localStorage.removeItem(OLD_KEY);
	} catch {
		// no storage: nothing to migrate
	}
}

/** Only a chosen place is remembered; GPS positions are never stored. */
function saved(code: CountryCode): Place | null {
	try {
		const s = localStorage.getItem(key(code));
		const p = s ? JSON.parse(s) : null;
		return p && Number.isFinite(p.lat) && Number.isFinite(p.lon) && typeof p.name === 'string' ? (p as Place) : null;
	} catch {
		return null;
	}
}

const initial = (): Place => {
	if (typeof localStorage !== 'undefined') migrate();
	const c = currentCountry();
	return saved(c.code) ?? { ...c.defaultPlace, via: 'default' };
};

export const places = () => currentCountry().places;

export const here = $state<{ place: Place; error: boolean }>({ place: initial(), error: false });

export function setPlace(p: Place): void {
	here.place = p;
	here.error = false;
	if (p.via === 'province') {
		try {
			localStorage.setItem(key(currentCountry().code), JSON.stringify(p));
		} catch {
			// private mode: fine, just not remembered
		}
	}
}

export function switchCountry(code: CountryCode): void {
	if (code === currentCountry().code) return;
	setCountry(code);
	const c = currentCountry();
	here.place = saved(code) ?? { ...c.defaultPlace, via: 'default' };
	here.error = false;
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
