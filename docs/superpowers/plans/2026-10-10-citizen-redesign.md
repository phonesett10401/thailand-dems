# Citizen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every visible part of the DEMS citizen app with the dark, glassy emergency design: three live danger levels, a multi-hazard Now screen with a desktop dashboard, dark map, shelters with filters, our own route guide, a Prepare section, and the D signal-shield logo whose arc shows the live level.

**Architecture:**
- **Built inside `web/`** (SvelteKit 2 + Svelte 5) on branch `redesign/citizen`.
- **Kept:** the Supabase API routes, feed parsers (`lib/sources`), Paraglide i18n, MapLibre, rate limiter and tests.
- **Level rules:** one pure module, `lib/levels.ts`, turns feeds into hazards and a level.
- **Live state:** a store, `lib/hazards.svelte.ts`, loads the feeds for the chosen place and feeds both the shell (logo arc, favicon) and the screens.
- **Routing:** goes through a new server route, `/api/route`, that calls OpenRouteService with a secret key.

**Tech Stack:** SvelteKit 2.70, Svelte 5 runes, TypeScript, Tailwind v4 (`@theme` tokens), Paraglide 2, maplibre-gl 6, bits-ui Dialog, @lucide/svelte, Fontsource (Geist, Geist Mono, Anuphan), Vitest, Playwright + axe, postgres.js, OpenRouteService v2 directions API.

**Spec:** `docs/superpowers/specs/2026-10-10-citizen-redesign-design.md` (mockups in `docs/superpowers/specs/2026-10-10-citizen-redesign/`)

## Global Constraints

**Process and tooling:**
- Work only on branch `redesign/citizen`, and never push to `main`. Before the first `git push -u origin redesign/citizen`, ask the owner once. After that, push at the end of each task.
- Commit messages have **no** `Co-Authored-By` or other attribution lines. This is the owner's rule.
- Never print, log or commit secrets. `.env` values are checked by presence only. `ORS_API_KEY` and `SUPABASE_SECRET_KEY` are read only on the server through `$env/dynamic/private`.
- All commands run from `web/` unless a step says otherwise. Every task ends with `npm run check` (0 errors) and `npm test` green.

**Code conventions:**
- Svelte 5 runes only (`$state`, `$derived`, `$effect`, `$props`). Keep SvelteKit at `^2.70` (do not move to 3).
- Every UI string goes through Paraglide `m.*`, with an EN key in `messages/en.json` and a Thai draft in `messages/th.json`. The exceptions are Prepare guide text (`lib/prepare/guides.ts`, keyed by locale) and brand words ("DEMS", "SOS · 1784").
- No emoji in the UI. Icons come from `@lucide/svelte`. No "AI" wording anywhere.
- Motion durations go through `ms()` from `$lib/motion` (0 under reduced motion). The CSS `.pulse` animation stops under `prefers-reduced-motion: reduce`.
- Tap targets are at least 44 px (`min-h-11`). The SOS control is `<a href="tel:1784">`.

**Colours (exact):**

| Token | Value |
|---|---|
| bg | `#0a0a0c` |
| text | `#f2f2f4` |
| muted | `#9a9aa0` |
| line | `rgb(255 255 255 / 0.09)` |
| safe | `#30d158` |
| watch | `#ffb020` |
| warning | `#ff453a` |
| unknown | `#6b6b72` |
| info | `#0a84ff` |

**Levels and thresholds:**
- Levels are `'safe' | 'watch' | 'warning'`, plus `'unknown'` overall.
- Thresholds (spec §4.2):

| Hazard | Watch | Warning |
|---|---|---|
| PM2.5 | > 37.5 | > 75 |
| Heat (feels-like daily max) | ≥ 41 | ≥ 54 |
| Rain (today) | ≥ 35 mm | ≥ 90 mm |
| Quake (within 300 km, last 24 h) | M ≥ 4.5 | M ≥ 6.0 |
| GDACS (300 km, cyclone 500 km) | orange | red; green → safe |
| River model | rising | never |
| Sample disasters (100 km) | listed | listed, **never counted in the overall level** |

- If every live feed fails, the level is `unknown`. Data older than 3 h shows `unknown`. "No data" is never shown as Safe.

## Review Focus

1. **A location outside Thailand** (GPS abroad, or a developer testing from another country). `/api/route` answers 400, and the route screen must say "Routing works inside Thailand only", not crash or spin. The test is in Task 11 (`routeError` maps 400 → `outside`).
2. **Feeds failing after a good load.** The level must turn Unknown while keeping the last hazards on screen. If only some feeds fail, the level comes from the rest, and the failed feeds are named. The tests are in Task 2 (`keepLast`, partial failure).
3. **A shelter with no coordinates.** It must sort last, show "distance unknown", and have no Route button. The tests are in Task 9 (`shelterRows` and the filter tests).
4. **Thai locale.** Long Thai headlines and labels must render without breaking the layout, and every new key must exist in `th.json`. The test is in Task 7 (e2e `/th` Now) and Task 14 (key-parity unit test).
5. **localStorage unavailable** (private mode or blocked). The checklist, first-visit note and saved place must not throw. The test is in Task 12 (`loadChecks` with a throwing storage).

## File Structure

| File | Responsibility |
|---|---|
| `src/app.css` | Design tokens, base, glass, level classes, map dots |
| `src/lib/levels.ts` (new) | Pure: feeds → hazards, overall level, staleness, keep-last |
| `src/lib/zones.ts` (new) | Pure: Warning hazards that block roads → circles and polygons |
| `src/lib/logo.ts` (new) | Logo path data, level colours, favicon SVG builder |
| `src/lib/hazards.svelte.ts` (new) | Live store: loads feeds for `here.place` and keeps an `Assessment` |
| `src/lib/prepare/guides.ts` (new) | Guide content EN/TH, go-bag items, emergency numbers |
| `src/lib/prepare/checklist.svelte.ts` (new) | Go-bag ticks in localStorage |
| `src/lib/shelters.ts` (new) | Pure: shelter rows (distance, facilities) and filters |
| `src/lib/route.ts` (new) | Client: call `/api/route`, step text, compass, off-route |
| `src/lib/server/route.ts` (new) | Server: validate the request, call ORS, retry without avoid, cache |
| `src/routes/api/route/+server.ts` (new) | POST endpoint with rate limit |
| `src/lib/labels.ts` | Adds hazard names, hazard lines, level words, titles |
| `src/lib/components/` new | `Logo`, `TopBar`, `TabBar`, `PlacePicker`, `FirstVisitNote`, `LevelBadge`, `HazardList`, `HazardSheet`, `ConditionTiles`, `NowPanel`, `ShelterSheet`, `Chip` |
| `src/lib/components/` changed | `Shell` (rewritten), `MapView` (dark, areas, lines), `Sheet` (dark) |
| `src/routes/` | `+page.svelte` (Now), `map/`, `shelters/`, `route/`, `prepare/`, `prepare/[hazard]/`, `more/`, `about/`, `report/` (restyle) |
| `src/hooks.server.ts` | Adds 308 redirects for the old URLs |
| Deleted | Task 6: `disasters/`, `info/`, `weather/`, `evacuation/` pages (their URLs redirect). Task 14: `AlertBanner`, `StatusPill`, `SampleBadge`, `ActionButton`, `AssistantSheet`, `OfflineBanner`, `BottomSheet`, `Conditions`, `EventList`, `LocationPicker`, `EmptyState` (if unused); `severity.ts`, `banner.ts`, `sheet.ts`, `weather-codes.ts` and their tests |

---

### Task 1: Design tokens and fonts

**Files:**
- Modify: `web/package.json` (dependencies)
- Modify: `web/src/app.css` (full rewrite)
- Modify: `web/src/app.html:6` (theme colour)

**Interfaces:**
- Produces:
  - Tailwind colour utilities `bg-bg`, `text-text`, `text-muted`, `border-line`, `bg-raised`, `text-safe`/`bg-safe`, `text-watch`/`bg-watch`, `text-warning`/`bg-warning`, `text-unknown`/`bg-unknown`, `text-info`/`bg-info`, and `font-mono`
  - CSS classes `.glass`, `.label`, `.headline`, `.pulse`, `.lv-safe`/`.lv-watch`/`.lv-warning`/`.lv-unknown` (set `--lv`), `.sky`, `.lv-bg` (background `var(--lv)`), `.lv-text` (colour `var(--lv)`), `.map-dot-*`
  - Legacy aliases `paper`, `ink`, `alarm`, `caution`, `rule`, kept until Task 14

- [ ] **Step 1: Swap the fonts**

Run:
```bash
npm uninstall @fontsource/ibm-plex-mono @fontsource/ibm-plex-sans-thai
npm install @fontsource-variable/geist@^5.3.0 @fontsource-variable/geist-mono@^5.3.0 @fontsource-variable/anuphan@^5.3.0
```
Expected: `added 3 packages`, `removed 2 packages`, and `package.json` lists the three new packages under `dependencies`.

- [ ] **Step 2: Rewrite `web/src/app.css`**

```css
@import 'tailwindcss';
@import '@fontsource-variable/geist';
@import '@fontsource-variable/geist-mono';
@import '@fontsource-variable/anuphan';

/* Registered so the level glow fades between colours instead of jumping. */
@property --lv {
	syntax: '<color>';
	inherits: true;
	initial-value: #6b6b72;
}

@theme {
	--color-bg: #0a0a0c;
	--color-raised: #141418;
	--color-text: #f2f2f4;
	--color-muted: #9a9aa0;
	--color-line: rgb(255 255 255 / 0.09);
	--color-safe: #30d158;
	--color-watch: #ffb020;
	--color-warning: #ff453a;
	--color-unknown: #6b6b72;
	--color-info: #0a84ff;
	/* Legacy names so old pages still compile; removed in Task 14. */
	--color-paper: #0a0a0c;
	--color-ink: #f2f2f4;
	--color-alarm: #ff453a;
	--color-caution: #ffb020;
	--color-rule: rgb(255 255 255 / 0.09);
	--font-sans: 'Geist Variable', 'Anuphan Variable', system-ui, sans-serif;
	--font-mono: 'Geist Mono Variable', ui-monospace, monospace;
}

@layer base {
	html {
		background: var(--color-bg);
		color: var(--color-text);
		color-scheme: dark;
	}
	body {
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
	}
	:focus-visible {
		outline: 2px solid var(--color-info);
		outline-offset: 2px;
	}
}

@layer components {
	.page {
		margin-inline: auto;
		max-width: 48rem;
		padding: calc(var(--header-h, 3.5rem) + 1.25rem) 1rem 7rem;
	}
	@media (min-width: 768px) {
		.page {
			padding-bottom: 3rem;
		}
	}

	.glass {
		background: rgb(255 255 255 / 0.05);
		backdrop-filter: blur(20px) saturate(1.3);
		-webkit-backdrop-filter: blur(20px) saturate(1.3);
		border: 1px solid var(--color-line);
	}
	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.glass {
			background: var(--color-raised);
		}
	}
	@media (prefers-reduced-transparency: reduce) {
		.glass {
			background: var(--color-raised);
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}

	.label {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	.headline {
		font-weight: 800;
		letter-spacing: -0.035em;
		line-height: 1.03;
	}

	.lv-safe {
		--lv: var(--color-safe);
	}
	.lv-watch {
		--lv: var(--color-watch);
	}
	.lv-warning {
		--lv: var(--color-warning);
	}
	.lv-unknown {
		--lv: var(--color-unknown);
	}
	.lv-bg {
		background: var(--lv);
	}
	.lv-text {
		color: var(--lv);
	}

	/* Radial glow behind the status, in the level colour. */
	.sky {
		position: relative;
		isolation: isolate;
		transition: --lv 600ms ease-out;
	}
	.sky::before {
		content: '';
		position: absolute;
		inset: 0 0 auto 0;
		height: 22rem;
		z-index: -1;
		pointer-events: none;
		background: radial-gradient(100% 80% at 80% 0%, color-mix(in srgb, var(--lv) 38%, transparent), transparent 75%);
	}

	.pulse {
		animation: pulse 1.4s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.35;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
		}
		.sky {
			transition: none;
		}
	}

	.map-dot {
		width: 16px;
		height: 16px;
		border-radius: 9999px;
		border: 2px solid #0a0a0c;
		box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35);
		cursor: pointer;
	}
	.map-dot-me {
		width: 14px;
		height: 14px;
		background: var(--color-info);
		border-color: #fff;
	}
	.map-dot-shelter {
		background: #f2f2f4;
		border-radius: 5px;
	}
	.map-dot-safe {
		background: var(--color-safe);
	}
	.map-dot-watch {
		background: var(--color-watch);
	}
	.map-dot-warning {
		background: var(--color-warning);
	}
	.map-dot-sample {
		background: #0a0a0c;
		border: 3px solid var(--color-watch);
	}
	/* Legacy kinds, removed in Task 14. */
	.map-dot-quake {
		background: var(--color-watch);
	}
	.map-dot-hazard {
		background: var(--color-warning);
	}
}
```

- [ ] **Step 3: Set the browser theme colour**

In `web/src/app.html`, replace `<meta name="theme-color" content="#f6f4ef" />` with `<meta name="theme-color" content="#0a0a0c" />`.

- [ ] **Step 4: Type check and tests**

Run: `npm run check && npm test`
Expected: `0 ERRORS`, and `Tests 85 passed`.

- [ ] **Step 5: Look at it**

Run the dev server (`npm run dev`, port 3001) and open `http://localhost:3001/`.
Expected: dark background, light text, Geist font. The old pages still work, just dark.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/app.css src/app.html
git commit -m "web: dark design tokens, Geist/Anuphan fonts, glass and level classes"
```

---

### Task 2: Level rules

**Files:**
- Create: `web/src/lib/levels.ts`
- Create: `web/src/lib/levels.test.ts`
- Modify: `web/src/lib/sources/openmeteo.ts` (feels-like max)
- Modify: `web/src/lib/sources/openmeteo.test.ts:14`
- Modify: `web/src/lib/sources/fixtures/forecast.json` (add `apparent_temperature_max`)
- Modify: `web/src/lib/sources/usgs.ts` (add `mag`)
- Modify: `web/src/lib/sources/usgs.test.ts:17-28`
- Modify: `web/src/lib/types.ts` (`HazardEvent.mag?`)

**Interfaces:**
- Consumes: `Air`, `Forecast` (now with `days[].feels: number | null`), `River` from `sources/openmeteo`; `HazardEvent` (now with `mag?: number`), `Disaster`, `DbAlert`, `Pt` from `types`; `distanceKm`, `toNum` from `geo`.
- Produces (exact):
```ts
export type Lvl = 'safe' | 'watch' | 'warning';
export type Overall = Lvl | 'unknown';
export type HazardType = 'flood' | 'rain' | 'storm' | 'smoke' | 'heat' | 'earthquake' | 'tsunami' | 'landslide' | 'drought' | 'wildfire' | 'volcano' | 'chemical' | 'other';
export type Hazard = { id: string; type: HazardType; level: Lvl; name: string | null; value: number | null; km: number | null; lat: number | null; lon: number | null; time: string | null; source: string; sample: boolean; url: string | null };
export type FeedKey = 'air' | 'forecast' | 'river' | 'gdacs' | 'quakes';
export type Feeds = { air?: Air; forecast?: Forecast; river?: River | null; gdacs?: HazardEvent[]; quakes?: HazardEvent[]; disasters: Disaster[]; alerts: DbAlert[] };
export type Assessment = { level: Overall; hazards: Hazard[]; failed: FeedKey[]; checkedAt: number };
export const T: { pm25: [number, number]; heat: [number, number]; rain: [number, number]; quake: [number, number]; quakeKm: number; quakeHours: number; gdacsKm: number; cycloneKm: number; sampleKm: number; staleMs: number };
export const RANK: Record<Overall, number>;
export function worst(levels: Lvl[]): Lvl;
export function collect(f: Feeds, at: Pt, now: number, near: boolean): Hazard[];
export function assess(f: Feeds, at: Pt, now: number): Assessment;
export function shown(a: Assessment, now: number): Overall;   // 'unknown' when stale
export function keepLast(prev: Assessment | null, next: Assessment): Assessment;
```
A feed key that is `undefined` in `Feeds` means "that feed failed". `river: null` means "no river at this point" (not a failure).

- [ ] **Step 1: Add feels-like to the forecast parser and its fixture**

Run:
```bash
node -e "const f='src/lib/sources/fixtures/forecast.json';const j=require('./'+f);j.daily.apparent_temperature_max=j.daily.temperature_2m_max.map(t=>Math.round((t+3)*10)/10);require('fs').writeFileSync(f,JSON.stringify(j,null,'\t')+'\n')"
```

In `web/src/lib/sources/openmeteo.ts`:
- In `RawForecast.daily`, add `apparent_temperature_max?: (number | null)[];`.
- In `Forecast.days`, change the row type to `{ date: Date; code: number; max: number; min: number; rain: number; feels: number | null }`.
- In `forecastUrl`, change `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` to `daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,apparent_temperature_max`.
- In `parseForecast`, replace the `days:` block with:
```ts
		days: r.daily.time
			.map((t, i) => ({
				date: unix(t),
				code: r.daily.weather_code[i],
				max: r.daily.temperature_2m_max[i],
				min: r.daily.temperature_2m_min[i],
				rain: r.daily.precipitation_sum[i],
				feels: r.daily.apparent_temperature_max?.[i] ?? null
			}))
			// feels may be missing on old responses; it must not drop the whole day.
			.filter((d) => complete({ ...d, feels: 0 }))
```

In `web/src/lib/sources/openmeteo.test.ts` line 14, change the expected object to `{ date: new Date(1791824400 * 1000), code: 95, max: 30.1, min: 24.2, rain: 22.8, feels: 33.1 }`.

- [ ] **Step 2: Add the magnitude to quake events**

- In `web/src/lib/types.ts`, inside `HazardEvent`, add `mag?: number;` after `url: string;`.
- In `web/src/lib/sources/usgs.ts` `parseQuakes`, add `mag,` after `url: f.properties.url` (keep the comma style).
- In `web/src/lib/sources/usgs.test.ts`, inside the first `toEqual({...})`, add `mag: 5.3,` after the `url` line.

Run: `npm test -- src/lib/sources`
Expected: all source tests pass.

- [ ] **Step 3: Write the failing level tests**

Create `web/src/lib/levels.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { assess, collect, keepLast, shown, T, worst, type Feeds } from './levels';
import type { Air, Forecast } from './sources/openmeteo';
import type { Disaster, HazardEvent } from './types';

const BKK = { lat: 13.7563, lon: 100.5018 };
const NOW = Date.parse('2026-10-10T06:00:00Z');
const air = (pm25: number): Air => ({ time: new Date(NOW), pm25, aqi: 0 });
const fc = (rain: number, feels: number | null): Forecast => ({
	now: { time: new Date(NOW), temp: 30, precip: 0, wind: 5, code: 0 },
	hours: [],
	days: [{ date: new Date(NOW), code: 0, max: 33, min: 25, rain, feels }]
});
const calm = (): Feeds => ({ air: air(10), forecast: fc(0, 33), river: null, gdacs: [], quakes: [], disasters: [], alerts: [] });
const quake = (mag: number, lat: number, lon: number, hoursAgo: number): HazardEvent => ({
	id: `Q${mag}${lat}`,
	source: 'USGS',
	kind: 'earthquake',
	title: `M${mag}`,
	level: 'watch',
	lat,
	lon,
	time: new Date(NOW - hoursAgo * 3600_000).toISOString(),
	current: true,
	url: 'u',
	mag
});
const gd = (kind: HazardEvent['kind'], level: HazardEvent['level'], lat: number, lon: number, current = true): HazardEvent => ({
	id: `G${kind}${lat}`,
	source: 'GDACS',
	kind,
	title: `${kind} event`,
	level,
	lat,
	lon,
	time: new Date(NOW).toISOString(),
	current,
	url: 'u'
});
const levelOfType = (f: Feeds, type: string) => assess(f, BKK, NOW).hazards.find((h) => h.type === type)?.level ?? 'safe';

describe('thresholds', () => {
	it('PM2.5: >37.5 watch, >75 warning (Thai PCD bands)', () => {
		expect(levelOfType({ ...calm(), air: air(37.5) }, 'smoke')).toBe('safe');
		expect(levelOfType({ ...calm(), air: air(37.6) }, 'smoke')).toBe('watch');
		expect(levelOfType({ ...calm(), air: air(75) }, 'smoke')).toBe('watch');
		expect(levelOfType({ ...calm(), air: air(75.1) }, 'smoke')).toBe('warning');
	});
	it('heat (feels-like max): >=41 watch, >=54 warning', () => {
		expect(levelOfType({ ...calm(), forecast: fc(0, 40.9) }, 'heat')).toBe('safe');
		expect(levelOfType({ ...calm(), forecast: fc(0, 41) }, 'heat')).toBe('watch');
		expect(levelOfType({ ...calm(), forecast: fc(0, 54) }, 'heat')).toBe('warning');
		expect(levelOfType({ ...calm(), forecast: fc(0, null) }, 'heat')).toBe('safe');
	});
	it('rain today: >=35 mm watch, >=90 mm warning', () => {
		expect(levelOfType({ ...calm(), forecast: fc(34.9, 33) }, 'rain')).toBe('safe');
		expect(levelOfType({ ...calm(), forecast: fc(35, 33) }, 'rain')).toBe('watch');
		expect(levelOfType({ ...calm(), forecast: fc(90, 33) }, 'rain')).toBe('warning');
	});
	it('quakes: M4.5+ within 300 km in 24 h watch, M6+ warning; older or farther ignored', () => {
		const near = { lat: 14.5, lon: 100.5 }; // ~83 km
		expect(levelOfType({ ...calm(), quakes: [quake(4.4, near.lat, near.lon, 1)] }, 'earthquake')).toBe('safe');
		expect(levelOfType({ ...calm(), quakes: [quake(4.5, near.lat, near.lon, 1)] }, 'earthquake')).toBe('watch');
		expect(levelOfType({ ...calm(), quakes: [quake(6, near.lat, near.lon, 1)] }, 'earthquake')).toBe('warning');
		expect(levelOfType({ ...calm(), quakes: [quake(6, near.lat, near.lon, 25)] }, 'earthquake')).toBe('safe');
		expect(levelOfType({ ...calm(), quakes: [quake(6, 20.5, 100.5, 1)] }, 'earthquake')).toBe('safe'); // ~750 km
	});
	it('GDACS: red warning, orange watch, green listed as safe; only current events in range', () => {
		const a = assess({ ...calm(), gdacs: [gd('flood', 'danger', 14, 100.6), gd('wildfire', 'warning', 14.2, 100.6), gd('drought', 'watch', 14.1, 100.6)] }, BKK, NOW);
		expect(a.hazards.map((h) => [h.type, h.level])).toEqual([
			['flood', 'warning'],
			['wildfire', 'watch'],
			['drought', 'safe']
		]);
		expect(assess({ ...calm(), gdacs: [gd('flood', 'danger', 14, 100.6, false)] }, BKK, NOW).hazards).toEqual([]);
		expect(assess({ ...calm(), gdacs: [gd('flood', 'danger', 18.8, 99)] }, BKK, NOW).hazards).toEqual([]); // ~580 km
		expect(assess({ ...calm(), gdacs: [gd('cyclone', 'danger', 16.5, 104)] }, BKK, NOW).hazards[0].type).toBe('storm'); // ~480 km, inside 500
	});
	it('river model: rising is watch, never warning', () => {
		expect(levelOfType({ ...calm(), river: { today: 1, peak: 50, peakDate: '2026-10-12', rising: true } }, 'flood')).toBe('watch');
		expect(levelOfType({ ...calm(), river: { today: 5, peak: 5, peakDate: '2026-10-10', rising: false } }, 'flood')).toBe('safe');
	});
});

describe('overall level', () => {
	it('the worst live hazard wins', () => {
		const a = assess({ ...calm(), air: air(80), forecast: fc(40, 33) }, BKK, NOW);
		expect(a.level).toBe('warning');
		expect(a.hazards.map((h) => h.type)).toEqual(['smoke', 'rain']);
	});
	it('sample disasters are listed but never raise the level', () => {
		const spill: Disaster = { DisasterID: 10, DisasterName: 'Chonburi Hazmat Spill', DisasterType: 'Industrial Accident', Severity: 'Catastrophic', Description: null, AffectedRegion: 'Chonburi', Latitude: '13.3611', Longitude: '100.9847', StartDate: '2025-01-01', Status: 'Active', EstimatedAffectedPopulation: null };
		const a = assess({ ...calm(), disasters: [spill] }, BKK, NOW);
		expect(a.level).toBe('safe');
		expect(a.hazards[0]).toMatchObject({ type: 'chemical', level: 'warning', sample: true });
	});
	it('a sample disaster takes the worst of its own severity and its active alerts', () => {
		const flood: Disaster = { DisasterID: 1, DisasterName: 'Bangkok Flooding', DisasterType: 'Flood', Severity: 'Moderate', Description: null, AffectedRegion: 'Bangkok', Latitude: '13.75', Longitude: '100.5', StartDate: '2025-01-01', Status: 'Active', EstimatedAffectedPopulation: null };
		const alert = { AlertID: 1, AlertType: 'x', Severity: 'Critical' as const, Title: 't', Message: 'm', AffectedRegion: 'Bangkok', IssuedAt: '2025-01-01', ExpiresAt: null, Status: 'Active', DisasterID: 1 };
		expect(assess({ ...calm(), disasters: [flood], alerts: [alert] }, BKK, NOW).hazards[0].level).toBe('warning');
	});
	it('every live feed failed → unknown, never safe; failed feeds are named', () => {
		const a = assess({ disasters: [], alerts: [] }, BKK, NOW);
		expect(a.level).toBe('unknown');
		expect(a.failed).toEqual(['air', 'forecast', 'river', 'gdacs', 'quakes']);
	});
	it('a partial failure still computes the level from what loaded', () => {
		const a = assess({ ...calm(), air: undefined, forecast: fc(95, 33) }, BKK, NOW);
		expect(a.level).toBe('warning');
		expect(a.failed).toEqual(['air']);
	});
	it('nothing found → safe', () => {
		expect(assess(calm(), BKK, NOW).level).toBe('safe');
	});
});

describe('staleness and keep-last', () => {
	it('data older than 3 hours shows unknown', () => {
		const a = assess(calm(), BKK, NOW);
		expect(shown(a, NOW + T.staleMs)).toBe('safe');
		expect(shown(a, NOW + T.staleMs + 1)).toBe('unknown');
	});
	it('a total failure after a good load keeps the last hazards and their time', () => {
		const good = assess({ ...calm(), air: air(80) }, BKK, NOW);
		const bad = assess({ disasters: [], alerts: [] }, BKK, NOW + 60_000);
		const kept = keepLast(good, bad);
		expect(kept.level).toBe('unknown');
		expect(kept.hazards).toEqual(good.hazards);
		expect(kept.checkedAt).toBe(NOW);
		expect(keepLast(null, bad)).toBe(bad);
		expect(keepLast(good, good)).toBe(good);
	});
});

describe('collect (map view)', () => {
	it('near=false keeps far live events and sample disasters with distances', () => {
		const far = { ...calm(), gdacs: [gd('flood', 'danger', 18.8, 99)] };
		const all = collect(far, BKK, NOW, false);
		expect(all).toHaveLength(1);
		expect(all[0].km).toBeGreaterThan(500);
	});
});

describe('worst', () => {
	it('ranks warning > watch > safe', () => {
		expect(worst([])).toBe('safe');
		expect(worst(['watch', 'safe', 'warning'])).toBe('warning');
	});
});
```

- [ ] **Step 4: Run them to make sure they fail**

Run: `npm test -- src/lib/levels.test.ts`
Expected: FAIL with `Failed to resolve import "./levels"`.

- [ ] **Step 5: Write `web/src/lib/levels.ts`**

```ts
import { distanceKm, toNum } from './geo';
import type { Air, Forecast, River } from './sources/openmeteo';
import type { DbAlert, Disaster, HazardEvent, HazardKind, Pt } from './types';

export type Lvl = 'safe' | 'watch' | 'warning';
export type Overall = Lvl | 'unknown';
export type HazardType =
	| 'flood'
	| 'rain'
	| 'storm'
	| 'smoke'
	| 'heat'
	| 'earthquake'
	| 'tsunami'
	| 'landslide'
	| 'drought'
	| 'wildfire'
	| 'volcano'
	| 'chemical'
	| 'other';
export type Hazard = {
	id: string;
	type: HazardType;
	level: Lvl;
	name: string | null;
	value: number | null;
	km: number | null;
	lat: number | null;
	lon: number | null;
	time: string | null;
	source: string;
	sample: boolean;
	url: string | null;
};
export type FeedKey = 'air' | 'forecast' | 'river' | 'gdacs' | 'quakes';
/** A live feed that is `undefined` failed to load. `river: null` means no river at this point. */
export type Feeds = {
	air?: Air;
	forecast?: Forecast;
	river?: River | null;
	gdacs?: HazardEvent[];
	quakes?: HazardEvent[];
	disasters: Disaster[];
	alerts: DbAlert[];
};
export type Assessment = { level: Overall; hazards: Hazard[]; failed: FeedKey[]; checkedAt: number };

/** Every number here comes from spec §4.2. */
export const T = {
	pm25: [37.5, 75] as [number, number], // Thai PCD: above 37.5 / above 75
	heat: [41, 54] as [number, number], // Thai heat index danger bands, inclusive
	rain: [35, 90] as [number, number], // TMD heavy / very heavy, inclusive
	quake: [4.5, 6] as [number, number],
	quakeKm: 300,
	quakeHours: 24,
	gdacsKm: 300,
	cycloneKm: 500,
	sampleKm: 100,
	staleMs: 3 * 3600_000
};

export const RANK: Record<Overall, number> = { unknown: -1, safe: 0, watch: 1, warning: 2 };
export const worst = (ls: Lvl[]): Lvl => ls.reduce<Lvl>((a, b) => (RANK[b] > RANK[a] ? b : a), 'safe');

const over = (v: number, [w, x]: [number, number], inclusive: boolean): Lvl => {
	const above = (t: number) => (inclusive ? v >= t : v > t);
	return above(x) ? 'warning' : above(w) ? 'watch' : 'safe';
};

const GDACS_TYPE: Record<HazardKind, HazardType> = {
	flood: 'flood',
	cyclone: 'storm',
	earthquake: 'earthquake',
	drought: 'drought',
	wildfire: 'wildfire',
	volcano: 'volcano',
	other: 'other'
};
// GDACS Red/Orange/Green arrive as danger/warning/watch through severity.levelOf.
const GDACS_LEVEL: Record<string, Lvl> = { danger: 'warning', warning: 'watch' };

const DISASTER_TYPE: Record<string, HazardType> = {
	Flood: 'flood',
	Earthquake: 'earthquake',
	'Industrial Accident': 'chemical',
	Tsunami: 'tsunami',
	Landslide: 'landslide',
	Hurricane: 'storm',
	Tornado: 'storm',
	Wildfire: 'wildfire',
	Drought: 'drought'
};
const SEVERITY: Record<string, Lvl> = {
	Catastrophic: 'warning',
	Critical: 'warning',
	Emergency: 'warning',
	Severe: 'watch',
	Moderate: 'watch',
	Warning: 'watch'
};

const live = (h: Omit<Hazard, 'sample'>): Hazard => ({ ...h, sample: false });

export function collect(f: Feeds, at: Pt, now: number, near: boolean): Hazard[] {
	const out: Hazard[] = [];
	const here = { km: null, lat: null, lon: null, name: null, url: null };
	const today = new Date(now).toISOString();

	if (f.air) {
		const level = over(f.air.pm25, T.pm25, false);
		if (level !== 'safe') out.push(live({ ...here, id: 'air', type: 'smoke', level, value: f.air.pm25, time: f.air.time.toISOString(), source: 'Open-Meteo' }));
	}
	const day = f.forecast?.days[0];
	if (day) {
		const heat = day.feels === null ? 'safe' : over(day.feels, T.heat, true);
		if (heat !== 'safe') out.push(live({ ...here, id: 'heat', type: 'heat', level: heat, value: day.feels, time: today, source: 'Open-Meteo' }));
		const rain = over(day.rain, T.rain, true);
		if (rain !== 'safe') out.push(live({ ...here, id: 'rain', type: 'rain', level: rain, value: day.rain, time: today, source: 'Open-Meteo' }));
	}
	if (f.river?.rising) {
		out.push(live({ ...here, id: 'river', type: 'flood', level: 'watch', value: f.river.peak, time: today, source: 'Open-Meteo river model' }));
	}

	for (const q of f.quakes ?? []) {
		const km = distanceKm(at, q);
		const fresh = now - Date.parse(q.time) <= T.quakeHours * 3600_000;
		const level = over(q.mag ?? 0, T.quake, true);
		if (near && (km > T.quakeKm || !fresh || level === 'safe')) continue;
		out.push(live({ id: q.id, type: 'earthquake', level, name: q.title, value: q.mag ?? null, km, lat: q.lat, lon: q.lon, time: q.time, source: 'USGS', url: q.url }));
	}
	for (const g of f.gdacs ?? []) {
		if (!g.current) continue;
		const km = distanceKm(at, g);
		if (near && km > (g.kind === 'cyclone' ? T.cycloneKm : T.gdacsKm)) continue;
		out.push(live({ id: g.id, type: GDACS_TYPE[g.kind], level: GDACS_LEVEL[g.level] ?? 'safe', name: g.title, value: null, km, lat: g.lat, lon: g.lon, time: g.time, source: 'GDACS', url: g.url }));
	}

	for (const d of f.disasters) {
		const lat = toNum(d.Latitude);
		const lon = toNum(d.Longitude);
		if (d.Status !== 'Active' || lat === null || lon === null) continue;
		const km = distanceKm(at, { lat, lon });
		if (near && km > T.sampleKm) continue;
		const alerts = f.alerts.filter((a) => a.Status === 'Active' && (a as { DisasterID?: number }).DisasterID === d.DisasterID);
		const level = worst([SEVERITY[d.Severity] ?? 'safe', ...alerts.map((a) => SEVERITY[a.Severity] ?? 'safe')]);
		if (level === 'safe') continue;
		out.push({ id: `D${d.DisasterID}`, type: DISASTER_TYPE[d.DisasterType] ?? 'other', level, name: d.DisasterName, value: null, km, lat, lon, time: d.StartDate, source: 'DEMS sample', sample: true, url: null });
	}

	return out
		.map((h, i) => ({ h, i }))
		.sort((a, b) => Number(a.h.sample) - Number(b.h.sample) || RANK[b.h.level] - RANK[a.h.level] || a.i - b.i)
		.map((x) => x.h);
}

const FEEDS: FeedKey[] = ['air', 'forecast', 'river', 'gdacs', 'quakes'];

export function assess(f: Feeds, at: Pt, now: number): Assessment {
	const failed = FEEDS.filter((k) => f[k] === undefined);
	const hazards = collect(f, at, now, true);
	const level: Overall = failed.length === FEEDS.length ? 'unknown' : worst(hazards.filter((h) => !h.sample).map((h) => h.level));
	return { level, hazards, failed, checkedAt: now };
}

export const shown = (a: Assessment, now: number): Overall => (now - a.checkedAt > T.staleMs ? 'unknown' : a.level);

/** A total failure after a good load keeps the last hazards on screen, marked unknown. */
export function keepLast(prev: Assessment | null, next: Assessment): Assessment {
	if (next.level !== 'unknown' || !prev || prev === next) return next;
	return { ...prev, level: 'unknown', failed: next.failed };
}
```
`DbAlert` has no `DisasterID` in its type, but the API rows carry it. The cast reads it without widening the shared type.

- [ ] **Step 6: Run the level tests**

Run: `npm test -- src/lib/levels.test.ts`
Expected: PASS (all `levels.test.ts` tests).

- [ ] **Step 7: Full suite and check**

Run: `npm run check && npm test`
Expected: `0 ERRORS`, and every test passes.

- [ ] **Step 8: Commit**

```bash
git add src/lib/levels.ts src/lib/levels.test.ts src/lib/sources src/lib/types.ts
git commit -m "web: level rules (3 levels + unknown) from live feeds; sample data never sets the level"
```

---

### Task 3: Hazard zones for routing

**Files:**
- Create: `web/src/lib/zones.ts`
- Create: `web/src/lib/zones.test.ts`

**Interfaces:**
- Consumes: `Hazard`, `HazardType` from `levels`.
- Produces:
```ts
export type Zone = { lat: number; lon: number; km: number };
export const BLOCKS_ROADS: HazardType[];          // flood, storm, tsunami, landslide, wildfire, chemical
export const ZONE_KM: Record<string, number>;      // radius per type, all ≤ 15
export function zonesFrom(hazards: Hazard[]): Zone[];   // live Warning, road-blocking, with coords; ≤ 10, nearest first
export function circle(z: Zone, points?: number): [number, number][]; // closed [lon, lat] ring
```

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/zones.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import type { Hazard } from './levels';
import { circle, zonesFrom } from './zones';

const h = (over: Partial<Hazard>): Hazard => ({
	id: Math.random().toString(),
	type: 'flood',
	level: 'warning',
	name: null,
	value: null,
	km: 5,
	lat: 13.8,
	lon: 100.5,
	time: null,
	source: 'GDACS',
	sample: false,
	url: null,
	...over
});

describe('zonesFrom', () => {
	it('keeps only live Warning hazards that block roads and have a position', () => {
		const zs = zonesFrom([
			h({ type: 'flood' }),
			h({ type: 'smoke' }),
			h({ type: 'storm', level: 'watch' }),
			h({ type: 'chemical', sample: true }),
			h({ type: 'landslide', lat: null, lon: null })
		]);
		expect(zs).toEqual([{ lat: 13.8, lon: 100.5, km: 10 }]);
	});
	it('caps at 10, nearest first', () => {
		const zs = zonesFrom(Array.from({ length: 14 }, (_, i) => h({ km: 14 - i, lat: 13 + i / 100 })));
		expect(zs).toHaveLength(10);
		expect(zs[0].lat).toBeCloseTo(13.13);
	});
});

describe('circle', () => {
	it('is a closed ring with the right radius', () => {
		const ring = circle({ lat: 13.75, lon: 100.5, km: 10 }, 16);
		expect(ring).toHaveLength(17);
		expect(ring[0]).toEqual(ring[16]);
		const [lon, lat] = ring[4]; // 90° = due north
		expect(lon).toBeCloseTo(100.5, 5);
		expect((lat - 13.75) * 111.32).toBeCloseTo(10, 1);
	});
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npm test -- src/lib/zones.test.ts`
Expected: FAIL, `Failed to resolve import "./zones"`.

- [ ] **Step 3: Write `web/src/lib/zones.ts`**

```ts
import type { Hazard, HazardType } from './levels';

export type Zone = { lat: number; lon: number; km: number };

/** Smoke, heat and quakes do not close roads; these do. */
export const BLOCKS_ROADS: HazardType[] = ['flood', 'storm', 'tsunami', 'landslide', 'wildfire', 'chemical'];
// ponytail: one fixed radius per type; use the event's real footprint if a feed ever provides one.
export const ZONE_KM: Record<string, number> = { flood: 10, storm: 15, tsunami: 5, landslide: 3, wildfire: 5, chemical: 5 };

export function zonesFrom(hazards: Hazard[]): Zone[] {
	return hazards
		.filter((x) => !x.sample && x.level === 'warning' && BLOCKS_ROADS.includes(x.type) && x.lat !== null && x.lon !== null)
		.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
		.slice(0, 10)
		.map((x) => ({ lat: x.lat!, lon: x.lon!, km: ZONE_KM[x.type] }));
}

/** Closed ring of [lon, lat] points, angle 0 = east, counter-clockwise. */
export function circle(z: Zone, points = 16): [number, number][] {
	const dLat = z.km / 111.32;
	const dLon = z.km / (111.32 * Math.cos((z.lat * Math.PI) / 180));
	const ring: [number, number][] = [];
	for (let i = 0; i < points; i++) {
		const a = (i / points) * 2 * Math.PI;
		ring.push([z.lon + dLon * Math.cos(a), z.lat + dLat * Math.sin(a)]);
	}
	ring.push(ring[0]);
	return ring;
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/lib/zones.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/zones.ts src/lib/zones.test.ts
git commit -m "web: hazard zones (road-blocking Warning hazards as circles) for routing"
```

---

### Task 4: Logo, live favicon and the hazard store

**Files:**
- Create: `web/src/lib/logo.ts`, `web/src/lib/logo.test.ts`
- Create: `web/src/lib/components/Logo.svelte`
- Create: `web/src/lib/hazards.svelte.ts`
- Create: `web/scripts/make-icons.js`
- Replace: `web/static/favicon.svg`; Create: `web/static/apple-touch-icon.png`
- Modify: `web/src/app.html` (apple-touch-icon link)

**Interfaces:**
- Consumes: `Overall`, `Assessment`, `Feeds`, `assess`, `keepLast` from `levels`; `api` from `config`; `here` from `location.svelte`; `getAir`, `getForecast`, `getRiver`, `getGdacs`, `getQuakes`.
- Produces:
```ts
// logo.ts
export const LEVEL_HEX: Record<Overall, string>;
export const SHIELD: string; export const ARC: string; export const BODY: string;
export function faviconSvg(level: Overall): string;
export const faviconHref: (level: Overall) => string;   // data: URL
// Logo.svelte props: { level?: Overall = 'warning'; size?: number = 24 }
// hazards.svelte.ts
export const live: { a: Assessment | null; feeds: Feeds | null; loading: boolean };
export function refresh(): Promise<void>;
```

- [ ] **Step 1: Write the failing logo test**

Create `web/src/lib/logo.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { faviconHref, faviconSvg, LEVEL_HEX } from './logo';

describe('favicon', () => {
	it('paints only the arc in the level colour', () => {
		for (const l of ['safe', 'watch', 'warning', 'unknown'] as const) {
			const svg = faviconSvg(l);
			expect(svg).toContain(`stroke="${LEVEL_HEX[l]}"`);
			expect(svg.match(/#[0-9a-f]{6}/gi)?.filter((c) => c === LEVEL_HEX[l])).toHaveLength(1);
		}
	});
	it('follows light/dark browser chrome for the shield and person', () => {
		expect(faviconSvg('safe')).toContain('prefers-color-scheme:dark');
	});
	it('is a data URL', () => {
		expect(faviconHref('watch')).toMatch(/^data:image\/svg\+xml,/);
	});
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- src/lib/logo.test.ts`
Expected: FAIL, `Failed to resolve import "./logo"`.

- [ ] **Step 3: Write `web/src/lib/logo.ts`**

```ts
import type { Overall } from './levels';

export const LEVEL_HEX: Record<Overall, string> = {
	safe: '#30d158',
	watch: '#ffb020',
	warning: '#ff453a',
	unknown: '#6b6b72'
};
// 64×64 grid. The shield and person never change colour; only the arc does.
export const SHIELD = 'M32 4 L54 11 V30 C54 44 45 53 32 60 C19 53 10 44 10 30 V11 Z';
export const ARC = 'M22 27 A11 11 0 0 1 42 27';
export const BODY = 'M24 47 C24 41.5 27.5 38.5 32 38.5 C36.5 38.5 40 41.5 40 47 Z';

export function faviconSvg(level: Overall): string {
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
		`<style>.f{fill:#141416}.s{stroke:#141416}@media (prefers-color-scheme:dark){.f{fill:#fff}.s{stroke:#fff}}</style>` +
		`<path class="s" d="${SHIELD}" fill="none" stroke-width="4.5" stroke-linejoin="round"/>` +
		`<path d="${ARC}" fill="none" stroke="${LEVEL_HEX[level]}" stroke-width="4" stroke-linecap="round"/>` +
		`<circle class="f" cx="32" cy="31" r="4.6"/><path class="f" d="${BODY}"/></svg>`
	);
}

export const faviconHref = (level: Overall) => `data:image/svg+xml,${encodeURIComponent(faviconSvg(level))}`;
```

Run: `npm test -- src/lib/logo.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 4: Write `web/src/lib/components/Logo.svelte`**

```svelte
<script lang="ts">
	import type { Overall } from '$lib/levels';
	import { ARC, BODY, LEVEL_HEX, SHIELD } from '$lib/logo';

	let { level = 'warning', size = 24 }: { level?: Overall; size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" class="shrink-0">
	<path d={SHIELD} fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" />
	<path
		d={ARC}
		fill="none"
		stroke={LEVEL_HEX[level]}
		stroke-width="4"
		stroke-linecap="round"
		class:pulse={level === 'warning'}
	/>
	<circle cx="32" cy="31" r="4.6" fill="currentColor" />
	<path d={BODY} fill="currentColor" />
</svg>
```

- [ ] **Step 5: Write `web/src/lib/hazards.svelte.ts`**

```ts
import { api } from './config';
import { assess, keepLast, type Assessment, type Feeds } from './levels';
import { here } from './location.svelte';
import { getGdacs } from './sources/gdacs';
import { getAir, getForecast, getRiver } from './sources/openmeteo';
import { getQuakes } from './sources/usgs';

/** One shared view of the hazards around `here.place`, used by the shell (logo, favicon) and the screens. */
export const live = $state<{ a: Assessment | null; feeds: Feeds | null; loading: boolean }>({
	a: null,
	feeds: null,
	loading: false
});

const settle = <T>(p: Promise<T>): Promise<T | undefined> => p.then((v) => v, () => undefined);
let token = 0;

export async function refresh(): Promise<void> {
	const t = ++token;
	const at = { lat: here.place.lat, lon: here.place.lon };
	live.loading = true;
	const [air, forecast, river, gdacs, quakes, disasters, alerts] = await Promise.all([
		settle(getAir(at)),
		settle(getForecast(at)),
		settle(getRiver(at)),
		settle(getGdacs()),
		settle(getQuakes()),
		api.disasters(),
		api.alerts()
	]);
	if (t !== token) return; // the place changed while loading
	const feeds: Feeds = { air, forecast, river, gdacs, quakes, disasters: disasters.data, alerts: alerts.data };
	live.feeds = feeds;
	live.a = keepLast(live.a, assess(feeds, at, Date.now()));
	live.loading = false;
}
```

- [ ] **Step 6: Static icons**

Create `web/scripts/make-icons.js`:
```js
// Writes static/favicon.svg (red arc, for places that can't show the live level) and
// static/apple-touch-icon.png (180 px, full-bleed dark tile; iOS rounds the corners).
// Run: node scripts/make-icons.js
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const SHIELD = 'M32 4 L54 11 V30 C54 44 45 53 32 60 C19 53 10 44 10 30 V11 Z';
const ARC = 'M22 27 A11 11 0 0 1 42 27';
const BODY = 'M24 47 C24 41.5 27.5 38.5 32 38.5 C36.5 38.5 40 41.5 40 47 Z';

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><style>.f{fill:#141416}.s{stroke:#141416}@media (prefers-color-scheme:dark){.f{fill:#fff}.s{stroke:#fff}}</style><path class="s" d="${SHIELD}" fill="none" stroke-width="4.5" stroke-linejoin="round"/><path d="${ARC}" fill="none" stroke="#ff453a" stroke-width="4" stroke-linecap="round"/><circle class="f" cx="32" cy="31" r="4.6"/><path class="f" d="${BODY}"/></svg>\n`;
writeFileSync('static/favicon.svg', favicon);

const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="180" height="180"><rect width="64" height="64" fill="#141416"/><g transform="translate(7 7) scale(.78)"><path d="${SHIELD}" fill="none" stroke="#fff" stroke-width="4.5" stroke-linejoin="round"/><path d="${ARC}" fill="none" stroke="#ff453a" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="31" r="4.6" fill="#fff"/><path d="${BODY}" fill="#fff"/></g></svg>`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
await page.setContent(`<style>body{margin:0}svg{display:block}</style>${tile}`);
await page.screenshot({ path: 'static/apple-touch-icon.png' });
await browser.close();
console.log('wrote static/favicon.svg and static/apple-touch-icon.png');
```
Run: `node scripts/make-icons.js`
Expected: `wrote static/favicon.svg and static/apple-touch-icon.png`. Open the PNG and check it shows a white shield with a red arc on a dark square.

In `web/src/app.html`, add after the `favicon.svg` link line:
```html
		<link rel="apple-touch-icon" href="%sveltekit.assets%/apple-touch-icon.png" />
```

- [ ] **Step 7: Check and commit**

Run: `npm run check && npm test`
Expected: `0 ERRORS`, all tests pass.

```bash
git add src/lib/logo.ts src/lib/logo.test.ts src/lib/components/Logo.svelte src/lib/hazards.svelte.ts scripts/make-icons.js static/favicon.svg static/apple-touch-icon.png src/app.html
git commit -m "web: D signal-shield logo with live arc, favicon builder, shared hazard store"
```

---
### Task 5: Prepare guide content

**Files:**
- Create: `web/src/lib/prepare/guides.ts`
- Create: `web/src/lib/prepare/guides.test.ts`

**Interfaces:**
- Consumes: `HazardType`, `Lvl` from `levels`; `getLocale` from Paraglide runtime.
- Produces:
```ts
export type Text = { en: string; th: string };
export const GUIDES: readonly ['flood', 'flash-flood', 'storm', 'smoke', 'heat', 'earthquake', 'tsunami', 'landslide', 'drought', 'chemical'];
export type GuideId = (typeof GUIDES)[number];
export type Guide = { title: Text; summary: Text; before: Text[]; during: Text[]; after: Text[] };
export const GUIDE: Record<GuideId, Guide>;
export const GUIDE_FOR: Partial<Record<HazardType, GuideId>>;
export const tx: (t: Text) => string;                 // current locale
export function stepsFor(type: HazardType, level: Lvl): Text[];   // watch → before[0..3], warning → during[0..3], else []
export const GO_BAG: { id: string; text: Text }[];
export const NUMBERS: { tel: string; name: Text }[];
```

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/prepare/guides.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { GO_BAG, GUIDE, GUIDE_FOR, GUIDES, NUMBERS, stepsFor } from './guides';

describe('guides', () => {
	it('every guide has a title, a summary and at least 3 items per phase, in both languages', () => {
		for (const id of GUIDES) {
			const g = GUIDE[id];
			for (const t of [g.title, g.summary, ...g.before, ...g.during, ...g.after]) {
				expect(t.en.trim(), id).not.toBe('');
				expect(t.th.trim(), id).not.toBe('');
			}
			expect(g.before.length, id).toBeGreaterThanOrEqual(3);
			expect(g.during.length, id).toBeGreaterThanOrEqual(3);
			expect(g.after.length, id).toBeGreaterThanOrEqual(3);
		}
	});
	it('maps hazards to guides', () => {
		expect(GUIDE_FOR.rain).toBe('flash-flood');
		expect(GUIDE_FOR.wildfire).toBe('smoke');
		expect(GUIDE_FOR.volcano).toBeUndefined();
	});
	it('what-to-do steps: watch = first 3 Before, warning = first 3 During, safe = none', () => {
		expect(stepsFor('smoke', 'watch')).toEqual(GUIDE.smoke.before.slice(0, 3));
		expect(stepsFor('smoke', 'warning')).toEqual(GUIDE.smoke.during.slice(0, 3));
		expect(stepsFor('smoke', 'safe')).toEqual([]);
		expect(stepsFor('volcano', 'warning')).toEqual([]);
	});
	it('go-bag ids are unique and emergency numbers include 1784', () => {
		expect(new Set(GO_BAG.map((i) => i.id)).size).toBe(GO_BAG.length);
		expect(NUMBERS.map((n) => n.tel)).toEqual(['1784', '1669', '191', '199', '1155', '1182']);
	});
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npm test -- src/lib/prepare`
Expected: FAIL, `Failed to resolve import "./guides"`.

- [ ] **Step 3: Write `web/src/lib/prepare/guides.ts`**

```ts
import type { HazardType, Lvl } from '../levels';
import { getLocale } from '../paraglide/runtime.js';

export type Text = { en: string; th: string };
export type Guide = { title: Text; summary: Text; before: Text[]; during: Text[]; after: Text[] };

const t = (en: string, th: string): Text => ({ en, th });
export const tx = (x: Text): string => x[getLocale()];

export const GUIDES = ['flood', 'flash-flood', 'storm', 'smoke', 'heat', 'earthquake', 'tsunami', 'landslide', 'drought', 'chemical'] as const;
export type GuideId = (typeof GUIDES)[number];

// Thai text is a draft for native review (messages/TH_REVIEW.md).
export const GUIDE: Record<GuideId, Guide> = {
	flood: {
		title: t('Flood', 'น้ำท่วม'),
		summary: t('Rivers and rain overflow into streets and homes.', 'น้ำจากแม่น้ำและฝนล้นเข้าถนนและบ้านเรือน'),
		before: [
			t('Know your nearest shelter and two ways to get there.', 'รู้ตำแหน่งที่พักพิงใกล้บ้านและเส้นทางไปอย่างน้อยสองเส้นทาง'),
			t('Move valuables, documents and medicine to a high shelf or upper floor.', 'ย้ายของมีค่า เอกสาร และยาไว้ที่สูงหรือชั้นบน'),
			t('Charge your phone and a power bank; keep a torch ready.', 'ชาร์จโทรศัพท์และพาวเวอร์แบงก์ เตรียมไฟฉายไว้'),
			t('Pack a go-bag with water, food and ID for three days.', 'เตรียมกระเป๋าฉุกเฉิน มีน้ำ อาหาร และบัตรประชาชน พอสำหรับสามวัน')
		],
		during: [
			t('Move to higher ground or the nearest shelter now.', 'ไปยังที่สูงหรือที่พักพิงที่ใกล้ที่สุดทันที'),
			t('Turn off electricity at the main switch before water reaches sockets.', 'ตัดไฟที่เบรกเกอร์หลักก่อนน้ำถึงปลั๊กไฟ'),
			t('Never walk or drive through moving water; 15 cm can knock you down.', 'ห้ามเดินหรือขับรถผ่านน้ำไหลเชี่ยว น้ำสูงเพียง 15 ซม. ก็ทำให้ล้มได้'),
			t('Take ID, medicine, phone, charger and drinking water.', 'นำบัตรประชาชน ยา โทรศัพท์ ที่ชาร์จ และน้ำดื่มติดตัวไป')
		],
		after: [
			t('Return home only when officials say it is safe.', 'กลับบ้านเมื่อเจ้าหน้าที่แจ้งว่าปลอดภัยแล้วเท่านั้น'),
			t('Have an electrician check wiring before switching power on.', 'ให้ช่างไฟตรวจระบบไฟก่อนเปิดใช้งาน'),
			t('Throw away food and water that touched floodwater.', 'ทิ้งอาหารและน้ำที่สัมผัสน้ำท่วม'),
			t('Watch for snakes and sharp debris when cleaning up.', 'ระวังงูและเศษวัสดุมีคมขณะทำความสะอาด')
		]
	},
	'flash-flood': {
		title: t('Flash flood and heavy rain', 'น้ำป่าไหลหลากและฝนตกหนัก'),
		summary: t('Water rises within minutes after heavy rain, often near hills.', 'น้ำขึ้นเร็วภายในไม่กี่นาทีหลังฝนตกหนัก มักเกิดใกล้ภูเขา'),
		before: [
			t('Check the rain forecast before hiking or camping near rivers.', 'ตรวจพยากรณ์ฝนก่อนเดินป่าหรือตั้งแคมป์ใกล้ลำน้ำ'),
			t('Learn the high ground near your home, school and work.', 'รู้จักจุดที่สูงใกล้บ้าน โรงเรียน และที่ทำงาน'),
			t('Clear drains and gutters around your house.', 'ลอกท่อระบายน้ำและรางน้ำรอบบ้าน'),
			t('Keep your phone charged and alerts switched on.', 'ชาร์จโทรศัพท์ให้เต็มและเปิดการแจ้งเตือนไว้')
		],
		during: [
			t('Leave river banks, streams and low roads immediately.', 'ออกจากริมแม่น้ำ ลำธาร และถนนที่ต่ำทันที'),
			t('Climb to higher ground; do not wait for the water to rise.', 'ขึ้นที่สูงทันที อย่ารอให้น้ำขึ้น'),
			t('Do not cross flooded roads or bridges, even in a car.', 'ห้ามข้ามถนนหรือสะพานที่น้ำท่วม แม้จะอยู่ในรถ'),
			t('A roaring sound upstream means water is coming.', 'หากได้ยินเสียงน้ำดังมาจากต้นน้ำ แสดงว่าน้ำกำลังมา')
		],
		after: [
			t('Stay away from river banks; they can collapse.', 'อยู่ห่างจากตลิ่ง เพราะอาจพังได้'),
			t('Report blocked roads and damaged bridges.', 'แจ้งถนนที่ถูกปิดกั้นและสะพานที่เสียหาย'),
			t('Check on neighbours, especially older people.', 'ดูแลเพื่อนบ้าน โดยเฉพาะผู้สูงอายุ'),
			t('Boil water until the supply is confirmed safe.', 'ต้มน้ำก่อนดื่มจนกว่าจะยืนยันว่าน้ำประปาปลอดภัย')
		]
	},
	storm: {
		title: t('Storm', 'พายุ'),
		summary: t('Tropical storms bring strong wind, heavy rain and storm surge.', 'พายุโซนร้อนนำลมแรง ฝนตกหนัก และคลื่นพายุซัดฝั่ง'),
		before: [
			t('Tie down or bring in loose objects outside.', 'ผูกยึดหรือเก็บสิ่งของนอกบ้านที่อาจปลิว'),
			t('Trim branches that hang over your roof or power lines.', 'ตัดกิ่งไม้ที่ยื่นเหนือหลังคาหรือสายไฟ'),
			t('Stock water, food, a torch and batteries for three days.', 'สำรองน้ำ อาหาร ไฟฉาย และถ่านไว้สามวัน'),
			t('Know which room in your home is the strongest.', 'รู้ว่าห้องไหนในบ้านแข็งแรงที่สุด')
		],
		during: [
			t('Stay indoors, away from windows and glass doors.', 'อยู่ในอาคาร ห่างจากหน้าต่างและประตูกระจก'),
			t('Unplug electrical devices if lightning is close.', 'ถอดปลั๊กเครื่องใช้ไฟฟ้าเมื่อฟ้าผ่าใกล้'),
			t('Do not go out on boats or to the beach.', 'ห้ามออกเรือหรือลงชายหาด'),
			t('If told to evacuate, leave early while roads are open.', 'หากได้รับแจ้งให้อพยพ ให้ออกเดินทางแต่เนิ่นๆ ขณะถนนยังใช้ได้')
		],
		after: [
			t('Stay away from fallen power lines and report them.', 'อยู่ห่างจากสายไฟที่ขาดและแจ้งการไฟฟ้า'),
			t('Watch for flooding after the storm passes.', 'ระวังน้ำท่วมหลังพายุผ่านไป'),
			t('Photograph damage for insurance before cleaning.', 'ถ่ายภาพความเสียหายไว้เพื่อประกันก่อนทำความสะอาด'),
			t('Use your phone only for urgent calls so lines stay free.', 'ใช้โทรศัพท์เฉพาะเรื่องเร่งด่วน เพื่อให้สายว่าง')
		]
	},
	smoke: {
		title: t('Smoke and haze (PM2.5)', 'หมอกควันและฝุ่น PM2.5'),
		summary: t('Fine dust from fires and traffic that harms lungs and heart.', 'ฝุ่นละเอียดจากการเผาและการจราจรที่ทำร้ายปอดและหัวใจ'),
		before: [
			t('Buy N95 masks for everyone at home; cloth masks do not filter PM2.5.', 'ซื้อหน้ากาก N95 ให้ทุกคนในบ้าน หน้ากากผ้ากรอง PM2.5 ไม่ได้'),
			t('Pick one room to seal and run an air purifier in.', 'เลือกห้องหนึ่งห้อง ปิดให้มิดชิดและเปิดเครื่องฟอกอากาศ'),
			t('Keep asthma and heart medicine stocked.', 'สำรองยาโรคหอบหืดและโรคหัวใจให้พอ'),
			t('Check PM2.5 each morning before going out.', 'ตรวจค่า PM2.5 ทุกเช้าก่อนออกจากบ้าน')
		],
		during: [
			t('Stay indoors with doors and windows closed.', 'อยู่ในอาคาร ปิดประตูและหน้าต่าง'),
			t('Wear an N95 mask whenever you go outside.', 'สวมหน้ากาก N95 ทุกครั้งที่ออกนอกอาคาร'),
			t('Avoid exercise outdoors, especially children and older people.', 'งดออกกำลังกายกลางแจ้ง โดยเฉพาะเด็กและผู้สูงอายุ'),
			t('See a doctor if you have chest pain or trouble breathing.', 'พบแพทย์หากเจ็บหน้าอกหรือหายใจลำบาก')
		],
		after: [
			t('Air out your home once PM2.5 drops below 37.5.', 'เปิดระบายอากาศเมื่อค่า PM2.5 ลดต่ำกว่า 37.5'),
			t('Change or clean air purifier filters.', 'เปลี่ยนหรือทำความสะอาดแผ่นกรองเครื่องฟอกอากาศ'),
			t('Report burning you see to local authorities.', 'แจ้งการเผาที่พบเห็นต่อหน่วยงานท้องถิ่น'),
			t('Keep spare masks for the next haze season.', 'เก็บหน้ากากสำรองไว้ใช้ในฤดูหมอกควันครั้งหน้า')
		]
	},
	heat: {
		title: t('Extreme heat', 'อากาศร้อนจัด'),
		summary: t('Heat that can cause heatstroke, mostly March to May.', 'ความร้อนที่อาจทำให้เกิดฮีทสโตรก มักเกิดช่วงมีนาคมถึงพฤษภาคม'),
		before: [
			t('Plan outdoor work for early morning or evening.', 'วางแผนทำงานกลางแจ้งช่วงเช้าตรู่หรือเย็น'),
			t('Find a cool place nearby: a mall, library or temple hall.', 'หาที่เย็นใกล้บ้าน เช่น ห้างสรรพสินค้า ห้องสมุด หรือศาลาวัด'),
			t('Check that older relatives have a fan or air conditioning.', 'ตรวจดูว่าญาติผู้สูงอายุมีพัดลมหรือเครื่องปรับอากาศ'),
			t('Keep oral rehydration salts at home.', 'มีผงเกลือแร่ติดบ้านไว้')
		],
		during: [
			t('Stay out of the sun between 11:00 and 15:00.', 'หลีกเลี่ยงแดดช่วง 11:00 ถึง 15:00 น.'),
			t('Drink water every 20 minutes, even if you are not thirsty.', 'ดื่มน้ำทุก 20 นาที แม้ไม่รู้สึกกระหาย'),
			t('Never leave children or pets in a parked car.', 'ห้ามทิ้งเด็กหรือสัตว์เลี้ยงไว้ในรถที่จอดอยู่'),
			t('Dizziness, confusion or no sweating means heatstroke: call 1669.', 'เวียนหัว สับสน หรือเหงื่อไม่ออก คือสัญญาณฮีทสโตรก ให้โทร 1669')
		],
		after: [
			t('Keep drinking water for the rest of the day.', 'ดื่มน้ำต่อเนื่องตลอดวัน'),
			t('Check on neighbours who live alone.', 'ไปดูเพื่อนบ้านที่อยู่คนเดียว'),
			t('Rest in the shade before going back to hard work.', 'พักในที่ร่มก่อนกลับไปทำงานหนัก'),
			t('Watch for headaches or cramps the next day.', 'สังเกตอาการปวดหัวหรือตะคริวในวันถัดไป')
		]
	},
	earthquake: {
		title: t('Earthquake', 'แผ่นดินไหว'),
		summary: t('Shaking from faults in the north and west, or from Myanmar.', 'การสั่นไหวจากรอยเลื่อนทางเหนือและตะวันตก หรือจากเมียนมา'),
		before: [
			t('Fix tall furniture and shelves to the wall.', 'ยึดเฟอร์นิเจอร์สูงและชั้นวางของไว้กับผนัง'),
			t('Practise Drop, Cover, Hold On with your family.', 'ฝึก หมอบ ป้อง เกาะ กับครอบครัว'),
			t('Know how to turn off gas and electricity.', 'รู้วิธีปิดแก๊สและตัดไฟ'),
			t('Agree on a meeting point outside your building.', 'นัดจุดรวมพลนอกอาคาร')
		],
		during: [
			t('Drop to the floor, cover your head, hold on to sturdy furniture.', 'หมอบลงกับพื้น ป้องศีรษะ เกาะโต๊ะที่แข็งแรง'),
			t('Stay away from windows and heavy objects that can fall.', 'อยู่ห่างจากหน้าต่างและของหนักที่อาจตกลงมา'),
			t('Do not use lifts; do not run outside while it is shaking.', 'ห้ามใช้ลิฟต์ และอย่าวิ่งออกนอกอาคารขณะสั่น'),
			t('If outside, move away from buildings, trees and power lines.', 'หากอยู่ข้างนอก ให้ออกห่างจากอาคาร ต้นไม้ และสายไฟ')
		],
		after: [
			t('Expect aftershocks; leave damaged buildings.', 'ระวังอาฟเตอร์ช็อก และออกจากอาคารที่เสียหาย'),
			t('Check for gas leaks; do not use flames.', 'ตรวจหาแก๊สรั่ว ห้ามจุดไฟ'),
			t('On the Andaman coast, move inland in case of a tsunami.', 'หากอยู่ชายฝั่งอันดามัน ให้ไปยังพื้นที่ด้านใน เผื่อเกิดสึนามิ'),
			t('Send a text instead of calling so lines stay free.', 'ส่งข้อความแทนการโทร เพื่อให้สายว่าง')
		]
	},
	tsunami: {
		title: t('Tsunami', 'สึนามิ'),
		summary: t('Giant waves on the Andaman coast after a large undersea quake.', 'คลื่นยักษ์ชายฝั่งอันดามันหลังแผ่นดินไหวใต้ทะเลขนาดใหญ่'),
		before: [
			t('Learn the tsunami evacuation signs near the beach.', 'จำป้ายเส้นทางอพยพสึนามิใกล้ชายหาด'),
			t('Know the nearest high ground or tall concrete building.', 'รู้จุดที่สูงหรืออาคารคอนกรีตสูงที่ใกล้ที่สุด'),
			t('Keep a go-bag ready if you live on the coast.', 'เตรียมกระเป๋าฉุกเฉินไว้หากอยู่ชายฝั่ง'),
			t('Know the sound of the warning tower in your area.', 'รู้จักเสียงหอเตือนภัยในพื้นที่')
		],
		during: [
			t('Strong shaking or the sea pulling back: run to high ground now.', 'แผ่นดินไหวแรงหรือน้ำทะเลลดลงผิดปกติ ให้วิ่งขึ้นที่สูงทันที'),
			t('Go on foot; roads jam quickly.', 'เดินเท้า เพราะถนนจะติดอย่างรวดเร็ว'),
			t('Go at least 10 m above sea level or 2 km inland.', 'ขึ้นที่สูงอย่างน้อย 10 เมตรจากระดับน้ำทะเล หรือเข้าฝั่งอย่างน้อย 2 กม.'),
			t('Do not go back for belongings.', 'อย่าย้อนกลับไปเอาของ')
		],
		after: [
			t('Stay on high ground; more waves can follow for hours.', 'อยู่บนที่สูงต่อ อาจมีคลื่นตามมาอีกหลายชั่วโมง'),
			t('Return only after an official all-clear.', 'กลับเมื่อทางการประกาศว่าปลอดภัยแล้วเท่านั้น'),
			t('Stay out of damaged buildings and floodwater.', 'อย่าเข้าอาคารที่เสียหายหรือน้ำท่วมขัง'),
			t('Help others only when you are safe yourself.', 'ช่วยเหลือผู้อื่นเมื่อตัวเองปลอดภัยแล้วเท่านั้น')
		]
	},
	landslide: {
		title: t('Landslide', 'ดินถล่ม'),
		summary: t('Slopes give way after days of heavy rain.', 'ลาดดินพังทลายหลังฝนตกหนักหลายวัน'),
		before: [
			t('Know if your home is on or below a steep slope.', 'รู้ว่าบ้านอยู่บนหรือใต้ลาดชันหรือไม่'),
			t('Watch for new cracks in walls, ground or roads.', 'สังเกตรอยแตกใหม่ที่ผนัง พื้นดิน หรือถนน'),
			t('Plan a route away from slopes and valleys.', 'วางแผนเส้นทางที่ห่างจากลาดเขาและหุบเขา'),
			t('Follow heavy rain warnings closely.', 'ติดตามประกาศเตือนฝนตกหนักอย่างใกล้ชิด')
		],
		during: [
			t('Muddy stream water or falling rocks: leave the slope now.', 'น้ำในลำธารขุ่นหรือมีหินร่วง ให้ออกจากลาดเขาทันที'),
			t('Move sideways out of the path of a slide, not downhill.', 'หนีออกด้านข้าง ไม่ใช่ลงตามทางดินถล่ม'),
			t('Stay away from river valleys and low areas.', 'อยู่ห่างจากหุบน้ำและที่ลุ่มต่ำ'),
			t('If you cannot escape, curl up and protect your head.', 'หากหนีไม่ทัน ให้ขดตัวและป้องศีรษะ')
		],
		after: [
			t('Stay away from the slide area; more can fall.', 'อยู่ห่างจากพื้นที่ดินถล่ม อาจถล่มซ้ำ'),
			t('Report broken roads, power and water lines.', 'แจ้งถนน สายไฟ และท่อน้ำที่เสียหาย'),
			t('Watch for flooding below the slide.', 'ระวังน้ำท่วมบริเวณใต้จุดดินถล่ม'),
			t('Have the slope checked before going home.', 'ให้ผู้เชี่ยวชาญตรวจลาดดินก่อนกลับบ้าน')
		]
	},
	drought: {
		title: t('Drought', 'ภัยแล้ง'),
		summary: t('Long dry spells that cut water for homes and farms.', 'ช่วงแล้งยาวนานที่ทำให้ขาดน้ำใช้ในบ้านและการเกษตร'),
		before: [
			t('Fix leaking taps and pipes.', 'ซ่อมก๊อกและท่อน้ำที่รั่ว'),
			t('Store drinking water in clean, closed containers.', 'เก็บน้ำดื่มในภาชนะที่สะอาดและมีฝาปิด'),
			t("Learn your area's water supply schedule.", 'รู้ตารางการจ่ายน้ำในพื้นที่'),
			t('Farmers: ask the local office about drought-tolerant crops.', 'เกษตรกร: สอบถามสำนักงานเกษตรเรื่องพืชทนแล้ง')
		],
		during: [
			t('Use water for drinking and cooking first.', 'ใช้น้ำเพื่อดื่มและทำอาหารเป็นอันดับแรก'),
			t('Reuse washing water for plants and toilets.', 'นำน้ำจากการซักล้างไปรดต้นไม้หรือราดห้องน้ำ'),
			t('Do not burn fields; dry land catches fire fast.', 'ห้ามเผาไร่ พื้นที่แห้งติดไฟได้ง่าย'),
			t('Get water from official distribution points if the supply stops.', 'หากน้ำหยุดไหล ให้รับน้ำจากจุดแจกจ่ายของทางการ')
		],
		after: [
			t('Keep saving water until reservoirs recover.', 'ประหยัดน้ำต่อไปจนกว่าแหล่งน้ำจะฟื้นตัว'),
			t('Clean stored water containers.', 'ทำความสะอาดภาชนะเก็บน้ำ'),
			t('Ask about government drought relief.', 'สอบถามความช่วยเหลือภัยแล้งจากภาครัฐ'),
			t('Plan rainwater collection for next season.', 'วางแผนเก็บน้ำฝนสำหรับฤดูถัดไป')
		]
	},
	chemical: {
		title: t('Chemical incident', 'อุบัติภัยสารเคมี'),
		summary: t('Leaks, fires or spills at factories and on roads.', 'การรั่วไหล ไฟไหม้ หรือสารเคมีหกในโรงงานและบนถนน'),
		before: [
			t('Know if you live near factories or chemical storage.', 'รู้ว่าบ้านอยู่ใกล้โรงงานหรือคลังสารเคมีหรือไม่'),
			t('Keep tape and a plastic sheet to seal a room.', 'เตรียมเทปและแผ่นพลาสติกไว้ปิดห้อง'),
			t('Know two ways out of your area.', 'รู้เส้นทางออกจากพื้นที่อย่างน้อยสองเส้นทาง'),
			t('Save 1784 and 199 in your phone.', 'บันทึกเบอร์ 1784 และ 199 ไว้ในโทรศัพท์')
		],
		during: [
			t('Go indoors, close windows, turn off fans and air conditioning.', 'เข้าอาคาร ปิดหน้าต่าง ปิดพัดลมและเครื่องปรับอากาศ'),
			t('If told to evacuate, leave upwind and uphill.', 'หากได้รับแจ้งให้อพยพ ให้ไปทางเหนือลมและที่สูง'),
			t('Cover your nose and mouth with a wet cloth.', 'ปิดจมูกและปากด้วยผ้าชุบน้ำ'),
			t('Do not touch spilled liquids or smoke residue.', 'ห้ามสัมผัสของเหลวที่หกหรือคราบควัน')
		],
		after: [
			t('Return only when officials say the air is safe.', 'กลับเมื่อทางการแจ้งว่าอากาศปลอดภัยแล้วเท่านั้น'),
			t('Wash skin and clothes that were exposed.', 'ล้างผิวหนังและเสื้อผ้าที่สัมผัสสารเคมี'),
			t('See a doctor if your eyes, skin or breathing hurt.', 'พบแพทย์หากแสบตา ระคายผิว หรือหายใจลำบาก'),
			t('Do not eat garden vegetables until they are checked.', 'อย่ากินผักในสวนจนกว่าจะได้รับการตรวจ')
		]
	}
};

export const GUIDE_FOR: Partial<Record<HazardType, GuideId>> = {
	flood: 'flood',
	rain: 'flash-flood',
	storm: 'storm',
	smoke: 'smoke',
	wildfire: 'smoke',
	heat: 'heat',
	earthquake: 'earthquake',
	tsunami: 'tsunami',
	landslide: 'landslide',
	drought: 'drought',
	chemical: 'chemical'
};

/** What to do now: the first three Before items at Watch, the first three During items at Warning. */
export function stepsFor(type: HazardType, level: Lvl): Text[] {
	const id = GUIDE_FOR[type];
	if (!id || level === 'safe') return [];
	return (level === 'warning' ? GUIDE[id].during : GUIDE[id].before).slice(0, 3);
}

export const GO_BAG: { id: string; text: Text }[] = [
	{ id: 'water', text: t('Water: 3 litres per person per day, for 3 days', 'น้ำดื่ม 3 ลิตรต่อคนต่อวัน สำหรับ 3 วัน') },
	{ id: 'food', text: t('Ready-to-eat food for 3 days', 'อาหารพร้อมกินสำหรับ 3 วัน') },
	{ id: 'meds', text: t('Medicine for 7 days and copies of prescriptions', 'ยาประจำตัว 7 วันและสำเนาใบสั่งยา') },
	{ id: 'docs', text: t('Copies of ID card, passport and house registration in a waterproof bag', 'สำเนาบัตรประชาชน พาสปอร์ต และทะเบียนบ้าน ใส่ถุงกันน้ำ') },
	{ id: 'phone', text: t('Phone, charger and a full power bank', 'โทรศัพท์ ที่ชาร์จ และพาวเวอร์แบงก์ที่ชาร์จเต็ม') },
	{ id: 'torch', text: t('Torch and spare batteries', 'ไฟฉายและถ่านสำรอง') },
	{ id: 'radio', text: t('Battery or wind-up radio', 'วิทยุใช้ถ่านหรือแบบหมุนมือ') },
	{ id: 'firstaid', text: t('First-aid kit', 'ชุดปฐมพยาบาล') },
	{ id: 'masks', text: t('N95 masks', 'หน้ากาก N95') },
	{ id: 'cash', text: t('Cash in small notes', 'เงินสดเป็นธนบัตรย่อย') },
	{ id: 'clothes', text: t('Change of clothes and a rain jacket', 'เสื้อผ้าสำรองและเสื้อกันฝน') },
	{ id: 'hygiene', text: t('Soap, toothbrush and sanitary items', 'สบู่ แปรงสีฟัน และของใช้ส่วนตัว') },
	{ id: 'whistle', text: t('Whistle to call for help', 'นกหวีดสำหรับขอความช่วยเหลือ') },
	{ id: 'blanket', text: t('Blanket or sleeping mat', 'ผ้าห่มหรือเสื่อนอน') },
	{ id: 'contacts', text: t('Paper list of family phone numbers', 'รายชื่อเบอร์โทรครอบครัวที่เขียนบนกระดาษ') }
];

export const NUMBERS: { tel: string; name: Text }[] = [
	{ tel: '1784', name: t('Disaster hotline (DDPM)', 'สายด่วนป้องกันและบรรเทาสาธารณภัย (ปภ.)') },
	{ tel: '1669', name: t('Medical emergency', 'การแพทย์ฉุกเฉิน') },
	{ tel: '191', name: t('Police', 'ตำรวจ') },
	{ tel: '199', name: t('Fire', 'ดับเพลิง') },
	{ tel: '1155', name: t('Tourist police', 'ตำรวจท่องเที่ยว') },
	{ tel: '1182', name: t('Weather (TMD)', 'กรมอุตุนิยมวิทยา') }
];
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/lib/prepare`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/prepare/guides.ts src/lib/prepare/guides.test.ts
git commit -m "web: Prepare guide content (10 hazards, EN + Thai draft), go-bag and emergency numbers"
```

---

### Task 6: Shell (top bar, tab bar, SOS, location, Demo chip, first-visit note, redirects)

**Files:**
- Create: `web/src/lib/tabs.ts`
- Create: `web/src/lib/components/TopBar.svelte`, `TabBar.svelte`, `PlacePicker.svelte`, `FirstVisitNote.svelte`
- Rewrite: `web/src/lib/components/Shell.svelte`
- Modify: `web/src/lib/components/LangToggle.svelte` (dark style)
- Modify: `web/src/lib/hazards.svelte.ts` (add `clock`)
- Modify: `web/src/hooks.server.ts` (redirects)
- Modify: `web/messages/en.json`, `web/messages/th.json`
- Create: `web/tests/e2e/shell.spec.ts`
- Modify: `web/tests/e2e/fixtures.ts` (`seenNote` option), `web/tests/e2e/shelters.spec.ts` (drop the evacuation test), `web/tests/e2e/a11y.spec.ts` (paths)
- Delete: `web/src/routes/{disasters,info,weather,evacuation}/`, `web/tests/e2e/{home,disasters,info,weather}.spec.ts`

**Interfaces:**
- Consumes: `live`, `refresh` (Task 4); `shown`, `Overall` (Task 2); `faviconHref` (Task 4); `Logo` (Task 4); `here`, `PROVINCES`, `setPlace`, `useGps` (existing).
- Produces:
```ts
// tabs.ts
export const TABS: { path: string; label: () => string; icon: IconComponent }[]; // '/', '/map', '/shelters', '/prepare', '/more'
export const activeTab: (current: string, path: string) => boolean;
// hazards.svelte.ts (added)
export const clock: { now: number };          // ticks every 60 s, driven by Shell
export const currentLevel: () => Overall;     // live.a ? shown(live.a, clock.now) : 'unknown'
```
- New messages: `nav_now`, `nav_prepare`, `nav_more`, `sos_aria`, `demo_chip`, `demo_chip_aria`, `place_change`, `search_label`, `first_visit_body`, `first_visit_ok`, `lvl_safe`, `lvl_watch`, `lvl_warning`, `lvl_unknown`, `live_label`.

- [ ] **Step 1: Add the messages**

Add to `web/messages/en.json`:
```json
	"nav_now": "Now",
	"nav_prepare": "Prepare",
	"nav_more": "More",
	"live_label": "Live",
	"sos_aria": "Call 1784, Thailand's disaster hotline",
	"demo_chip": "Demo",
	"demo_chip_aria": "About this demo and its data",
	"place_change": "Change location",
	"search_label": "Search a province or shelter",
	"first_visit_body": "DEMS is a student project. Levels are estimates from public data, not official warnings. Follow TMD and DDPM instructions. In an emergency call 1784.",
	"first_visit_ok": "Got it",
	"lvl_safe": "Safe",
	"lvl_watch": "Watch",
	"lvl_warning": "Warning",
	"lvl_unknown": "Unknown"
```
Add to `web/messages/th.json`:
```json
	"nav_now": "ตอนนี้",
	"nav_prepare": "เตรียมพร้อม",
	"nav_more": "เพิ่มเติม",
	"live_label": "สด",
	"sos_aria": "โทร 1784 สายด่วนภัยพิบัติ",
	"demo_chip": "เดโม",
	"demo_chip_aria": "เกี่ยวกับเดโมนี้และข้อมูล",
	"place_change": "เปลี่ยนตำแหน่ง",
	"search_label": "ค้นหาจังหวัดหรือที่พักพิง",
	"first_visit_body": "DEMS เป็นโครงงานของนักศึกษา ระดับเตือนภัยเป็นการประเมินจากข้อมูลสาธารณะ ไม่ใช่ประกาศทางการ โปรดปฏิบัติตามคำแนะนำของกรมอุตุนิยมวิทยาและ ปภ. กรณีฉุกเฉินโทร 1784",
	"first_visit_ok": "เข้าใจแล้ว",
	"lvl_safe": "ปลอดภัย",
	"lvl_watch": "เฝ้าระวัง",
	"lvl_warning": "เตือนภัย",
	"lvl_unknown": "ไม่ทราบ"
```
(In both files, add a comma after the previous last entry. The files must stay valid JSON.)

- [ ] **Step 2: Add the clock to the hazard store**

Append to `web/src/lib/hazards.svelte.ts`:
```ts
import { shown, type Overall } from './levels';

/** Ticks once a minute (Shell drives it) so stale data turns Unknown without a reload. */
export const clock = $state({ now: Date.now() });
export const currentLevel = (): Overall => (live.a ? shown(live.a, clock.now) : 'unknown');
```
(Merge the import with the existing `./levels` import at the top of the file.)

- [ ] **Step 3: Write `web/src/lib/tabs.ts`**

```ts
import { BookOpenCheck, Ellipsis, Map as MapIcon, Radio, Tent } from '@lucide/svelte';
import { m } from './paraglide/messages.js';
import type { IconComponent } from './types';

export const TABS: { path: string; label: () => string; icon: IconComponent }[] = [
	{ path: '/', label: m.nav_now, icon: Radio },
	{ path: '/map', label: m.nav_map, icon: MapIcon },
	{ path: '/shelters', label: m.nav_shelters, icon: Tent },
	{ path: '/prepare', label: m.nav_prepare, icon: BookOpenCheck },
	{ path: '/more', label: m.nav_more, icon: Ellipsis }
];

export const activeTab = (current: string, path: string) => (path === '/' ? current === '/' : current.startsWith(path));
```
If `BookOpenCheck` or `Ellipsis` is missing from the installed `@lucide/svelte`, use `ListChecks` and `Menu` instead (check with `npm run check`).

- [ ] **Step 4: Write `web/src/lib/components/PlacePicker.svelte`**

```svelte
<script lang="ts">
	import { ChevronDown, LocateFixed } from '@lucide/svelte';
	import { here, PROVINCES, setPlace, useGps } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let box: HTMLDetailsElement;
	let busy = $state(false);
	const name = $derived(
		here.place.via === 'gps' ? m.location_gps() : here.place.via === 'default' ? m.location_default() : here.place.name
	);

	async function gps() {
		busy = true;
		await useGps();
		busy = false;
		if (!here.error) box.open = false;
	}
	function pick(e: Event) {
		const p = PROVINCES.find((x) => x.name === (e.currentTarget as HTMLSelectElement).value);
		if (p) {
			setPlace({ ...p, via: 'province' });
			box.open = false;
		}
	}
</script>

<details bind:this={box} class="relative">
	<summary
		class="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-lg px-2 text-sm text-muted hover:text-text [&::-webkit-details-marker]:hidden"
		aria-label={m.place_change()}
	>
		<span class="max-w-36 truncate">{name}</span><ChevronDown size={14} aria-hidden="true" />
	</summary>
	<div class="glass absolute top-12 left-0 z-40 flex w-64 flex-col gap-2 rounded-2xl bg-bg/90 p-3">
		<button
			type="button"
			onclick={gps}
			disabled={busy}
			class="flex min-h-11 items-center gap-2 rounded-lg bg-white/5 px-3 text-sm font-semibold disabled:opacity-50"
		>
			<LocateFixed size={16} aria-hidden="true" />{m.location_use_gps()}
		</button>
		<label class="flex flex-col gap-1 text-xs text-muted">
			{m.location_pick()}
			<select onchange={pick} class="min-h-11 rounded-lg border border-line bg-raised px-2 text-sm text-text">
				<option value="">{m.location_pick()}</option>
				{#each PROVINCES as p (p.name)}
					<option value={p.name} selected={here.place.via === 'province' && here.place.name === p.name}>{p.name}</option>
				{/each}
			</select>
		</label>
		{#if here.error}<p role="status" class="text-sm text-warning">{m.location_denied()}</p>{/if}
	</div>
</details>
```

- [ ] **Step 5: Write `web/src/lib/components/TopBar.svelte`**

```svelte
<script lang="ts">
	import { Phone, Search } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { api } from '$lib/config';
	import type { Overall } from '$lib/levels';
	import { PROVINCES, setPlace } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '$lib/paraglide/runtime.js';
	import { activeTab, TABS } from '$lib/tabs';
	import type { Shelter } from '$lib/types';
	import LangToggle from './LangToggle.svelte';
	import Logo from './Logo.svelte';
	import PlacePicker from './PlacePicker.svelte';

	let { level }: { level: Overall } = $props();
	let shelters = $state<Shelter[]>([]);
	const current = $derived(deLocalizeHref(page.url.pathname));

	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
		const slash = (e: KeyboardEvent) => {
			const t = e.target as HTMLElement;
			if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) {
				e.preventDefault();
				document.getElementById('top-search')?.focus();
			}
		};
		window.addEventListener('keydown', slash);
		return () => window.removeEventListener('keydown', slash);
	});

	function search(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const q = input.value.trim();
		const p = PROVINCES.find((x) => x.name === q);
		const s = shelters.find((x) => x.ShelterName === q);
		if (p) setPlace({ ...p, via: 'province' });
		else if (s) goto(localizeHref(`/shelters?focus=${s.ShelterID}`));
		else return;
		input.value = '';
		input.blur();
	}
</script>

<div class="mx-auto flex h-14 max-w-[1600px] items-center gap-2 px-3 md:gap-3 md:px-4">
	<a href={localizeHref('/')} class="flex min-h-11 items-center gap-2 font-bold tracking-tight">
		<Logo {level} size={26} />DEMS
		<span class="flex items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-warning uppercase">
			<span class="size-1.5 rounded-full bg-warning shadow-[0_0_0_3px_rgb(255_69_58/0.2)]" aria-hidden="true"></span><span class="hidden sm:inline">{m.live_label()}</span>
		</span>
	</a>
	<PlacePicker />
	<label class="ml-2 hidden min-h-9 w-72 items-center gap-2 rounded-lg border border-line bg-raised px-3 text-sm text-muted lg:flex">
		<Search size={14} aria-hidden="true" />
		<span class="sr-only">{m.search_label()}</span>
		<input id="top-search" list="top-search-list" placeholder={m.search_label()} onchange={search} class="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-muted" />
		<kbd class="rounded border border-line px-1 font-mono text-[10px]">/</kbd>
	</label>
	<datalist id="top-search-list">
		{#each PROVINCES as p (p.name)}<option value={p.name}></option>{/each}
		{#each shelters as s (s.ShelterID)}<option value={s.ShelterName}></option>{/each}
	</datalist>
	<nav aria-label={m.tabs_label()} class="ml-2 hidden gap-1 md:flex">
		{#each TABS as t (t.path)}
			<a
				href={localizeHref(t.path)}
				aria-current={activeTab(current, t.path) ? 'page' : undefined}
				class="rounded-lg px-3 py-1.5 text-sm font-medium {activeTab(current, t.path) ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}"
				>{t.label()}</a
			>
		{/each}
	</nav>
	<div class="ml-auto flex items-center gap-2">
		<a href={localizeHref('/about')} aria-label={m.demo_chip_aria()} class="inline-flex min-h-9 items-center rounded-full border border-line px-2.5 font-mono text-[10px] tracking-[0.1em] text-muted uppercase">{m.demo_chip()}</a>
		<span class="hidden md:inline-block"><LangToggle /></span>
		<a
			href="tel:1784"
			aria-label={m.sos_aria()}
			class="flex min-h-9 items-center gap-1.5 rounded-full bg-[#e5251b] px-3 text-xs font-bold text-white shadow-[0_4px_18px_rgb(229_37_27/0.35)]"
		>
			<Phone size={13} aria-hidden="true" />SOS · 1784
		</a>
	</div>
</div>
```
Note: `#e5251b` with white text has a 4.7:1 contrast. `--color-warning` (#ff453a) with white is only 3.4:1, so the SOS button uses the deeper red.

- [ ] **Step 6: Write `web/src/lib/components/TabBar.svelte`**

```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '$lib/paraglide/runtime.js';
	import { activeTab, TABS } from '$lib/tabs';

	const current = $derived(deLocalizeHref(page.url.pathname));
</script>

<nav
	aria-label={m.tabs_label()}
	class="glass fixed inset-x-0 bottom-0 z-30 border-x-0 border-b-0 bg-bg/80 pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<ul class="grid grid-cols-5">
		{#each TABS as t (t.path)}
			{@const on = activeTab(current, t.path)}
			<li>
				<a
					href={localizeHref(t.path)}
					aria-current={on ? 'page' : undefined}
					class="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium {on ? 'text-text' : 'text-muted'}"
				>
					<t.icon size={22} strokeWidth={on ? 2.2 : 1.7} aria-hidden="true" />
					{t.label()}
				</a>
			</li>
		{/each}
	</ul>
</nav>
```

- [ ] **Step 7: Write `web/src/lib/components/FirstVisitNote.svelte`**

```svelte
<script lang="ts">
	import { Info } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';

	const KEY = 'dems.seen-note';
	let show = $state(false);

	onMount(() => {
		try {
			show = localStorage.getItem(KEY) !== '1';
		} catch {
			show = true; // storage blocked: show it, it just won't be remembered
		}
	});
	function ok() {
		show = false;
		try {
			localStorage.setItem(KEY, '1');
		} catch {
			// private mode: fine
		}
	}
</script>

{#if show}
	<aside
		role="note"
		class="glass fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex items-start gap-3 rounded-2xl bg-bg/85 p-4 text-sm md:right-auto md:bottom-4 md:left-4 md:max-w-md"
	>
		<Info size={18} class="mt-0.5 shrink-0 text-info" aria-hidden="true" />
		<p class="flex-1 leading-relaxed">{m.first_visit_body()}</p>
		<button type="button" onclick={ok} class="min-h-11 shrink-0 rounded-lg bg-text px-3 font-semibold text-bg">{m.first_visit_ok()}</button>
	</aside>
{/if}
```

- [ ] **Step 8: Rewrite `web/src/lib/components/Shell.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { clock, currentLevel, refresh } from '$lib/hazards.svelte';
	import { here } from '$lib/location.svelte';
	import { faviconHref } from '$lib/logo';
	import FirstVisitNote from './FirstVisitNote.svelte';
	import TabBar from './TabBar.svelte';
	import TopBar from './TopBar.svelte';

	let { children }: { children: Snippet } = $props();
	let headerH = $state(56);
	const level = $derived(currentLevel());

	onMount(() => {
		const tick = setInterval(() => (clock.now = Date.now()), 60_000);
		const reload = setInterval(refresh, 10 * 60_000);
		return () => {
			clearInterval(tick);
			clearInterval(reload);
		};
	});
	// Reload whenever the chosen place changes (refresh reads here.place before its first await).
	$effect(() => {
		void here.place;
		refresh();
	});
	$effect(() => {
		document.documentElement.style.setProperty('--header-h', `${headerH}px`);
	});
	$effect(() => {
		const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
		if (link) link.href = faviconHref(level);
	});
</script>

<header bind:clientHeight={headerH} class="glass fixed inset-x-0 top-0 z-30 border-x-0 border-t-0 bg-bg/70">
	<TopBar {level} />
</header>

<main>{@render children()}</main>

<FirstVisitNote />
<TabBar />
```

- [ ] **Step 9: Restyle `LangToggle.svelte`**

In `web/src/lib/components/LangToggle.svelte`, replace the class string `rounded-md border border-ink px-2.5 py-1.5 font-mono text-xs font-medium` with `inline-flex min-h-9 items-center rounded-lg border border-line px-2.5 font-mono text-xs font-medium text-muted hover:text-text`.

- [ ] **Step 10: Redirect the old URLs**

In `web/src/hooks.server.ts`:
- Change the `@sveltejs/kit` import line to `import { redirect, type Handle } from '@sveltejs/kit';`.
- Add `import { deLocalizeUrl, extractLocaleFromUrl, localizeUrl } from '$lib/paraglide/runtime.js';`.
- Add this before `const i18n`:
```ts
/** Old addresses from the first redesign keep working (spec §3.2). */
const MOVED: Record<string, string> = {
	'/disasters': '/map',
	'/info': '/about',
	'/weather': '/',
	'/evacuation': '/shelters'
};
const moved: Handle = ({ event, resolve }) => {
	const to = MOVED[deLocalizeUrl(event.url).pathname];
	if (!to) return resolve(event);
	const locale = extractLocaleFromUrl(event.url) ?? 'en';
	redirect(308, localizeUrl(new URL(to, event.url), { locale }).pathname);
};
```
- Change the last line to `export const handle = sequence(moved, i18n, auth);`.

- [ ] **Step 11: Remove the pages the redirects replace, and keep the first-visit note out of other tests**

From here on, `/disasters`, `/info`, `/weather` and `/evacuation` redirect, so their pages and tests can never run again:
```bash
git rm -r src/routes/disasters src/routes/info src/routes/weather src/routes/evacuation
git rm tests/e2e/home.spec.ts tests/e2e/disasters.spec.ts tests/e2e/info.spec.ts tests/e2e/weather.spec.ts
```
- The old home map tests come back in `map.spec.ts` (Task 8). The geolocation test is in `shell.spec.ts` below.
- In `web/tests/e2e/shelters.spec.ts`, delete the whole `test('evacuation shows nearest open shelters and sample routes', ...)` block.
- In `web/tests/e2e/a11y.spec.ts`, change the path list to `['/', '/shelters', '/report', '/th']`. Task 14 widens it again.

The first-visit note sits above the tab bar and would block clicks in every other test. In `web/tests/e2e/fixtures.ts`:
- Change the extend type to `base.extend<{ backend: 'up' | 'down'; seenNote: boolean; mocks: void }>`.
- Add `seenNote: [true, { option: true }],` next to `backend`.
- Change the mocks fixture signature to `async ({ page, backend, seenNote }, use) => {`, and make its first line:
```ts
			if (seenNote) await page.addInitScript(() => localStorage.setItem('dems.seen-note', '1'));
```

- [ ] **Step 11b: Write the shell e2e tests**

Create `web/tests/e2e/shell.spec.ts`:
```ts
import { expect, test } from './fixtures';

test('top bar: logo, live, SOS calls 1784, Demo chip opens About', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /DEMS/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: "Call 1784, Thailand's disaster hotline" })).toHaveAttribute('href', 'tel:1784');
	await expect(page.getByRole('link', { name: 'About this demo and its data' })).toHaveAttribute('href', '/about');
});

test('phone tab bar has the five tabs', async ({ page }) => {
	await page.goto('/');
	const nav = page.getByRole('navigation').last();
	for (const name of ['Now', 'Map', 'Shelters', 'Prepare', 'More']) {
		await expect(nav.getByRole('link', { name })).toBeVisible();
	}
});

test('the browser tab icon shows the live level colour', async ({ page }) => {
	await page.goto('/');
	// fixtures: PM2.5 41.2 → Watch (amber)
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /%23ffb020/);
});

test.describe('first visit', () => {
	test.use({ seenNote: false });
	test('the note shows once', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('note')).toContainText('student project');
	await page.getByRole('button', { name: 'Got it' }).click();
		await page.reload();
		await expect(page.getByRole('note')).toHaveCount(0);
	});
});

for (const [from, to] of [
	['/disasters', '/map'],
	['/info', '/about'],
	['/weather', '/'],
	['/evacuation', '/shelters'],
	['/th/disasters', '/th/map']
]) {
	test(`${from} redirects to ${to}`, async ({ request }) => {
		const r = await request.get(from, { maxRedirects: 0 });
		expect(r.status()).toBe(308);
		expect(r.headers().location).toBe(to);
	});
}

test.describe('geolocation denied', () => {
	test.use({ permissions: [] });
	test('the place picker asks for a province instead', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/');
		await page.getByLabel('Change location').click();
		await page.getByRole('button', { name: 'Use my location' }).click();
		await expect(page.getByText('Location unavailable. Choose a province instead.')).toBeVisible();
	});
});
```
If `/th/disasters` redirects to `/th/map/` or similar, check `trailingSlash` in the Paraglide settings and fix the expected value to match the real localized path. Do not change the hook to fit a wrong expectation.

- [ ] **Step 12: Run the checks and the new e2e tests**

Run: `npm run check && npm test`
Expected: `0 ERRORS`, all unit tests pass.

Run: `npx playwright test tests/e2e/shell.spec.ts`
Expected: all shell tests pass. The `/map` redirect target returns 404 until Task 8. The redirect test only checks the 308 and the `location` header.

- [ ] **Step 13: Commit**

```bash
git add -A src messages tests
git commit -m "web: new shell (live logo arc, SOS 1784, place picker, search, tabs, first-visit note) and old-URL redirects"
```

---

### Task 7: Now screen (phone and desktop dashboard)

**Files:**
- Modify: `web/src/lib/labels.ts` (add hazard and level helpers)
- Modify: `web/src/lib/types.ts` (`MapMarker.kind` adds `'safe' | 'watch' | 'warning'`)
- Modify: `web/src/lib/components/Sheet.svelte` (dark style)
- Create: `web/src/lib/components/LevelBadge.svelte`, `LevelScale.svelte`, `HazardList.svelte`, `HazardSheet.svelte`, `ConditionTiles.svelte`, `NowPanel.svelte`
- Rewrite: `web/src/routes/+page.svelte`
- Modify: `web/messages/en.json`, `web/messages/th.json`
- Create: `web/tests/e2e/now.spec.ts`

**Interfaces:**
- Consumes: `live`, `clock`, `currentLevel` (Tasks 4 and 6); `Hazard`, `HazardType`, `Overall`, `Lvl`, `Assessment`, `Feeds`, `FeedKey`, `RANK` (Task 2); `stepsFor`, `GUIDE_FOR`, `tx` (Task 5); `api`, `sortByDistance`, `toNum`, `occupancyPct`, `here`, `MapView`, `Sheet`, `fmtTime`, `pm25Band`, `pm25Label`.
- Produces (labels.ts):
```ts
export const hazName: (t: HazardType) => string;
export const hazLine: (h: Hazard) => string;
export const levelWord: (l: Overall) => string;
export const feedName: (k: FeedKey) => string;
export function nowTitle(types: HazardType[]): string;   // 1–3 names, first letter upper, rest lower (EN)
export const HAZ_CODE: Record<HazardType, string>;
export const nearestOpen: (shelters: Shelter[], at: Pt) => { s: Shelter; km: number } | null;
```
- Component props:
  - `LevelBadge { level: Overall; small?: boolean }`
  - `LevelScale { level: Overall }`
  - `HazardList { hazards: Hazard[]; quiet?: string[]; onselect: (h: Hazard) => void }`
  - `HazardSheet { hazard: Hazard | null (bindable) }`
  - `ConditionTiles { feeds: Feeds | null; at: Pt }`
  - `NowPanel { level: Overall; a: Assessment | null; feeds: Feeds | null; nearest: { s: Shelter; km: number } | null; onselect: (h: Hazard) => void }`

- [ ] **Step 1: Add the messages**

`web/messages/en.json`:
```json
	"haz_flood": "Flooding",
	"haz_rain": "Heavy rain",
	"haz_storm": "Storm",
	"haz_smoke": "Haze",
	"haz_heat": "Extreme heat",
	"haz_earthquake": "Earthquake",
	"haz_tsunami": "Tsunami",
	"haz_landslide": "Landslide",
	"haz_drought": "Drought",
	"haz_wildfire": "Wildfire",
	"haz_volcano": "Volcano",
	"haz_chemical": "Chemical spill",
	"haz_other": "Hazard",
	"line_pm25": "PM2.5 {value} µg/m³",
	"line_heat": "Feels like {value}°C today",
	"line_rain": "{value} mm of rain today",
	"line_river": "River model shows a rise",
	"line_quake": "M{mag} · {km} km away",
	"line_event": "{name} · {km} km away",
	"feed_air": "Air quality",
	"feed_forecast": "Forecast",
	"feed_river": "River model",
	"feed_gdacs": "GDACS",
	"feed_quakes": "Earthquakes",
	"now_where": "{place} · your location",
	"now_updated": "updated {time}",
	"now_safe_title": "No warnings near you",
	"now_safe_body": "Nothing active near {place}.",
	"now_unknown_title": "Status unknown",
	"now_unknown_body": "Couldn't reach the data sources. Last checked {time}.",
	"now_unknown_never": "Couldn't reach the data sources yet.",
	"now_title_1": "{a} near you",
	"now_title_2": "{a} and {b}",
	"now_title_3": "{a}, {b} and {c}",
	"now_reason_1": "1 active hazard near you.",
	"now_reason_n": "{count} active hazards near you. The worst one sets the level.",
	"now_partial": "Unavailable right now: {feeds}.",
	"now_guidance": "DEMS estimate from public data. Official warnings: TMD / DDPM.",
	"now_quiet": "no risk here right now",
	"now_steps": "What to do now",
	"now_shelter": "Nearest shelter",
	"now_shelter_go": "Go to shelter now",
	"now_shelter_sub": "{name} · {km} km",
	"now_shelter_none": "Find a shelter",
	"now_report": "Report something",
	"now_shelters": "Nearest shelters",
	"now_rain24": "Rain chance, next 24 h",
	"now_recent": "Recent events",
	"now_recent_none": "No recent events near you.",
	"tile_rain": "Rain today",
	"tile_air": "Air PM2.5",
	"tile_river": "River",
	"tile_quakes": "Quakes 24 h",
	"tile_rising": "Rising",
	"tile_normal": "Normal",
	"tile_none": "None",
	"sample_tag": "Sample",
	"hazard_source": "Source: {source} · {time}",
	"hazard_distance": "{km} km from you",
	"hazard_sample_note": "Sample record from this demo's database. It never changes your level.",
	"hazard_guide": "Read the full guide",
	"hazard_open_source": "Open source report"
```
`web/messages/th.json`:
```json
	"haz_flood": "น้ำท่วม",
	"haz_rain": "ฝนตกหนัก",
	"haz_storm": "พายุ",
	"haz_smoke": "หมอกควัน",
	"haz_heat": "อากาศร้อนจัด",
	"haz_earthquake": "แผ่นดินไหว",
	"haz_tsunami": "สึนามิ",
	"haz_landslide": "ดินถล่ม",
	"haz_drought": "ภัยแล้ง",
	"haz_wildfire": "ไฟป่า",
	"haz_volcano": "ภูเขาไฟ",
	"haz_chemical": "สารเคมีรั่วไหล",
	"haz_other": "ภัยอื่นๆ",
	"line_pm25": "PM2.5 {value} มคก./ลบ.ม.",
	"line_heat": "รู้สึกเหมือน {value}°C วันนี้",
	"line_rain": "ฝน {value} มม. วันนี้",
	"line_river": "แบบจำลองแม่น้ำแสดงว่าน้ำกำลังขึ้น",
	"line_quake": "M{mag} · ห่าง {km} กม.",
	"line_event": "{name} · ห่าง {km} กม.",
	"feed_air": "คุณภาพอากาศ",
	"feed_forecast": "พยากรณ์อากาศ",
	"feed_river": "แบบจำลองแม่น้ำ",
	"feed_gdacs": "GDACS",
	"feed_quakes": "แผ่นดินไหว",
	"now_where": "{place} · ตำแหน่งของคุณ",
	"now_updated": "อัปเดต {time}",
	"now_safe_title": "ไม่มีการเตือนภัยใกล้คุณ",
	"now_safe_body": "ไม่มีเหตุการณ์ใกล้ {place}",
	"now_unknown_title": "ไม่ทราบสถานะ",
	"now_unknown_body": "เชื่อมต่อแหล่งข้อมูลไม่ได้ ตรวจล่าสุด {time}",
	"now_unknown_never": "ยังเชื่อมต่อแหล่งข้อมูลไม่ได้",
	"now_title_1": "{a} ใกล้คุณ",
	"now_title_2": "{a} และ {b}",
	"now_title_3": "{a} {b} และ {c}",
	"now_reason_1": "มีภัย 1 อย่างใกล้คุณ",
	"now_reason_n": "มีภัย {count} อย่างใกล้คุณ ระดับรวมใช้ภัยที่รุนแรงที่สุด",
	"now_partial": "ใช้งานไม่ได้ขณะนี้: {feeds}",
	"now_guidance": "เป็นการประเมินของ DEMS จากข้อมูลสาธารณะ ประกาศทางการ: กรมอุตุนิยมวิทยา / ปภ.",
	"now_quiet": "ไม่มีความเสี่ยงในขณะนี้",
	"now_steps": "สิ่งที่ควรทำตอนนี้",
	"now_shelter": "ที่พักพิงใกล้ที่สุด",
	"now_shelter_go": "ไปที่พักพิงตอนนี้",
	"now_shelter_sub": "{name} · {km} กม.",
	"now_shelter_none": "ค้นหาที่พักพิง",
	"now_report": "แจ้งเหตุ",
	"now_shelters": "ที่พักพิงใกล้ที่สุด",
	"now_rain24": "โอกาสฝน 24 ชม. ข้างหน้า",
	"now_recent": "เหตุการณ์ล่าสุด",
	"now_recent_none": "ไม่มีเหตุการณ์ล่าสุดใกล้คุณ",
	"tile_rain": "ฝนวันนี้",
	"tile_air": "ฝุ่น PM2.5",
	"tile_river": "แม่น้ำ",
	"tile_quakes": "แผ่นดินไหว 24 ชม.",
	"tile_rising": "กำลังขึ้น",
	"tile_normal": "ปกติ",
	"tile_none": "ไม่มี",
	"sample_tag": "ตัวอย่าง",
	"hazard_source": "แหล่งข้อมูล: {source} · {time}",
	"hazard_distance": "ห่างจากคุณ {km} กม.",
	"hazard_sample_note": "ข้อมูลตัวอย่างจากฐานข้อมูลของเดโมนี้ ไม่มีผลต่อระดับเตือนภัยของคุณ",
	"hazard_guide": "อ่านคู่มือฉบับเต็ม",
	"hazard_open_source": "เปิดรายงานต้นทาง"
```

- [ ] **Step 2: Add the helpers to `web/src/lib/labels.ts`**

Add these imports (merge with the existing ones): `import type { FeedKey, Hazard, HazardType, Overall } from './levels';`, `import { sortByDistance, toNum } from './geo';`, `import type { Pt } from './types';` (`Shelter` is already imported). Then append:
```ts
const HAZ_NAME: Record<HazardType, () => string> = {
	flood: m.haz_flood,
	rain: m.haz_rain,
	storm: m.haz_storm,
	smoke: m.haz_smoke,
	heat: m.haz_heat,
	earthquake: m.haz_earthquake,
	tsunami: m.haz_tsunami,
	landslide: m.haz_landslide,
	drought: m.haz_drought,
	wildfire: m.haz_wildfire,
	volcano: m.haz_volcano,
	chemical: m.haz_chemical,
	other: m.haz_other
};
export const hazName = (t: HazardType): string => HAZ_NAME[t]();

export const HAZ_CODE: Record<HazardType, string> = {
	flood: 'FL',
	rain: 'RN',
	storm: 'ST',
	smoke: 'PM',
	heat: '°C',
	earthquake: 'EQ',
	tsunami: 'TS',
	landslide: 'LS',
	drought: 'DR',
	wildfire: 'WF',
	volcano: 'VO',
	chemical: 'CH',
	other: '!'
};

const km0 = (km: number | null) => (km === null ? '' : km.toFixed(0));
export function hazLine(h: Hazard): string {
	if (h.type === 'smoke' && h.value !== null) return m.line_pm25({ value: h.value.toFixed(1) });
	if (h.type === 'heat' && h.value !== null) return m.line_heat({ value: h.value.toFixed(0) });
	if (h.type === 'rain' && h.value !== null) return m.line_rain({ value: h.value.toFixed(0) });
	if (h.id === 'river') return m.line_river();
	if (h.type === 'earthquake' && h.value !== null) return m.line_quake({ mag: h.value.toFixed(1), km: km0(h.km) });
	if (h.name && h.km !== null) return m.line_event({ name: h.name, km: km0(h.km) });
	return h.name ?? '';
}

export const levelWord = (l: Overall): string =>
	({ safe: m.lvl_safe, watch: m.lvl_watch, warning: m.lvl_warning, unknown: m.lvl_unknown })[l]();

export const feedName = (k: FeedKey): string =>
	({ air: m.feed_air, forecast: m.feed_forecast, river: m.feed_river, gdacs: m.feed_gdacs, quakes: m.feed_quakes })[k]();

/** "Haze and flooding": distinct hazard names, worst first, at most three. */
export function nowTitle(types: HazardType[]): string {
	const names = [...new Set(types)].slice(0, 3).map(hazName);
	const s =
		names.length === 1
			? m.now_title_1({ a: names[0] })
			: names.length === 2
				? m.now_title_2({ a: names[0], b: names[1] })
				: m.now_title_3({ a: names[0], b: names[1], c: names[2] });
	const lower = s.toLowerCase(); // no-op for Thai
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function nearestOpen(shelters: Shelter[], at: Pt): { s: Shelter; km: number } | null {
	const hit = sortByDistance(
		shelters.filter((s) => s.Status === 'Available'),
		at,
		(s) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) })
	).find((x) => x.km !== null);
	return hit ? { s: hit.item, km: hit.km! } : null;
}
```

Add a unit test file `web/src/lib/labels.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { nearestOpen, nowTitle } from './labels';
import type { Shelter } from './types';

describe('nowTitle', () => {
	it('joins up to three hazard names, sentence case', () => {
		expect(nowTitle(['smoke'])).toBe('Haze near you');
		expect(nowTitle(['smoke', 'flood'])).toBe('Haze and flooding');
		expect(nowTitle(['smoke', 'heat', 'earthquake', 'rain'])).toBe('Haze, extreme heat and earthquake');
		expect(nowTitle(['smoke', 'smoke'])).toBe('Haze near you');
	});
});

describe('nearestOpen', () => {
	const s = (id: number, lat: string | null, status: Shelter['Status'] = 'Available'): Shelter => ({
		ShelterID: id, ShelterName: `S${id}`, ShelterType: 't', Address: 'a', City: 'c', Latitude: lat, Longitude: lat === null ? null : '100.5', Capacity: 10, CurrentOccupancy: 0, Status: status, Facilities: null
	});
	it('skips full and position-less shelters', () => {
		const r = nearestOpen([s(1, '13.76', 'Full'), s(2, null), s(3, '14.5')], { lat: 13.75, lon: 100.5 });
		expect(r?.s.ShelterID).toBe(3);
		expect(nearestOpen([s(2, null)], { lat: 13.75, lon: 100.5 })).toBeNull();
	});
});
```
Run: `npm test -- src/lib/labels.test.ts`
Expected: PASS (2 tests). If the first fails because the helpers aren't added yet, add them and re-run.

- [ ] **Step 3: Add the level marker kinds**

In `web/src/lib/types.ts`, change `kind: 'shelter' | 'quake' | 'hazard' | 'sample' | 'me';` to `kind: 'shelter' | 'quake' | 'hazard' | 'sample' | 'me' | 'safe' | 'watch' | 'warning';`.

- [ ] **Step 4: Dark `Sheet.svelte`**

In `web/src/lib/components/Sheet.svelte`:
- Replace `class="fixed inset-0 z-40 bg-ink/40"` with `class="fixed inset-0 z-40 bg-black/60"`.
- Replace `rounded-t-3xl bg-paper p-5` with `rounded-t-3xl border border-line bg-raised p-5`.
- Replace `class="rounded-md p-2 hover:bg-ink/10"` with `class="grid size-11 place-items-center rounded-lg hover:bg-white/10"`.

- [ ] **Step 5: Write the small components**

`web/src/lib/components/LevelBadge.svelte`:
```svelte
<script lang="ts">
	import { levelWord } from '$lib/labels';
	import type { Overall } from '$lib/levels';

	let { level, small = false }: { level: Overall; small?: boolean } = $props();
	const MARK: Record<Overall, string> = { safe: '●', watch: '●', warning: '▲', unknown: '?' };
</script>

<span
	class="lv-{level} lv-bg inline-flex items-center gap-1.5 self-start rounded-md font-mono font-bold tracking-[0.12em] uppercase
		{level === 'unknown' ? 'text-white' : 'text-bg'} {small ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}"
	class:pulse={level === 'warning'}
>
	<span aria-hidden="true">{MARK[level]}</span>{levelWord(level)}
</span>
```

`web/src/lib/components/LevelScale.svelte`:
```svelte
<script lang="ts">
	import { levelWord } from '$lib/labels';
	import { RANK, type Lvl, type Overall } from '$lib/levels';

	let { level }: { level: Overall } = $props();
	const STEPS: Lvl[] = ['safe', 'watch', 'warning'];
</script>

<div class="lv-{level}" aria-hidden="true">
	<div class="grid grid-cols-3 gap-1">
		{#each STEPS as s (s)}
			<i class="block h-1.5 rounded-full {RANK[s] <= RANK[level] ? 'lv-bg shadow-[0_0_10px_var(--lv)]' : 'bg-white/10'}"></i>
		{/each}
	</div>
	<div class="label mt-1.5 grid grid-cols-3">
		{#each STEPS as s (s)}<span>{levelWord(s)}</span>{/each}
	</div>
</div>
```

`web/src/lib/components/HazardList.svelte`:
```svelte
<script lang="ts">
	import { HAZ_CODE, hazLine, hazName, levelWord } from '$lib/labels';
	import type { Hazard } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';

	let { hazards, quiet = [], onselect }: { hazards: Hazard[]; quiet?: string[]; onselect: (h: Hazard) => void } = $props();
</script>

<ul class="glass divide-y divide-line overflow-hidden rounded-2xl">
	{#each hazards as h (h.id)}
		<li>
			<button
				type="button"
				onclick={() => onselect(h)}
				class="lv-{h.level} flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5"
			>
				<span class="lv-bg grid size-8 shrink-0 place-items-center rounded-lg font-mono text-[11px] font-bold text-bg" aria-hidden="true"
					>{HAZ_CODE[h.type]}</span
				>
				<span class="min-w-0 flex-1">
					<span class="block font-semibold"
						>{hazName(h.type)}{#if h.sample}<span class="label ml-2 rounded border border-line px-1 py-px">{m.sample_tag()}</span>{/if}</span
					>
					<span class="block truncate text-xs text-muted">{hazLine(h)}</span>
				</span>
				<span class="lv-text font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">{levelWord(h.level)}</span>
			</button>
		</li>
	{/each}
	{#if quiet.length}
		<li class="flex items-center gap-3 px-3 py-2.5 opacity-60">
			<span class="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 font-mono text-[11px] text-muted" aria-hidden="true">~</span>
			<span class="text-sm"><b class="font-semibold">{quiet.join(' · ')}</b> <span class="text-muted">{m.now_quiet()}</span></span>
		</li>
	{/if}
</ul>
```

`web/src/lib/components/HazardSheet.svelte`:
```svelte
<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { fmtDateTime } from '$lib/format';
	import { hazLine, hazName } from '$lib/labels';
	import type { Hazard } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { GUIDE_FOR, stepsFor, tx } from '$lib/prepare/guides';
	import LevelBadge from './LevelBadge.svelte';
	import Sheet from './Sheet.svelte';

	let { hazard = $bindable(null) }: { hazard: Hazard | null } = $props();
	const steps = $derived(hazard ? stepsFor(hazard.type, hazard.level) : []);
	const guide = $derived(hazard ? GUIDE_FOR[hazard.type] : undefined);
</script>

<Sheet
	bind:open={() => hazard !== null, (v) => { if (!v) hazard = null; }}
	title={hazard ? hazName(hazard.type) : ''}
>
	{#if hazard}
		<div class="flex flex-col gap-4">
			<LevelBadge level={hazard.level} />
			<p class="text-muted">{hazLine(hazard)}</p>
			{#if steps.length}
				<section>
					<h3 class="label mb-2">{m.now_steps()}</h3>
					<ol class="flex flex-col gap-2">
						{#each steps as s, i (i)}
							<li class="flex gap-3"><span class="lv-{hazard.level} lv-text font-mono text-xs">0{i + 1}</span>{tx(s)}</li>
						{/each}
					</ol>
				</section>
			{/if}
			{#if hazard.sample}<p class="rounded-lg border border-line p-3 text-sm text-muted">{m.hazard_sample_note()}</p>{/if}
			<p class="font-mono text-[11px] text-muted">
				{m.hazard_source({ source: hazard.source, time: hazard.time ? fmtDateTime(hazard.time) : '—' })}
				{#if hazard.km !== null}<br />{m.hazard_distance({ km: hazard.km.toFixed(0) })}{/if}
			</p>
			<div class="flex flex-wrap gap-2">
				{#if guide}
					<a href={localizeHref(`/prepare/${guide}`)} class="inline-flex min-h-11 items-center rounded-lg bg-text px-4 font-semibold text-bg">{m.hazard_guide()}</a>
				{/if}
				{#if hazard.url}
					<a href={hazard.url} target="_blank" rel="noopener" class="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line px-4 text-sm"
						><ExternalLink size={14} aria-hidden="true" />{m.hazard_open_source()}</a
					>
				{/if}
			</div>
		</div>
	{/if}
</Sheet>
```

`web/src/lib/components/ConditionTiles.svelte`:
```svelte
<script lang="ts">
	import { distanceKm } from '$lib/geo';
	import { pm25Label } from '$lib/labels';
	import { T, type Feeds } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';
	import { pm25Band } from '$lib/sources/openmeteo';
	import type { Pt } from '$lib/types';

	let { feeds, at }: { feeds: Feeds | null; at: Pt } = $props();
	const day = $derived(feeds?.forecast?.days[0]);
	const quakes = $derived(
		feeds?.quakes?.filter((q) => distanceKm(at, q) <= T.quakeKm && Date.now() - Date.parse(q.time) <= T.quakeHours * 3600_000).length
	);
</script>

<div class="grid grid-cols-2 gap-2.5">
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_rain()}</div>
		<div class="mt-1 text-2xl font-semibold tracking-tight">{day ? day.rain.toFixed(0) : '—'}<span class="ml-1 text-xs text-muted">mm</span></div>
	</div>
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_air()}</div>
		<div class="mt-1 text-2xl font-semibold tracking-tight">{feeds?.air ? feeds.air.pm25.toFixed(1) : '—'}<span class="ml-1 text-xs text-muted">µg/m³</span></div>
		{#if feeds?.air}<div class="text-xs text-muted">{pm25Label(pm25Band(feeds.air.pm25))}</div>{/if}
	</div>
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_river()}</div>
		<div class="mt-1 text-xl font-semibold {feeds?.river?.rising ? 'text-watch' : ''}">
			{feeds?.river === undefined ? '—' : feeds.river === null ? m.tile_none() : feeds.river.rising ? m.tile_rising() : m.tile_normal()}
		</div>
	</div>
	<div class="glass rounded-2xl p-3">
		<div class="label">{m.tile_quakes()}</div>
		<div class="mt-1 text-xl font-semibold">{quakes === undefined ? '—' : quakes === 0 ? m.tile_none() : quakes}</div>
	</div>
</div>
```
`feeds?.river === undefined` is true both before loading and when the feed failed. Both show "—".

`web/src/lib/components/NowPanel.svelte`:
```svelte
<script lang="ts">
	import { ArrowRight, TriangleAlert } from '@lucide/svelte';
	import { fmtTime } from '$lib/format';
	import { feedName, hazName, nowTitle } from '$lib/labels';
	import type { Assessment, Feeds, Hazard, HazardType, Overall } from '$lib/levels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { stepsFor, tx } from '$lib/prepare/guides';
	import type { Shelter } from '$lib/types';
	import ConditionTiles from './ConditionTiles.svelte';
	import HazardList from './HazardList.svelte';
	import LevelBadge from './LevelBadge.svelte';
	import LevelScale from './LevelScale.svelte';

	let {
		level,
		a,
		feeds,
		nearest,
		onselect
	}: {
		level: Overall;
		a: Assessment | null;
		feeds: Feeds | null;
		nearest: { s: Shelter; km: number } | null;
		onselect: (h: Hazard) => void;
	} = $props();

	const place = $derived(
		here.place.via === 'gps' ? m.location_gps() : here.place.via === 'default' ? m.location_default() : here.place.name
	);
	const active = $derived(a ? a.hazards.filter((h) => !h.sample && h.level !== 'safe') : []);
	const QUIET: HazardType[] = ['flood', 'storm', 'earthquake', 'smoke', 'heat'];
	const quiet = $derived(a ? QUIET.filter((t) => !a.hazards.some((h) => h.type === t)).map(hazName) : []);
	const title = $derived(
		level === 'unknown' ? m.now_unknown_title() : level === 'safe' ? m.now_safe_title() : nowTitle(active.map((h) => h.type))
	);
	const reason = $derived(
		level === 'unknown'
			? a
				? m.now_unknown_body({ time: fmtTime(new Date(a.checkedAt)) })
				: m.now_unknown_never()
			: level === 'safe'
				? m.now_safe_body({ place })
				: active.length === 1
					? m.now_reason_1()
					: m.now_reason_n({ count: active.length })
	);
	const steps = $derived(level === 'warning' && active[0] ? stepsFor(active[0].type, 'warning') : []);
	const shelterHref = $derived(nearest ? localizeHref(`/route?to=shelter:${nearest.s.ShelterID}`) : localizeHref('/shelters'));
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-baseline justify-between gap-2 text-sm text-muted">
		<span>{m.now_where({ place })}</span>
		{#if a}<span class="font-mono text-[11px]">{m.now_updated({ time: fmtTime(new Date(a.checkedAt)) })}</span>{/if}
	</div>
	<LevelBadge {level} />
	<h1 class="headline text-[2.4rem]">{title}</h1>
	<p class="-mt-1 text-[15px] leading-snug text-[#c9c9cf]">{reason}</p>
	{#if a && a.failed.length && level !== 'unknown'}
		<p class="text-xs text-watch">{m.now_partial({ feeds: a.failed.map(feedName).join(', ') })}</p>
	{/if}
	<p class="text-xs text-muted">{m.now_guidance()}</p>
	<LevelScale {level} />
	{#if steps.length}
		<section class="lv-warning">
			<h2 class="label mb-2">{m.now_steps()}</h2>
			<ol class="flex flex-col gap-1.5 text-[15px]">
				{#each steps as s, i (i)}
					<li class="flex gap-3"><span class="lv-text font-mono text-xs">0{i + 1}</span>{tx(s)}</li>
				{/each}
			</ol>
		</section>
	{/if}
	{#if a}<HazardList hazards={a.hazards} {quiet} {onselect} />{/if}
	<ConditionTiles {feeds} at={here.place} />
	<a
		href={shelterHref}
		class="flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 font-bold {level === 'warning'
			? 'bg-[#e5251b] text-white shadow-[0_8px_30px_rgb(229_37_27/0.35)]'
			: 'bg-text text-bg'}"
	>
		<span class="flex-1">
			{nearest ? (level === 'warning' ? m.now_shelter_go() : m.now_shelter()) : m.now_shelter_none()}
			{#if nearest}<small class="block text-xs font-medium opacity-75">{m.now_shelter_sub({ name: nearest.s.ShelterName, km: nearest.km.toFixed(1) })}</small>{/if}
		</span>
		<ArrowRight size={20} aria-hidden="true" />
	</a>
	<a href={localizeHref('/report')} class="flex min-h-11 items-center gap-2 self-start text-sm text-muted hover:text-text">
		<TriangleAlert size={16} aria-hidden="true" />{m.now_report()}
	</a>
</div>
```

- [ ] **Step 6: Rewrite `web/src/routes/+page.svelte`**

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import HazardSheet from '$lib/components/HazardSheet.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import NowPanel from '$lib/components/NowPanel.svelte';
	import { api } from '$lib/config';
	import { fmtHour, fmtTime } from '$lib/format';
	import { occupancyPct, sortByDistance, toNum } from '$lib/geo';
	import { currentLevel, live } from '$lib/hazards.svelte';
	import { hazName, nearestOpen } from '$lib/labels';
	import type { Hazard } from '$lib/levels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import type { MapMarker, Shelter } from '$lib/types';

	const wide = new MediaQuery('min-width: 1024px');
	let shelters = $state<Shelter[]>([]);
	let picked = $state<Hazard | null>(null);
	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
	});

	const level = $derived(currentLevel());
	const nearest = $derived(nearestOpen(shelters, here.place));
	const coords = (s: Shelter) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) });
	const closest = $derived(sortByDistance(shelters, here.place, coords).filter((x) => x.km !== null).slice(0, 3));
	const hours = $derived(live.feeds?.forecast?.hours ?? []);
	const recent = $derived(
		(live.a?.hazards ?? []).filter((h) => !h.sample && h.time).sort((a, b) => b.time!.localeCompare(a.time!)).slice(0, 4)
	);
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...(live.a?.hazards ?? []).flatMap((h): MapMarker[] =>
			h.lat === null || h.lon === null ? [] : [{ id: h.id, kind: h.sample ? 'sample' : h.level, lat: h.lat, lon: h.lon, label: hazName(h.type) }]
		),
		...shelters.flatMap((s): MapMarker[] => {
			const c = coords(s);
			return c.lat === null || c.lon === null ? [] : [{ id: `S${s.ShelterID}`, kind: 'shelter', lat: c.lat, lon: c.lon, label: s.ShelterName }];
		})
	]);
	const select = (id: string) => (picked = live.a?.hazards.find((h) => h.id === id) ?? null);
</script>

{#if wide.current}
	<div class="fixed inset-x-0 top-[var(--header-h)] bottom-0 grid grid-cols-[400px_1fr]">
		<aside class="lv-{level} sky overflow-y-auto border-r border-line p-5">
			<NowPanel {level} a={live.a} feeds={live.feeds} {nearest} onselect={(h) => (picked = h)} />
		</aside>
		<section class="grid min-h-0 grid-rows-[1fr_220px]">
			<MapView class="relative" {markers} center={here.place} zoom={8} focus={here.place} onselect={select} />
			<div class="grid grid-cols-[1.35fr_1fr_1fr] gap-3 border-t border-line p-3">
				<div class="glass flex flex-col gap-2 rounded-2xl p-3.5">
					<div class="flex justify-between"><h2 class="label">{m.now_shelters()}</h2><a class="text-xs text-muted" href={localizeHref('/shelters')}>→</a></div>
					{#each closest as { item: s, km } (s.ShelterID)}
						{@const pct = occupancyPct(s.CurrentOccupancy, s.Capacity)}
						<div class="grid grid-cols-[1fr_64px_56px] items-center gap-3 text-sm">
							<span class="truncate">{s.ShelterName}</span>
							<span class="h-1.5 overflow-hidden rounded-full bg-white/10"><i class="block h-full {pct >= 90 ? 'bg-warning' : pct >= 70 ? 'bg-watch' : 'bg-safe'}" style="width:{pct}%"></i></span>
							<span class="text-right font-mono text-xs text-muted">{km!.toFixed(1)} km</span>
						</div>
					{/each}
				</div>
				<div class="glass flex flex-col gap-2 rounded-2xl p-3.5">
					<h2 class="label">{m.now_rain24()}</h2>
					<div class="flex flex-1 items-end gap-[3px]" aria-hidden="true">
						{#each hours as h (h.time.getTime())}
							<i class="flex-1 rounded-t-sm bg-gradient-to-b from-info to-info/30" style="height:{Math.max(4, h.rainChance)}%" title="{fmtHour(h.time)}: {h.rainChance}%"></i>
						{/each}
					</div>
				</div>
				<div class="glass flex flex-col gap-2 rounded-2xl p-3.5">
					<h2 class="label">{m.now_recent()}</h2>
					{#each recent as h (h.id)}
						<div class="grid grid-cols-[44px_1fr] gap-2 text-xs"><span class="font-mono text-muted">{fmtTime(h.time!)}</span><span class="truncate">{hazName(h.type)} · {h.name ?? ''}</span></div>
					{:else}
						<p class="text-xs text-muted">{m.now_recent_none()}</p>
					{/each}
				</div>
			</div>
		</section>
	</div>
{:else}
	<div class="lv-{level} sky page max-w-xl">
		<NowPanel {level} a={live.a} feeds={live.feeds} {nearest} onselect={(h) => (picked = h)} />
	</div>
{/if}

<HazardSheet bind:hazard={picked} />
```

- [ ] **Step 7: Write the Now e2e tests**

Create `web/tests/e2e/now.spec.ts`:
```ts
import { expect, test } from './fixtures';

const air = (pm25: number) => JSON.stringify({ current: { time: 1791518400, pm2_5: pm25, us_aqi: 0 } });

test('fixtures (PM2.5 41.2, river rising) → Watch: haze and flooding', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Watch', { exact: true }).first()).toBeVisible();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Haze and flooding');
	await expect(page.getByText('PM2.5 41.2 µg/m³')).toBeVisible();
	await expect(page.getByText('DEMS estimate from public data. Official warnings: TMD / DDPM.')).toBeVisible();
	await expect(page.getByRole('link', { name: /Nearest shelter/ })).toContainText('km');
});

test('PM2.5 120 → Warning with steps and a red shelter button', async ({ page }) => {
	await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ contentType: 'application/json', body: air(120) }));
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Haze and flooding');
	await expect(page.getByText('Warning', { exact: true }).first()).toBeVisible();
	await expect(page.getByText('Stay indoors with doors and windows closed.')).toBeVisible();
	await expect(page.getByRole('link', { name: /Go to shelter now/ })).toBeVisible();
});

test('every feed down → Unknown, never Safe', async ({ page }) => {
	for (const host of ['api.open-meteo.com', 'air-quality-api.open-meteo.com', 'flood-api.open-meteo.com', 'earthquake.usgs.gov', 'www.gdacs.org']) {
		await page.route(`https://${host}/**`, (r) => r.fulfill({ status: 503, body: '' }));
	}
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Status unknown');
	await expect(page.getByText('Safe', { exact: true })).toHaveCount(1); // only the scale label, never the badge
});

test('one feed down: level still computed, the missing feed is named', async ({ page }) => {
	await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ status: 503, body: '' }));
	await page.goto('/');
	await expect(page.getByText('Unavailable right now: Air quality.')).toBeVisible();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Flooding near you');
});

test('tapping a hazard opens its detail with source and guide link', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /Haze/ }).click();
	const sheet = page.getByRole('dialog');
	await expect(sheet).toContainText('Source: Open-Meteo');
	await expect(sheet.getByRole('link', { name: 'Read the full guide' })).toHaveAttribute('href', '/prepare/smoke');
});

test('reduced motion: the warning badge does not pulse', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ contentType: 'application/json', body: air(120) }));
	await page.goto('/');
	const badge = page.locator('.pulse').first();
	await expect(badge).toBeVisible();
	expect(await badge.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});

test('Thai: level and headline render in Thai', async ({ page }) => {
	await page.goto('/th');
	await expect(page.locator('html')).toHaveAttribute('lang', 'th');
	await expect(page.getByText('เฝ้าระวัง', { exact: true }).first()).toBeVisible();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('หมอกควัน และ น้ำท่วม');
});

test.describe('desktop', () => {
	test.use({ viewport: { width: 1440, height: 900 } });
	test('dashboard: panel, map, nearest shelters, rain chance, recent events', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.maplibregl-map')).toBeVisible();
		for (const h of ['Nearest shelters', 'Rain chance, next 24 h', 'Recent events']) {
			await expect(page.getByRole('heading', { name: h })).toBeVisible();
		}
	});
});
```

- [ ] **Step 8: Run everything**

Run: `npm run check && npm test`
Expected: `0 ERRORS`, all unit tests pass.

Run: `npx playwright test tests/e2e/now.spec.ts tests/e2e/shell.spec.ts`
Expected: all pass.

If the Thai headline differs only by spacing (Thai joins names without the English sentence-case step), update the expected text to what `nowTitle` actually produces for `['smoke','flood']` in Thai: `หมอกควัน และ น้ำท่วม`. Do not change `now_title_2`.

- [ ] **Step 9: Look at it**

Take screenshots at 375×812 and 1440×900 of `/` with the default fixtures and with PM2.5 forced to 120. Compare them with `docs/superpowers/specs/2026-10-10-citizen-redesign/style-emergency.html` and `style-desktop.html`.

- [ ] **Step 10: Commit**

```bash
git add -A src messages tests
git commit -m "web: Now screen (level, multi-hazard list, steps, tiles, shelter button) and desktop dashboard"
```

---

### Task 8: Map screen

**Files:**
- Rewrite: `web/src/lib/components/MapView.svelte` (dark style, areas, lines, fit)
- Create: `web/src/lib/components/Chip.svelte`
- Create: `web/src/routes/map/+page.svelte`
- Create: `web/tests/e2e/map.spec.ts`
- Modify: `web/messages/en.json`, `web/messages/th.json`

**Interfaces:**
- Consumes: `circle`, `Zone` (Task 3); `collect`, `Hazard`, `HazardType` (Task 2); `live` (Task 4); `HazardSheet` (Task 7); `hazName`, `hazLine`, `HAZ_CODE`, `levelWord` (Task 7).
- Produces:
```ts
// MapView props (superset of the old ones; old callers keep working)
{ markers: MapMarker[]; center: Pt; zoom?: number; focus?: Pt | null; onselect?: (id: string) => void; class?: string;
  areas?: { id: string; lat: number; lon: number; km: number; color: string }[];
  lines?: { id: string; coords: [number, number][]; color: string }[];   // [lon, lat]
  fit?: [number, number][] | null }                                       // fit the view to these [lon, lat] points
// Chip props: { on: boolean; color?: string; onclick: () => void; children: Snippet }
```

- [ ] **Step 1: Messages**

`en.json`:
```json
	"map_layers": "Map layers",
	"map_shelters": "Shelters",
	"map_all_hazards": "Hazards in Thailand",
	"map_none": "No hazards to show.",
	"map_report": "Report"
```
`th.json`:
```json
	"map_layers": "ชั้นข้อมูลแผนที่",
	"map_shelters": "ที่พักพิง",
	"map_all_hazards": "ภัยในประเทศไทย",
	"map_none": "ไม่มีภัยที่จะแสดง",
	"map_report": "แจ้งเหตุ"
```

- [ ] **Step 2: Rewrite `web/src/lib/components/MapView.svelte`**

```svelte
<script lang="ts">
	import { MapPinOff } from '@lucide/svelte';
	import { type GeoJSONSource, LngLatBounds, Map as MlMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	// MapLibre looks for its worker next to its own file, which Vite's bundling moves.
	import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
	import { untrack } from 'svelte';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import type { MapMarker, Pt } from '$lib/types';
	import { circle } from '$lib/zones';
	import EmptyState from './EmptyState.svelte';

	type Area = { id: string; lat: number; lon: number; km: number; color: string };
	type Line = { id: string; coords: [number, number][]; color: string };
	let {
		markers,
		center,
		zoom = 5,
		focus = null,
		onselect,
		areas = [],
		lines = [],
		fit = null,
		class: klass = 'relative'
	}: {
		markers: MapMarker[];
		center: Pt;
		zoom?: number;
		focus?: Pt | null;
		onselect?: (id: string) => void;
		areas?: Area[];
		lines?: Line[];
		fit?: [number, number][] | null;
		class?: string;
	} = $props();

	setWorkerUrl(workerUrl);

	let el: HTMLDivElement;
	let map = $state<MlMap | null>(null);
	let ready = $state(false);
	let failed = $state(false);
	const empty = { type: 'FeatureCollection' as const, features: [] };

	$effect(() => {
		const start = untrack(() => center);
		let mm: MlMap;
		try {
			mm = new MlMap({
				container: el,
				style: 'https://tiles.openfreemap.org/styles/dark',
				center: [start.lon, start.lat],
				zoom: untrack(() => zoom),
				attributionControl: { compact: true }
			});
		} catch {
			failed = true; // no WebGL: lists still work
			return;
		}
		mm.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
		mm.on('load', () => {
			mm.addSource('areas', { type: 'geojson', data: empty });
			mm.addLayer({ id: 'areas-fill', type: 'fill', source: 'areas', paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.16 } });
			mm.addLayer({ id: 'areas-edge', type: 'line', source: 'areas', paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-opacity': 0.7 } });
			mm.addSource('lines', { type: 'geojson', data: empty });
			mm.addLayer({
				id: 'lines',
				type: 'line',
				source: 'lines',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: { 'line-color': ['get', 'color'], 'line-width': 5 }
			});
			ready = true;
		});
		map = mm;
		return () => mm.remove();
	});

	$effect(() => {
		const mm = map;
		if (!mm) return;
		const added = markers.map((mk) => {
			const dot = document.createElement('button');
			dot.type = 'button';
			dot.className = `map-dot map-dot-${mk.kind}`;
			dot.setAttribute('aria-label', mk.label);
			dot.title = mk.label;
			dot.addEventListener('click', () => onselect?.(mk.id));
			return new Marker({ element: dot }).setLngLat([mk.lon, mk.lat]).addTo(mm);
		});
		return () => added.forEach((a) => a.remove());
	});

	$effect(() => {
		if (!map || !ready) return;
		(map.getSource('areas') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: areas.map((a) => ({ type: 'Feature', properties: { color: a.color }, geometry: { type: 'Polygon', coordinates: [circle(a, 48)] } }))
		});
		(map.getSource('lines') as GeoJSONSource).setData({
			type: 'FeatureCollection',
			features: lines.map((l) => ({ type: 'Feature', properties: { color: l.color }, geometry: { type: 'LineString', coordinates: l.coords } }))
		});
	});

	$effect(() => {
		if (map && focus) map.flyTo({ center: [focus.lon, focus.lat], zoom: Math.max(map.getZoom(), 9), duration: ms(900) });
	});
	$effect(() => {
		if (!map || !fit || fit.length < 2) return;
		const b = fit.reduce((acc, p) => acc.extend(p), new LngLatBounds(fit[0], fit[0]));
		map.fitBounds(b, { padding: 60, duration: ms(700) });
	});
</script>

<!-- The caller sets positioning and size via `class`. -->
<div class={klass}>
	<!-- maplibre-gl.css forces position:relative on this element, so size it with h-full, not inset-0. -->
	<div bind:this={el} class="h-full w-full" class:hidden={failed}></div>
	{#if failed}
		<div class="absolute inset-0 flex items-center justify-center p-6">
			<EmptyState icon={MapPinOff} text={m.map_unavailable()} />
		</div>
	{/if}
</div>
```

- [ ] **Step 3: Write `web/src/lib/components/Chip.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { on, color, onclick, children }: { on: boolean; color?: string; onclick: () => void; children: Snippet } = $props();
</script>

<button
	type="button"
	aria-pressed={on}
	{onclick}
	class="glass inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full bg-bg/60 px-3 text-xs {on ? 'border-white/25 text-text' : 'text-muted'}"
>
	{#if color}<i class="size-2 rounded-full" style="background:{color}" aria-hidden="true"></i>{/if}
	{@render children()}
</button>
```

- [ ] **Step 4: Write `web/src/routes/map/+page.svelte`**

```svelte
<script lang="ts">
	import { TriangleAlert } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { goto } from '$app/navigation';
	import Chip from '$lib/components/Chip.svelte';
	import HazardList from '$lib/components/HazardList.svelte';
	import HazardSheet from '$lib/components/HazardSheet.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import { api } from '$lib/config';
	import { toNum } from '$lib/geo';
	import { live } from '$lib/hazards.svelte';
	import { hazName } from '$lib/labels';
	import { collect, type Hazard, type HazardType } from '$lib/levels';
	import { here } from '$lib/location.svelte';
	import { LEVEL_HEX } from '$lib/logo';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import type { MapMarker, Shelter } from '$lib/types';
	import { ZONE_KM } from '$lib/zones';

	const wide = new MediaQuery('min-width: 1024px');
	let shelters = $state<Shelter[]>([]);
	let picked = $state<Hazard | null>(null);
	let hidden = $state<Set<string>>(new Set());
	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
	});

	// Map = "what is happening anywhere": every current hazard, not only those near you.
	const all = $derived(live.feeds ? collect(live.feeds, here.place, Date.now(), false) : []);
	const types = $derived([...new Set(all.map((h) => h.type))] as HazardType[]);
	const shown = $derived(all.filter((h) => !hidden.has(h.type)));
	const toggle = (k: string) => {
		const n = new Set(hidden);
		if (n.has(k)) n.delete(k);
		else n.add(k);
		hidden = n;
	};
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...shown.flatMap((h): MapMarker[] =>
			h.lat === null || h.lon === null ? [] : [{ id: h.id, kind: h.sample ? 'sample' : h.level, lat: h.lat, lon: h.lon, label: hazName(h.type) }]
		),
		...(hidden.has('shelters')
			? []
			: shelters.flatMap((s): MapMarker[] => {
					const lat = toNum(s.Latitude);
					const lon = toNum(s.Longitude);
					return lat === null || lon === null ? [] : [{ id: `S${s.ShelterID}`, kind: 'shelter', lat, lon, label: s.ShelterName }];
				}))
	]);
	const areas = $derived(
		shown
			.filter((h) => h.lat !== null && h.lon !== null && h.level !== 'safe')
			.map((h) => ({ id: h.id, lat: h.lat!, lon: h.lon!, km: ZONE_KM[h.type] ?? 10, color: LEVEL_HEX[h.level] }))
	);
	function select(id: string) {
		if (id.startsWith('S')) {
			goto(localizeHref(`/shelters?focus=${id.slice(1)}`));
			return;
		}
		picked = all.find((h) => h.id === id) ?? null;
	}
</script>

<div class="fixed inset-x-0 top-[var(--header-h)] bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 lg:grid lg:grid-cols-[360px_1fr]">
	{#if wide.current}
		<aside class="overflow-y-auto border-r border-line p-4">
			<h1 class="label mb-3">{m.map_all_hazards()}</h1>
			{#if shown.length}<HazardList hazards={shown} onselect={(h) => (picked = h)} />{:else}<p class="text-sm text-muted">{m.map_none()}</p>{/if}
		</aside>
	{/if}
	<div class="relative h-full">
		<MapView class="relative h-full" {markers} {areas} center={here.place} zoom={6} onselect={select} />
		<div role="group" aria-label={m.map_layers()} class="absolute inset-x-3 top-3 flex gap-1.5 overflow-x-auto pb-1">
			{#each types as t (t)}
				<Chip on={!hidden.has(t)} color={LEVEL_HEX.watch} onclick={() => toggle(t)}>{hazName(t)}</Chip>
			{/each}
			<Chip on={!hidden.has('shelters')} color="#f2f2f4" onclick={() => toggle('shelters')}>{m.map_shelters()}</Chip>
		</div>
		<a
			href={localizeHref('/report')}
			class="absolute right-3 bottom-24 flex min-h-11 items-center gap-1.5 rounded-full bg-text px-4 text-sm font-semibold text-bg shadow-lg md:bottom-28"
		>
			<TriangleAlert size={16} aria-hidden="true" />{m.map_report()}
		</a>
	</div>
</div>

<HazardSheet bind:hazard={picked} />
```
- [ ] **Step 5: Write `web/tests/e2e/map.spec.ts`** (brings back the map tests from the old home spec)

```ts
import { expect, test } from './fixtures';

const currentFlood = JSON.stringify({
	features: [
		{
			geometry: { type: 'Point', coordinates: [100.6, 14.0] },
			properties: { eventtype: 'FL', eventid: 9, name: 'Flood in Ayutthaya', alertlevel: 'Red', iscurrent: 'true', fromdate: '2026-10-09T00:00:00', url: { report: 'https://gdacs.org/x' } }
		}
	]
});

test('the map loads its worker without errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
	page.on('pageerror', (err) => errors.push(err.message));
	await page.goto('/map');
	await expect(page.locator('.maplibregl-canvas')).toBeVisible();
	const box = await page.locator('.maplibregl-map').boundingBox();
	expect(box?.height).toBeGreaterThan(400);
	await page.waitForTimeout(1500);
	expect(errors.filter((e) => /worker/i.test(e))).toEqual([]);
});

test('layer chips toggle hazard types and shelters', async ({ page }) => {
	await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: currentFlood }));
	await page.goto('/map');
	const chip = page.getByRole('button', { name: 'Flooding' });
	await expect(chip).toHaveAttribute('aria-pressed', 'true');
	await chip.click();
	await expect(chip).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByRole('button', { name: 'Shelters' })).toHaveAttribute('aria-pressed', 'true');
});

test('floating Report button goes to the report form', async ({ page }) => {
	await page.goto('/map');
	await expect(page.getByRole('link', { name: 'Report' })).toHaveAttribute('href', '/report');
});

test('no WebGL: map area explains itself', async ({ page }) => {
	await page.addInitScript(() => {
		const orig = HTMLCanvasElement.prototype.getContext;
		// @ts-expect-error test override
		HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
			return type.startsWith('webgl') ? null : orig.call(this, type, ...rest);
		};
	});
	await page.goto('/map');
	await expect(page.getByText("Map can't be shown on this device.")).toBeVisible();
});

test.describe('desktop', () => {
	test.use({ viewport: { width: 1440, height: 900 } });
	test('lists every hazard on the left', async ({ page }) => {
		await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: currentFlood }));
		await page.goto('/map');
		await expect(page.getByRole('heading', { name: 'Hazards in Thailand' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Flooding.*Flood in Ayutthaya/ })).toBeVisible();
	});
});
```
- [ ] **Step 6: Run everything**

Run: `npm run check && npm test && npx playwright test tests/e2e/map.spec.ts tests/e2e/now.spec.ts`
Expected: `0 ERRORS`, all unit tests pass, all map and now e2e tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A src messages tests
git commit -m "web: dark map with hazard areas and layer chips; /map replaces /disasters"
```

---
### Task 9: Shelters screen

**Files:**
- Create: `web/src/lib/shelters.ts`, `web/src/lib/shelters.test.ts`
- Create: `web/src/lib/components/ShelterSheet.svelte`
- Rewrite: `web/src/routes/shelters/+page.svelte`
- Rewrite: `web/tests/e2e/shelters.spec.ts`
- Modify: `web/messages/en.json`, `web/messages/th.json`

**Interfaces:**
- Consumes: `Shelter`, `EvacRoute`, `Pt` (types); `distanceKm`, `toNum`, `occupancyPct` (geo); `Chip`, `MapView`, `Sheet` (Tasks 7–8); `shelterStatusLabel` (labels).
- Produces:
```ts
export type Facility = 'medical' | 'pets' | 'cleanAir';
export type Filter = 'open' | 'space' | Facility;
export type ShelterRow = { s: Shelter; km: number | null; lat: number | null; lon: number | null; pct: number; facilities: Facility[] };
export function shelterRows(list: Shelter[], at: Pt): ShelterRow[];         // by distance, no-coords last
export function applyFilters(rows: ShelterRow[], on: Set<Filter>): ShelterRow[];
// ShelterSheet props: { row: ShelterRow | null (bindable) }
```
- Route link format (used by Task 11): `/route?to=shelter:<ShelterID>`.

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/shelters.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import sample from './sample/shelters.json';
import { applyFilters, shelterRows } from './shelters';
import type { Shelter } from './types';

const BKK = { lat: 13.7563, lon: 100.5018 };
const list = sample as Shelter[];

describe('shelterRows', () => {
	it('sorts by distance and puts shelters without a position last', () => {
		const noPos = { ...list[0], ShelterID: 999, Latitude: null, Longitude: null };
		const rows = shelterRows([noPos, ...list], BKK);
		expect(rows[0].s.City).toBe('Bangkok');
		expect(rows.at(-1)!.s.ShelterID).toBe(999);
		expect(rows.at(-1)!.km).toBeNull();
	});
	it('reads facilities from the free-text column', () => {
		const rows = shelterRows(list, BKK);
		const by = (name: string) => rows.find((r) => r.s.ShelterName === name)!.facilities;
		expect(by('Chiang Mai University Shelter')).toContain('cleanAir');
		expect(by('Phuket Convention Center')).toContain('pets');
		expect(by('Krabi Sports Complex')).toContain('medical'); // "First aid"
		expect(by('Patong Beach Emergency Shelter')).toContain('medical');
	});
});

describe('applyFilters', () => {
	const rows = shelterRows(list, BKK);
	it('no filters returns everything', () => {
		expect(applyFilters(rows, new Set())).toHaveLength(list.length);
	});
	it('open hides full shelters; has space needs open and under 90 % full', () => {
		expect(applyFilters(rows, new Set(['open'])).some((r) => r.s.Status === 'Full')).toBe(false);
		expect(applyFilters(rows, new Set(['space'])).every((r) => r.s.Status === 'Available' && r.pct < 90)).toBe(true);
	});
	it('filters combine with AND', () => {
		const r = applyFilters(rows, new Set(['pets', 'open']));
		expect(r).toEqual([]); // the only pet-friendly sample shelter is Full
	});
});
```

- [ ] **Step 2: Run them to make sure they fail**

Run: `npm test -- src/lib/shelters.test.ts`
Expected: FAIL, `Failed to resolve import "./shelters"`.

- [ ] **Step 3: Write `web/src/lib/shelters.ts`**

```ts
import { occupancyPct, sortByDistance, toNum } from './geo';
import type { Pt, Shelter } from './types';

export type Facility = 'medical' | 'pets' | 'cleanAir';
export type Filter = 'open' | 'space' | Facility;
export type ShelterRow = { s: Shelter; km: number | null; lat: number | null; lon: number | null; pct: number; facilities: Facility[] };

// ponytail: keyword match on the free-text Facilities column; switch to real columns when the admin console edits them.
const FACILITY: Record<Facility, RegExp> = { medical: /medic|first aid/i, pets: /\bpet/i, cleanAir: /air purif/i };

export function shelterRows(list: Shelter[], at: Pt): ShelterRow[] {
	return sortByDistance(list, at, (s) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) })).map(({ item: s, km }) => ({
		s,
		km,
		lat: toNum(s.Latitude),
		lon: toNum(s.Longitude),
		pct: occupancyPct(s.CurrentOccupancy, s.Capacity),
		facilities: (Object.keys(FACILITY) as Facility[]).filter((f) => FACILITY[f].test(s.Facilities ?? ''))
	}));
}

export function applyFilters(rows: ShelterRow[], on: Set<Filter>): ShelterRow[] {
	return rows.filter(
		(r) =>
			(!on.has('open') || r.s.Status === 'Available') &&
			(!on.has('space') || (r.s.Status === 'Available' && r.pct < 90)) &&
			[...on].every((f) => f === 'open' || f === 'space' || r.facilities.includes(f))
	);
}
```
Run: `npm test -- src/lib/shelters.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 4: Messages**

`en.json`:
```json
	"f_open": "Open",
	"f_space": "Has space",
	"f_medical": "Medical",
	"f_pets": "Pets",
	"f_cleanAir": "Clean air",
	"shelters_filters": "Filter shelters",
	"shelters_none": "No shelters match these filters.",
	"shelter_route": "Route",
	"shelter_gmaps": "Open in Google Maps",
	"shelter_facilities": "Facilities",
	"evac_list_title": "Evacuation routes",
	"evac_line": "{from} → {to} · {km} km · {min} min"
```
`th.json`:
```json
	"f_open": "เปิดอยู่",
	"f_space": "ยังมีที่ว่าง",
	"f_medical": "มีแพทย์",
	"f_pets": "รับสัตว์เลี้ยง",
	"f_cleanAir": "อากาศสะอาด",
	"shelters_filters": "กรองที่พักพิง",
	"shelters_none": "ไม่มีที่พักพิงที่ตรงกับตัวกรอง",
	"shelter_route": "เส้นทาง",
	"shelter_gmaps": "เปิดใน Google Maps",
	"shelter_facilities": "สิ่งอำนวยความสะดวก",
	"evac_list_title": "เส้นทางอพยพ",
	"evac_line": "{from} → {to} · {km} กม. · {min} นาที"
```

- [ ] **Step 5: Write `web/src/lib/components/ShelterSheet.svelte`**

```svelte
<script lang="ts">
	import { Navigation } from '@lucide/svelte';
	import { shelterStatusLabel } from '$lib/labels';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import type { ShelterRow } from '$lib/shelters';
	import Sheet from './Sheet.svelte';

	let { row = $bindable(null) }: { row: ShelterRow | null } = $props();
</script>

<Sheet bind:open={() => row !== null, (v) => { if (!v) row = null; }} title={row?.s.ShelterName ?? ''}>
	{#if row}
		<div class="flex flex-col gap-4">
			<p class="text-sm text-muted">{row.s.Address}, {row.s.City} · <span class="label">{m.sample_tag()}</span></p>
			<p class="text-sm">{shelterStatusLabel(row.s.Status)}{#if row.km !== null} · <span class="font-mono">{row.km.toFixed(1)} km</span>{/if}</p>
			<div>
				<div class="h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
					<i class="block h-full {row.pct >= 90 ? 'bg-warning' : row.pct >= 70 ? 'bg-watch' : 'bg-safe'}" style="width:{row.pct}%"></i>
				</div>
				<p class="mt-1 text-xs text-muted">{m.shelter_capacity({ occupied: row.s.CurrentOccupancy, capacity: row.s.Capacity })}</p>
			</div>
			{#if row.s.Facilities}
				<div><h3 class="label mb-1">{m.shelter_facilities()}</h3><p class="text-sm">{row.s.Facilities}</p></div>
			{/if}
			{#if row.lat !== null && row.lon !== null}
				<a href={localizeHref(`/route?to=shelter:${row.s.ShelterID}`)} class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-text font-semibold text-bg">
					<Navigation size={18} aria-hidden="true" />{m.shelter_route()}
				</a>
				<a href="https://www.google.com/maps/dir/?api=1&destination={row.lat},{row.lon}" target="_blank" rel="noopener" class="self-center text-xs text-muted underline">{m.shelter_gmaps()}</a>
			{/if}
		</div>
	{/if}
</Sheet>
```

- [ ] **Step 6: Rewrite `web/src/routes/shelters/+page.svelte`**

```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { page } from '$app/state';
	import Chip from '$lib/components/Chip.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import ShelterSheet from '$lib/components/ShelterSheet.svelte';
	import { api } from '$lib/config';
	import { shelterStatusLabel } from '$lib/labels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { applyFilters, shelterRows, type Filter, type ShelterRow } from '$lib/shelters';
	import type { EvacRoute, MapMarker, Shelter } from '$lib/types';

	const wide = new MediaQuery('min-width: 1024px');
	let shelters = $state<Shelter[] | null>(null);
	let routes = $state<EvacRoute[]>([]);
	let on = $state<Set<Filter>>(new Set());
	let picked = $state<ShelterRow | null>(null);
	const FILTERS: [Filter, () => string][] = [
		['open', m.f_open],
		['space', m.f_space],
		['medical', m.f_medical],
		['pets', m.f_pets],
		['cleanAir', m.f_cleanAir]
	];

	onMount(() => {
		api.shelters().then((r) => {
			shelters = r.data;
			const focus = Number(page.url.searchParams.get('focus'));
			if (focus) picked = shelterRows(r.data, here.place).find((x) => x.s.ShelterID === focus) ?? null;
		});
		api.evacuationRoutes().then((r) => (routes = r.data));
	});

	const rows = $derived(shelters ? applyFilters(shelterRows(shelters, here.place), on) : []);
	const toggle = (f: Filter) => {
		const n = new Set(on);
		if (n.has(f)) n.delete(f);
		else n.add(f);
		on = n;
	};
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...rows.flatMap((r): MapMarker[] => (r.lat === null || r.lon === null ? [] : [{ id: String(r.s.ShelterID), kind: 'shelter', lat: r.lat, lon: r.lon, label: r.s.ShelterName }]))
	]);
	const select = (id: string) => (picked = rows.find((r) => String(r.s.ShelterID) === id) ?? null);
</script>

{#snippet list()}
	<h1 class="headline text-3xl">{m.shelters_title()}</h1>
	<p class="mt-1 text-xs text-muted">{m.shelters_sample_note()}</p>
	<div role="group" aria-label={m.shelters_filters()} class="mt-3 flex gap-1.5 overflow-x-auto pb-1">
		{#each FILTERS as [f, label] (f)}<Chip on={on.has(f)} onclick={() => toggle(f)}>{label()}</Chip>{/each}
	</div>
	{#if shelters === null}
		<p class="mt-4 text-sm text-muted">{m.loading()}</p>
	{:else if rows.length === 0}
		<p class="mt-4 text-sm text-muted">{m.shelters_none()}</p>
	{:else}
		<ul class="mt-3 flex flex-col gap-2.5">
			{#each rows as r (r.s.ShelterID)}
				<li>
					<button type="button" onclick={() => (picked = r)} class="glass flex w-full flex-col gap-2 rounded-2xl p-3.5 text-left hover:bg-white/[0.07]">
						<span class="flex items-start justify-between gap-3">
							<span><span class="block font-semibold">{r.s.ShelterName}</span><span class="block text-xs text-muted">{r.s.City} · {shelterStatusLabel(r.s.Status)}</span></span>
							<span class="font-mono text-sm" data-km={r.km ?? undefined}>{r.km === null ? m.shelter_distance_unknown() : `${r.km.toFixed(1)} km`}</span>
						</span>
						<span class="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
							<i class="block h-full {r.pct >= 90 ? 'bg-warning' : r.pct >= 70 ? 'bg-watch' : 'bg-safe'}" style="width:{r.pct}%"></i>
						</span>
						{#if r.facilities.length}
							<span class="flex flex-wrap gap-1">{#each r.facilities as f (f)}<span class="label rounded border border-line px-1.5 py-0.5">{{ medical: m.f_medical, pets: m.f_pets, cleanAir: m.f_cleanAir }[f]()}</span>{/each}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	{#if routes.length}
		<section class="mt-8">
			<h2 class="label mb-2">{m.evac_list_title()} · {m.sample_tag()}</h2>
			<ul class="flex flex-col gap-1.5 text-sm">
				{#each routes as r (r.RouteID)}
					<li class="rounded-xl border border-line p-3"><b class="font-semibold">{r.RouteName}</b><br /><span class="text-xs text-muted">{m.evac_line({ from: r.StartPoint, to: r.EndPoint, km: r.Distance, min: r.EstimatedTime })}</span></li>
				{/each}
			</ul>
		</section>
	{/if}
{/snippet}

{#if wide.current}
	<div class="fixed inset-x-0 top-[var(--header-h)] bottom-0 grid grid-cols-[420px_1fr]">
		<aside class="overflow-y-auto border-r border-line p-5">{@render list()}</aside>
		<MapView class="relative" {markers} center={here.place} zoom={7} onselect={select} />
	</div>
{:else}
	<div class="page">{@render list()}</div>
{/if}

<ShelterSheet bind:row={picked} />
```

- [ ] **Step 7: Rewrite `web/tests/e2e/shelters.spec.ts`**

```ts
import { expect, test } from './fixtures';

test('shelters sorted by distance, labelled as sample', async ({ page }) => {
	await page.goto('/shelters');
	await expect(page.getByRole('heading', { name: 'Shelters', level: 1 })).toBeVisible();
	await expect(page.getByText('Every shelter on this page is sample data.')).toBeVisible();
	const kms = await page.locator('[data-km]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-km'))));
	expect(kms.length).toBeGreaterThan(1);
	expect(kms).toEqual([...kms].sort((a, b) => a - b));
});

test('filters narrow the list', async ({ page }) => {
	await page.goto('/shelters');
	await page.getByRole('button', { name: 'Clean air' }).click();
	await expect(page.getByRole('button', { name: /Chiang Mai University Shelter/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /Bangkok Stadium/ })).toHaveCount(0);
	await page.getByRole('button', { name: 'Pets' }).click();
	await expect(page.getByText('No shelters match these filters.')).toBeVisible();
});

test('detail sheet offers our route guide and a Google Maps fallback', async ({ page }) => {
	await page.goto('/shelters');
	await page.getByRole('button', { name: /Bangkok Stadium/ }).click();
	const sheet = page.getByRole('dialog');
	await expect(sheet.getByRole('link', { name: 'Route' })).toHaveAttribute('href', /\/route\?to=shelter:\d+/);
	await expect(sheet.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
});

test('?focus= opens that shelter', async ({ page }) => {
	await page.goto('/shelters?focus=3');
	await expect(page.getByRole('dialog')).toBeVisible();
});

test('sample evacuation routes are listed at the bottom', async ({ page }) => {
	await page.goto('/shelters');
	await expect(page.getByRole('heading', { name: /Evacuation routes · Sample/ })).toBeVisible();
	await expect(page.getByText('Highway 1 - North Route')).toBeVisible();
});
```
If shelter ID 3 does not exist in `src/lib/sample/shelters.json`, use any real `ShelterID` from that file.

- [ ] **Step 8: Run and commit**

Run: `npm run check && npm test && npx playwright test tests/e2e/shelters.spec.ts`
Expected: `0 ERRORS`, all pass.

```bash
git add -A src messages tests
git commit -m "web: shelters with filters, detail sheet, route button; sample evacuation routes listed"
```

---

### Task 10: Route API (OpenRouteService proxy)

**Files:**
- Create: `web/src/lib/route.ts` (shared types only in this task)
- Create: `web/src/lib/server/route.ts`, `web/src/lib/server/route.test.ts`
- Create: `web/src/routes/api/route/+server.ts`
- Modify: `web/.env` (owner adds `ORS_API_KEY`; never print or commit it)

**Interfaces:**
- Consumes: `Zone`, `circle` (Task 3); `ipHash`, `rateLimitSalt` (`lib/server/rate-limit`); `sql` (`lib/server/db`); `public.reserve_report_slot` (migration 0003).
- Produces:
```ts
// src/lib/route.ts (types, shared by client and server)
export type Mode = 'foot' | 'car' | 'bike';
export type RouteReq = { from: Pt; to: Pt; mode: Mode; avoid: Zone[] };
export type Step = { type: number; name: string; distance: number; duration: number; at: number };   // at = index into line
export type RouteRes = { line: [number, number][]; distance: number; duration: number; steps: Step[]; avoided: boolean };
// src/lib/server/route.ts
export const ROUTE_RATE: { max: 30; windowMinutes: 10 };
export function parseRouteReq(body: unknown): { ok: true; value: RouteReq } | { ok: false; error: string };
export function orsRoute(q: RouteReq, apiKey: string, fetchFn?: typeof fetch, now?: number): Promise<RouteRes | null>;
export function clearRouteCache(): void;
// POST /api/route → 200 RouteRes | 400 {message} ("outside Thailand" for points outside) | 429 | 503
```

- [ ] **Step 1: Ask the owner for the OpenRouteService key** (owner action. Stop and ask)

Tell the owner:
1. Go to https://openrouteservice.org, choose **Sign up**, and confirm the email.
2. Open the **Dashboard**, then **Request a token**, choose **Standard**, name it `dems`, and **Create token**.
3. Copy the key. Open `web/.env` in this worktree and add a line `ORS_API_KEY=<the key>`.
4. In Vercel go to **Project → Settings → Environment Variables**. Add `ORS_API_KEY` with the same key, ticked for **Production** and **Preview**.

Continue with Steps 2–7 while waiting. They don't need the key. Step 8 does.

- [ ] **Step 2: Shared types in `web/src/lib/route.ts`**

```ts
import type { Pt } from './types';
import type { Zone } from './zones';

export type Mode = 'foot' | 'car' | 'bike';
export type RouteReq = { from: Pt; to: Pt; mode: Mode; avoid: Zone[] };
/** `type` is the OpenRouteService instruction code (0 = left … 13 = keep right); `at` indexes `line`. */
export type Step = { type: number; name: string; distance: number; duration: number; at: number };
export type RouteRes = { line: [number, number][]; distance: number; duration: number; steps: Step[]; avoided: boolean };
```

- [ ] **Step 3: Write the failing server tests**

Create `web/src/lib/server/route.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRouteCache, orsRoute, parseRouteReq } from './route';

const BKK = { lat: 13.7563, lon: 100.5018 };
const DEST = { lat: 13.73, lon: 100.53 };
const ok = (avoid: unknown[] = []) => ({ from: BKK, to: DEST, mode: 'foot', avoid });
const ORS = {
	features: [
		{
			geometry: { coordinates: [[100.5018, 13.7563], [100.51, 13.75], [100.53, 13.73]] },
			properties: {
				summary: { distance: 1234.5, duration: 900 },
				segments: [
					{
						steps: [
							{ distance: 400, duration: 300, type: 11, name: 'Rama IV Road', way_points: [0, 1] },
							{ distance: 834.5, duration: 600, type: 0, name: '-', way_points: [1, 2] },
							{ distance: 0, duration: 0, type: 10, name: '-', way_points: [2, 2] }
						]
					}
				]
			}
		}
	]
};
const res = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });

describe('parseRouteReq', () => {
	it('accepts a valid request', () => {
		expect(parseRouteReq(ok([{ lat: 13.8, lon: 100.5, km: 10 }]))).toEqual({ ok: true, value: { from: BKK, to: DEST, mode: 'foot', avoid: [{ lat: 13.8, lon: 100.5, km: 10 }] } });
	});
	it.each([
		[null, 'Body must be JSON'],
		[{ ...ok(), from: { lat: 'x', lon: 1 } }, 'from and to need lat and lon'],
		[{ ...ok(), to: { lat: 35.6, lon: 139.7 } }, 'outside Thailand'],
		[{ ...ok(), mode: 'plane' }, 'mode must be foot, car or bike'],
		[ok(Array.from({ length: 11 }, () => ({ lat: 13.8, lon: 100.5, km: 1 }))), 'at most 10 avoid zones'],
		[ok([{ lat: 13.8, lon: 100.5, km: 16 }]), 'each zone needs lat, lon and km (0–15)']
	])('rejects %j', (body, error) => {
		expect(parseRouteReq(body)).toEqual({ ok: false, error });
	});
});

describe('orsRoute', () => {
	beforeEach(() => clearRouteCache());
	const q = parseRouteReq(ok([{ lat: 13.8, lon: 100.5, km: 10 }])) as { ok: true; value: Parameters<typeof orsRoute>[0] };

	it('calls ORS with the profile, key, coordinates and avoid polygons, and maps the answer', async () => {
		const f = vi.fn(async () => res(200, ORS));
		const r = await orsRoute(q.value, 'KEY', f as typeof fetch, 0);
		const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://api.openrouteservice.org/v2/directions/foot-walking/geojson');
		expect((init.headers as Record<string, string>).Authorization).toBe('KEY');
		const body = JSON.parse(init.body as string);
		expect(body.coordinates).toEqual([[100.5018, 13.7563], [100.53, 13.73]]);
		expect(body.options.avoid_polygons.type).toBe('MultiPolygon');
		expect(r).toEqual({
			line: [[100.5018, 13.7563], [100.51, 13.75], [100.53, 13.73]],
			distance: 1234.5,
			duration: 900,
			steps: [
				{ type: 11, name: 'Rama IV Road', distance: 400, duration: 300, at: 0 },
				{ type: 0, name: '', distance: 834.5, duration: 600, at: 1 },
				{ type: 10, name: '', distance: 0, duration: 0, at: 2 }
			],
			avoided: true
		});
	});
	it('retries without avoid polygons when ORS rejects them, and says so', async () => {
		const f = vi.fn().mockResolvedValueOnce(res(400, { error: { code: 2003 } })).mockResolvedValueOnce(res(200, ORS));
		const r = await orsRoute(q.value, 'KEY', f as typeof fetch, 0);
		expect(f).toHaveBeenCalledTimes(2);
		expect(JSON.parse((f.mock.calls[1][1] as RequestInit).body as string).options).toBeUndefined();
		expect(r?.avoided).toBe(false);
	});
	it('returns null when ORS is down or the network fails', async () => {
		expect(await orsRoute(q.value, 'KEY', (async () => res(503)) as typeof fetch, 0)).toBeNull();
		expect(await orsRoute(q.value, 'KEY', (async () => { throw new Error('net'); }) as typeof fetch, 0)).toBeNull();
	});
	it('caches the same request for 10 minutes', async () => {
		const f = vi.fn(async () => res(200, ORS));
		await orsRoute(q.value, 'KEY', f as typeof fetch, 0);
		await orsRoute(q.value, 'KEY', f as typeof fetch, 9 * 60_000);
		expect(f).toHaveBeenCalledTimes(1);
		await orsRoute(q.value, 'KEY', f as typeof fetch, 11 * 60_000);
		expect(f).toHaveBeenCalledTimes(2);
	});
});
```

- [ ] **Step 4: Run them to make sure they fail**

Run: `npm test -- src/lib/server/route.test.ts`
Expected: FAIL, `Failed to resolve import "./route"`.

- [ ] **Step 5: Write `web/src/lib/server/route.ts`**

```ts
import type { RouteReq, RouteRes } from '$lib/route';
import type { Pt } from '$lib/types';
import { circle, type Zone } from '$lib/zones';

/** Separate bucket from reports: the hash is prefixed `route:` before reserve_report_slot. */
export const ROUTE_RATE = { max: 30, windowMinutes: 10 } as const;

const PROFILE = { foot: 'foot-walking', car: 'driving-car', bike: 'cycling-regular' } as const;
const inThailand = (p: Pt) => p.lat >= 5 && p.lat <= 21 && p.lon >= 97 && p.lon <= 106;
const isPt = (v: unknown): v is Pt =>
	typeof v === 'object' && v !== null && Number.isFinite((v as Pt).lat) && Number.isFinite((v as Pt).lon);

export function parseRouteReq(b: unknown): { ok: true; value: RouteReq } | { ok: false; error: string } {
	if (typeof b !== 'object' || b === null) return { ok: false, error: 'Body must be JSON' };
	const { from, to, mode, avoid = [] } = b as Record<string, unknown>;
	if (!isPt(from) || !isPt(to)) return { ok: false, error: 'from and to need lat and lon' };
	if (!inThailand(from) || !inThailand(to)) return { ok: false, error: 'outside Thailand' };
	if (mode !== 'foot' && mode !== 'car' && mode !== 'bike') return { ok: false, error: 'mode must be foot, car or bike' };
	if (!Array.isArray(avoid) || avoid.length > 10) return { ok: false, error: 'at most 10 avoid zones' };
	for (const z of avoid) {
		if (!isPt(z) || typeof (z as Zone).km !== 'number' || !((z as Zone).km > 0 && (z as Zone).km <= 15)) {
			return { ok: false, error: 'each zone needs lat, lon and km (0–15)' };
		}
	}
	return {
		ok: true,
		value: {
			from: { lat: from.lat, lon: from.lon },
			to: { lat: to.lat, lon: to.lon },
			mode,
			avoid: (avoid as Zone[]).map((z) => ({ lat: z.lat, lon: z.lon, km: z.km }))
		}
	};
}

type OrsStep = { distance: number; duration: number; type: number; name: string; way_points: [number, number] };
type OrsJson = {
	features?: {
		geometry: { coordinates: number[][] };
		properties: { summary?: { distance?: number; duration?: number }; segments?: { steps?: OrsStep[] }[] };
	}[];
};

// ponytail: per-instance memory cache; a shared store (KV) if traffic ever needs it.
const cache = new Map<string, { at: number; value: RouteRes }>();
const TTL = 10 * 60_000;
const r4 = (n: number) => n.toFixed(4);
const keyOf = (q: RouteReq) =>
	[q.mode, r4(q.from.lat), r4(q.from.lon), r4(q.to.lat), r4(q.to.lon), ...q.avoid.map((z) => `${r4(z.lat)},${r4(z.lon)},${z.km}`)].join('|');
export const clearRouteCache = () => cache.clear();

export async function orsRoute(q: RouteReq, apiKey: string, fetchFn: typeof fetch = fetch, now = Date.now()): Promise<RouteRes | null> {
	const key = keyOf(q);
	const hit = cache.get(key);
	if (hit && now - hit.at < TTL) return hit.value;

	const call = (avoid: Zone[]) =>
		fetchFn(`https://api.openrouteservice.org/v2/directions/${PROFILE[q.mode]}/geojson`, {
			method: 'POST',
			headers: { Authorization: apiKey, 'content-type': 'application/json', accept: 'application/geo+json' },
			body: JSON.stringify({
				coordinates: [
					[q.from.lon, q.from.lat],
					[q.to.lon, q.to.lat]
				],
				instructions: true,
				units: 'm',
				...(avoid.length ? { options: { avoid_polygons: { type: 'MultiPolygon', coordinates: avoid.map((z) => [circle(z)]) } } } : {})
			}),
			signal: AbortSignal.timeout(10_000)
		});

	try {
		let avoided = q.avoid.length > 0;
		let res = await call(q.avoid);
		// ORS refuses some avoid polygons (too large, overlapping the start): route without them and tell the user.
		if (!res.ok && res.status === 400 && avoided) {
			res = await call([]);
			avoided = false;
		}
		if (!res.ok) return null;
		const f = ((await res.json()) as OrsJson).features?.[0];
		if (!f) return null;
		const value: RouteRes = {
			line: f.geometry.coordinates.map((c) => [c[0], c[1]] as [number, number]),
			distance: f.properties.summary?.distance ?? 0,
			duration: f.properties.summary?.duration ?? 0,
			steps: (f.properties.segments ?? [])
				.flatMap((s) => s.steps ?? [])
				.map((s) => ({ type: s.type, name: s.name === '-' ? '' : s.name, distance: s.distance, duration: s.duration, at: s.way_points[0] })),
			avoided
		};
		cache.set(key, { at: now, value });
		return value;
	} catch {
		return null;
	}
}
```
Run: `npm test -- src/lib/server/route.test.ts`
Expected: PASS (all route tests).

- [ ] **Step 6: Write `web/src/routes/api/route/+server.ts`**

```ts
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sql } from '$lib/server/db';
import { ipHash, rateLimitSalt } from '$lib/server/rate-limit';
import { orsRoute, parseRouteReq, ROUTE_RATE } from '$lib/server/route';

export const POST = async ({ request, getClientAddress }) => {
	const parsed = parseRouteReq(await request.json().catch(() => null));
	if (!parsed.ok) error(400, parsed.error);
	if (!env.ORS_API_KEY) error(503, 'Routing is not configured');
	const hash = `route:${ipHash(getClientAddress(), rateLimitSalt(env.SUPABASE_SECRET_KEY))}`;
	const [{ ok }] = await sql()`select public.reserve_report_slot(${hash}, ${ROUTE_RATE.max}, ${ROUTE_RATE.windowMinutes}) as ok`;
	if (!ok) error(429, 'Too many route requests');
	const route = await orsRoute(parsed.value, env.ORS_API_KEY);
	if (!route) error(503, 'Routing unavailable');
	return json(route);
};
```

- [ ] **Step 7: Check and commit**

Run: `npm run check && npm test`
Expected: `0 ERRORS`, all pass.

```bash
git add src/lib/route.ts src/lib/server/route.ts src/lib/server/route.test.ts src/routes/api/route/+server.ts
git commit -m "web: /api/route proxy to OpenRouteService (validation, avoid zones with fallback, rate limit, cache)"
```

- [ ] **Step 8: Real smoke test (needs the key from Step 1)**

With `ORS_API_KEY` in `web/.env`, run `npm run dev`, then in a second terminal:
```bash
curl -s -X POST http://localhost:3001/api/route -H "content-type: application/json" -d "{\"from\":{\"lat\":13.7563,\"lon\":100.5018},\"to\":{\"lat\":13.7307,\"lon\":100.5232},\"mode\":\"foot\",\"avoid\":[]}" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log(r.distance,r.duration,r.steps.length,r.line.length)})"
```
Expected: four numbers, e.g. `3874.2 2789.5 9 121` (a real walking route of a few km).

If you get `Routing is not configured`, the key is missing from `.env`. If you get `Routing unavailable`, run the same request straight against ORS with `curl -H "Authorization: $KEY"` and read its error. Never paste the key into the chat or a commit.

---

### Task 11: Route screen

**Files:**
- Modify: `web/src/lib/route.ts` (client functions)
- Create: `web/src/lib/route.test.ts`
- Create: `web/src/routes/route/+page.svelte`
- Modify: `web/tests/e2e/fixtures.ts` (mock `/api/route`)
- Create: `web/tests/e2e/route.spec.ts`
- Modify: `web/messages/en.json`, `web/messages/th.json`

**Interfaces:**
- Consumes: `RouteReq`, `RouteRes`, `Step`, `Mode` (Task 10); `zonesFrom` (Task 3); `live` (Task 4); `MapView` (Task 8); `distanceKm`, `toNum`.
- Produces:
```ts
export type RouteFail = 'limited' | 'unavailable' | 'offline' | 'outside';
export function routeError(status: number, body?: string): RouteFail;
export function getRoute(req: RouteReq, fetchFn?: typeof fetch): Promise<{ ok: true; data: RouteRes } | { ok: false; reason: RouteFail }>;
export function stepText(s: Step, destination: string): string;
export function bearing(a: Pt, b: Pt): number;        // degrees 0–360, 0 = north
export function compass(deg: number): 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
export function nearestIndex(line: [number, number][], p: Pt): number;
export function offRoute(line: [number, number][], p: Pt, meters?: number): boolean;   // default 50
export function currentStep(steps: Step[], index: number): number;   // index into steps
```

- [ ] **Step 1: Messages**

`en.json`:
```json
	"route_title": "Route to {name}",
	"route_mode": "Travel mode",
	"mode_foot": "Walk",
	"mode_car": "Drive",
	"mode_bike": "Bike",
	"route_summary": "{km} km · {min} min",
	"route_avoided": "Avoids {count} hazard zones",
	"route_not_avoided": "Couldn't route around hazard zones. Check conditions on the way.",
	"route_steps": "Steps",
	"route_start": "Start",
	"route_stop": "Stop",
	"route_recalc": "You're off the route. Recalculate",
	"route_loading": "Finding a safe route…",
	"route_limited": "Too many route requests from this connection. Try again in a few minutes.",
	"route_outside": "Routing works inside Thailand only.",
	"route_fallback": "Routing is unavailable right now. Straight-line distance: {km} km to the {dir}.",
	"route_no_dest": "Choose a shelter first.",
	"route_pick_shelter": "Pick a shelter",
	"step_unnamed": "the road",
	"step_0": "Turn left onto {name}",
	"step_1": "Turn right onto {name}",
	"step_2": "Turn sharp left onto {name}",
	"step_3": "Turn sharp right onto {name}",
	"step_4": "Bear left onto {name}",
	"step_5": "Bear right onto {name}",
	"step_6": "Continue straight on {name}",
	"step_7": "Enter the roundabout",
	"step_8": "Exit the roundabout onto {name}",
	"step_9": "Make a U-turn on {name}",
	"step_10": "Arrive at {name}",
	"step_11": "Head off on {name}",
	"step_12": "Keep left onto {name}",
	"step_13": "Keep right onto {name}",
	"dir_n": "north",
	"dir_ne": "north-east",
	"dir_e": "east",
	"dir_se": "south-east",
	"dir_s": "south",
	"dir_sw": "south-west",
	"dir_w": "west",
	"dir_nw": "north-west"
```
`th.json`:
```json
	"route_title": "เส้นทางไป {name}",
	"route_mode": "วิธีเดินทาง",
	"mode_foot": "เดิน",
	"mode_car": "ขับรถ",
	"mode_bike": "จักรยาน",
	"route_summary": "{km} กม. · {min} นาที",
	"route_avoided": "หลีกเลี่ยงพื้นที่อันตราย {count} แห่ง",
	"route_not_avoided": "ไม่สามารถหาเส้นทางเลี่ยงพื้นที่อันตรายได้ โปรดตรวจสภาพระหว่างทาง",
	"route_steps": "ขั้นตอน",
	"route_start": "เริ่มนำทาง",
	"route_stop": "หยุด",
	"route_recalc": "คุณออกนอกเส้นทาง คำนวณใหม่",
	"route_loading": "กำลังหาเส้นทางที่ปลอดภัย…",
	"route_limited": "ขอเส้นทางจากการเชื่อมต่อนี้บ่อยเกินไป โปรดลองใหม่ในอีกไม่กี่นาที",
	"route_outside": "ระบบนำทางใช้ได้เฉพาะในประเทศไทย",
	"route_fallback": "ระบบนำทางใช้ไม่ได้ขณะนี้ ระยะทางเส้นตรง {km} กม. ไปทาง{dir}",
	"route_no_dest": "โปรดเลือกที่พักพิงก่อน",
	"route_pick_shelter": "เลือกที่พักพิง",
	"step_unnamed": "ถนน",
	"step_0": "เลี้ยวซ้ายเข้า {name}",
	"step_1": "เลี้ยวขวาเข้า {name}",
	"step_2": "เลี้ยวซ้ายหักศอกเข้า {name}",
	"step_3": "เลี้ยวขวาหักศอกเข้า {name}",
	"step_4": "เบี่ยงซ้ายเข้า {name}",
	"step_5": "เบี่ยงขวาเข้า {name}",
	"step_6": "ตรงไปตาม {name}",
	"step_7": "เข้าวงเวียน",
	"step_8": "ออกจากวงเวียนเข้า {name}",
	"step_9": "กลับรถที่ {name}",
	"step_10": "ถึง {name}",
	"step_11": "ออกเดินทางทาง {name}",
	"step_12": "ชิดซ้ายเข้า {name}",
	"step_13": "ชิดขวาเข้า {name}",
	"dir_n": "ทิศเหนือ",
	"dir_ne": "ทิศตะวันออกเฉียงเหนือ",
	"dir_e": "ทิศตะวันออก",
	"dir_se": "ทิศตะวันออกเฉียงใต้",
	"dir_s": "ทิศใต้",
	"dir_sw": "ทิศตะวันตกเฉียงใต้",
	"dir_w": "ทิศตะวันตก",
	"dir_nw": "ทิศตะวันตกเฉียงเหนือ"
```
`step_7` has no `{name}`. Paraglide then generates a function that takes no inputs, so `stepText` calls it without arguments (see Step 3).

- [ ] **Step 2: Write the failing client tests**

Create `web/src/lib/route.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { bearing, compass, currentStep, getRoute, nearestIndex, offRoute, routeError, stepText } from './route';

const line: [number, number][] = [
	[100.5, 13.75],
	[100.51, 13.75],
	[100.52, 13.75]
];

describe('step text', () => {
	it('builds instructions from ORS codes, with a fallback street name and the destination at the end', () => {
		expect(stepText({ type: 0, name: 'Rama IV Road', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Turn left onto Rama IV Road');
		expect(stepText({ type: 1, name: '', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Turn right onto the road');
		expect(stepText({ type: 10, name: '', distance: 0, duration: 0, at: 2 }, 'Bangkok Stadium')).toBe('Arrive at Bangkok Stadium');
		expect(stepText({ type: 7, name: 'x', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Enter the roundabout');
		expect(stepText({ type: 99, name: 'Soi 5', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Continue straight on Soi 5');
	});
});

describe('compass', () => {
	it('gives the direction to the destination', () => {
		expect(compass(bearing({ lat: 13, lon: 100 }, { lat: 14, lon: 100 }))).toBe('n');
		expect(compass(bearing({ lat: 13, lon: 100 }, { lat: 13, lon: 101 }))).toBe('e');
		expect(compass(bearing({ lat: 13, lon: 100 }, { lat: 12, lon: 99 }))).toBe('sw');
	});
});

describe('following', () => {
	it('finds the nearest point and detects leaving the route', () => {
		expect(nearestIndex(line, { lat: 13.7501, lon: 100.5101 })).toBe(1);
		expect(offRoute(line, { lat: 13.7502, lon: 100.51 })).toBe(false); // ~22 m
		expect(offRoute(line, { lat: 13.752, lon: 100.51 })).toBe(true); // ~220 m
	});
	it('the current step is the last one that starts at or before the position', () => {
		const steps = [0, 1, 2].map((at) => ({ type: 6, name: '', distance: 1, duration: 1, at }));
		expect(currentStep(steps, 0)).toBe(0);
		expect(currentStep(steps, 1)).toBe(1);
		expect(currentStep(steps, 5)).toBe(2);
	});
});

describe('errors', () => {
	it('maps HTTP answers to what the user is told', () => {
		expect(routeError(429)).toBe('limited');
		expect(routeError(400, '{"message":"outside Thailand"}')).toBe('outside');
		expect(routeError(503)).toBe('unavailable');
		expect(routeError(400, '{"message":"mode must be foot, car or bike"}')).toBe('unavailable');
	});
	it('a network failure is offline', async () => {
		const r = await getRoute({ from: { lat: 13, lon: 100 }, to: { lat: 13, lon: 100 }, mode: 'foot', avoid: [] }, (async () => {
			throw new Error('net');
		}) as typeof fetch);
		expect(r).toEqual({ ok: false, reason: 'offline' });
	});
});
```

- [ ] **Step 3: Add the client functions to `web/src/lib/route.ts`**

Append (and add `import { distanceKm } from './geo';` and `import { m } from './paraglide/messages.js';` at the top):
```ts
export type RouteFail = 'limited' | 'unavailable' | 'offline' | 'outside';

export const routeError = (status: number, body = ''): RouteFail =>
	status === 429 ? 'limited' : status === 400 && body.includes('outside Thailand') ? 'outside' : 'unavailable';

export async function getRoute(
	req: RouteReq,
	fetchFn: typeof fetch = (u, i) => fetch(u, i)
): Promise<{ ok: true; data: RouteRes } | { ok: false; reason: RouteFail }> {
	try {
		const res = await fetchFn('/api/route', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(req),
			signal: AbortSignal.timeout(15_000)
		});
		if (res.ok) return { ok: true, data: (await res.json()) as RouteRes };
		return { ok: false, reason: routeError(res.status, await res.text()) };
	} catch {
		return { ok: false, reason: 'offline' };
	}
}

const STEP: Record<number, (i: { name: string }) => string> = {
	0: m.step_0,
	1: m.step_1,
	2: m.step_2,
	3: m.step_3,
	4: m.step_4,
	5: m.step_5,
	6: m.step_6,
	8: m.step_8,
	9: m.step_9,
	10: m.step_10,
	11: m.step_11,
	12: m.step_12,
	13: m.step_13
};
/** ORS has no Thai, so we write the instructions ourselves from its codes. */
export function stepText(s: Step, destination: string): string {
	if (s.type === 7) return m.step_7();
	const name = s.type === 10 ? destination : s.name || m.step_unnamed();
	return (STEP[s.type] ?? m.step_6)({ name });
}

export function bearing(a: Pt, b: Pt): number {
	const r = (d: number) => (d * Math.PI) / 180;
	const y = Math.sin(r(b.lon - a.lon)) * Math.cos(r(b.lat));
	const x = Math.cos(r(a.lat)) * Math.sin(r(b.lat)) - Math.sin(r(a.lat)) * Math.cos(r(b.lat)) * Math.cos(r(b.lon - a.lon));
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const DIRS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
export const compass = (deg: number) => DIRS[Math.round(deg / 45) % 8];

export function nearestIndex(line: [number, number][], p: Pt): number {
	let best = 0;
	let bestKm = Infinity;
	line.forEach(([lon, lat], i) => {
		const km = distanceKm(p, { lat, lon });
		if (km < bestKm) [best, bestKm] = [i, km];
	});
	return best;
}
// ponytail: distance to the nearest vertex, not the segment; fine because ORS lines have dense vertices.
export const offRoute = (line: [number, number][], p: Pt, meters = 50): boolean =>
	line.length > 0 && distanceKm(p, { lat: line[nearestIndex(line, p)][1], lon: line[nearestIndex(line, p)][0] }) * 1000 > meters;

export function currentStep(steps: Step[], index: number): number {
	let cur = 0;
	steps.forEach((s, i) => {
		if (s.at <= index) cur = i;
	});
	return cur;
}
```
Run: `npm test -- src/lib/route.test.ts`
Expected: PASS (all route tests). If `m.step_7()` does not type-check because Paraglide still expects an inputs object, call `m.step_7({})`.

- [ ] **Step 4: Write `web/src/routes/route/+page.svelte`**

```svelte
<script lang="ts">
	import { Bike, Car, Footprints, Navigation } from '@lucide/svelte';
	import { onDestroy, onMount, untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { page } from '$app/state';
	import MapView from '$lib/components/MapView.svelte';
	import { api } from '$lib/config';
	import { distanceKm, toNum } from '$lib/geo';
	import { live } from '$lib/hazards.svelte';
	import { here } from '$lib/location.svelte';
	import { LEVEL_HEX } from '$lib/logo';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { bearing, compass, currentStep, getRoute, nearestIndex, offRoute, stepText, type Mode, type RouteFail, type RouteRes } from '$lib/route';
	import type { MapMarker, Pt, Shelter } from '$lib/types';
	import { zonesFrom } from '$lib/zones';

	const wide = new MediaQuery('min-width: 1024px');
	const to = page.url.searchParams.get('to') ?? '';
	let mode = $state<Mode>((['foot', 'car', 'bike'].includes(page.url.searchParams.get('mode') ?? '') ? page.url.searchParams.get('mode') : 'foot') as Mode);
	let dest = $state<{ name: string; at: Pt } | null>(null);
	let result = $state<{ ok: true; data: RouteRes } | { ok: false; reason: RouteFail } | null>(null);
	let me = $state<Pt | null>(null);
	let watchId: number | null = null;

	onMount(async () => {
		if (to.startsWith('shelter:')) {
			const id = Number(to.slice(8));
			const s = (await api.shelters()).data.find((x: Shelter) => x.ShelterID === id);
			const lat = toNum(s?.Latitude);
			const lon = toNum(s?.Longitude);
			if (s && lat !== null && lon !== null) dest = { name: s.ShelterName, at: { lat, lon } };
		} else {
			const [lat, lon] = to.split(',').map(Number);
			if (Number.isFinite(lat) && Number.isFinite(lon)) dest = { name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`, at: { lat, lon } };
		}
	});

	const zones = $derived(zonesFrom(live.a?.hazards ?? []));
	async function load() {
		if (!dest) return;
		result = null;
		result = await getRoute({ from: me ?? here.place, to: dest.at, mode, avoid: zones });
	}
	// Reload when the destination or mode changes; `me`/zones are read inside load() untracked.
	$effect(() => {
		void dest;
		void mode;
		untrack(load);
	});

	const route = $derived(result?.ok ? result.data : null);
	const idx = $derived(route && me ? nearestIndex(route.line, me) : 0);
	const stepNow = $derived(route ? currentStep(route.steps, idx) : 0);
	const off = $derived(!!(route && me && offRoute(route.line, me)));

	function start() {
		if (!('geolocation' in navigator)) return;
		watchId = navigator.geolocation.watchPosition((p) => (me = { lat: p.coords.latitude, lon: p.coords.longitude }), () => {}, {
			enableHighAccuracy: true,
			maximumAge: 5000
		});
	}
	function stop() {
		if (watchId !== null) navigator.geolocation.clearWatch(watchId);
		watchId = null;
		me = null;
	}
	onDestroy(stop);

	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: (me ?? here.place).lat, lon: (me ?? here.place).lon, label: m.location_label() },
		...(dest ? [{ id: 'dest', kind: 'shelter' as const, lat: dest.at.lat, lon: dest.at.lon, label: dest.name }] : [])
	]);
	const lines = $derived(route ? [{ id: 'route', coords: route.line, color: '#0a84ff' }] : []);
	const areas = $derived(zones.map((z, i) => ({ id: `z${i}`, ...z, color: LEVEL_HEX.warning })));
	const straight = $derived(dest ? { km: distanceKm(here.place, dest.at).toFixed(1), dir: m[`dir_${compass(bearing(here.place, dest.at))}`]() } : null);
	const MODES: [Mode, () => string, typeof Footprints][] = [
		['foot', m.mode_foot, Footprints],
		['car', m.mode_car, Car],
		['bike', m.mode_bike, Bike]
	];
</script>

{#snippet panel()}
	{#if !dest}
		<p class="text-muted">{m.route_no_dest()}</p>
		<a href={localizeHref('/shelters')} class="mt-3 inline-flex min-h-11 items-center rounded-lg bg-text px-4 font-semibold text-bg">{m.route_pick_shelter()}</a>
	{:else}
		<h1 class="headline text-2xl">{m.route_title({ name: dest.name })}</h1>
		<div role="group" aria-label={m.route_mode()} class="mt-3 grid grid-cols-3 gap-1.5">
			{#each MODES as [k, label, Icon] (k)}
				<button type="button" aria-pressed={mode === k} onclick={() => (mode = k)} class="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border text-sm {mode === k ? 'border-white/30 bg-white/10' : 'border-line text-muted'}">
					<Icon size={16} aria-hidden="true" />{label()}
				</button>
			{/each}
		</div>
		{#if result === null}
			<p class="mt-4 text-sm text-muted" role="status">{m.route_loading()}</p>
		{:else if route}
			<p class="mt-4 text-3xl font-semibold tracking-tight">{m.route_summary({ km: (route.distance / 1000).toFixed(1), min: Math.max(1, Math.round(route.duration / 60)) })}</p>
			{#if route.avoided}<p class="mt-1 text-sm text-safe">{m.route_avoided({ count: zones.length })}</p>{:else if zones.length}<p class="mt-1 text-sm text-watch">{m.route_not_avoided()}</p>{/if}
			<div class="mt-3 flex gap-2">
				{#if watchId === null}
					<button type="button" onclick={start} class="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-text font-semibold text-bg"><Navigation size={16} aria-hidden="true" />{m.route_start()}</button>
				{:else}
					<button type="button" onclick={stop} class="min-h-11 flex-1 rounded-xl border border-line font-semibold">{m.route_stop()}</button>
				{/if}
			</div>
			{#if off}<button type="button" onclick={load} class="mt-2 min-h-11 w-full rounded-xl bg-watch font-semibold text-bg">{m.route_recalc()}</button>{/if}
			<h2 class="label mt-5 mb-2">{m.route_steps()}</h2>
			<ol class="flex flex-col gap-1">
				{#each route.steps as s, i (i)}
					<li class="flex justify-between gap-3 rounded-lg px-2 py-2 text-sm {i === stepNow && me ? 'bg-info/15 text-text' : ''}" aria-current={i === stepNow && me ? 'step' : undefined}>
						<span>{stepText(s, dest.name)}</span><span class="shrink-0 font-mono text-xs text-muted">{s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${Math.round(s.distance)} m`}</span>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="mt-4 text-sm" role="alert">
				{result.reason === 'limited' ? m.route_limited() : result.reason === 'outside' ? m.route_outside() : m.route_fallback({ km: straight!.km, dir: straight!.dir })}
			</p>
			<a href="https://www.google.com/maps/dir/?api=1&destination={dest.at.lat},{dest.at.lon}" target="_blank" rel="noopener" class="mt-2 inline-block text-sm text-muted underline">{m.shelter_gmaps()}</a>
		{/if}
	{/if}
{/snippet}

{#if wide.current}
	<div class="fixed inset-x-0 top-[var(--header-h)] bottom-0 grid grid-cols-[400px_1fr]">
		<aside class="overflow-y-auto border-r border-line p-5">{@render panel()}</aside>
		<MapView class="relative" {markers} {lines} {areas} center={here.place} zoom={12} fit={route?.line ?? null} />
	</div>
{:else}
	<MapView class="fixed inset-x-0 top-[var(--header-h)] h-[42vh]" {markers} {lines} {areas} center={here.place} zoom={12} fit={route?.line ?? null} />
	<div class="page" style="padding-top: calc(var(--header-h) + 42vh + 1rem)">{@render panel()}</div>
{/if}
```
Deliberate gap: spec §2.5's "route line draws itself" is not built, because MapLibre line layers can't use CSS `stroke-dashoffset`. The animated `fitBounds` stands in. Record this as a ruling if executing with a ledger.

Type note: `m[\`dir_${...}\`]` needs a typed lookup. If `svelte-check` complains, replace it with `({ n: m.dir_n, ne: m.dir_ne, e: m.dir_e, se: m.dir_se, s: m.dir_s, sw: m.dir_sw, w: m.dir_w, nw: m.dir_nw })[compass(...)]()`.

- [ ] **Step 5: Mock `/api/route` in the e2e fixtures**

In `web/tests/e2e/fixtures.ts`, inside the `/api/` route handler, before the generic `POST` branch, add:
```ts
					if (new URL(r.request().url()).pathname === '/api/route') {
						return r.fulfill({ ...json, body: ROUTE });
					}
```
And at the top level of the file:
```ts
export const ROUTE = JSON.stringify({
	line: [[100.5018, 13.7563], [100.51, 13.75], [100.5232, 13.7307]],
	distance: 3874,
	duration: 2790,
	steps: [
		{ type: 11, name: 'Ratchadamnoen Road', distance: 900, duration: 650, at: 0 },
		{ type: 0, name: 'Rama IV Road', distance: 2974, duration: 2140, at: 1 },
		{ type: 10, name: '', distance: 0, duration: 0, at: 2 }
	],
	avoided: false
});
```

- [ ] **Step 6: Write `web/tests/e2e/route.spec.ts`**

```ts
import { expect, test } from './fixtures';

test('route to a shelter: summary, steps in words, mode switch re-requests', async ({ page }) => {
	const modes: string[] = [];
	page.on('request', (r) => r.url().endsWith('/api/route') && modes.push(JSON.parse(r.postData() ?? '{}').mode));
	await page.goto('/route?to=shelter:2');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Route to');
	await expect(page.getByText('3.9 km · 47 min')).toBeVisible();
	await expect(page.getByText('Turn left onto Rama IV Road')).toBeVisible();
	await expect(page.getByText(/^Arrive at /)).toBeVisible();
	await page.getByRole('button', { name: 'Drive' }).click();
	await expect.poll(() => modes).toEqual(['foot', 'car']);
});

test('routing down: straight-line fallback and Google Maps link', async ({ page }) => {
	await page.route((u) => u.pathname === '/api/route', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Routing unavailable"}' }));
	await page.goto('/route?to=shelter:2');
	await expect(page.getByRole('alert')).toContainText('Straight-line distance');
	await expect(page.getByRole('link', { name: 'Open in Google Maps' })).toBeVisible();
});

test('outside Thailand is explained, not a spinner', async ({ page }) => {
	await page.route((u) => u.pathname === '/api/route', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: '{"message":"outside Thailand"}' }));
	await page.goto('/route?to=shelter:2');
	await expect(page.getByRole('alert')).toHaveText('Routing works inside Thailand only.');
});

test('no destination asks you to pick a shelter', async ({ page }) => {
	await page.goto('/route');
	await expect(page.getByRole('link', { name: 'Pick a shelter' })).toHaveAttribute('href', '/shelters');
});
```
Use a `ShelterID` that exists in the sample data with coordinates. Check `src/lib/sample/shelters.json`, and if `2` is not one, change `shelter:2`.

- [ ] **Step 7: Run and commit**

Run: `npm run check && npm test && npx playwright test tests/e2e/route.spec.ts tests/e2e/now.spec.ts`
Expected: `0 ERRORS`, all pass.

```bash
git add -A src messages tests
git commit -m "web: our own route guide (map line, steps in EN/TH, follow mode, off-route recalc, fallbacks)"
```

---

### Task 12: Prepare screens

**Files:**
- Create: `web/src/lib/prepare/checklist.ts`, `web/src/lib/prepare/checklist.test.ts`
- Create: `web/src/routes/prepare/+page.svelte`
- Create: `web/src/routes/prepare/[hazard]/+page.ts`, `web/src/routes/prepare/[hazard]/+page.svelte`
- Create: `web/tests/e2e/prepare.spec.ts`
- Modify: `web/messages/en.json`, `web/messages/th.json`

**Interfaces:**
- Consumes: `GUIDES`, `GUIDE`, `GO_BAG`, `NUMBERS`, `tx`, `GuideId` (Task 5).
- Produces:
```ts
export const CHECK_KEY = 'dems.gobag';
export function loadChecks(storage?: Pick<Storage, 'getItem'> | null): Set<string>;
export function saveChecks(done: Set<string>, storage?: Pick<Storage, 'setItem'> | null): void;
export function toggled(done: Set<string>, id: string): Set<string>;
```

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/prepare/checklist.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { CHECK_KEY, loadChecks, saveChecks, toggled } from './checklist';

const mem = () => {
	const s = new Map<string, string>();
	return { getItem: (k: string) => s.get(k) ?? null, setItem: (k: string, v: string) => void s.set(k, v) };
};
const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

describe('go-bag checklist', () => {
	it('round-trips through storage', () => {
		const st = mem();
		saveChecks(new Set(['water', 'meds']), st);
		expect([...loadChecks(st)].sort()).toEqual(['meds', 'water']);
		expect(st.getItem(CHECK_KEY)).toBe('["water","meds"]');
	});
	it('toggles without mutating', () => {
		const a = new Set(['water']);
		const b = toggled(a, 'water');
		expect(a.has('water')).toBe(true);
		expect(b.has('water')).toBe(false);
		expect(toggled(b, 'food').has('food')).toBe(true);
	});
	it('blocked or corrupt storage never throws', () => {
		expect(loadChecks(broken)).toEqual(new Set());
		expect(() => saveChecks(new Set(['x']), broken)).not.toThrow();
		const st = mem();
		st.setItem(CHECK_KEY, '{not json');
		expect(loadChecks(st)).toEqual(new Set());
		expect(loadChecks(null)).toEqual(new Set());
	});
});
```
Run: `npm test -- src/lib/prepare/checklist.test.ts`
Expected: FAIL, `Failed to resolve import "./checklist"`.

- [ ] **Step 2: Write `web/src/lib/prepare/checklist.ts`**

```ts
export const CHECK_KEY = 'dems.gobag';

const storage = (): Storage | null => {
	try {
		return typeof localStorage === 'undefined' ? null : localStorage;
	} catch {
		return null;
	}
};

export function loadChecks(st: Pick<Storage, 'getItem'> | null = storage()): Set<string> {
	try {
		const raw = st?.getItem(CHECK_KEY);
		const list: unknown = raw ? JSON.parse(raw) : [];
		return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
	} catch {
		return new Set();
	}
}

export function saveChecks(done: Set<string>, st: Pick<Storage, 'setItem'> | null = storage()): void {
	try {
		st?.setItem(CHECK_KEY, JSON.stringify([...done]));
	} catch {
		// private mode or full storage: ticks just aren't remembered
	}
}

export function toggled(done: Set<string>, id: string): Set<string> {
	const n = new Set(done);
	if (n.has(id)) n.delete(id);
	else n.add(id);
	return n;
}
```
Run: `npm test -- src/lib/prepare/checklist.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 3: Messages**

`en.json`:
```json
	"prep_title": "Prepare",
	"prep_intro": "Get ready before it happens. Guides for each hazard, a go-bag list and the numbers to call.",
	"prep_guides": "Hazard guides",
	"prep_bag": "Go-bag checklist",
	"prep_bag_count": "{done} of {total} ready",
	"prep_bag_reset": "Reset",
	"prep_bag_note": "Saved on this device only.",
	"prep_numbers": "Emergency numbers",
	"prep_before": "Before",
	"prep_during": "During",
	"prep_after": "After",
	"prep_back": "All guides",
	"prep_call": "Call {tel}"
```
`th.json`:
```json
	"prep_title": "เตรียมพร้อม",
	"prep_intro": "เตรียมตัวก่อนเกิดเหตุ คู่มือสำหรับภัยแต่ละประเภท รายการกระเป๋าฉุกเฉิน และเบอร์โทรฉุกเฉิน",
	"prep_guides": "คู่มือรับมือภัย",
	"prep_bag": "รายการกระเป๋าฉุกเฉิน",
	"prep_bag_count": "พร้อมแล้ว {done} จาก {total}",
	"prep_bag_reset": "ล้าง",
	"prep_bag_note": "บันทึกไว้ในเครื่องนี้เท่านั้น",
	"prep_numbers": "เบอร์โทรฉุกเฉิน",
	"prep_before": "ก่อนเกิดเหตุ",
	"prep_during": "ระหว่างเกิดเหตุ",
	"prep_after": "หลังเกิดเหตุ",
	"prep_back": "คู่มือทั้งหมด",
	"prep_call": "โทร {tel}"
```

- [ ] **Step 4: Write `web/src/routes/prepare/+page.svelte`**

```svelte
<script lang="ts">
	import { Check, Phone } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { loadChecks, saveChecks, toggled } from '$lib/prepare/checklist';
	import { GO_BAG, GUIDE, GUIDES, NUMBERS, tx } from '$lib/prepare/guides';

	let done = $state(new Set<string>());
	onMount(() => (done = loadChecks()));
	function flip(id: string) {
		done = toggled(done, id);
		saveChecks(done);
	}
	function reset() {
		done = new Set();
		saveChecks(done);
	}
</script>

<div class="page max-w-4xl">
	<h1 class="headline text-4xl">{m.prep_title()}</h1>
	<p class="mt-2 max-w-xl text-muted">{m.prep_intro()}</p>

	<h2 class="label mt-8 mb-3">{m.prep_guides()}</h2>
	<ul class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
		{#each GUIDES as id (id)}
			<li>
				<a href={localizeHref(`/prepare/${id}`)} class="glass flex h-full flex-col gap-1 rounded-2xl p-4 hover:bg-white/[0.07]">
					<span class="font-semibold">{tx(GUIDE[id].title)}</span>
					<span class="text-sm text-muted">{tx(GUIDE[id].summary)}</span>
				</a>
			</li>
		{/each}
	</ul>

	<div class="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
		<section>
			<div class="mb-3 flex items-baseline justify-between">
				<h2 class="label">{m.prep_bag()}</h2>
				<span class="font-mono text-xs text-muted" role="status">{m.prep_bag_count({ done: done.size, total: GO_BAG.length })}</span>
			</div>
			<ul class="glass divide-y divide-line rounded-2xl">
				{#each GO_BAG as item (item.id)}
					<li>
						<label class="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5 text-sm">
							<input type="checkbox" class="peer sr-only" checked={done.has(item.id)} onchange={() => flip(item.id)} />
							<span class="grid size-5 shrink-0 place-items-center rounded-md border border-line peer-checked:border-safe peer-checked:bg-safe peer-focus-visible:outline-2 peer-focus-visible:outline-info" aria-hidden="true">
								{#if done.has(item.id)}<Check size={14} class="text-bg" />{/if}
							</span>
							<span class={done.has(item.id) ? 'text-muted line-through' : ''}>{tx(item.text)}</span>
						</label>
					</li>
				{/each}
			</ul>
			<div class="mt-2 flex items-center justify-between text-xs text-muted">
				<span>{m.prep_bag_note()}</span>
				<button type="button" onclick={reset} class="min-h-11 px-2 underline">{m.prep_bag_reset()}</button>
			</div>
		</section>
		<section>
			<h2 class="label mb-3">{m.prep_numbers()}</h2>
			<ul class="flex flex-col gap-2">
				{#each NUMBERS as n (n.tel)}
					<li>
						<a href="tel:{n.tel}" aria-label={m.prep_call({ tel: n.tel })} class="glass flex min-h-14 items-center gap-3 rounded-2xl px-4">
							<Phone size={16} class="text-warning" aria-hidden="true" />
							<span class="font-mono text-xl font-semibold">{n.tel}</span>
							<span class="text-sm text-muted">{tx(n.name)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	</div>
</div>
```

- [ ] **Step 5: Write the guide route**

`web/src/routes/prepare/[hazard]/+page.ts`:
```ts
import { error } from '@sveltejs/kit';
import { GUIDES, type GuideId } from '$lib/prepare/guides';

export const load = ({ params }) => {
	if (!(GUIDES as readonly string[]).includes(params.hazard)) error(404, 'Unknown guide');
	return { id: params.hazard as GuideId };
};
```

`web/src/routes/prepare/[hazard]/+page.svelte`:
```svelte
<script lang="ts">
	import { ArrowLeft } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { GUIDE, GUIDES, tx } from '$lib/prepare/guides';

	let { data } = $props();
	const g = $derived(GUIDE[data.id]);
	const PHASES = [
		['before', m.prep_before],
		['during', m.prep_during],
		['after', m.prep_after]
	] as const;
</script>

<div class="page max-w-5xl lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
	<nav class="hidden lg:block" aria-label={m.prep_guides()}>
		<ul class="sticky top-[calc(var(--header-h)+1.25rem)] flex flex-col gap-0.5">
			{#each GUIDES as id (id)}
				<li><a href={localizeHref(`/prepare/${id}`)} aria-current={id === data.id ? 'page' : undefined} class="block rounded-lg px-3 py-2 text-sm {id === data.id ? 'bg-white/10 text-text' : 'text-muted hover:text-text'}">{tx(GUIDE[id].title)}</a></li>
			{/each}
		</ul>
	</nav>
	<article>
		<a href={localizeHref('/prepare')} class="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted lg:hidden"><ArrowLeft size={16} aria-hidden="true" />{m.prep_back()}</a>
		<h1 class="headline text-4xl">{tx(g.title)}</h1>
		<p class="mt-2 text-muted">{tx(g.summary)}</p>
		{#each PHASES as [key, label] (key)}
			<section class="mt-8">
				<h2 class="label mb-3 {key === 'during' ? 'text-warning' : ''}">{label()}</h2>
				<ol class="flex flex-col gap-2.5">
					{#each g[key] as item, i (i)}
						<li class="flex gap-3"><span class="font-mono text-xs text-muted">0{i + 1}</span>{tx(item)}</li>
					{/each}
				</ol>
			</section>
		{/each}
	</article>
</div>
```

- [ ] **Step 6: Write `web/tests/e2e/prepare.spec.ts`**

```ts
import { expect, test } from './fixtures';

test('prepare lists the ten guides, the go-bag and tap-to-call numbers', async ({ page }) => {
	await page.goto('/prepare');
	await expect(page.getByRole('heading', { name: 'Prepare', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: /Smoke and haze/ })).toHaveAttribute('href', '/prepare/smoke');
	await expect(page.getByRole('link', { name: 'Call 1784' })).toHaveAttribute('href', 'tel:1784');
	await expect(page.getByText('0 of 15 ready')).toBeVisible();
});

test('go-bag ticks survive a reload', async ({ page }) => {
	await page.goto('/prepare');
	await page.getByText('First-aid kit').click();
	await expect(page.getByText('1 of 15 ready')).toBeVisible();
	await page.reload();
	await expect(page.getByText('1 of 15 ready')).toBeVisible();
});

test('a guide shows Before, During and After', async ({ page }) => {
	await page.goto('/prepare/earthquake');
	await expect(page.getByRole('heading', { name: 'Earthquake', level: 1 })).toBeVisible();
	for (const h of ['Before', 'During', 'After']) await expect(page.getByRole('heading', { name: h })).toBeVisible();
	await expect(page.getByText('Drop to the floor, cover your head, hold on to sturdy furniture.')).toBeVisible();
});

test('an unknown guide is a 404', async ({ page }) => {
	await page.goto('/prepare/meteor');
	await expect(page.getByText('404')).toBeVisible();
});

test('Thai guide text', async ({ page }) => {
	await page.goto('/th/prepare/flood');
	await expect(page.getByRole('heading', { name: 'น้ำท่วม', level: 1 })).toBeVisible();
});
```

- [ ] **Step 7: Run and commit**

Run: `npm run check && npm test && npx playwright test tests/e2e/prepare.spec.ts`
Expected: `0 ERRORS`, all pass.

```bash
git add -A src messages tests
git commit -m "web: Prepare section (10 hazard guides, go-bag checklist saved on device, emergency numbers)"
```

---

### Task 13: Report restyle, More and About

**Files:**
- Modify: `web/src/routes/report/+page.svelte` (classes only)
- Create: `web/src/routes/more/+page.svelte`
- Create: `web/src/routes/about/+page.svelte`
- Create: `web/tests/e2e/more.spec.ts`
- Modify: `web/messages/en.json`, `web/messages/th.json`

**Interfaces:**
- Consumes: `T` (Task 2), `LangToggle`, existing `about_*` messages.
- Produces: routes `/more` and `/about`.

- [ ] **Step 1: Restyle the report form**

In `web/src/routes/report/+page.svelte`, do these replace-alls **in this order**:

| # | Find | Replace |
|---|---|---|
| 1 | `has-checked:border-ink has-checked:bg-ink has-checked:text-paper` | `has-checked:border-text has-checked:bg-text has-checked:text-bg` |
| 2 | `accent-ink` | `accent-white` |
| 3 | `border-ink` | `border-line` |
| 4 | `bg-white` | `bg-raised` |
| 5 | `bg-ink` | `bg-text` |
| 6 | `text-paper` | `text-bg` |
| 7 | `bg-alarm` | `bg-[#e5251b]` |
| 8 | `text-alarm` | `text-warning` |
| 9 | `rounded-md` | `rounded-lg` |
| 10 | `border-rule` | `border-line` |

Then change `<h1 class="text-2xl font-bold">` to `<h1 class="headline text-3xl">`.

Run: `npx playwright test tests/e2e/report.spec.ts`
Expected: all 5 report tests still pass. Only classes changed.

- [ ] **Step 2: Messages**

`en.json`:
```json
	"more_title": "More",
	"more_report": "Report an incident",
	"more_language": "Language",
	"more_about": "About and data sources",
	"more_demo": "Demo tour",
	"more_staff": "Staff sign-in",
	"more_admin": "Admin",
	"more_volunteer": "Volunteer",
	"more_ask": "Ask DEMS",
	"coming_soon": "Coming soon",
	"about_levels_title": "How levels are set",
	"about_levels_body": "Each hazard near you gets Safe, Watch or Warning from public thresholds. The worst live hazard sets your level. If no source answers, the level is Unknown, never Safe.",
	"about_row_pm25": "PM2.5: Watch above {w} µg/m³, Warning above {x} (Thai PCD)",
	"about_row_heat": "Heat: Watch from {w}°C feels-like, Warning from {x}°C",
	"about_row_rain": "Rain today: Watch from {w} mm, Warning from {x} mm (TMD)",
	"about_row_quake": "Earthquake within {km} km in 24 h: Watch from M{w}, Warning from M{x}",
	"about_row_gdacs": "GDACS events within {km} km: orange = Watch, red = Warning",
	"about_row_river": "River model rising: Watch only (it is a forecast, not a measurement)",
	"about_row_sample": "Sample disasters: listed with a Sample tag, never counted",
	"about_limits_title": "Limits",
	"about_limits_body": "This is a student project, not an official warning service. Data can be late or wrong. Routes avoid only hazard zones we know about and cannot see road closures. Always follow TMD and DDPM, and call 1784 in an emergency."
```
`th.json`:
```json
	"more_title": "เพิ่มเติม",
	"more_report": "แจ้งเหตุ",
	"more_language": "ภาษา",
	"more_about": "เกี่ยวกับและแหล่งข้อมูล",
	"more_demo": "ทัวร์เดโม",
	"more_staff": "เข้าสู่ระบบเจ้าหน้าที่",
	"more_admin": "ผู้ดูแลระบบ",
	"more_volunteer": "อาสาสมัคร",
	"more_ask": "ถาม DEMS",
	"coming_soon": "เร็วๆ นี้",
	"about_levels_title": "ระดับเตือนภัยกำหนดอย่างไร",
	"about_levels_body": "ภัยแต่ละอย่างใกล้คุณจะได้ระดับ ปลอดภัย เฝ้าระวัง หรือ เตือนภัย ตามเกณฑ์สาธารณะ ระดับของคุณใช้ภัยจริงที่รุนแรงที่สุด หากไม่มีแหล่งข้อมูลตอบกลับ ระดับจะเป็น ไม่ทราบ ไม่ใช่ ปลอดภัย",
	"about_row_pm25": "PM2.5: เฝ้าระวังเมื่อเกิน {w} มคก./ลบ.ม. เตือนภัยเมื่อเกิน {x} (กรมควบคุมมลพิษ)",
	"about_row_heat": "ความร้อน: เฝ้าระวังตั้งแต่ {w}°C (ค่าที่รู้สึก) เตือนภัยตั้งแต่ {x}°C",
	"about_row_rain": "ฝนวันนี้: เฝ้าระวังตั้งแต่ {w} มม. เตือนภัยตั้งแต่ {x} มม. (กรมอุตุนิยมวิทยา)",
	"about_row_quake": "แผ่นดินไหวในรัศมี {km} กม. ภายใน 24 ชม.: เฝ้าระวังตั้งแต่ M{w} เตือนภัยตั้งแต่ M{x}",
	"about_row_gdacs": "เหตุการณ์ GDACS ในรัศมี {km} กม.: สีส้ม = เฝ้าระวัง สีแดง = เตือนภัย",
	"about_row_river": "แบบจำลองแม่น้ำแสดงว่าน้ำขึ้น: เฝ้าระวังเท่านั้น (เป็นการพยากรณ์ ไม่ใช่การวัดจริง)",
	"about_row_sample": "ภัยพิบัติตัวอย่าง: แสดงพร้อมป้ายตัวอย่าง ไม่นำมาคิดระดับ",
	"about_limits_title": "ข้อจำกัด",
	"about_limits_body": "นี่เป็นโครงงานนักศึกษา ไม่ใช่บริการเตือนภัยทางการ ข้อมูลอาจล่าช้าหรือผิดพลาด เส้นทางหลีกเลี่ยงได้เฉพาะพื้นที่อันตรายที่เราทราบ และมองไม่เห็นถนนที่ถูกปิด โปรดปฏิบัติตามกรมอุตุนิยมวิทยาและ ปภ. และโทร 1784 ในกรณีฉุกเฉิน"
```

- [ ] **Step 3: Write `web/src/routes/more/+page.svelte`**

```svelte
<script lang="ts">
	import { ChevronRight, Info, Languages, MessagesSquare, PlayCircle, ShieldUser, TriangleAlert } from '@lucide/svelte';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';

	const row = 'glass flex min-h-14 items-center gap-3 rounded-2xl px-4';
</script>

<div class="page max-w-xl">
	<h1 class="headline text-4xl">{m.more_title()}</h1>
	<ul class="mt-6 flex flex-col gap-2">
		<li><a href={localizeHref('/report')} class={row}><TriangleAlert size={18} class="text-warning" aria-hidden="true" /><span class="flex-1">{m.more_report()}</span><ChevronRight size={16} aria-hidden="true" /></a></li>
		<li class={row}><Languages size={18} aria-hidden="true" /><span class="flex-1">{m.more_language()}</span><LangToggle /></li>
		<li><a href={localizeHref('/about')} class={row}><Info size={18} aria-hidden="true" /><span class="flex-1">{m.more_about()}</span><ChevronRight size={16} aria-hidden="true" /></a></li>
		<li class="{row} opacity-60"><PlayCircle size={18} aria-hidden="true" /><span class="flex-1">{m.more_demo()}</span><span class="label">{m.coming_soon()}</span></li>
		<li class="{row} opacity-60"><MessagesSquare size={18} aria-hidden="true" /><span class="flex-1">{m.more_ask()}</span><span class="label">{m.coming_soon()}</span></li>
		<li class="{row} flex-wrap py-3">
			<ShieldUser size={18} aria-hidden="true" /><span class="flex-1">{m.more_staff()}</span>
			<a href={localizeHref('/admin/login')} class="min-h-11 rounded-lg border border-line px-3 py-2.5 text-sm">{m.more_admin()}</a>
			<a href={localizeHref('/volunteer/login')} class="min-h-11 rounded-lg border border-line px-3 py-2.5 text-sm">{m.more_volunteer()}</a>
		</li>
	</ul>
</div>
```
If `ShieldUser` is missing from the installed lucide, use `UserCog`.

- [ ] **Step 4: Write `web/src/routes/about/+page.svelte`**

```svelte
<script lang="ts">
	import { T } from '$lib/levels';
	import { m } from '$lib/paraglide/messages.js';

	const rows = [
		m.about_row_pm25({ w: T.pm25[0], x: T.pm25[1] }),
		m.about_row_heat({ w: T.heat[0], x: T.heat[1] }),
		m.about_row_rain({ w: T.rain[0], x: T.rain[1] }),
		m.about_row_quake({ km: T.quakeKm, w: T.quake[0], x: T.quake[1] }),
		m.about_row_gdacs({ km: T.gdacsKm }),
		m.about_row_river(),
		m.about_row_sample()
	];
</script>

<div class="page max-w-2xl">
	<h1 class="headline text-4xl">{m.about_title()}</h1>
	<p class="mt-3 text-[#c9c9cf]">{m.about_intro()}</p>

	<section class="mt-8">
		<h2 class="label mb-2">{m.about_real()}</h2>
		<ul class="glass divide-y divide-line rounded-2xl text-sm">
			{#each [m.about_real_weather(), m.about_real_events(), m.about_real_quakes(), m.about_real_map()] as t (t)}<li class="px-4 py-3">{t}</li>{/each}
		</ul>
	</section>
	<section class="mt-6">
		<h2 class="label mb-2">{m.about_sample()}</h2>
		<ul class="glass divide-y divide-line rounded-2xl text-sm">
			{#each [m.about_sample_shelters(), m.about_sample_disasters(), m.about_sample_routes(), m.about_reports()] as t (t)}<li class="px-4 py-3">{t}</li>{/each}
		</ul>
	</section>
	<section class="mt-6">
		<h2 class="label mb-2">{m.about_levels_title()}</h2>
		<p class="text-sm text-[#c9c9cf]">{m.about_levels_body()}</p>
		<ul class="mt-3 flex flex-col gap-1.5 font-mono text-xs text-muted">
			{#each rows as r (r)}<li>{r}</li>{/each}
		</ul>
	</section>
	<section class="mt-6">
		<h2 class="label mb-2">{m.about_limits_title()}</h2>
		<p class="text-sm text-[#c9c9cf]">{m.about_limits_body()}</p>
	</section>
	<p class="mt-6 text-xs text-muted">{m.about_th_note()}</p>
</div>
```
If Paraglide types the `{w}` inputs as strings, pass `String(T.pm25[0])` etc.

- [ ] **Step 5: Write `web/tests/e2e/more.spec.ts`**

```ts
import { expect, test } from './fixtures';

test('More links to report, about and staff sign-in; coming-soon items are inert', async ({ page }) => {
	await page.goto('/more');
	await expect(page.getByRole('link', { name: 'Report an incident' })).toHaveAttribute('href', '/report');
	await expect(page.getByRole('link', { name: 'About and data sources' })).toHaveAttribute('href', '/about');
	await expect(page.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/login');
	await expect(page.getByText('Ask DEMS')).toBeVisible();
	await expect(page.getByRole('link', { name: /Ask DEMS/ })).toHaveCount(0);
});

test('About explains sources, sample data, thresholds and limits', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByText('PM2.5: Watch above 37.5 µg/m³, Warning above 75 (Thai PCD)')).toBeVisible();
	await expect(page.getByText(/never Safe/)).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Limits' })).toBeVisible();
});
```

- [ ] **Step 6: Run and commit**

Run: `npm run check && npm test && npx playwright test tests/e2e/more.spec.ts tests/e2e/report.spec.ts`
Expected: `0 ERRORS`, all pass.

```bash
git add -A src messages tests
git commit -m "web: dark report form, More hub, About page with sources, thresholds and limits"
```

---

### Task 14: Cleanup, Thai review list and full verification

**Files:**
- Delete:
  - components: `AlertBanner.svelte`, `StatusPill.svelte`, `SampleBadge.svelte`, `ActionButton.svelte`, `AssistantSheet.svelte`, `OfflineBanner.svelte`, `BottomSheet.svelte`, `Conditions.svelte`, `EventList.svelte`, `LocationPicker.svelte`, `SourceStamp.svelte` (if no longer imported)
  - lib: `banner.ts` + `banner.test.ts`, `sheet.ts` + `sheet.test.ts`, `weather-codes.ts` + `weather-codes.test.ts`, `severity.ts` + `severity.test.ts`
- Modify: `web/src/lib/sources/gdacs.ts`, `usgs.ts` and their tests (3-level `level`)
- Modify: `web/src/lib/types.ts` (drop `Level`; `HazardEvent.level: Lvl`; `MapMarker.kind` without `quake`/`hazard`)
- Modify: `web/src/lib/levels.ts`, `levels.test.ts` (GDACS level is now already 3-level)
- Modify: `web/src/lib/labels.ts` (drop the helpers only the old pages used)
- Modify: `web/src/app.css` (drop legacy aliases and dots)
- Modify: `web/src/lib/components/LoginForm.svelte`, admin and volunteer pages (new tokens)
- Create: `web/src/lib/messages.test.ts` (EN/TH key parity)
- Modify: `web/messages/TH_REVIEW.md`, `web/tests/e2e/a11y.spec.ts`

**Interfaces:**
- Changes:
  - `HazardEvent.level` becomes `Lvl` (`'safe' | 'watch' | 'warning'`).
  - GDACS: Red → `'warning'`, Orange → `'watch'`, anything else → `'safe'`.
  - USGS: `quakeLevel(mag)` → `mag >= 6 ? 'warning' : mag >= 4.5 ? 'watch' : 'safe'`.

- [ ] **Step 1: Find what is still imported**

Run: `grep -rln "AlertBanner\|StatusPill\|SampleBadge\|ActionButton\|AssistantSheet\|OfflineBanner\|BottomSheet\|Conditions\|EventList\|LocationPicker\|SourceStamp\|\$lib/severity\|/banner'\|/sheet'\|weather-codes" src`
Expected: only the files listed for deletion, plus `gdacs.ts`, `usgs.ts` and `labels.ts`. Anything else must be fixed before deleting.

- [ ] **Step 2: Move the sources to 3 levels**

In `web/src/lib/sources/gdacs.ts`:
- Remove `import { levelOf } from '../severity';`.
- Add `const ALERT: Record<string, Lvl> = { Red: 'warning', Orange: 'watch' };` and `import type { Lvl } from '../levels';`.
- Set `level: ALERT[p.alertlevel] ?? 'safe',`.

In `web/src/lib/sources/usgs.ts`, replace `quakeLevel` with:
```ts
export function quakeLevel(mag: number): Lvl {
	return mag >= 6 ? 'warning' : mag >= 4.5 ? 'watch' : 'safe';
}
```
Change its import to `import type { Lvl } from '../levels';` and `import type { HazardEvent } from '../types';`.

In `web/src/lib/sources/usgs.test.ts`, change the `quakeLevel` expectations to `6.2 → 'warning'`, `5.0 → 'watch'`, `4.4 → 'safe'`, `3.1 → 'safe'`. Change the `parseQuakes` expected `level: 'warning'` (M5.3) to `level: 'watch'`.

In `web/src/lib/sources/gdacs.test.ts`, change every expected GDACS `level` (`'warning'` for Orange → `'watch'`; `'danger'` for Red → `'warning'`; `'watch'` for Green → `'safe'`).

In `web/src/lib/types.ts`:
- Delete `export type Level = ...`.
- Add `import type { Lvl } from './levels';`.
- Set `level: Lvl;` in `HazardEvent`.
- Remove `'quake' | 'hazard'` from `MapMarker.kind`.

In `web/src/lib/levels.ts`, replace `GDACS_LEVEL[g.level] ?? 'safe'` with `g.level` and delete the `GDACS_LEVEL` constant and its comment.

In `web/src/lib/levels.test.ts`, in the GDACS test, change the `gd(...)` levels `'danger'` → `'warning'`, `'warning'` → `'watch'`, `'watch'` → `'safe'`. That covers the four calls in "GDACS: red warning…" and those in the other tests that pass `'danger'`.

- [ ] **Step 3: Delete the old code**

```bash
git rm src/lib/components/AlertBanner.svelte src/lib/components/StatusPill.svelte src/lib/components/SampleBadge.svelte src/lib/components/ActionButton.svelte src/lib/components/AssistantSheet.svelte src/lib/components/OfflineBanner.svelte src/lib/components/BottomSheet.svelte src/lib/components/Conditions.svelte src/lib/components/EventList.svelte src/lib/components/LocationPicker.svelte src/lib/banner.ts src/lib/banner.test.ts src/lib/sheet.ts src/lib/sheet.test.ts src/lib/weather-codes.ts src/lib/weather-codes.test.ts src/lib/severity.ts src/lib/severity.test.ts
```
Also `git rm src/lib/components/SourceStamp.svelte` if Step 1 showed nothing else imports it.

In `web/src/lib/labels.ts`, delete:
- `kindLabel`, `levelLabel`, `shelterStatusLevel`, `wxLabel`, `wxIcon`, `PM25_LEVEL`, `pm25Level`
- the imports only they used: the `@lucide/svelte` cloud icons, `WeatherKey`, `HazardKind`, `Level`

`status.svelte.ts` (`markOffline`) stays: `config.ts` still uses it.

- [ ] **Step 4: Drop the legacy tokens and fix their last users**

In `web/src/app.css`, delete the five legacy colour lines (`--color-paper` … `--color-rule`) with their comment, and the `.map-dot-quake` / `.map-dot-hazard` rules with their comment.

Run: `grep -rn "paper\|\bink\b\|-ink\|alarm\|caution\|border-rule\|bg-white\b" src --include=*.svelte`
For each hit, apply the Task 13 Step 1 replacement table. These are expected in `LoginForm.svelte` and the admin/volunteer pages.

- [ ] **Step 5: EN/TH parity test** (Review Focus 4)

Create `web/src/lib/messages.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import th from '../../messages/th.json';

describe('messages', () => {
	it('every English key has a Thai translation and vice versa', () => {
		const keys = (o: object) => Object.keys(o).filter((k) => k !== '$schema').sort();
		expect(keys(th)).toEqual(keys(en));
	});
	it('no empty strings', () => {
		for (const [k, v] of Object.entries({ ...en, ...th })) if (k !== '$schema') expect(String(v).trim(), k).not.toBe('');
	});
});
```
Run: `npm test -- src/lib/messages.test.ts`
Expected: PASS. If a key is missing, add the Thai draft. Never delete the English key to make the test pass.

- [ ] **Step 6: Thai review list**

Append to `web/messages/TH_REVIEW.md` a section `## Citizen redesign (2026-10)` listing every key added in Tasks 6–13 (`nav_now` … `about_limits_body`), plus a line saying the Prepare guide text in `src/lib/prepare/guides.ts` (`th:` fields) also needs native review.

- [ ] **Step 7: Accessibility paths**

In `web/tests/e2e/a11y.spec.ts`, change the path list to:
`['/', '/map', '/shelters', '/prepare', '/prepare/flood', '/route?to=shelter:2', '/report', '/more', '/about', '/th']`

- [ ] **Step 8: Full verification**

Run: `npm run check && npm test`
Expected: `0 ERRORS`, and every unit test passes (the old ones minus the deleted files, plus the new ones).

Run: `npx playwright test > /tmp/e2e.txt 2>&1; tail -20 /tmp/e2e.txt`. Use the plan workspace instead of `/tmp` if executing with the ledger.
Expected: every e2e test passes, including all accessibility paths with no serious or critical violations.

Run `npm run build`.
Expected: build succeeds.

Take screenshots at 375×812 and 1440×900 of `/`, `/map`, `/shelters`, `/route?to=shelter:2`, `/prepare`, `/more`, `/about` and `/th`. Compare them with the mockups. Fix any glaring mismatch (contrast, overflow, overlap with the tab bar) before committing.

- [ ] **Step 9: Commit and push the branch**

```bash
git add -A
git commit -m "web: remove the old citizen UI, 3-level sources, EN/TH parity test, Thai review list"
git push -u origin redesign/citizen
```
The push to the branch gives a Vercel preview link. Share it with the owner to try on a real phone. **Do not merge to `main`.** That needs the owner's explicit go-ahead (spec §9).
