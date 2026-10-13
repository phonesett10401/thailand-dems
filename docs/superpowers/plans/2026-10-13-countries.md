# Countries (Thailand, Myanmar, Sweden + Burmese) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** DEMS works for Thailand, Myanmar and Sweden, with a country chooser and EN/ไทย/မြန်မာ in every country. Sweden's weather levels come from SMHI official warnings.

**Architecture:**
- A per-country config (`src/lib/countries/`) feeds the existing shared screens and level engine.
- A `country` store sits beside the existing `here` place store.
- The server filters citizen tables by a new `country` column.
- A new `/api/warnings/se` endpoint proxies and normalises SMHI warnings.
- Burmese is a third Paraglide locale.

**Tech Stack:** SvelteKit 2 / Svelte 5 runes, TypeScript, Tailwind 4, Paraglide 2, Supabase Postgres (postgres.js), Vitest, Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-10-13-countries-design.md`

## Global Constraints

### Project rules
- Commits carry **no** Co-Authored-By or other attribution lines. Never push. Never read or print any `.env` file.
- `npm install` in `web/` on Windows prunes the `@emnapi/*` entries from `web/package-lock.json`. Run it only in Task 6, and only as described there.

### Countries
| Code | Default place | SOS | Main numbers |
|---|---|---|---|
| `TH` | Bangkok 13.7563, 100.5018 | `1784` | as today |
| `MM` | Yangon 16.8409, 96.1735 | `199` | 199 police, 192 ambulance, 191 fire |
| `SE` | Stockholm 59.3293, 18.0686 | `112` | 112, 1177 health advice, 114 14 police non-emergency, 113 13 information in a major incident |

- **Country is chosen independently of language.** Locales are `en`, `th` and `my`, and all three work in every country.
- Defaults: country `TH` on first visit; the country is stored in localStorage under `dems.country`.

### Levels
- **TH and MM** use DEMS weather rules: heat feels-like ≥41 / ≥54, rain ≥35 / ≥90 mm, river rising → Watch.
- **SE** uses SMHI warnings only for weather:
  - `YELLOW` → watch
  - `ORANGE` / `RED` → warning
  - any other code (e.g. `MESSAGE`) is ignored
  - Warnings are matched to the user's county by **SMHI area id**.
  - In SE, DEMS heat/rain/river rules create **no** hazards.
- **PM2.5** is >37.5 Watch / >75 Warning everywhere.
  - Source label: TH "Thai PCD", MM/SE "WHO interim target".
- **Earthquake and GDACS rules** are unchanged in every country.
- **Unknown, never Safe, when every feed for that country fails.** Data is stale after 3 h.

### Shelters
- TH: `sample` (with the new note)
- MM: `in-development`
- SE: `link` to MSB's shelter map, `https://www.msb.se/sv/amnesomraden/skydd-mot-olyckor-och-farliga-amnen/befolkningsskydd/skyddsrum/`. The Task 5 implementer verifies the URL resolves; if it moved, use MSB's current skyddsrum page.

### UI rules
- Tap targets are ≥44 px. Contrast meets WCAG AA. Keep the dark-glass style.
- Switch layout with CSS, never `MediaQuery` `{#if}`.
- Every UI string goes through Paraglide `m.*` in EN/TH/MY.
- New TH strings are listed in `messages/TH_REVIEW.md`; all MY strings in `messages/MY_REVIEW.md`.

### Burmese
- Unicode only.
- Noto Sans Myanmar (Fontsource), with taller line-height under `:lang(my)`.
- **The merge is blocked until the owner signs off `MY_REVIEW.md`.**

## Review Focus
1. **A place chosen in one country leaks into another.**
   - Scenario: switch from TH (with Chiang Mai picked) to SE.
   - Expected: the place becomes Stockholm (default), not Chiang Mai. Switching back to TH restores Chiang Mai.
   - Pinned in Task 1 (unit) and Task 5 (e2e).
2. **SMHI down in Sweden.**
   - Expected: the level must not say Safe purely because SMHI failed while air/quakes are fine. Show "SMHI unavailable" (partial-feed line); the level comes from the remaining feeds.
   - If *all* SE feeds fail → Unknown.
   - Pinned in Task 3.
3. **GPS in a border area (Mae Sot vs Myawaddy) or outside all three countries.**
   - Detection uses the nearest known place within 300 km. Outside → no banner.
   - The banner never switches by itself. "Not now" is remembered for the session.
   - Pinned in Task 1 (unit) and Task 5 (e2e).
4. **Burmese clipping.** Stacked glyphs must not be cut off in pills/chips/badges at 375 px. Pinned in Task 6 (axe + a visual still check per screen).
5. **Old visitors keep working.** No `dems.country` key → TH. Existing `dems.place` (TH province) is migrated to `dems.place.TH`. Pinned in Task 1.

---

## File map

**Create**
- `web/src/lib/countries/index.ts`, `th.ts`, `mm.ts`, `se.ts`, `countries.test.ts`
- `web/src/lib/country.svelte.ts`
- `web/supabase/migrations/0004_countries.sql`
- `web/src/routes/api/warnings/se/+server.ts`
- `web/src/lib/sources/smhi.ts`, `smhi.test.ts`, `fixtures/smhi-warnings.json`
- `web/src/lib/components/CountryBanner.svelte`, `CountryPicker.svelte`
- `web/messages/my.json`, `web/messages/MY_REVIEW.md`
- `web/tests/e2e/countries.spec.ts`

**Modify**
- `location.svelte.ts`, `levels.ts`, `levels.test.ts`, `hazards.svelte.ts`, `api.ts`, `labels.ts`, `prepare/guides.ts` (+ test)
- `server/queries.ts`, `api/{shelters,disasters,alerts}/+server.ts`
- Components: `TopBar`, `PlacePicker`, `LangToggle`
- Routes: `more`, `shelters`, `map`, `about`, `demo`, `prepare`
- `app.css`, `project.inlang/settings.json`, `format.ts`, `messages/{en,th}.json`, `TH_REVIEW.md`
- `tests/e2e/fixtures.ts`, `a11y.spec.ts`
- Root `README.md`

---

### Task 1: Country registry and country store

**Files:**
- Create: `web/src/lib/countries/index.ts`, `th.ts`, `mm.ts`, `se.ts`, `web/src/lib/countries/countries.test.ts`, `web/src/lib/country.svelte.ts`
- Modify: `web/src/lib/location.svelte.ts`

**Interfaces:**
- Produces:
  - `CountryCode`, `Country`, `COUNTRIES: Record<CountryCode, Country>`
  - `detectCountry(pt: Pt): CountryCode | null`
  - `country` (`$state<{ code: CountryCode }>`), `setCountry(code)`, `currentCountry(): Country`
  - `location.svelte.ts` keeps `here`, `setPlace`, `useGps`. `PROVINCES` is **replaced** by `places()`, which returns the current country's places.

- [ ] **Step 1: Write the failing tests.** `web/src/lib/countries/countries.test.ts`:

```ts
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
```

Run `cd web && npx vitest run src/lib/countries`. Expected: FAIL (module not found).

- [ ] **Step 2: `web/src/lib/countries/index.ts`**

```ts
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
```

- [ ] **Step 3: Country files**

`web/src/lib/countries/th.ts`:

```ts
import provinces from '$lib/sample/provinces.json';
import type { Country } from './index';

export const th: Country = {
	code: 'TH',
	flag: '🇹🇭',
	view: { lat: 13.7563, lon: 100.5018, zoom: 6 },
	defaultPlace: { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
	places: (provinces as { Province: string; Latitude: string; Longitude: string }[]).map((p) => ({
		name: p.Province,
		lat: Number(p.Latitude),
		lon: Number(p.Longitude)
	})),
	sos: '1784',
	numbers: [
		{ tel: '1784', key: '1784' },
		{ tel: '1669', key: '1669' },
		{ tel: '191', key: '191' },
		{ tel: '199', key: '199' },
		{ tel: '1155', key: '1155' },
		{ tel: '1182', key: '1182' }
	],
	air: 'thai-pcd',
	weather: 'dems',
	shelters: 'sample'
};
```

**Ruling for the implementer:** check what `NUMBERS` in `src/lib/prepare/guides.ts` currently contains. Task 4 moves those labels into messages as `num_th_<tel>`; here, keep the `key` exactly equal to the tel.

`web/src/lib/countries/mm.ts`: 15 places, each using its capital's coordinates:

```ts
import type { Country } from './index';

export const mm: Country = {
	code: 'MM',
	flag: '🇲🇲',
	view: { lat: 19.75, lon: 96.1, zoom: 5 },
	defaultPlace: { name: 'Yangon', lat: 16.8409, lon: 96.1735 },
	places: [
		{ name: 'Ayeyarwady Region', lat: 16.7792, lon: 94.7325 },
		{ name: 'Bago Region', lat: 17.3352, lon: 96.4813 },
		{ name: 'Chin State', lat: 22.6436, lon: 93.6053 },
		{ name: 'Kachin State', lat: 25.3833, lon: 97.3964 },
		{ name: 'Kayah State', lat: 19.674, lon: 97.2093 },
		{ name: 'Kayin State', lat: 16.8892, lon: 97.6339 },
		{ name: 'Magway Region', lat: 20.1497, lon: 94.9325 },
		{ name: 'Mandalay Region', lat: 21.9588, lon: 96.0891 },
		{ name: 'Mon State', lat: 16.4905, lon: 97.6283 },
		{ name: 'Naypyidaw Union Territory', lat: 19.7633, lon: 96.0785 },
		{ name: 'Rakhine State', lat: 20.1462, lon: 92.8983 },
		{ name: 'Sagaing Region', lat: 22.1083, lon: 95.1358 },
		{ name: 'Shan State', lat: 20.7892, lon: 97.0378 },
		{ name: 'Tanintharyi Region', lat: 14.0833, lon: 98.1944 },
		{ name: 'Yangon Region', lat: 16.8409, lon: 96.1735 }
	],
	sos: '199',
	numbers: [
		{ tel: '199', key: 'mm_199' },
		{ tel: '192', key: 'mm_192' },
		{ tel: '191', key: 'mm_191' }
	],
	air: 'who-it',
	weather: 'dems',
	shelters: 'in-development'
};
```

`web/src/lib/countries/se.ts`: the 21 län, using each residence city. `smhiId` is the SMHI warnings area id, from `…/ibww/api/version/1/metadata/area.json`, code `SWE_COUNTIES`:

```ts
import type { Country } from './index';

export const MSB_SHELTERS = 'https://www.msb.se/sv/amnesomraden/skydd-mot-olyckor-och-farliga-amnen/befolkningsskydd/skyddsrum/';

export const se: Country = {
	code: 'SE',
	flag: '🇸🇪',
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
	air: 'who-it',
	weather: 'smhi',
	shelters: 'link',
	shelterLink: MSB_SHELTERS
};
```

- [ ] **Step 4: Country store.** `web/src/lib/country.svelte.ts`:

```ts
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
```

- [ ] **Step 5: Places per country** (`location.svelte.ts`). The current `PROVINCES`, `saved()` and the `BANGKOK` default become per-country:
  - The saved place key is `dems.place.<code>`.
  - On first load, if the old key `dems.place` exists and `dems.place.TH` does not, copy it to `dems.place.TH` and remove `dems.place`.
  - Export `places()`, which returns `currentCountry().places`.
  - Export `switchCountry(code)`, which calls `setCountry(code)` and then sets `here.place` to that country's saved place, or `{ ...defaultPlace, via: 'default' }`.
  - `setPlace` saves under the current country's key.
  - Update every importer of `PROVINCES` (`TopBar.svelte`, `PlacePicker.svelte`, and anything else that greps) to call `places()`.

  Add tests in a new `web/src/lib/location.test.ts`. Mock localStorage with a simple in-memory object on `globalThis` before importing:
  - **(a)** No keys → country TH, place Bangkok (default).
  - **(b)** The old `dems.place` = Chiang Mai is migrated to `dems.place.TH` and used.
  - **(c)** With Chiang Mai picked in TH:
    1. `switchCountry('SE')` gives place Stockholm, via `default`.
    2. `switchCountry('TH')` gives Chiang Mai again.

  `.svelte.ts` modules work in Vitest here already (`hazards.svelte.ts` is imported in tests). Check `vite.config.ts`'s test config; if runes fail in the test environment, test the pure helpers (key migration, place-for-country) as plain functions exported from a `location-store.ts` and keep the `$state` wrapper thin. Ledger which way you went.

- [ ] **Step 6: Run the tests.** Run `npx vitest run src/lib/countries src/lib/location.test.ts`, then `npm run check` and `npm test`. Expected: all PASS, 0 check errors.

- [ ] **Step 7: Commit.** `git add web/src/lib && git commit -m "web: country registry (TH, MM, SE), country store, places per country"`

---

### Task 2: Server and data: a country column, filtered APIs

**Files:**
- Create: `web/supabase/migrations/0004_countries.sql`
- Modify:
  - `web/src/lib/server/queries.ts`
  - `web/src/routes/api/shelters/+server.ts`, `disasters/+server.ts`, `alerts/+server.ts`
  - `web/src/lib/api.ts`, `web/src/lib/api.test.ts`
  - `web/scripts/db/smoke-supabase.js`

**Interfaces:**
- Consumes: `country.code` (Task 1).
- Produces:
  - `api.shelters()`, `api.disasters()` and `api.alerts()` send `?country=<code>` from the current country store.
  - The sample fallback is filtered to `TH` (sample rows are all Thai).
  - `listShelters(sql, country)`, `listDisasters(sql, country)`, `listAlerts(sql, country)`.

- [ ] **Step 1: Migration** `0004_countries.sql`:

```sql
-- Countries: every citizen-facing row belongs to one country. Existing rows are Thai.
alter table public.shelters  add column if not exists country text not null default 'TH' check (country in ('TH','MM','SE'));
alter table public.disasters add column if not exists country text not null default 'TH' check (country in ('TH','MM','SE'));
alter table public.alerts    add column if not exists country text not null default 'TH' check (country in ('TH','MM','SE'));
create index if not exists shelters_country_idx  on public.shelters (country);
create index if not exists disasters_country_idx on public.disasters (country);
create index if not exists alerts_country_idx    on public.alerts (country);
```

Check `0001_init.sql` for existing RLS policies or views on these tables. Adding a column with a default does not break `select *` policies; note it in the report.

**Do not apply it to the live database.** The owner runs `npm run db:apply` after merge; the README "Deploy" section already says so. Mention this in the PR description.

- [ ] **Step 2: Write the failing tests** in `web/src/lib/api.test.ts`. Follow the existing pattern there, which injects `fetchFn`:
  - Assert the request URL ends with `/shelters?country=SE` when the country passed is SE.
  - Assert that on failure with country `MM`, the fallback is an **empty list** (sample data is Thai-only), and with `TH` it is the sample list.

  Do this by changing the signature to `createApi(base, onOffline, fetchFn, getCountry: () => CountryCode = () => 'TH')`, so tests don't need the store. In `src/lib/config.ts`, pass `() => country.code`.

  Run: FAIL.

- [ ] **Step 3: Implement.**
  - **`api.ts`:**
    ```ts
    const q = () => `?country=${getCountry()}`;
    const thOnly = <T>(rows: T) => (getCountry() === 'TH' ? rows : ([] as T));
    // shelters: () => get<Shelter[]>('/shelters' + q(), thOnly(sampleShelters as Shelter[])), …
    ```
    Do the same for disasters and alerts. Evacuation routes stay TH-only sample. Leave them unfiltered: they are only used on the TH Shelters screen.
  - **`queries.ts`:** add `country: string` to the three list functions, with `where s.country = ${country}` (and `where a.country = ${country}` / `d.country`).
  - **Route handlers:**
    ```ts
    const C = ['TH', 'MM', 'SE'];
    export const GET = async ({ url }) => {
    	const c = url.searchParams.get('country') ?? 'TH';
    	if (!C.includes(c)) error(400, 'Unknown country');
    	return json(await withDb((s) => listShelters(s, c)));
    };
    ```
    Import `error` from `@sveltejs/kit`.
  - **`smoke-supabase.js`:** add a check that `public.shelters` has a `country` column with default `'TH'`. Follow its existing pass/fail line style.

- [ ] **Step 4: Run.** Run `npm test`, `npm run check` and `npx playwright test` (the e2e fixtures mock `/api/*` by path; make sure `?country=TH` still matches. If the fixture matches the exact path, update it to ignore the query). Expected: all PASS.

- [ ] **Step 5: Commit.** `git add web && git commit -m "web: country column on shelters/disasters/alerts; APIs filter by ?country"`

---

### Task 3: SMHI warnings and country-aware levels

**Files:**
- Create:
  - `web/src/lib/sources/smhi.ts`, `web/src/lib/sources/smhi.test.ts`
  - `web/src/lib/sources/fixtures/smhi-warnings.json`
  - `web/src/routes/api/warnings/se/+server.ts`
- Modify: `web/src/lib/levels.ts`, `web/src/lib/levels.test.ts`, `web/src/lib/hazards.svelte.ts`, `web/src/lib/labels.ts`, `web/src/routes/map/+page.svelte`

**Interfaces:**
- Consumes: `Country` (Task 1); the `place.smhiId` of SE places.
- Produces:
  - `type SmhiWarning = { areaId: number; level: 'watch' | 'warning'; event: string; code: string; start: string; end: string | null }`
  - `normaliseSmhi(raw: unknown): SmhiWarning[]`
  - `getSmhi(fetchFn?): Promise<SmhiWarning[]>`, which calls `/api/warnings/se`
  - `HazardType` gains `'official'`
  - `Feeds` gains `smhi?: SmhiWarning[]`; `FeedKey` gains `'smhi'`
  - `collect(f, at, now, near, c: Country, smhiArea?: number)` and `assess(f, at, now, c, smhiArea?)`. **This is a signature change.** Update every caller: `hazards.svelte.ts`, `map/+page.svelte`, and the tests.

- [ ] **Step 1: The fixture.** Save a trimmed copy of the live feed plus synthetic cases as `fixtures/smhi-warnings.json`. Write it by hand in exactly this shape (from the real API):

```json
[
	{ "id": 1, "event": { "en": "Wind", "code": "WIND" }, "warningAreas": [
		{ "approximateStart": "2026-10-13T06:00:00.000Z", "approximateEnd": "2026-10-13T20:00:00.000Z",
		  "warningLevel": { "code": "ORANGE" }, "affectedAreas": [{ "id": 1, "en": "Stockholm County" }] } ] },
	{ "id": 2, "event": { "en": "Snow", "code": "SNOW" }, "warningAreas": [
		{ "approximateStart": "2026-10-13T06:00:00.000Z", "approximateEnd": null,
		  "warningLevel": { "code": "YELLOW" }, "affectedAreas": [{ "id": 25, "en": "Norrbotten County" }, { "id": 24, "en": "Västerbotten County" }] } ] },
	{ "id": 3, "event": { "en": "Risk for water shortage", "code": "WATER_SHORTAGE" }, "warningAreas": [
		{ "approximateStart": "2026-04-20T22:00:00.000Z", "approximateEnd": null,
		  "warningLevel": { "code": "MESSAGE" }, "affectedAreas": [{ "id": 1, "en": "Stockholm County" }] } ] },
	{ "id": 4, "event": { "en": "Rain", "code": "RAIN" }, "warningAreas": [
		{ "approximateStart": "2026-10-13T06:00:00.000Z", "approximateEnd": null,
		  "warningLevel": { "code": "RED" }, "affectedAreas": [{ "id": 14, "en": "Västra Götaland County" }] } ] }
]
```

- [ ] **Step 2: Write the failing tests.** `smhi.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import raw from './fixtures/smhi-warnings.json';
import { normaliseSmhi } from './smhi';

describe('normaliseSmhi', () => {
	const w = normaliseSmhi(raw);
	it('maps Yellow → watch and Orange/Red → warning, one row per affected area', () => {
		expect(w.filter((x) => x.areaId === 1)).toEqual([expect.objectContaining({ level: 'warning', event: 'Wind', code: 'WIND' })]);
		expect(w.filter((x) => x.code === 'SNOW').map((x) => x.areaId).sort()).toEqual([24, 25]);
		expect(w.find((x) => x.code === 'RAIN')?.level).toBe('warning');
	});
	it('ignores MESSAGE and any unknown level', () => expect(w.some((x) => x.code === 'WATER_SHORTAGE')).toBe(false));
	it('survives junk', () => {
		expect(normaliseSmhi(null)).toEqual([]);
		expect(normaliseSmhi([{ nope: 1 }])).toEqual([]);
	});
});
```

In `levels.test.ts`, add a `describe('countries')` block. Use the existing fixtures and helpers in that file for `Feeds`; read it first and build on its feed builder.
  1. **TH with heat/rain over threshold** → those hazards are present (as today). Keep the existing tests: update them to pass `COUNTRIES.TH`.
  2. **SE with the same heat and rain values** → no heat or rain hazards. With `smhi` containing an ORANGE for area 1 and `smhiArea = 1`, there is an `official` hazard, level `warning`, `name: 'Wind'`, `source: 'SMHI'`, `km/lat/lon: null`. The overall level is `warning`.
  3. **SE with SMHI warnings only for other areas** → no official hazard.
  4. **SE with `smhi: undefined`** (failed) and air fine → `failed` includes `'smhi'` and the level is computed from the remaining feeds, not `unknown`.
  5. **SE with every SE feed failed** (air, gdacs, quakes, smhi) → `unknown`.
  6. **MM** → PM2.5 41.2 gives Watch. The hazard's source string is `'Open-Meteo (WHO interim target)'`; TH keeps `'Open-Meteo'`. If the source string is shown to users, the label key below handles the wording.

Run: FAIL.

- [ ] **Step 3: Implement `smhi.ts`.**

```ts
import type { FetchFn } from './http';

export type SmhiWarning = { areaId: number; level: 'watch' | 'warning'; event: string; code: string; start: string; end: string | null };
const LEVEL: Record<string, SmhiWarning['level']> = { YELLOW: 'watch', ORANGE: 'warning', RED: 'warning' };

export function normaliseSmhi(raw: unknown): SmhiWarning[] {
	if (!Array.isArray(raw)) return [];
	const out: SmhiWarning[] = [];
	for (const w of raw) {
		const event = w?.event?.en, code = w?.event?.code;
		if (typeof event !== 'string' || typeof code !== 'string' || !Array.isArray(w.warningAreas)) continue;
		for (const a of w.warningAreas) {
			const level = LEVEL[a?.warningLevel?.code];
			if (!level || !Array.isArray(a.affectedAreas)) continue;
			for (const area of a.affectedAreas)
				if (Number.isInteger(area?.id)) out.push({ areaId: area.id, level, event, code, start: a.approximateStart ?? '', end: a.approximateEnd ?? null });
		}
	}
	return out;
}

/** Browser side: our own cached proxy, never SMHI directly. */
export async function getSmhi(fetchFn: FetchFn = (u, i) => fetch(u, i)): Promise<SmhiWarning[]> {
	const res = await fetchFn('/api/warnings/se', { signal: AbortSignal.timeout(6000) });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return (await res.json()) as SmhiWarning[];
}
```

Check `./http`'s `FetchFn` type and match the existing source files' style (see `sources/usgs.ts`).

- [ ] **Step 4: The proxy endpoint.** `web/src/routes/api/warnings/se/+server.ts`:

```ts
import { error, json } from '@sveltejs/kit';
import { normaliseSmhi, type SmhiWarning } from '$lib/sources/smhi';

const URL = 'https://opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json';
const TTL = 5 * 60_000;
let cache: { at: number; data: SmhiWarning[] } | null = null; // ponytail: per-instance cache; fine for SMHI's update rate

export const GET = async ({ fetch }) => {
	if (!cache || Date.now() - cache.at > TTL) {
		try {
			const r = await fetch(URL, { signal: AbortSignal.timeout(8000) });
			if (!r.ok) throw new Error(String(r.status));
			cache = { at: Date.now(), data: normaliseSmhi(await r.json()) };
		} catch {
			if (!cache) error(503, 'SMHI unavailable');
		}
	}
	return json(cache!.data, { headers: { 'cache-control': 'public, s-maxage=300' } });
};
```

**On failure with a stale cache:** serve the stale data. Five minutes of staleness is fine; the 3 h stale rule still protects the user.

- [ ] **Step 5: Country-aware `levels.ts`.**
  - **Types:**
    - add `'official'` to `HazardType`
    - add `'smhi'` to `FeedKey`
    - add `smhi?: SmhiWarning[]` to `Feeds`
  - **`collect(f, at, now, near, c: Country, smhiArea?: number)`:**
    - The air hazard's `source` becomes `c.air === 'thai-pcd' ? 'Open-Meteo' : 'Open-Meteo (WHO interim target)'`.
    - Wrap the heat, rain and river blocks in `if (c.weather === 'dems') { … }`.
    - After the river block:
      ```ts
      if (c.weather === 'smhi' && smhiArea !== undefined)
      	for (const w of f.smhi ?? [])
      		if (w.areaId === smhiArea)
      			out.push(live({ ...here, id: `smhi-${w.code}-${w.areaId}`, type: 'official', level: w.level, name: w.event, value: null, time: w.start, source: 'SMHI', url: 'https://www.smhi.se/vader/varningar-och-brandrisk' }));
      ```
    - Ids must be unique per event and area. If two warnings share a code and area, append the index.
  - **`assess(f, at, now, c, smhiArea?)`:** the feed list depends on the country:
    ```ts
    const feedsFor = (c: Country): FeedKey[] => (c.weather === 'smhi' ? ['air', 'gdacs', 'quakes', 'smhi'] : ['air', 'forecast', 'river', 'gdacs', 'quakes']);
    ```
    `failed` and the all-failed → `unknown` rule use `feedsFor(c)`.

- [ ] **Step 6: Wire up the store and callers.**
  - **`hazards.svelte.ts`:**
    - Add `settle(country.code === 'SE' ? getSmhi() : Promise.resolve(undefined))` to the `Promise.all`.
    - Store the result as `smhi` in `feeds`. For non-SE countries leave `smhi` undefined; it is not counted there.
    - Find `smhiArea`: if `here.place` has `smhiId` use it, otherwise use the `smhiId` of the nearest SE place (for GPS). Add a small exported helper `smhiAreaFor(pt): number` in `countries/se.ts`, with a unit test: Gothenburg → 14.
    - Pass `currentCountry()` and `smhiArea` to `assess`.
    - `refresh()` must also re-run when `country.code` changes. Check how Shell triggers `refresh` today (an `$effect` on `here.place`) and add `country.code` to it.
  - **`map/+page.svelte`:** `collect(live.feeds, here.place, Date.now(), false, currentCountry(), smhiArea)`. Official hazards have no coordinates, so the existing `lat !== null` filter keeps them off the map, as intended.
  - **`labels.ts`:**
    - `HAZ_NAME.official = m.haz_official`
    - `HAZ_CODE.official = 'OF'`
    - `feedName('smhi') = m.feed_smhi`
  - **Messages (EN / TH):**
    - `haz_official`: "Official warning" / "คำเตือนทางการ"
    - `feed_smhi`: "SMHI warnings" / "คำเตือนของ SMHI"
    - `official_badge`: "Official: SMHI" / "ทางการ: SMHI"

    Add them to `TH_REVIEW.md`. MY is added in Task 6. **Until then, the message parity test only covers en/th, which is fine.**

- [ ] **Step 7: Run.** Run `npm test`, `npm run check` and `npx playwright test`. The existing e2e should be unchanged, because TH is the default. Expected: all PASS.

- [ ] **Step 8: Commit.** `git add web && git commit -m "web: SMHI warnings (cached proxy) decide Sweden's weather levels; country-aware level engine"`

---

### Task 4: Prepare: cold and snow guides, the cold kit, numbers per country

**Files:**
- Modify: `web/src/lib/prepare/guides.ts`, `web/src/lib/prepare/guides.test.ts`, `web/src/routes/prepare/+page.svelte`, `web/src/routes/prepare/[hazard]/+page.svelte` (if it lists numbers), `web/messages/en.json`, `web/messages/th.json`, `TH_REVIEW.md`

**Interfaces:**
- Consumes: `Country.numbers` (Task 1); `HazardType 'official'` (Task 3).
- Produces:
  - `GUIDES` gains `'cold'` and `'snow'`
  - `KITS` gains `'cold'`
  - `guideForSmhi(code: string): GuideId | null`
  - `NUMBERS` is removed; screens use `currentCountry().numbers` with labels `m['num_' + key]`

- [ ] **Step 1: Write the failing tests.** In `guides.test.ts`:
  - `GUIDES` includes `cold` and `snow`. Each new guide has non-empty `before`, `during` and `after` in en and th.
  - `bagFor('cold')` starts with `BASICS` and contains `warmlayers`, `hatgloves`, `powerbank`, `handwarmers` and `thermos`, with no duplicate ids.
  - `guideForSmhi`:
    - `'WIND'` → `'storm'`
    - `'SNOW'` → `'snow'`
    - `'RAIN'` → `'flood'`
    - `'HIGH_TEMPERATURES'` → `'heat'`
    - `'WATER_SHORTAGE'` → `null`
  - Life-critical cold steps exist, matched by these regexes on the English text:
    - `/hypotherm/i` with `/112/`
    - `/carbon monoxide|generator|indoors/i`

  Run: FAIL.

- [ ] **Step 2: Guides (EN and TH; MY comes in Task 6).** Follow the existing guide shape and tone exactly; read the `heat` and `storm` guides first. Content:

**cold, "Extreme cold"**
- **Before:**
  - Dress in layers, with a hat, gloves and windproof outer layer
  - Keep a phone power bank charged
  - Check on elderly neighbours
  - Keep some food and water at home in case of power cuts
- **During:**
  - Limit time outside; cover skin, because frostbite can start in minutes in strong wind
  - Watch for hypothermia (shivering, confusion, slurred speech): get the person warm and dry and call 112
  - Never use a grill, camping stove or generator indoors (carbon monoxide)
  - Keep moving if you must be outside
- **After:**
  - Warm frostbitten skin slowly with lukewarm water, not hot, and don't rub it
  - Check pipes and heating
  - Follow SMHI and local announcements

**snow, "Heavy snow"**
- **Before:**
  - Keep a shovel, warm clothes and food at home
  - In a car, carry a blanket, water, a torch and a charged phone
  - Plan to stay home if SMHI warns
- **During:**
  - Avoid unnecessary travel
  - If stuck in a car, stay in it, keep the exhaust pipe clear of snow and run the engine only briefly for heat
  - Watch for snow sliding from roofs
- **After:**
  - Clear snow carefully and take breaks (heart strain)
  - Check on neighbours
  - Keep roofs and vents clear

**Kit `cold`:**
- `warmlayers`: "Warm layers and a windproof jacket"
- `hatgloves`: "Hat, gloves and scarf"
- `powerbank`: "Charged power bank"
- `handwarmers`: "Hand warmers"
- `thermos`: "Thermos for a hot drink"

Write the Thai for each in the existing go-bag Thai style. `KIT_FOR` maps no hazard type to `cold` (SMHI official warnings choose it on the Prepare screen only through the chip). Keep it simple: the cold chip shows only when `country.code === 'SE'`.

`guideForSmhi`:
```ts
export const guideForSmhi = (code: string): GuideId | null =>
	/WIND|STORM/.test(code) ? 'storm' : /SNOW/.test(code) ? 'snow' : /RAIN|FLOOD|FLOW/.test(code) ? 'flood' : /HIGH_TEMP/.test(code) ? 'heat' : /LOW_TEMP|COLD/.test(code) ? 'cold' : null;
```

Check the real SMHI event codes: open `https://opendata-download-warnings.smhi.se/ibww/api/version/1/metadata/event.json` (the `events` link in `metadata.json`). Adjust the patterns to the real codes, add them to the test, and ledger the list.

- [ ] **Step 3: Numbers per country.**
  - Move the current `NUMBERS` labels into messages:
    - `num_1784`
    - `num_1669`
    - `num_191`
    - `num_199`
    - `num_1155`
    - `num_1182`

    Some may already exist; check `num_1784` in `en.json` and reuse them.
  - Add the new keys:

    | Key | EN | TH |
    |---|---|---|
    | `num_mm_199` | Police | ตำรวจ |
    | `num_mm_192` | Ambulance | รถพยาบาล |
    | `num_mm_191` | Fire | ดับเพลิง |
    | `num_se_112` | Emergency (police, ambulance, fire) | เหตุฉุกเฉิน (ตำรวจ รถพยาบาล ดับเพลิง) |
    | `num_se_1177` | Health advice | คำแนะนำด้านสุขภาพ |
    | `num_se_11414` | Police, non-emergency | ตำรวจ (ไม่เร่งด่วน) |
    | `num_se_11313` | Information in a major incident | ข้อมูลเมื่อเกิดเหตุร้ายแรง |

  - The Prepare page renders `currentCountry().numbers.map(n => ({ tel: n.tel, name: m['num_' + n.key]() }))`. Use a typed lookup map, not `m[...]` with a string, so svelte-check stays happy: build a `Record<string, () => string>` in `labels.ts`.
  - Remove `NUMBERS` from `guides.ts` and update the tests that used it. The Prepare e2e asserts "Call 1784, Disaster hotline", so keep that EN label identical.
  - Display numbers with spaces where natural ("114 14", "113 13"). Keep `tel:` without spaces.

- [ ] **Step 4: The official hazard's guide link.**
  - In `HazardSheet.svelte` (and the Now list, if it links guides), an `official` hazard links to `guideForSmhi(code)` when it is non-null.
  - The SMHI code isn't on `Hazard`. Use the id prefix `smhi-<CODE>-<area>` (Task 3) and parse it with a helper, `smhiCode(h)`.

- [ ] **Step 5: Run.** Run `npm test`, `npm run check` and `npx playwright test prepare`. Expected: PASS.

- [ ] **Step 6: Commit.** `git add web && git commit -m "web: cold and snow guides, cold go-bag kit, emergency numbers per country"`

---

### Task 5: Screens: country chooser, header, banner, shelters, map

**Files:**
- Create: `web/src/lib/components/CountryPicker.svelte`, `web/src/lib/components/CountryBanner.svelte`, `web/tests/e2e/countries.spec.ts`
- Modify:
  - Components: `TopBar.svelte`, `PlacePicker.svelte`, `Shell.svelte` (mount the banner)
  - Routes: `more/+page.svelte`, `shelters/+page.svelte`, `map/+page.svelte`, `+page.svelte` (Now, official badge), `HazardList.svelte` (badge)
  - `messages/en.json`, `th.json`, `TH_REVIEW.md`
  - `tests/e2e/fixtures.ts`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  - The SOS link uses `currentCountry().sos`, with `aria-label = m.sos_aria({ num })`.
  - The location default label is `m.location_default({ city })`.

- [ ] **Step 1: Write the failing e2e.** In `tests/e2e/countries.spec.ts`, using the fixtures from `./fixtures`:
  - **More → Country → Myanmar.**
    - The SOS link is `tel:199` with text `SOS · 199`.
    - The place picker lists "Mandalay Region".
    - The Shelters tab shows "In development" and no shelter cards.
  - **More → Country → Sweden.**
    - SOS is `tel:112`.
    - Shelters shows a link whose name contains "MSB" and whose href starts with `https://www.msb.se`.
    - With `/api/warnings/se` mocked to return `[{areaId:1,level:'warning',event:'Wind',code:'WIND',start:'2026-10-13T06:00:00Z',end:null}]` and Open-Meteo mocked as usual:
      - Now shows the Warning level
      - the hazard row contains "Wind"
      - the text "Official: SMHI" is visible
  - **Switching back to Thailand** restores SOS 1784 and the sample shelters.
  - **GPS in Sweden while the country is Thailand.**
    - Setup: `context.grantPermissions(['geolocation'])` and `context.setGeolocation({ latitude: 59.33, longitude: 18.07 })`, then trigger "Use my location" in the place picker.
    - A banner "You're in Sweden" with **Switch** and **Not now** appears.
    - The country is still Thailand (SOS 1784) until **Switch** is clicked.
    - After **Not now**, the banner is gone and stays gone after navigating to Map.
  - **Persistence:** after choosing Sweden and reloading, the country is still Sweden.

  **Fixtures:** add mocks for `/api/warnings/se`, plus an empty-list default. Add `?country=` handling to the `/api/*` mocks: MM/SE return `[]`.

  Run: FAIL.

- [ ] **Step 2: Implement.**
  - **`CountryPicker.svelte`:**
    - A `role="radiogroup"` with `aria-label={m.country_label()}`.
    - Three `role="radio"` buttons (flag plus name), each `min-h-11`, with `aria-checked`.
    - Selecting one calls `switchCountry(code)` (Task 1).
    - It goes on More as a new row under Language.
  - **`TopBar.svelte`:**
    - The place label is prefixed by `currentCountry().flag`.
    - SOS uses `href="tel:{sos}"` with text `SOS · {sos}`.
    - The search box suggestions use `places()`.
  - **`PlacePicker.svelte`:**
    - It lists `places()`.
    - "Use my location": after `useGps()` succeeds, it calls `detectCountry(here.place)`. If the result is a different supported country and is not dismissed this session (a `sessionStorage` key `dems.banner.dismissed.<code>`), it sets a shared `$state` `suggested = code`.
    - Put `suggested` in `country.svelte.ts`, exported with `dismissSuggestion()`.
  - **`CountryBanner.svelte`:**
    - Mounted in `Shell` under the top bar.
    - It renders when `suggested` is set: `m.country_banner({ country: name })` with buttons **Switch** (`switchCountry(suggested)`, then keep the GPS place) and **Not now** (`dismissSuggestion()`).
    - Both buttons are `min-h-11`. It is glass style with `role="status"`.
    - **On Switch, keep the GPS position as the place,** not the new country's default: the user is physically there.
  - **Shelters page:**
    - `sample` → as today, plus the note `m.shelters_th_note()` at the top.
    - `in-development` → a glass card with `m.shelters_dev_title()` and `m.shelters_dev_body()`, with no list, map or routes.
    - `link` → a glass card with `m.shelters_se_title()`, `m.shelters_se_body()` and a button `m.shelters_se_cta()` linking to `shelterLink` (`target="_blank"`, `rel="noopener"`).
    - Switch with `{#if currentCountry().shelters === …}`. That is a data branch, not a layout MediaQuery, so it is fine.
  - **Map:** `MapView`'s `center` and `zoom` come from `currentCountry().view` when `here.place.via === 'default'`; otherwise use the place as today.
  - **Now and HazardList:** for `h.type === 'official'`:
    - the row title is `h.name` (SMHI's event)
    - a small badge `m.official_badge()` in the level colour, `label` style
    - the "Sample" tag logic is unchanged
  - **`location_default`:** today "Bangkok (default)". It becomes `"{city} (default)"`, passing `defaultPlace.name`.
  - **`sos_aria`:** today "Call 1784, Thailand's disaster hotline". It becomes `"Call {num}, emergency number"`. Check that any e2e asserting the old text is updated.

- [ ] **Step 3: Messages (EN / TH).** Add these to `TH_REVIEW.md`:

| key | en | th |
|---|---|---|
| country_label | Country | ประเทศ |
| country_TH | Thailand | ไทย |
| country_MM | Myanmar | เมียนมา |
| country_SE | Sweden | สวีเดน |
| country_banner | You're in {country}. Switch? | คุณอยู่ที่{country} เปลี่ยนประเทศไหม |
| country_switch | Switch | เปลี่ยน |
| country_not_now | Not now | ไม่ใช่ตอนนี้ |
| shelters_th_note | Example shelters: Thailand has no public shelter list. In a real emergency, follow DDPM and local announcements. | ตัวอย่างที่พักพิงเท่านั้น ประเทศไทยยังไม่มีรายชื่อที่พักพิงสาธารณะ เมื่อเกิดเหตุจริง ให้ติดตามประกาศของ ปภ. และหน่วยงานท้องถิ่น |
| shelters_dev_title | Shelters: in development | ที่พักพิง: อยู่ระหว่างพัฒนา |
| shelters_dev_body | Myanmar has no public shelter list we can use yet. In an emergency, follow official and local announcements. | ยังไม่มีรายชื่อที่พักพิงสาธารณะของเมียนมาที่ใช้ได้ เมื่อเกิดเหตุ ให้ติดตามประกาศทางการและท้องถิ่น |
| shelters_se_title | Civil-defence shelters (skyddsrum) | หลุมหลบภัยฝ่ายพลเรือน (skyddsrum) |
| shelters_se_body | Sweden has about 64,000 civil-defence shelters for war and air raids. For storms or floods, follow SMHI and your municipality. MSB keeps the official map. | สวีเดนมีหลุมหลบภัยฝ่ายพลเรือนราว 64,000 แห่งสำหรับภาวะสงครามและการโจมตีทางอากาศ หากเกิดพายุหรือน้ำท่วม ให้ติดตาม SMHI และเทศบาลของคุณ แผนที่ทางการดูแลโดย MSB |
| shelters_se_cta | Open MSB's shelter map | เปิดแผนที่หลุมหลบภัยของ MSB |

Also update `location_default` and `sos_aria` in both languages as described in Step 2.

- [ ] **Step 4: Run.** Run `npm run check`, `npm test` and the full `npx playwright test`. Expected: all PASS.

- [ ] **Step 5: Visual check.** On the dev server (`.claude/launch.json` "web"), at 375 px, view More, Now (SE with a mocked warning if feasible, otherwise TH), Shelters for each country, and Map. Nothing clips, and the banner does not cover the SOS button.

- [ ] **Step 6: Commit.** `git add web && git commit -m "web: country chooser, per-country SOS/places/shelters/map, GPS switch banner, SMHI badge"`

---

### Task 6: Burmese (မြန်မာ)

**Files:**
- Create: `web/messages/my.json`, `web/messages/MY_REVIEW.md`
- Modify:
  - Config and helpers: `web/project.inlang/settings.json`, `web/src/lib/format.ts` (+ test)
  - Components: `LangToggle.svelte`
  - Content and styles: `prepare/guides.ts` (+ test), `app.css`, `package.json`, `package-lock.json`
  - Tests: `messages.test.ts`, `tests/e2e/a11y.spec.ts`, plus a new e2e test in `countries.spec.ts`

**Interfaces:**
- Consumes: every message key from Tasks 1–5.
- Produces:
  - locale `my`
  - `Text` becomes `{ en: string; th: string; my: string }`
  - `t(en, th, my)`

- [ ] **Step 1: Write the failing tests.**
  - **`messages.test.ts`:** extend key parity to `my.json`, so every key in `en.json` is present and non-empty in `my.json`. Also, every `my` value contains at least one Myanmar-script character (`/[က-႟]/`), except values that are only numbers, symbols, names or brands (ASCII-only in `en` too, e.g. "SMHI", "SOS · {num}"). Allow-list those by checking that `en === my` is acceptable only when `en` has no letters other than proper nouns. **Ruling:** allow identical values only if the en value has no `[a-z]{4,}` lowercase word.
  - **`guides.test.ts`:** every `Text` has a non-empty `my` field.
  - **`format.test.ts`:** `fmtDate(d, 'my')` returns a string, without throwing.

  Run: FAIL.

- [ ] **Step 2: Locale and font.**
  - `project.inlang/settings.json`: `"locales": ["en", "th", "my"]`.
  - `format.ts`: `type Loc = 'en' | 'th' | 'my'`, with the tag `my → 'my-MM'`.
  - **Font:** run `cd web && npm install @fontsource/noto-sans-myanmar@5.3.0`. Then **immediately** run `git diff package-lock.json | grep -c '^-.*emnapi'`.
    - If any `@emnapi` entries were removed, restore them from `git show HEAD:web/package-lock.json`. The diff may only **add** the font package.
    - Verify with `npm ci --dry-run`.
    - **No other installs.**
  - **`app.css`:**
    - import the 400 and 600 weights: `@import '@fontsource/noto-sans-myanmar/400.css';` and `/600.css`
    - add `'Noto Sans Myanmar'` to `--font-sans` after `'Anuphan Variable'`
    - add `:lang(my) body, :lang(my) { line-height: 1.75; }`
    - **Check that headline classes with tight line-height don't clip.** Override `.headline:lang(my)` with `line-height: 1.35`.
    - Read `app.css` for the existing `.headline` and `.label` rules first, and adjust uppercase/letter-spacing for `my` if needed. Burmese has no case, but wide letter-spacing hurts it: set `letter-spacing: 0` under `:lang(my)` for `.label`.
  - **`LangToggle.svelte`:** today it is a two-way toggle. It becomes three compact links, EN / ไทย / မြန်မာ, inside a group labelled `m.language_label()`. The current one is marked `aria-current="true"` and each link is ≥44 px.
    - Check where `LangToggle` is used: More, and possibly the TopBar on desktop. In the TopBar it must still fit; if not, keep a single "language" button there that goes to More, and ledger it.
    - Each label is in its own language. Set the `lang` attribute per link.

- [ ] **Step 3: Translate.** Produce `my.json` with every key in `en.json`, and a `my` field for every `t(...)` in `guides.ts` (change `t` to take three arguments and update every call).
  - **Style:**
    - natural, plain Myanmar for the general public, not literal
    - Arabic digits
    - keep `{placeholders}` exactly
    - keep brand and source names in Latin script (DEMS, SMHI, USGS, GDACS, Open-Meteo, OpenStreetMap, MSB, PM2.5)
  - **Life-critical guide steps** (earthquake, tsunami, flood, flash-flood, storm, heat, chemical, cold) get extra care.
  - **`MY_REVIEW.md`:**
    - a header explaining what the owner needs to check, and that the merge waits on their sign-off
    - section 1, "Life-critical steps (check first)": a table of every `during` step of every guide, as en | my
    - section 2: all other guide text
    - section 3: every UI key, as key | en | my
    - a sign-off line at the end: `Reviewed by: ____  Date: ____`

- [ ] **Step 4: Burmese e2e.** In `countries.spec.ts`, visit `/my`, `/my/map`, `/my/shelters`, `/my/prepare` and `/my/more`.
  - The `<html lang="my">` attribute is set.
  - The headline text matches `/[က-႟]/`.
  - No element contains a raw message key (regex `/\b[a-z]+_[a-z_]+\b/` in visible text of `main`). Keep it simple: assert there's no `now_` or `prep_` substring.

  In `a11y.spec.ts`, add `/my`, `/my/prepare` and `/my/more` to the list.

- [ ] **Step 5: Run and look.**
  - Run `npm run check`, `npm test` and the full `npx playwright test`. Expected: all PASS.
  - **Visual check.** On the dev server at 375 px, open `/my`, `/my/map`, `/my/shelters`, `/my/prepare`, `/my/prepare/earthquake` and `/my/more`. Screenshot each and **look**: no clipped stacked glyphs in chips, badges, the tab bar or headlines; nothing overflows.

- [ ] **Step 6: Commit.** `git add web && git commit -m "web: Burmese (မြန်မာ) language in every country, Noto Sans Myanmar, review list"`

---

### Task 7: Copy and docs

**Files:**
- Modify: `web/messages/en.json`, `th.json`, `my.json` (`app_name` and About keys), `web/src/routes/about/+page.svelte`, `web/src/routes/demo/+page.svelte` (a note), root `README.md`, `web/src/app.html` (the `<title>` and og description)

**Interfaces:**
- Consumes: everything before.
- Produces: user-visible naming and docs that match three countries.

- [ ] **Step 1: Write the failing e2e.** In `more.spec.ts` (About test):
  - About mentions "SMHI" (official warnings for Sweden), and the sample list says the shelters are Thai examples.
  - The demo page shows `m.demo_video_th_note()`: "The video shows the Thailand version."

  Run: FAIL.

- [ ] **Step 2: Implement.**
  - **Naming:**
    - `app_name`: "DEMS" in en/th/my.
    - `<title>` in `app.html`: "DEMS".
    - `og:title`: "DEMS". The og description mentions Thailand, Myanmar and Sweden.
    - Keep the `og.png` image as it is. It says "DEMS Thailand"; note it in the report as a known leftover for the owner to decide.
  - **About:**
    - Add `about_real_smhi`: "Sweden: official weather warnings: SMHI".
    - The sample list item for shelters becomes "Thailand: example shelters (no public list exists). Myanmar: in development. Sweden: link to MSB's official civil-defence shelter map."
    - The PM2.5 threshold row label stays and gains "(Thai PCD; WHO interim target in Myanmar and Sweden)". Read `thresholds.ts` and add a separate row via a new key rather than altering the existing Thai row text, which the e2e asserts.
  - **Demo page:** add the `demo_video_th_note` line under the video. The demo "Under the hood" data-flow body gains one sentence: "In Sweden, SMHI's official warnings set the weather level."
  - **`README.md`:**
    - title "DEMS: Disaster and Emergency Management System"
    - a new "Countries" section: what differs per country (the table from the spec, in short)
    - languages EN/TH/MY
    - in the Real vs sample table, add SMHI and MSB-link rows
    - in "Run it locally", add migration `0004`
  - Add all new keys to `TH_REVIEW.md`; MY strings go into `my.json` and `MY_REVIEW.md` section 3.

- [ ] **Step 3: Run.** Run `npm run check`, `npm test` and the full `npx playwright test`. Expected: all PASS.

- [ ] **Step 4: Commit.** `git add -A web README.md && git commit -m "docs and copy: DEMS for Thailand, Myanmar and Sweden"`

---

## Self-review notes (for the controller)

- **Spec coverage:**
  - registry and store (T1)
  - the server country column (T2)
  - SMHI and levels (T3)
  - guides and numbers (T4)
  - screens, banner, shelters and map (T5)
  - Burmese (T6)
  - copy, README and About (T7)
- **Deliberate deviation from the spec:** the spec listed a `bbox` field for detection. The plan uses nearest-place-within-300 km instead, because the Thai and Myanmar bounding boxes overlap heavily (the Chiang Rai area). The Review Focus covers border towns.
- **Merge gate:** the owner signs off `MY_REVIEW.md`. The DB migration `0004` must be applied with `npm run db:apply` after merge, and **before** the new API queries hit production. Otherwise `where country = …` fails with 503 until it is applied. **The controller must tell the owner to run `npm run db:apply` right after the merge, or apply it just before** (a non-breaking additive migration). Prefer applying before the merge.
