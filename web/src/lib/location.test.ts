import { beforeEach, describe, expect, it, vi } from 'vitest';

const CM = { lat: 18.79, lon: 98.98, name: 'Chiang Mai', via: 'province' as const };

function fakeStorage(init: Record<string, string> = {}) {
	const m = new Map(Object.entries(init));
	(globalThis as any).localStorage = {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, String(v)),
		removeItem: (k: string) => void m.delete(k)
	};
	return m;
}
async function load() {
	vi.resetModules();
	return import('./location.svelte');
}

beforeEach(() => fakeStorage());

describe('places per country', () => {
	it('(a) no keys: Thailand, Bangkok by default', async () => {
		const { here } = await load();
		const { country } = await import('./country.svelte');
		expect(country.code).toBe('TH');
		expect(here.place.name).toBe('Bangkok');
		expect(here.place.via).toBe('default');
	});
	it('(b) the old dems.place is migrated to dems.place.TH', async () => {
		const m = fakeStorage({ 'dems.place': JSON.stringify(CM) });
		const { here } = await load();
		expect(here.place.name).toBe('Chiang Mai');
		expect(m.has('dems.place')).toBe(false);
		expect(m.has('dems.place.TH')).toBe(true);
	});
	it('(c) switching country gives its default; switching back restores the saved place', async () => {
		const { here, setPlace, switchCountry, places } = await load();
		setPlace(CM);
		switchCountry('SE');
		expect(here.place.name).toBe('Stockholm');
		expect(here.place.via).toBe('default');
		expect(places()).toHaveLength(21);
		switchCountry('TH');
		expect(here.place.name).toBe('Chiang Mai');
		expect(here.place.via).toBe('province');
	});
});

describe('switchCountry', () => {
	it('choosing the current country keeps a GPS place', async () => {
		const { here, setPlace, switchCountry } = await load();
		const gps = { lat: 13.9, lon: 100.6, name: 'gps', via: 'gps' as const };
		setPlace(gps);
		switchCountry('TH');
		expect(here.place).toEqual(gps);
	});
});
