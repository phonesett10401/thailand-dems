import { COUNTRIES, type Country, type CountryCode } from './countries';

const KEY = 'dems.country';
const read = (): CountryCode => {
	try {
		const v = localStorage.getItem(KEY);
		return v === 'TH' || v === 'MM' || v === 'SE' ? v : 'TH';
	} catch {
		return 'TH';
	}
};

export const country = $state<{ code: CountryCode }>({ code: typeof localStorage === 'undefined' ? 'TH' : read() });
export const currentCountry = (): Country => COUNTRIES[country.code];

/** Callers (location.svelte.ts) reset the place; this only records the choice. */
export function setCountry(code: CountryCode): void {
	country.code = code;
	try {
		localStorage.setItem(KEY, code);
	} catch {
		// private mode: not remembered
	}
}
