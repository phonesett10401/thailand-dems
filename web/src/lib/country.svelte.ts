import { COUNTRIES, type Country, type CountryCode } from './countries';
import { getLocale } from './paraglide/runtime.js';

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
/** The country's numbers and agencies, for messages that name them. */
export const callParams = () => {
	const c = currentCountry();
	return { sos: c.sos, medical: c.guide.medical, police: c.guide.police, num: c.guide.medical, officials: c.guide.officials[getLocale()] };
};

/** Callers (location.svelte.ts) reset the place; this only records the choice. */
export function setCountry(code: CountryCode): void {
	country.code = code;
	try {
		localStorage.setItem(KEY, code);
	} catch {
		// private mode: not remembered
	}
}

/** A country GPS says we are in but the user has not chosen; the banner offers it. Never applied by itself. */
export const suggestion = $state<{ code: CountryCode | null }>({ code: null });
const dismissKey = (c: CountryCode) => `dems.banner.dismissed.${c}`;

export function suggestCountry(code: CountryCode | null): void {
	if (code === null || code === country.code) return void (suggestion.code = null);
	try {
		if (sessionStorage.getItem(dismissKey(code))) return void (suggestion.code = null);
	} catch {
		// no sessionStorage: can't remember "Not now"
	}
	suggestion.code = code;
}

export function dismissSuggestion(): void {
	if (!suggestion.code) return;
	try {
		sessionStorage.setItem(dismissKey(suggestion.code), '1');
	} catch {
		// fine: shown again next time
	}
	suggestion.code = null;
}
