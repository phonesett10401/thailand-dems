# Phase 1 — Foundation + Citizen Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new SvelteKit app in `web/` that gives citizens a public, phone-first, EN/TH emergency UI (Home map, Disasters map, Shelters, Evacuation, Weather, Report, Info) with real hazard data from public sources and clearly labelled sample data from the project's own backend.

**Architecture:** SvelteKit 2 SPA (`ssr = false`) styled with Tailwind v4 tokens for the "Civic Signal" theme. Pure TypeScript modules in `src/lib/` hold all logic (geo, severity, banner choice, report validation, source parsers) and are unit-tested with Vitest; Svelte components stay thin. Public sources (Open-Meteo, USGS, GDACS) are fetched directly from the browser; the existing Express API is called through one wrapper that falls back to bundled, personal-data-scrubbed sample JSON and raises a page-wide offline banner.

**Tech Stack:** SvelteKit 2.70, Svelte 5 runes, TypeScript, Vite 8, Tailwind CSS 4, Paraglide JS 2 (i18n), maplibre-gl 6 + OpenFreeMap tiles, bits-ui 2 (Dialog), @lucide/svelte (icons), Fontsource (IBM Plex Sans Thai / IBM Plex Mono), Vitest 4, Playwright + @axe-core/playwright.

**Spec:** `docs/superpowers/specs/2026-10-09-ui-redesign-design.md` (sections 3–7, 10, 13 apply to this phase).

## Global Constraints

- **SvelteKit 2, not 3.** Pin `@sveltejs/kit` `^2.70.3`. `npx sv create` now scaffolds Kit 3 (released 2026-10-01); do **not** use it. Files in this plan are written by hand for Kit 2 (adapter config in `svelte.config.js`, hook types from `@sveltejs/kit`, `tsconfig` extends `./.svelte-kit/tsconfig.json`).
- Versions: svelte `^5.57.2`, vite `^8.3.0`, `@sveltejs/vite-plugin-svelte` `^7.2.0`, tailwindcss + `@tailwindcss/vite` `^4.3.3`, `@inlang/paraglide-js` `^2.26.0`, maplibre-gl `^6.13.0`, bits-ui `^2.19.5`, `@lucide/svelte` `^1.53.0`, vitest `^4.1.11`, `@playwright/test` `^1.64.0`, `@axe-core/playwright` `^4.13.0`, typescript `^6.0.3`, `@types/node` `^24`. No other dependencies without asking the owner.
- `maplibre-gl` 6 has **no default export** — use named imports (`import { Map as MlMap, Marker } from 'maplibre-gl'`).
- Adapter: `@sveltejs/adapter-auto` `^7.0.0` (selects the Vercel adapter on Vercel). `adapter-vercel` fails locally on Windows (symlink EPERM), so it is not used directly.
- Dev and preview run on **port 3001** (`strictPort`). The backend's CORS list allows `http://localhost:3001`; it does not allow Vite's default 5173. Do not change the backend.
- `ssr = false` for the whole app (root `+layout.ts`).
- Fetch defaults must call the global lazily: `(u, i) => fetch(u, i)`, never `fetchFn = fetch` (unbound `fetch` throws "Illegal invocation" in browsers).
- Every user-visible string goes through Paraglide `m.*()`. No hard-coded UI text in components. No emoji anywhere in UI.
- No "AI", "smart" or "intelligent" wording anywhere.
- Data from the project's backend (`/api/*`) is always shown with `<SampleBadge />` on the component that shows it. Data from public sources shows `<SourceStamp />` (source + update time).
- Glass (`.glass`) only on surfaces floating over the map (top bar, Home bottom sheet). Alerts and primary buttons are always solid.
- All JS-driven animation durations go through `ms()` from `$lib/motion` (returns 0 under `prefers-reduced-motion`).
- The backend (`backend/`) and old frontend (`frontend/`) are not modified in this phase.
- Commits: no `Co-Authored-By` or other Claude attribution lines (owner rule). Never push; the owner pushes.
- Never print or commit `.env` files. `web/.env` is gitignored; only `web/.env.example` is committed.
- Run all commands from `web/` unless a step says otherwise.

## Review Focus

1. **GDACS answers `204 No Content` or contains duplicate/partial events** → the app shows "no events" (or the valid ones) without crashing; duplicate event ids never reach a keyed `{#each}`. *Pinned by Task 3 `gdacs.test.ts` (204 → `[]`, duplicates removed, non-Point geometry skipped).*
2. **A public source is down or slow** (Open-Meteo/USGS/GDACS timeout or 5xx) → that card says "<source> unavailable right now" with a "Try again" button; the rest of the page still renders. *Pinned by Task 3 `http.test.ts` (`sourced()` returns `{ error }`, failed fetch is not cached) and Task 9 e2e "open-meteo down".*
3. **Shelter records with blank/null coordinates, capacity 0, or occupancy above capacity** → listed after located shelters with "distance unknown", never plotted, capacity bar clamps to 0–100%, no `NaN`. *Pinned by Task 2 `geo.test.ts`.*
4. **Report submission fails (no signal or server error), or the user double-taps Send, or types more than the DB columns allow** → the typed report stays on screen with an error message, only one request is sent, and fields are trimmed to the DB limits (name/email 100, phone 20, place 255). *Pinned by Task 2 `report.test.ts` and Task 13 e2e "backend down keeps the form".*
5. **The device has no WebGL or location permission is denied** → map areas show "Map can't be shown on this device" and the lists still work; "Use my location" shows "Location unavailable. Choose a province instead." *Pinned by Task 9 e2e "no webgl" and "geolocation denied".*

---

## File Structure

```
web/
  package.json, svelte.config.js, vite.config.ts, tsconfig.json, playwright.config.ts
  .gitignore, .npmrc, .env.example
  project.inlang/settings.json
  messages/en.json, messages/th.json, messages/TH_REVIEW.md
  scripts/scrub.js            PII scrubbing + test-record filter (pure)
  scripts/scrub.test.js
  scripts/export-sample.js    one-off: backend → src/lib/sample/*.json
  static/favicon.svg
  src/app.html, app.css, app.d.ts, hooks.ts, hooks.server.ts
  src/lib/
    types.ts                  shared data types
    geo.ts                    toNum, distanceKm, sortByDistance, occupancyPct
    severity.ts               Level, levelOf, kindOf, LEVEL_RANK, LEVEL_CLASS
    weather-codes.ts          WMO code → WeatherKey
    banner.ts                 pickBanner()
    sheet.ts                  nearestSnap() for the bottom sheet
    report.ts                 report form validation + API payload builder
    format.ts                 locale-aware date/time formatting (Buddhist era in TH)
    labels.ts                 enum → message / icon lookups
    motion.ts                 ms() reduced-motion helper
    status.svelte.ts          shared offline flag
    location.svelte.ts        current place (default/GPS/province)
    api.ts                    createApi(): backend wrapper with sample fallback
    config.ts                 api instance bound to PUBLIC_API_URL
    sources/http.ts           fetchJson (timeout, 204, cache), sourced()
    sources/openmeteo.ts      forecast, air quality, river flow, pm25Band
    sources/usgs.ts           earthquakes near Thailand
    sources/gdacs.ts          GDACS events for Thailand
    sources/fixtures/*.json   small hand-written API responses (unit + e2e)
    sample/*.json             generated by scripts/export-sample.js
    components/               Shell, LangToggle, Sheet, AssistantSheet, OfflineBanner,
                              AlertBanner, SampleBadge, SourceStamp, StatusPill,
                              ActionButton, EmptyState, EventList, MapView,
                              BottomSheet, LocationPicker, Conditions
  src/routes/
    +layout.ts, +layout.svelte
    +page.svelte                       Home
    disasters/+page.svelte             Map tab
    shelters/+page.svelte
    evacuation/+page.svelte
    weather/+page.svelte
    report/+page.svelte
    info/+page.svelte
  tests/e2e/fixtures.ts, home.spec.ts, disasters.spec.ts, shelters.spec.ts,
            weather.spec.ts, report.spec.ts, info.spec.ts, a11y.spec.ts
```

---

### Task 1: Scaffold `web/` (SvelteKit 2, Tailwind tokens, Paraglide, ports)

**Files:**
- Create: `web/package.json`, `web/svelte.config.js`, `web/vite.config.ts`, `web/tsconfig.json`, `web/.gitignore`, `web/.npmrc`, `web/.env.example`, `web/project.inlang/settings.json`, `web/messages/en.json`, `web/messages/th.json`, `web/static/favicon.svg`, `web/src/app.html`, `web/src/app.d.ts`, `web/src/app.css`, `web/src/hooks.ts`, `web/src/hooks.server.ts`, `web/src/routes/+layout.ts`, `web/src/routes/+layout.svelte`, `web/src/routes/+page.svelte`

**Interfaces:**
- Produces: `$lib/paraglide/messages.js` (`m`), `$lib/paraglide/runtime.js` (`getLocale`, `localizeHref`, `deLocalizeHref`); Tailwind colours `paper ink alarm caution rule muted`, fonts `font-sans font-mono`; CSS classes `.page`, `.glass`, `.map-dot*`; CSS var `--header-h`.

- [ ] **Step 1: Create `web/package.json`**

```json
{
	"name": "dems-web",
	"private": true,
	"version": "0.1.0",
	"type": "module",
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"prepare": "svelte-kit sync || echo ''",
		"i18n": "paraglide-js compile --project ./project.inlang --outdir ./src/lib/paraglide",
		"check": "npm run i18n && svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
		"test": "vitest run",
		"test:e2e": "playwright test",
		"export-sample": "node scripts/export-sample.js"
	},
	"devDependencies": {
		"@axe-core/playwright": "^4.13.0",
		"@inlang/paraglide-js": "^2.26.0",
		"@playwright/test": "^1.64.0",
		"@sveltejs/adapter-auto": "^7.0.0",
		"@sveltejs/kit": "^2.70.3",
		"@sveltejs/vite-plugin-svelte": "^7.2.0",
		"@tailwindcss/vite": "^4.3.3",
		"@types/node": "^24",
		"svelte": "^5.57.2",
		"svelte-check": "^4.6.0",
		"tailwindcss": "^4.3.3",
		"typescript": "^6.0.3",
		"vite": "^8.3.0",
		"vitest": "^4.1.11"
	},
	"dependencies": {
		"@fontsource/ibm-plex-mono": "^5.3.0",
		"@fontsource/ibm-plex-sans-thai": "^5.3.0",
		"@lucide/svelte": "^1.53.0",
		"bits-ui": "^2.19.5",
		"maplibre-gl": "^6.13.0"
	}
}
```

- [ ] **Step 2: Create config files**

`web/svelte.config.js`:
```js
import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	preprocess: vitePreprocess(),
	compilerOptions: { runes: true },
	kit: { adapter: adapter() }
};
```

`web/vite.config.ts`:
```ts
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			strategy: ['url', 'cookie', 'baseLocale']
		})
	],
	// Backend CORS allows localhost:3001 but not Vite's default 5173.
	server: { port: 3001, strictPort: true },
	preview: { port: 3001, strictPort: true },
	test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.js'] }
});
```

`web/tsconfig.json`:
```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true,
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"resolveJsonModule": true,
		"skipLibCheck": true,
		"sourceMap": true,
		"strict": true,
		"moduleResolution": "bundler"
	}
}
```

`web/.gitignore`:
```
node_modules/
.svelte-kit/
build/
.vercel/
src/lib/paraglide/
test-results/
playwright-report/
.env
.env.*
!.env.example
```

`web/.npmrc`:
```
engine-strict=true
```

`web/.env.example`:
```
# Base URL of the Express API (backend/server-disaster.js)
PUBLIC_API_URL=http://localhost:5000/api
```

`web/project.inlang/settings.json`:
```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js"
	],
	"plugin.inlang.messageFormat": { "pathPattern": "./messages/{locale}.json" },
	"baseLocale": "en",
	"locales": ["en", "th"]
}
```

`web/messages/en.json` (Task 6 replaces this with the full set):
```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"app_name": "DEMS Thailand"
}
```

`web/messages/th.json`:
```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"app_name": "DEMS ประเทศไทย"
}
```

- [ ] **Step 3: Create app shell files**

`web/static/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#d7261e"/><rect x="14" y="7" width="4" height="12" fill="#fff"/><rect x="14" y="22" width="4" height="4" fill="#fff"/></svg>
```

`web/src/app.html`:
```html
<!doctype html>
<html lang="%paraglide.lang%">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
		<meta name="theme-color" content="#f6f4ef" />
		<link rel="icon" href="%sveltekit.assets%/favicon.svg" />
		<title>DEMS Thailand</title>
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

`web/src/app.d.ts`:
```ts
declare global {
	namespace App {}
}
export {};
```

`web/src/hooks.ts`:
```ts
import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime.js';

export const reroute: Reroute = (request) => deLocalizeUrl(request.url).pathname;
```

`web/src/hooks.server.ts`:
```ts
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server.js';

export const handle: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) =>
		resolve(
			{ ...event, request },
			{ transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale) }
		)
	);
```

`web/src/routes/+layout.ts`:
```ts
// ponytail: SPA mode. Every page needs browser APIs (map, geolocation) and the old app was
// client-only too. Turn SSR back on per route if first-paint speed on slow networks matters.
export const ssr = false;
```

`web/src/app.css`:
```css
@import 'tailwindcss';
@import '@fontsource/ibm-plex-sans-thai/400.css';
@import '@fontsource/ibm-plex-sans-thai/600.css';
@import '@fontsource/ibm-plex-sans-thai/700.css';
@import '@fontsource/ibm-plex-mono/500.css';

@theme {
	--color-paper: #f6f4ef;
	--color-ink: #141414;
	--color-alarm: #d7261e;
	--color-caution: #e8a317;
	--color-rule: #d8d3c8;
	--color-muted: #555555;
	--font-sans: 'IBM Plex Sans Thai', system-ui, sans-serif;
	--font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}

@layer base {
	html {
		background: var(--color-paper);
		color: var(--color-ink);
	}
	body {
		font-family: var(--font-sans);
		-webkit-font-smoothing: antialiased;
	}
	:focus-visible {
		outline: 3px solid var(--color-ink);
		outline-offset: 2px;
	}
}

@layer components {
	.page {
		margin-inline: auto;
		max-width: 48rem;
		padding: calc(var(--header-h, 3.5rem) + 1.5rem) 1rem 7rem;
	}
	@media (min-width: 768px) {
		.page {
			padding-bottom: 3rem;
		}
	}

	.glass {
		background: color-mix(in srgb, var(--color-paper) 72%, transparent);
		backdrop-filter: blur(16px) saturate(1.4);
		-webkit-backdrop-filter: blur(16px) saturate(1.4);
		border: 1px solid rgb(255 255 255 / 0.7);
	}
	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.glass {
			background: var(--color-paper);
		}
	}
	@media (prefers-reduced-transparency: reduce) {
		.glass {
			background: var(--color-paper);
			backdrop-filter: none;
			-webkit-backdrop-filter: none;
		}
	}

	.map-dot {
		width: 16px;
		height: 16px;
		border-radius: 9999px;
		border: 2px solid #fff;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.4);
		cursor: pointer;
	}
	.map-dot-shelter {
		background: var(--color-ink);
	}
	.map-dot-quake {
		background: var(--color-caution);
	}
	.map-dot-hazard {
		background: var(--color-alarm);
	}
	.map-dot-sample {
		background: #fff;
		border: 3px solid var(--color-alarm);
	}
	.map-dot-me {
		background: #1f6feb;
		width: 14px;
		height: 14px;
	}
}
```

`web/src/routes/+layout.svelte` (Task 7 replaces the body with `<Shell>`):
```svelte
<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

{@render children()}
```

`web/src/routes/+page.svelte` (Task 9 replaces it):
```svelte
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale } from '$lib/paraglide/runtime.js';
</script>

<h1 class="p-6 text-2xl font-bold text-alarm" data-locale={getLocale()}>{m.app_name()}</h1>
```

- [ ] **Step 4: Install and verify types**

Run: `cd web && npm install && npx playwright install chromium && npm run check`
Expected: install succeeds; `svelte-check found 0 errors and 0 warnings`.

- [ ] **Step 5: Verify build and both locales**

Run: `npm run build` then, in a second terminal, `npm run preview`, then:
```bash
curl -s localhost:3001/ | grep -o '<html lang="[a-z]*"'
curl -s localhost:3001/th | grep -o '<html lang="[a-z]*"'
```
Expected: build ends with `Using @sveltejs/adapter-auto` and a "Could not detect a supported production environment" notice (normal locally); first curl prints `<html lang="en"`, second `<html lang="th"`. Stop the preview server.

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "web: scaffold SvelteKit 2 app with Tailwind tokens and Paraglide EN/TH"
```

---

### Task 2: Core logic modules (types, geo, severity, weather codes, banner, sheet snap, report)

**Files:**
- Create: `web/src/lib/types.ts`, `web/src/lib/geo.ts`, `web/src/lib/severity.ts`, `web/src/lib/weather-codes.ts`, `web/src/lib/banner.ts`, `web/src/lib/sheet.ts`, `web/src/lib/report.ts`
- Test: `web/src/lib/geo.test.ts`, `web/src/lib/severity.test.ts`, `web/src/lib/weather-codes.test.ts`, `web/src/lib/banner.test.ts`, `web/src/lib/sheet.test.ts`, `web/src/lib/report.test.ts`

**Interfaces:**
- Produces (exact):
  - `types.ts`: `Shelter`, `Disaster`, `DbAlert`, `EvacRoute`, `ReportInput`, `REPORT_TYPES`, `ReportType`, `REPORT_SEVERITIES`, `ReportSeverity`, `Level`, `HazardKind`, `HazardEvent`, `Sourced<T>`, `MapMarker`, `Pt`
  - `geo.ts`: `toNum(v: unknown): number | null`, `distanceKm(a: Pt, b: Pt): number`, `sortByDistance<T>(items: T[], from: Pt, coords: (t: T) => { lat: number | null; lon: number | null }): { item: T; km: number | null }[]`, `occupancyPct(occupied: number, capacity: number): number`
  - `severity.ts`: `levelOf(s: string): Level`, `kindOf(disasterType: string): HazardKind`, `LEVEL_RANK: Record<Level, number>`, `LEVEL_CLASS: Record<Level, string>`, `LEVEL_STRIPE: Record<Level, string>`
  - `weather-codes.ts`: `type WeatherKey`, `weatherKey(code: number): WeatherKey`
  - `banner.ts`: `type Banner`, `pickBanner(events: HazardEvent[], alerts: DbAlert[]): Banner`
  - `sheet.ts`: `nearestSnap(height: number, snaps: number[], velocity?: number): number` (returns an index)
  - `report.ts`: `type ReportForm`, `emptyForm(): ReportForm`, `type StepErrors`, `validateStep(step: 1 | 2, f: ReportForm): StepErrors`, `toReportInput(f: ReportForm): ReportInput`

- [ ] **Step 1: Create `types.ts`** (no test; types only)

```ts
export type Pt = { lat: number; lon: number };

/** Rows from the project's Express API. Numeric columns arrive as strings from MySQL DECIMAL. */
export type Shelter = {
	ShelterID: number;
	ShelterName: string;
	ShelterType: string;
	Address: string;
	City: string;
	Latitude: string | number | null;
	Longitude: string | number | null;
	Capacity: number;
	CurrentOccupancy: number;
	Status: 'Available' | 'Full' | 'Closed' | 'Under Maintenance';
	Facilities: string | null;
};

export type Disaster = {
	DisasterID: number;
	DisasterName: string;
	DisasterType: string;
	Severity: 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic';
	Description: string | null;
	AffectedRegion: string;
	Latitude: string | number | null;
	Longitude: string | number | null;
	StartDate: string;
	Status: 'Active' | 'Contained' | 'Recovery' | 'Closed';
	EstimatedAffectedPopulation: number | null;
};

export type DbAlert = {
	AlertID: number;
	AlertType: string;
	Severity: 'Info' | 'Warning' | 'Critical' | 'Emergency';
	Title: string;
	Message: string;
	AffectedRegion: string;
	IssuedAt: string;
	ExpiresAt: string | null;
	Status: string;
};

export type EvacRoute = {
	RouteID: number;
	RouteName: string;
	StartPoint: string;
	EndPoint: string;
	Status: string;
	EstimatedTime: number;
	Distance: number;
	CurrentLoad: number;
};

/** Must match backend/db/create-user-reports.sql enums. */
export const REPORT_TYPES = ['Flood', 'Earthquake', 'Fire', 'Storm', 'Landslide', 'Tsunami', 'Drought', 'Other'] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const REPORT_SEVERITIES = ['Minor', 'Moderate', 'Severe', 'Critical'] as const;
export type ReportSeverity = (typeof REPORT_SEVERITIES)[number];

/** Body of POST /api/reports (backend/controllers/userReportController.js createReport). */
export type ReportInput = {
	DisasterType: ReportType;
	Severity: ReportSeverity;
	Description: string;
	ReportedLocation: string;
	Latitude: number | null;
	Longitude: number | null;
	UserName: string | null;
	UserEmail: string | null;
	UserPhone: string | null;
};

export type Level = 'info' | 'watch' | 'warning' | 'danger';
export type HazardKind = 'flood' | 'cyclone' | 'earthquake' | 'drought' | 'wildfire' | 'volcano' | 'other';

/** A hazard from a public source (GDACS or USGS). */
export type HazardEvent = {
	id: string;
	source: 'GDACS' | 'USGS';
	kind: HazardKind;
	title: string;
	level: Level;
	lat: number;
	lon: number;
	time: string; // ISO 8601 UTC
	current: boolean;
	url: string;
};

export type Sourced<T> = { data: T; source: string; updatedAt: Date } | { error: true; source: string };

export type MapMarker = {
	id: string;
	kind: 'shelter' | 'quake' | 'hazard' | 'sample' | 'me';
	lat: number;
	lon: number;
	label: string;
};
```

- [ ] **Step 2: Write failing tests for geo, severity, weather codes**

`web/src/lib/geo.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { distanceKm, occupancyPct, sortByDistance, toNum } from './geo';

describe('toNum', () => {
	it('parses MySQL decimal strings and rejects blanks', () => {
		expect(toNum('14.35200000')).toBe(14.352);
		expect(toNum(7)).toBe(7);
		expect(toNum('')).toBeNull();
		expect(toNum(null)).toBeNull();
		expect(toNum(undefined)).toBeNull();
		expect(toNum('abc')).toBeNull();
	});
});

describe('distanceKm', () => {
	it('Bangkok to Chiang Mai is about 580 km', () => {
		const d = distanceKm({ lat: 13.7563, lon: 100.5018 }, { lat: 18.7883, lon: 98.9853 });
		expect(d).toBeGreaterThan(570);
		expect(d).toBeLessThan(600);
	});
});

describe('sortByDistance', () => {
	const from = { lat: 13.75, lon: 100.5 };
	const rows = [
		{ n: 'far', lat: '18.78', lon: '98.98' },
		{ n: 'nocoords', lat: null, lon: '' },
		{ n: 'near', lat: '13.80', lon: '100.55' }
	];
	it('sorts nearest first and puts unknown locations last with km null', () => {
		const out = sortByDistance(rows, from, (r) => ({ lat: toNum(r.lat), lon: toNum(r.lon) }));
		expect(out.map((o) => o.item.n)).toEqual(['near', 'far', 'nocoords']);
		expect(out[2].km).toBeNull();
		expect(out[0].km).toBeLessThan(10);
	});
});

describe('occupancyPct', () => {
	it('rounds and clamps to 0..100', () => {
		expect(occupancyPct(520, 900)).toBe(58);
		expect(occupancyPct(1200, 900)).toBe(100);
		expect(occupancyPct(-5, 900)).toBe(0);
	});
	it('treats capacity 0 or less as full, never NaN', () => {
		expect(occupancyPct(0, 0)).toBe(100);
		expect(occupancyPct(10, -1)).toBe(100);
	});
});
```

`web/src/lib/severity.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { kindOf, levelOf } from './severity';

describe('levelOf', () => {
	it('maps DB, alert and GDACS vocabularies onto four levels', () => {
		expect(levelOf('Catastrophic')).toBe('danger');
		expect(levelOf('Emergency')).toBe('danger');
		expect(levelOf('Critical')).toBe('danger');
		expect(levelOf('Red')).toBe('danger');
		expect(levelOf('Severe')).toBe('warning');
		expect(levelOf('Warning')).toBe('warning');
		expect(levelOf('Orange')).toBe('warning');
		expect(levelOf('Moderate')).toBe('watch');
		expect(levelOf('Green')).toBe('watch');
		expect(levelOf('Minor')).toBe('info');
		expect(levelOf('Info')).toBe('info');
		expect(levelOf('something new')).toBe('info');
	});
});

describe('kindOf', () => {
	it('maps DB disaster types onto hazard kinds', () => {
		expect(kindOf('Flood')).toBe('flood');
		expect(kindOf('Earthquake')).toBe('earthquake');
		expect(kindOf('Hurricane')).toBe('cyclone');
		expect(kindOf('Wildfire')).toBe('wildfire');
		expect(kindOf('Drought')).toBe('drought');
		expect(kindOf('Volcanic Eruption')).toBe('volcano');
		expect(kindOf('Industrial Accident')).toBe('other');
	});
});
```

`web/src/lib/weather-codes.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { weatherKey } from './weather-codes';

describe('weatherKey', () => {
	it('groups WMO codes', () => {
		expect(weatherKey(0)).toBe('clear');
		expect(weatherKey(2)).toBe('mainly_clear');
		expect(weatherKey(3)).toBe('overcast');
		expect(weatherKey(45)).toBe('fog');
		expect(weatherKey(53)).toBe('drizzle');
		expect(weatherKey(63)).toBe('rain');
		expect(weatherKey(81)).toBe('rain');
		expect(weatherKey(73)).toBe('snow');
		expect(weatherKey(95)).toBe('thunder');
		expect(weatherKey(999)).toBe('overcast');
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/geo.test.ts src/lib/severity.test.ts src/lib/weather-codes.test.ts`
Expected: FAIL — cannot resolve `./geo`, `./severity`, `./weather-codes`.

- [ ] **Step 4: Implement geo, severity, weather codes**

`web/src/lib/geo.ts`:
```ts
import type { Pt } from './types';

export function toNum(v: unknown): number | null {
	if (v === null || v === undefined || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

export function distanceKm(a: Pt, b: Pt): number {
	const rad = (d: number) => (d * Math.PI) / 180;
	const dLat = rad(b.lat - a.lat);
	const dLon = rad(b.lon - a.lon);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function sortByDistance<T>(
	items: T[],
	from: Pt,
	coords: (t: T) => { lat: number | null; lon: number | null }
): { item: T; km: number | null }[] {
	return items
		.map((item) => {
			const { lat, lon } = coords(item);
			return { item, km: lat === null || lon === null ? null : distanceKm(from, { lat, lon }) };
		})
		.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
}

export function occupancyPct(occupied: number, capacity: number): number {
	if (!(capacity > 0)) return 100;
	return Math.min(100, Math.max(0, Math.round((occupied / capacity) * 100)));
}
```

`web/src/lib/severity.ts`:
```ts
import type { HazardKind, Level } from './types';

export function levelOf(s: string): Level {
	switch (s) {
		case 'Catastrophic':
		case 'Emergency':
		case 'Critical':
		case 'Red':
			return 'danger';
		case 'Severe':
		case 'Warning':
		case 'Orange':
			return 'warning';
		case 'Moderate':
		case 'Green':
			return 'watch';
		default:
			return 'info';
	}
}

export function kindOf(disasterType: string): HazardKind {
	switch (disasterType) {
		case 'Flood':
			return 'flood';
		case 'Earthquake':
			return 'earthquake';
		case 'Hurricane':
			return 'cyclone';
		case 'Wildfire':
			return 'wildfire';
		case 'Drought':
			return 'drought';
		case 'Volcanic Eruption':
			return 'volcano';
		default:
			return 'other';
	}
}

export const LEVEL_RANK: Record<Level, number> = { info: 0, watch: 1, warning: 2, danger: 3 };

/** Pill styles. Literal class strings so Tailwind can see them. */
export const LEVEL_CLASS: Record<Level, string> = {
	danger: 'bg-alarm text-white',
	warning: 'bg-caution text-ink',
	watch: 'bg-ink/10 text-ink',
	info: 'border border-rule text-ink'
};

/** Left-edge stripe on list rows. */
export const LEVEL_STRIPE: Record<Level, string> = {
	danger: 'bg-alarm',
	warning: 'bg-caution',
	watch: 'bg-ink/40',
	info: 'bg-rule'
};
```

`web/src/lib/weather-codes.ts`:
```ts
export type WeatherKey = 'clear' | 'mainly_clear' | 'overcast' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder';

/** WMO weather interpretation codes, as used by Open-Meteo. */
export function weatherKey(code: number): WeatherKey {
	if (code === 0) return 'clear';
	if (code === 1 || code === 2) return 'mainly_clear';
	if (code === 45 || code === 48) return 'fog';
	if (code >= 51 && code <= 57) return 'drizzle';
	if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
	if (code >= 95 && code <= 99) return 'thunder';
	return 'overcast';
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/lib/geo.test.ts src/lib/severity.test.ts src/lib/weather-codes.test.ts`
Expected: PASS (3 files).

- [ ] **Step 6: Write failing tests for banner, sheet, report**

`web/src/lib/banner.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { pickBanner } from './banner';
import type { DbAlert, HazardEvent } from './types';

const ev = (over: Partial<HazardEvent>): HazardEvent => ({
	id: 'GDACS-FL-1',
	source: 'GDACS',
	kind: 'flood',
	title: 'Flood in Thailand',
	level: 'warning',
	lat: 13,
	lon: 100,
	time: '2026-10-01T00:00:00Z',
	current: true,
	url: 'https://www.gdacs.org/x',
	...over
});
const al = (over: Partial<DbAlert>): DbAlert => ({
	AlertID: 1,
	AlertType: 'Early Warning',
	Severity: 'Warning',
	Title: 'Flood watch',
	Message: 'msg',
	AffectedRegion: 'Ayutthaya',
	IssuedAt: '2025-11-24T12:42:49.000Z',
	ExpiresAt: '2025-12-01T12:42:49.000Z',
	Status: 'Active',
	...over
});

describe('pickBanner', () => {
	it('prefers the most severe current GDACS event', () => {
		const b = pickBanner(
			[ev({ id: 'a', level: 'warning' }), ev({ id: 'b', level: 'danger' }), ev({ id: 'c', level: 'danger', current: false })],
			[al({})]
		);
		expect(b).toEqual({ kind: 'live', event: expect.objectContaining({ id: 'b' }) });
	});
	it('ignores non-current events and USGS quakes for the banner', () => {
		const b = pickBanner([ev({ current: false }), ev({ id: 'q', source: 'USGS', current: true })], []);
		expect(b).toEqual({ kind: 'none' });
	});
	it('falls back to the most severe active sample alert, newest first, ignoring expiry dates', () => {
		const b = pickBanner(
			[],
			[
				al({ AlertID: 1, Severity: 'Warning' }),
				al({ AlertID: 2, Severity: 'Emergency', IssuedAt: '2025-01-01T00:00:00Z' }),
				al({ AlertID: 3, Severity: 'Emergency', IssuedAt: '2025-06-01T00:00:00Z' }),
				al({ AlertID: 4, Severity: 'Emergency', Status: 'Expired' })
			]
		);
		expect(b).toEqual({ kind: 'sample', alert: expect.objectContaining({ AlertID: 3 }) });
	});
	it('returns none when nothing is active', () => {
		expect(pickBanner([], [al({ Status: 'Cancelled' })])).toEqual({ kind: 'none' });
	});
});
```

`web/src/lib/sheet.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { nearestSnap } from './sheet';

const snaps = [168, 400, 700];

describe('nearestSnap', () => {
	it('picks the closest snap when released slowly', () => {
		expect(nearestSnap(180, snaps)).toBe(0);
		expect(nearestSnap(330, snaps)).toBe(1);
		expect(nearestSnap(690, snaps, 0.1)).toBe(2);
	});
	it('a fast flick up goes to the next taller snap', () => {
		expect(nearestSnap(200, snaps, 1.2)).toBe(1);
		expect(nearestSnap(450, snaps, 1.2)).toBe(2);
		expect(nearestSnap(700, snaps, 1.2)).toBe(2);
	});
	it('a fast flick down goes to the next shorter snap', () => {
		expect(nearestSnap(650, snaps, -1.2)).toBe(1);
		expect(nearestSnap(380, snaps, -1.2)).toBe(0);
		expect(nearestSnap(168, snaps, -1.2)).toBe(0);
	});
});
```

`web/src/lib/report.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { emptyForm, toReportInput, validateStep } from './report';

describe('validateStep', () => {
	it('step 1 requires type, severity and a description of 10+ characters', () => {
		expect(validateStep(1, emptyForm())).toEqual({ type: 'required', severity: 'required', description: 'required' });
		const f = { ...emptyForm(), type: 'Flood' as const, severity: 'Severe' as const, description: '  short  ' };
		expect(validateStep(1, f)).toEqual({ description: 'short' });
		expect(validateStep(1, { ...f, description: 'Water up to the knees on Rama 2' })).toEqual({});
	});
	it('step 2 needs a place name or GPS coordinates', () => {
		expect(validateStep(2, emptyForm())).toEqual({ place: 'required' });
		expect(validateStep(2, { ...emptyForm(), place: 'Mae Rim market' })).toEqual({});
		expect(validateStep(2, { ...emptyForm(), lat: 18.9, lon: 98.9 })).toEqual({});
	});
});

describe('toReportInput', () => {
	const base = {
		...emptyForm(),
		type: 'Flood' as const,
		severity: 'Severe' as const,
		description: '  Water rising fast  ',
		place: ' Mae Rim '
	};
	it('trims text and turns empty optional fields into null', () => {
		expect(toReportInput(base)).toEqual({
			DisasterType: 'Flood',
			Severity: 'Severe',
			Description: 'Water rising fast',
			ReportedLocation: 'Mae Rim',
			Latitude: null,
			Longitude: null,
			UserName: null,
			UserEmail: null,
			UserPhone: null
		});
	});
	it('uses coordinates as the place when no place name is given', () => {
		const out = toReportInput({ ...base, place: '', lat: 18.912345678, lon: 98.912345678 });
		expect(out.ReportedLocation).toBe('18.91235, 98.91235');
		expect(out.Latitude).toBe(18.912345678);
	});
	it('cuts fields to the database column limits', () => {
		const out = toReportInput({ ...base, name: 'n'.repeat(150), email: 'e'.repeat(150), phone: '0'.repeat(30), place: 'p'.repeat(300) });
		expect(out.UserName).toHaveLength(100);
		expect(out.UserEmail).toHaveLength(100);
		expect(out.UserPhone).toHaveLength(20);
		expect(out.ReportedLocation).toHaveLength(255);
	});
});
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `npx vitest run src/lib/banner.test.ts src/lib/sheet.test.ts src/lib/report.test.ts`
Expected: FAIL — cannot resolve `./banner`, `./sheet`, `./report`.

- [ ] **Step 8: Implement banner, sheet, report**

`web/src/lib/banner.ts`:
```ts
import { LEVEL_RANK, levelOf } from './severity';
import type { DbAlert, HazardEvent } from './types';

export type Banner = { kind: 'live'; event: HazardEvent } | { kind: 'sample'; alert: DbAlert } | { kind: 'none' };

/**
 * Real current GDACS alerts win. Otherwise show the most severe active alert from the demo
 * database (rendered with a SAMPLE badge). Sample expiry dates are ignored: the sample data is
 * frozen in time, so filtering on them would hide it forever.
 */
export function pickBanner(events: HazardEvent[], alerts: DbAlert[]): Banner {
	const live = events
		.filter((e) => e.source === 'GDACS' && e.current)
		.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level])[0];
	if (live) return { kind: 'live', event: live };

	const sample = alerts
		.filter((a) => a.Status === 'Active')
		.sort(
			(a, b) =>
				LEVEL_RANK[levelOf(b.Severity)] - LEVEL_RANK[levelOf(a.Severity)] || b.IssuedAt.localeCompare(a.IssuedAt)
		)[0];
	return sample ? { kind: 'sample', alert: sample } : { kind: 'none' };
}
```

`web/src/lib/sheet.ts`:
```ts
/** Index of the snap height to settle on. velocity is px/ms, positive = finger moving up. */
export function nearestSnap(height: number, snaps: number[], velocity = 0): number {
	if (velocity > 0.5) {
		const i = snaps.findIndex((s) => s > height);
		return i === -1 ? snaps.length - 1 : i;
	}
	if (velocity < -0.5) {
		for (let i = snaps.length - 1; i >= 0; i--) if (snaps[i] < height) return i;
		return 0;
	}
	let best = 0;
	for (let i = 1; i < snaps.length; i++) if (Math.abs(snaps[i] - height) < Math.abs(snaps[best] - height)) best = i;
	return best;
}
```

`web/src/lib/report.ts`:
```ts
import type { ReportInput, ReportSeverity, ReportType } from './types';

export type ReportForm = {
	type: ReportType | '';
	severity: ReportSeverity | '';
	description: string;
	place: string;
	lat: number | null;
	lon: number | null;
	name: string;
	email: string;
	phone: string;
};

export const emptyForm = (): ReportForm => ({
	type: '',
	severity: '',
	description: '',
	place: '',
	lat: null,
	lon: null,
	name: '',
	email: '',
	phone: ''
});

export type StepErrors = Partial<Record<'type' | 'severity' | 'description' | 'place', 'required' | 'short'>>;

export function validateStep(step: 1 | 2, f: ReportForm): StepErrors {
	const e: StepErrors = {};
	if (step === 1) {
		if (!f.type) e.type = 'required';
		if (!f.severity) e.severity = 'required';
		const d = f.description.trim();
		if (!d) e.description = 'required';
		else if (d.length < 10) e.description = 'short';
	} else if (!f.place.trim() && f.lat === null) {
		e.place = 'required';
	}
	return e;
}

/** Column limits from backend/db/create-user-reports.sql. */
const cut = (s: string, n: number): string | null => {
	const t = s.trim().slice(0, n);
	return t === '' ? null : t;
};

export function toReportInput(f: ReportForm): ReportInput {
	const coords = f.lat !== null && f.lon !== null ? `${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}` : '';
	return {
		DisasterType: f.type as ReportType,
		Severity: f.severity as ReportSeverity,
		Description: f.description.trim().slice(0, 2000),
		ReportedLocation: cut(f.place, 255) ?? coords,
		Latitude: f.lat,
		Longitude: f.lon,
		UserName: cut(f.name, 100),
		UserEmail: cut(f.email, 100),
		UserPhone: cut(f.phone, 20)
	};
}
```

- [ ] **Step 9: Run all unit tests**

Run: `npm test`
Expected: PASS (6 files).

- [ ] **Step 10: Commit**

```bash
git add web/src/lib
git commit -m "web: add core logic (geo, severity, banner, sheet snap, report) with tests"
```

---

### Task 3: Public data sources (Open-Meteo, USGS, GDACS)

**Files:**
- Create: `web/src/lib/sources/http.ts`, `web/src/lib/sources/openmeteo.ts`, `web/src/lib/sources/usgs.ts`, `web/src/lib/sources/gdacs.ts`, `web/src/lib/sources/fixtures/forecast.json`, `web/src/lib/sources/fixtures/air.json`, `web/src/lib/sources/fixtures/river.json`, `web/src/lib/sources/fixtures/usgs.json`, `web/src/lib/sources/fixtures/gdacs.json`
- Test: `web/src/lib/sources/http.test.ts`, `web/src/lib/sources/openmeteo.test.ts`, `web/src/lib/sources/usgs.test.ts`, `web/src/lib/sources/gdacs.test.ts`

**Interfaces:**
- Consumes: `types.ts` (`HazardEvent`, `Sourced`, `Pt`, `Level`), `severity.ts` (`levelOf`)
- Produces:
  - `http.ts`: `fetchJson<T>(url: string, opts?: { ttlMs?: number; timeoutMs?: number; fetchFn?: FetchFn }): Promise<T | null>`, `clearCache(): void`, `sourced<T>(source: string, load: () => Promise<T>): Promise<Sourced<T>>`, `type FetchFn`
  - `openmeteo.ts`: `type Forecast`, `type Air`, `type River`, `type Pm25Band`, `parseForecast(raw): Forecast`, `parseAir(raw): Air`, `parseRiver(raw): River | null`, `pm25Band(v: number): Pm25Band`, `getForecast(p: Pt): Promise<Forecast>`, `getAir(p: Pt): Promise<Air>`, `getRiver(p: Pt): Promise<River | null>`
  - `usgs.ts`: `quakeLevel(mag: number): Level`, `parseQuakes(raw, now?: number): HazardEvent[]`, `getQuakes(): Promise<HazardEvent[]>`
  - `gdacs.ts`: `parseGdacs(raw): HazardEvent[]`, `getGdacs(): Promise<HazardEvent[]>`

- [ ] **Step 1: Create fixtures** (also used by e2e tests in Task 9+)

`web/src/lib/sources/fixtures/forecast.json` (Open-Meteo, `timeformat=unixtime`):
```json
{
	"current": { "time": 1791518400, "temperature_2m": 31.4, "precipitation": 0.2, "wind_speed_10m": 9.5, "weather_code": 61 },
	"hourly": {
		"time": [1791518400, 1791522000, 1791525600, 1791529200, 1791532800, 1791536400, 1791540000, 1791543600, 1791547200, 1791550800, 1791554400, 1791558000, 1791561600, 1791565200, 1791568800, 1791572400, 1791576000, 1791579600, 1791583200, 1791586800, 1791590400, 1791594000, 1791597600, 1791601200],
		"temperature_2m": [31.4, 32.1, 32.8, 33.0, 32.5, 31.2, 29.8, 28.9, 28.1, 27.6, 27.2, 26.9, 26.5, 26.2, 26.0, 25.8, 25.7, 25.9, 26.8, 28.0, 29.3, 30.4, 31.2, 31.9],
		"precipitation_probability": [20, 25, 35, 60, 75, 70, 40, 20, 10, 5, 5, 5, 0, 0, 0, 0, 0, 5, 10, 15, 20, 30, 40, 45]
	},
	"daily": {
		"time": [1791478800, 1791565200, 1791651600, 1791738000, 1791824400, 1791910800, 1791997200],
		"weather_code": [61, 80, 3, 2, 95, 63, 1],
		"temperature_2m_max": [33.0, 32.4, 31.8, 32.9, 30.1, 29.7, 32.2],
		"temperature_2m_min": [25.7, 25.1, 24.8, 25.3, 24.2, 23.9, 24.6],
		"precipitation_sum": [6.4, 12.1, 0.0, 0.0, 22.8, 9.3, 0.4]
	}
}
```

`web/src/lib/sources/fixtures/air.json`:
```json
{ "current": { "time": 1791518400, "pm2_5": 41.2, "us_aqi": 114 } }
```

`web/src/lib/sources/fixtures/river.json`:
```json
{
	"daily": {
		"time": ["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"],
		"river_discharge": [4.8, 3.5, 7.8, 12.6, 9.1, 6.0, 5.2]
	}
}
```

`web/src/lib/sources/fixtures/usgs.json`:
```json
{
	"type": "FeatureCollection",
	"features": [
		{
			"type": "Feature",
			"id": "us7000abcd",
			"properties": { "mag": 5.3, "place": "81 km SSW of Banda Aceh, Indonesia", "time": 1791070654235, "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd" },
			"geometry": { "type": "Point", "coordinates": [95.1, 4.9, 10] }
		},
		{
			"type": "Feature",
			"id": "us7000efgh",
			"properties": { "mag": null, "place": "Myanmar", "time": 1791500000000, "url": "https://earthquake.usgs.gov/earthquakes/eventpage/us7000efgh" },
			"geometry": { "type": "Point", "coordinates": [97.0, 20.1, 15] }
		}
	]
}
```

`web/src/lib/sources/fixtures/gdacs.json`:
```json
{
	"type": "FeatureCollection",
	"features": [
		{
			"type": "Feature",
			"geometry": { "type": "Point", "coordinates": [101.141, 6.3345] },
			"properties": { "eventtype": "FL", "eventid": 1103621, "name": "Flood in Thailand", "alertlevel": "Orange", "iscurrent": "false", "fromdate": "2025-11-17T01:00:00", "url": { "report": "https://www.gdacs.org/report.aspx?eventid=1103621&episodeid=2&eventtype=FL" } }
		},
		{
			"type": "Feature",
			"geometry": { "type": "Point", "coordinates": [108.6, 16] },
			"properties": { "eventtype": "TC", "eventid": 1001229, "name": "Tropical Cyclone FENGSHEN-25", "alertlevel": "Orange", "iscurrent": "false", "fromdate": "2025-10-18T00:00:00", "url": { "report": "https://www.gdacs.org/report.aspx?eventid=1001229&episodeid=21&eventtype=TC" } }
		}
	]
}
```

- [ ] **Step 2: Write failing tests**

`web/src/lib/sources/http.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache, fetchJson, sourced } from './http';

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('fetchJson', () => {
	beforeEach(() => clearCache());

	it('returns parsed JSON and caches by URL', async () => {
		const f = vi.fn(async () => ok({ a: 1 }));
		expect(await fetchJson('u1', { fetchFn: f })).toEqual({ a: 1 });
		expect(await fetchJson('u1', { fetchFn: f })).toEqual({ a: 1 });
		expect(f).toHaveBeenCalledTimes(1);
	});

	it('returns null for 204 No Content', async () => {
		expect(await fetchJson('u2', { fetchFn: async () => new Response(null, { status: 204 }) })).toBeNull();
	});

	it('throws on HTTP errors and does not cache the failure', async () => {
		const f = vi.fn(async () => new Response('x', { status: 503 }));
		await expect(fetchJson('u3', { fetchFn: f })).rejects.toThrow('503');
		await expect(fetchJson('u3', { fetchFn: f })).rejects.toThrow('503');
		expect(f).toHaveBeenCalledTimes(2);
	});
});

describe('sourced', () => {
	it('wraps data with source and time', async () => {
		const r = await sourced('Open-Meteo', async () => 42);
		expect(r).toEqual({ data: 42, source: 'Open-Meteo', updatedAt: expect.any(Date) });
	});
	it('turns failures into an error marker instead of throwing', async () => {
		const r = await sourced('USGS', async () => {
			throw new Error('timeout');
		});
		expect(r).toEqual({ error: true, source: 'USGS' });
	});
});
```

`web/src/lib/sources/openmeteo.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import air from './fixtures/air.json';
import forecast from './fixtures/forecast.json';
import river from './fixtures/river.json';
import { parseAir, parseForecast, parseRiver, pm25Band } from './openmeteo';

describe('parseForecast', () => {
	it('maps current, 24 hours and 7 days', () => {
		const f = parseForecast(forecast);
		expect(f.now).toEqual({ time: new Date(1791518400 * 1000), temp: 31.4, precip: 0.2, wind: 9.5, code: 61 });
		expect(f.hours).toHaveLength(24);
		expect(f.hours[3]).toEqual({ time: new Date(1791529200 * 1000), temp: 33.0, rainChance: 60 });
		expect(f.days).toHaveLength(7);
		expect(f.days[4]).toEqual({ date: new Date(1791824400 * 1000), code: 95, max: 30.1, min: 24.2, rain: 22.8 });
	});
});

describe('parseAir', () => {
	it('reads PM2.5 and AQI', () => {
		expect(parseAir(air)).toEqual({ time: new Date(1791518400 * 1000), pm25: 41.2, aqi: 114 });
	});
});

describe('parseRiver', () => {
	it('finds the 7-day peak and flags a big rise', () => {
		expect(parseRiver(river)).toEqual({ today: 4.8, peak: 12.6, peakDate: '2026-10-12', rising: true });
	});
	it('is steady when the peak is not much above today', () => {
		const r = parseRiver({ daily: { time: ['a', 'b'], river_discharge: [10, 12] } });
		expect(r?.rising).toBe(false);
	});
	it('returns null when the model has no data here', () => {
		expect(parseRiver({ daily: { time: [], river_discharge: [] } })).toBeNull();
		expect(parseRiver({ daily: { time: ['a'], river_discharge: [null] } })).toBeNull();
	});
});

describe('pm25Band (Thai PCD 24-hour bands)', () => {
	it('classifies concentrations', () => {
		expect(pm25Band(10)).toBe('very_good');
		expect(pm25Band(15)).toBe('very_good');
		expect(pm25Band(20)).toBe('good');
		expect(pm25Band(30)).toBe('moderate');
		expect(pm25Band(50)).toBe('unhealthy_some');
		expect(pm25Band(120)).toBe('unhealthy');
	});
});
```

`web/src/lib/sources/usgs.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import usgs from './fixtures/usgs.json';
import { parseQuakes, quakeLevel } from './usgs';

describe('quakeLevel', () => {
	it('grades by magnitude', () => {
		expect(quakeLevel(6.2)).toBe('danger');
		expect(quakeLevel(5.0)).toBe('warning');
		expect(quakeLevel(4.4)).toBe('watch');
		expect(quakeLevel(3.1)).toBe('info');
	});
});

describe('parseQuakes', () => {
	it('maps GeoJSON features to hazard events', () => {
		const out = parseQuakes(usgs, 1791520000000);
		expect(out[0]).toEqual({
			id: 'USGS-us7000abcd',
			source: 'USGS',
			kind: 'earthquake',
			title: 'M5.3 · 81 km SSW of Banda Aceh, Indonesia',
			level: 'warning',
			lat: 4.9,
			lon: 95.1,
			time: new Date(1791070654235).toISOString(),
			current: false,
			url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us7000abcd'
		});
	});
	it('treats a missing magnitude as 0 and marks events from the last 3 days as current', () => {
		const out = parseQuakes(usgs, 1791520000000);
		expect(out[1].title).toBe('M0.0 · Myanmar');
		expect(out[1].current).toBe(true);
	});
	it('handles null input', () => {
		expect(parseQuakes(null)).toEqual([]);
	});
});
```

`web/src/lib/sources/gdacs.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import gdacs from './fixtures/gdacs.json';
import { parseGdacs } from './gdacs';

describe('parseGdacs', () => {
	it('maps events, newest first, with UTC times', () => {
		const out = parseGdacs(gdacs);
		expect(out.map((e) => e.id)).toEqual(['GDACS-FL-1103621', 'GDACS-TC-1001229']);
		expect(out[0]).toEqual({
			id: 'GDACS-FL-1103621',
			source: 'GDACS',
			kind: 'flood',
			title: 'Flood in Thailand',
			level: 'warning',
			lat: 6.3345,
			lon: 101.141,
			time: '2025-11-17T01:00:00.000Z',
			current: false,
			url: 'https://www.gdacs.org/report.aspx?eventid=1103621&episodeid=2&eventtype=FL'
		});
	});
	it('returns [] for a 204 (null) response', () => {
		expect(parseGdacs(null)).toEqual([]);
	});
	it('drops duplicates, unknown event types and non-point geometry', () => {
		const f = gdacs.features[0];
		const raw = {
			features: [
				f,
				f,
				{ ...f, properties: { ...f.properties, eventtype: 'XX', eventid: 2 } },
				{ ...f, geometry: { type: 'Polygon', coordinates: [] }, properties: { ...f.properties, eventid: 3 } }
			]
		};
		expect(parseGdacs(raw as never)).toHaveLength(1);
	});
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/lib/sources`
Expected: FAIL — cannot resolve `./http`, `./openmeteo`, `./usgs`, `./gdacs`.

- [ ] **Step 4: Implement `http.ts`**

```ts
import type { Sourced } from '../types';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const cache = new Map<string, { at: number; value: Promise<unknown> }>();

/** GET JSON with a timeout. 204 → null. Successful responses are cached per URL for ttlMs. */
export function fetchJson<T>(
	url: string,
	{ ttlMs = 10 * 60_000, timeoutMs = 8000, fetchFn = (u, i) => fetch(u, i) }: { ttlMs?: number; timeoutMs?: number; fetchFn?: FetchFn } = {}
): Promise<T | null> {
	const hit = cache.get(url);
	if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T | null>;
	const value = (async () => {
		const res = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
		if (res.status === 204) return null;
		if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
		return (await res.json()) as T;
	})();
	cache.set(url, { at: Date.now(), value });
	value.catch(() => cache.delete(url));
	return value;
}

export function clearCache(): void {
	cache.clear();
}

/** Never throws: UI cards render either data + source stamp, or "source unavailable" + retry. */
export async function sourced<T>(source: string, load: () => Promise<T>): Promise<Sourced<T>> {
	try {
		return { data: await load(), source, updatedAt: new Date() };
	} catch {
		return { error: true, source };
	}
}
```

- [ ] **Step 5: Implement `openmeteo.ts`**

```ts
import type { Pt } from '../types';
import { fetchJson } from './http';

type RawForecast = {
	current: { time: number; temperature_2m: number; precipitation: number; wind_speed_10m: number; weather_code: number };
	hourly: { time: number[]; temperature_2m: number[]; precipitation_probability: number[] };
	daily: {
		time: number[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
	};
};
type RawAir = { current: { time: number; pm2_5: number; us_aqi: number } };
type RawRiver = { daily: { time: string[]; river_discharge: (number | null)[] } };

export type Forecast = {
	now: { time: Date; temp: number; precip: number; wind: number; code: number };
	hours: { time: Date; temp: number; rainChance: number }[];
	days: { date: Date; code: number; max: number; min: number; rain: number }[];
};
export type Air = { time: Date; pm25: number; aqi: number };
export type River = { today: number; peak: number; peakDate: string; rising: boolean };
export type Pm25Band = 'very_good' | 'good' | 'moderate' | 'unhealthy_some' | 'unhealthy';

const unix = (s: number) => new Date(s * 1000);
const where = (p: Pt) => `latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}`;
const TZ = 'timezone=Asia%2FBangkok&timeformat=unixtime';

export const forecastUrl = (p: Pt) =>
	`https://api.open-meteo.com/v1/forecast?${where(p)}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7&forecast_hours=24&${TZ}`;
export const airUrl = (p: Pt) => `https://air-quality-api.open-meteo.com/v1/air-quality?${where(p)}&current=pm2_5,us_aqi&${TZ}`;
export const riverUrl = (p: Pt) => `https://flood-api.open-meteo.com/v1/flood?${where(p)}&daily=river_discharge&forecast_days=7`;

export function parseForecast(r: RawForecast): Forecast {
	return {
		now: {
			time: unix(r.current.time),
			temp: r.current.temperature_2m,
			precip: r.current.precipitation,
			wind: r.current.wind_speed_10m,
			code: r.current.weather_code
		},
		hours: r.hourly.time.map((t, i) => ({
			time: unix(t),
			temp: r.hourly.temperature_2m[i],
			rainChance: r.hourly.precipitation_probability[i]
		})),
		days: r.daily.time.map((t, i) => ({
			date: unix(t),
			code: r.daily.weather_code[i],
			max: r.daily.temperature_2m_max[i],
			min: r.daily.temperature_2m_min[i],
			rain: r.daily.precipitation_sum[i]
		}))
	};
}

export function parseAir(r: RawAir): Air {
	return { time: unix(r.current.time), pm25: r.current.pm2_5, aqi: r.current.us_aqi };
}

export function parseRiver(r: RawRiver): River | null {
	const v = r.daily.river_discharge;
	if (!v.length || v[0] === null) return null;
	let peakIdx = 0;
	v.forEach((x, i) => {
		if (x !== null && x > (v[peakIdx] ?? -Infinity)) peakIdx = i;
	});
	const today = v[0];
	const peak = v[peakIdx] as number;
	return { today, peak, peakDate: r.daily.time[peakIdx], rising: peak > today * 1.5 && peak - today > 1 };
}

/** Thai Pollution Control Department 24-hour PM2.5 bands (µg/m³). */
export function pm25Band(v: number): Pm25Band {
	if (v <= 15) return 'very_good';
	if (v <= 25) return 'good';
	if (v <= 37.5) return 'moderate';
	if (v <= 75) return 'unhealthy_some';
	return 'unhealthy';
}

async function must<T>(p: Promise<T | null>): Promise<T> {
	const v = await p;
	if (v === null) throw new Error('empty response');
	return v;
}

export const getForecast = async (p: Pt) => parseForecast(await must(fetchJson<RawForecast>(forecastUrl(p))));
export const getAir = async (p: Pt) => parseAir(await must(fetchJson<RawAir>(airUrl(p))));
export const getRiver = async (p: Pt) => parseRiver(await must(fetchJson<RawRiver>(riverUrl(p))));
```

- [ ] **Step 6: Implement `usgs.ts`**

```ts
import type { HazardEvent, Level } from '../types';
import { fetchJson } from './http';

type RawQuakes = {
	features: {
		id: string;
		properties: { mag: number | null; place: string; time: number; url: string };
		geometry: { coordinates: number[] };
	}[];
};

const DAY = 86_400_000;

/** Thailand and neighbours, last 30 days, M3+. */
export function usgsUrl(now = new Date()): string {
	const start = new Date(now.getTime() - 30 * DAY).toISOString().slice(0, 10);
	return `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=4&maxlatitude=22&minlongitude=95&maxlongitude=107&minmagnitude=3&orderby=time&limit=50&starttime=${start}`;
}

export function quakeLevel(mag: number): Level {
	if (mag >= 6) return 'danger';
	if (mag >= 5) return 'warning';
	if (mag >= 4) return 'watch';
	return 'info';
}

export function parseQuakes(raw: RawQuakes | null, now = Date.now()): HazardEvent[] {
	return (raw?.features ?? []).map((f) => {
		const mag = f.properties.mag ?? 0;
		return {
			id: `USGS-${f.id}`,
			source: 'USGS',
			kind: 'earthquake',
			title: `M${mag.toFixed(1)} · ${f.properties.place}`,
			level: quakeLevel(mag),
			lat: f.geometry.coordinates[1],
			lon: f.geometry.coordinates[0],
			time: new Date(f.properties.time).toISOString(),
			current: now - f.properties.time < 3 * DAY,
			url: f.properties.url
		};
	});
}

export const getQuakes = async () => parseQuakes(await fetchJson<RawQuakes>(usgsUrl()));
```

- [ ] **Step 7: Implement `gdacs.ts`**

```ts
import { levelOf } from '../severity';
import type { HazardEvent, HazardKind } from '../types';
import { fetchJson } from './http';

const KIND: Record<string, HazardKind> = {
	FL: 'flood',
	TC: 'cyclone',
	EQ: 'earthquake',
	DR: 'drought',
	WF: 'wildfire',
	VO: 'volcano'
};

type RawGdacs = {
	features: {
		geometry: { type: string; coordinates: unknown };
		properties: {
			eventtype: string;
			eventid: number;
			name: string;
			alertlevel: string;
			iscurrent: string;
			fromdate: string;
			url: { report: string };
		};
	}[];
};

const DAY = 86_400_000;

/** Events GDACS tagged with Thailand over the last 12 months. CORS: allowed (*). */
export function gdacsUrl(now = new Date()): string {
	const d = (x: Date) => x.toISOString().slice(0, 10);
	return `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;DR;WF&country=Thailand&fromdate=${d(new Date(now.getTime() - 365 * DAY))}&todate=${d(now)}`;
}

/** raw is null when GDACS answers 204 No Content (no events). */
export function parseGdacs(raw: RawGdacs | null): HazardEvent[] {
	const byId = new Map<string, HazardEvent>();
	for (const f of raw?.features ?? []) {
		const p = f.properties;
		const kind = KIND[p.eventtype];
		if (!kind || f.geometry?.type !== 'Point') continue;
		const [lon, lat] = f.geometry.coordinates as [number, number];
		const id = `GDACS-${p.eventtype}-${p.eventid}`;
		byId.set(id, {
			id,
			source: 'GDACS',
			kind,
			title: p.name,
			level: levelOf(p.alertlevel),
			lat,
			lon,
			time: new Date(p.fromdate.endsWith('Z') ? p.fromdate : `${p.fromdate}Z`).toISOString(),
			current: p.iscurrent === 'true',
			url: p.url.report
		});
	}
	return [...byId.values()].sort((a, b) => b.time.localeCompare(a.time));
}

export const getGdacs = async () => parseGdacs(await fetchJson<RawGdacs>(gdacsUrl()));
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run src/lib/sources`
Expected: PASS (4 files).

- [ ] **Step 9: Commit**

```bash
git add web/src/lib/sources
git commit -m "web: add Open-Meteo, USGS and GDACS sources with fixtures and tests"
```

---

### Task 4: Scrubbed sample data export

**Files:**
- Create: `web/scripts/scrub.js`, `web/scripts/export-sample.js`, `web/src/lib/sample/shelters.json`, `web/src/lib/sample/disasters.json`, `web/src/lib/sample/alerts.json`, `web/src/lib/sample/evacuation-routes.json`, `web/src/lib/sample/provinces.json` (the last five are generated)
- Test: `web/scripts/scrub.test.js`

**Interfaces:**
- Produces: `scrubRecords(rows)`, `dropTestRecords(rows)`, `findPii(rows): string[]` in `scripts/scrub.js`; JSON files in `src/lib/sample/` with the same row shapes as the API (`Shelter[]`, `Disaster[]`, `DbAlert[]`, `EvacRoute[]`, `{ Province, Region, Latitude, Longitude }[]`).

- [ ] **Step 1: Write the failing test**

`web/scripts/scrub.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { dropTestRecords, findPii, scrubRecords } from './scrub.js';

describe('scrubRecords', () => {
	it('replaces people, emails and phones with obviously fake values', () => {
		const out = scrubRecords([
			{ ShelterName: 'Ayutthaya Temple Shelter', ContactPerson: 'Thawatchai B.', ContactPhone: '035-555-0808' },
			{ UserName: 'Real Person', UserEmail: 'real@gmail.com', UserPhone: '0612312345' }
		]);
		expect(out[0]).toEqual({ ShelterName: 'Ayutthaya Temple Shelter', ContactPerson: 'Sample Person 1', ContactPhone: '000-000-0000' });
		expect(out[1]).toEqual({ UserName: 'Sample Person 2', UserEmail: 'sample2@example.invalid', UserPhone: '000-000-0000' });
	});
	it('leaves empty personal fields empty', () => {
		expect(scrubRecords([{ ContactPhone: null }])).toEqual([{ ContactPhone: null }]);
	});
});

describe('dropTestRecords', () => {
	it('removes rows whose names or text say "test"', () => {
		const rows = [{ DisasterName: '2nd Test' }, { DisasterName: 'Chiang Mai Flood' }, { Title: 'x', DisasterName: 'Test' }, { Description: 'contest results' }];
		expect(dropTestRecords(rows)).toEqual([{ DisasterName: 'Chiang Mai Flood' }, { Description: 'contest results' }]);
	});
});

describe('findPii', () => {
	it('flags real-looking emails and Thai phone numbers anywhere in the data', () => {
		expect(findPii([{ note: 'call 081-234-5678 or mail a.b@gmail.com' }])).toEqual(['081-234-5678', 'a.b@gmail.com']);
		expect(findPii([{ x: '000-000-0000', y: 'sample1@example.invalid', z: '035-555-0808' }])).toEqual(['035-555-0808']);
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run scripts/scrub.test.js`
Expected: FAIL — cannot resolve `./scrub.js`.

- [ ] **Step 3: Implement `scrub.js`**

```js
// Keeps real personal data out of the repo. Used only by export-sample.js.

const PERSON = ['ContactPerson', 'UserName', 'FirstName', 'LastName', 'VerifiedBy'];
const EMAIL = ['Email', 'UserEmail', 'ContactEmail'];
const PHONE = ['ContactPhone', 'UserPhone', 'Phone', 'EmergencyContact', 'EmergencyPhone'];

/** @param {Record<string, unknown>[]} rows */
export function scrubRecords(rows) {
	return rows.map((row, i) => {
		const o = { ...row };
		for (const k of PERSON) if (o[k]) o[k] = `Sample Person ${i + 1}`;
		for (const k of EMAIL) if (o[k]) o[k] = `sample${i + 1}@example.invalid`;
		for (const k of PHONE) if (o[k]) o[k] = '000-000-0000';
		return o;
	});
}

const TEST = /\btest\b/i;

/** @param {Record<string, unknown>[]} rows */
export function dropTestRecords(rows) {
	return rows.filter(
		(r) => ![r.DisasterName, r.ShelterName, r.Title, r.Description].some((v) => typeof v === 'string' && TEST.test(v))
	);
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /\b0\d{1,2}-?\d{3}-?\d{4}\b/g;

/** Safety net after scrubbing: any email or Thai phone number that is not one of our fakes. */
export function findPii(rows) {
	const text = JSON.stringify(rows);
	const emails = (text.match(EMAIL_RE) ?? []).filter((e) => !e.endsWith('@example.invalid'));
	const phones = (text.match(PHONE_RE) ?? []).filter((p) => p !== '000-000-0000');
	return [...phones, ...emails];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/scrub.test.js`
Expected: PASS.

- [ ] **Step 5: Implement `export-sample.js`**

```js
// One-off: copy the demo database's citizen-facing tables into src/lib/sample/ as the offline
// fallback. Run with the backend up: `npm run export-sample`. Re-run only when the seed data changes.
import { mkdir, writeFile } from 'node:fs/promises';
import { dropTestRecords, findPii, scrubRecords } from './scrub.js';

const BASE = process.env.PUBLIC_API_URL || 'http://localhost:5000/api';
const OUT = new URL('../src/lib/sample/', import.meta.url);
const JOBS = {
	shelters: '/shelters',
	disasters: '/disasters',
	alerts: '/alerts',
	'evacuation-routes': '/evacuation/routes',
	provinces: '/locations/provinces'
};

await mkdir(OUT, { recursive: true });
for (const [name, path] of Object.entries(JOBS)) {
	const res = await fetch(BASE + path);
	if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
	const rows = await res.json();
	const clean = name === 'provinces' ? rows : scrubRecords(dropTestRecords(rows));
	const leaks = findPii(clean);
	if (leaks.length) throw new Error(`${name}: personal data still present (${leaks.length} values), not writing`);
	await writeFile(new URL(`${name}.json`, OUT), JSON.stringify(clean, null, '\t') + '\n');
	console.log(`${name}: ${clean.length} rows`);
}
```

- [ ] **Step 6: Generate the sample files**

Run (backend must be running on :5000 — from repo root `cd backend && node server-disaster.js` in another terminal): `npm run export-sample`
Expected: five lines like `shelters: 11 rows`, `disasters: 14 rows`, `alerts: 17 rows`, `evacuation-routes: 4 rows`, `provinces: 27 rows`; no error. If it throws "personal data still present", add the offending field name to the right list in `scrub.js`, add a test case for it, and re-run.

- [ ] **Step 7: Check the output by eye**

Run: `grep -c "Sample Person" src/lib/sample/shelters.json && grep -il "test" src/lib/sample/disasters.json || echo "no test rows"`
Expected: a count ≥ 1, then `no test rows`.

- [ ] **Step 8: Commit**

```bash
git add web/scripts web/src/lib/sample
git commit -m "web: add scrubbed sample data export for offline fallback"
```

---

### Task 5: Backend API wrapper with sample fallback and offline flag

**Files:**
- Create: `web/src/lib/status.svelte.ts`, `web/src/lib/api.ts`, `web/src/lib/config.ts`
- Test: `web/src/lib/api.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `sources/http.ts` (`FetchFn`), `src/lib/sample/*.json`
- Produces:
  - `status.svelte.ts`: `status: { offline: boolean }` (reactive), `markOffline(): void`
  - `api.ts`: `type Loaded<T> = { data: T; live: boolean }`, `type PostResult = { ok: true } | { ok: false; reason: 'offline' | 'rejected' }`, `createApi(base: string, onOffline: () => void, fetchFn?: FetchFn)` returning `{ shelters(): Promise<Loaded<Shelter[]>>; disasters(): Promise<Loaded<Disaster[]>>; alerts(): Promise<Loaded<DbAlert[]>>; evacuationRoutes(): Promise<Loaded<EvacRoute[]>>; submitReport(r: ReportInput): Promise<PostResult> }`
  - `config.ts`: `api` (instance bound to `PUBLIC_API_URL`, default `http://localhost:5000/api`)

- [ ] **Step 1: Write the failing test**

`web/src/lib/api.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { createApi } from './api';
import sampleShelters from './sample/shelters.json';
import type { ReportInput } from './types';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const report: ReportInput = {
	DisasterType: 'Flood',
	Severity: 'Severe',
	Description: 'Water rising fast',
	ReportedLocation: 'Mae Rim',
	Latitude: null,
	Longitude: null,
	UserName: null,
	UserEmail: null,
	UserPhone: null
};

describe('createApi GET', () => {
	it('returns live data from the backend', async () => {
		const onOffline = vi.fn();
		const fetchFn = vi.fn(async () => json([{ ShelterID: 1 }]));
		const api = createApi('http://x/api', onOffline, fetchFn);
		expect(await api.shelters()).toEqual({ data: [{ ShelterID: 1 }], live: true });
		expect(fetchFn).toHaveBeenCalledWith('http://x/api/shelters', expect.anything());
		expect(onOffline).not.toHaveBeenCalled();
	});

	it('falls back to bundled sample data and flags offline when the backend is unreachable', async () => {
		const onOffline = vi.fn();
		const api = createApi('http://x/api', onOffline, async () => {
			throw new TypeError('Failed to fetch');
		});
		expect(await api.shelters()).toEqual({ data: sampleShelters, live: false });
		expect(onOffline).toHaveBeenCalledOnce();
	});

	it('also falls back on a server error', async () => {
		const onOffline = vi.fn();
		const api = createApi('http://x/api', onOffline, async () => json({ error: 'db down' }, 500));
		expect((await api.shelters()).live).toBe(false);
		expect(onOffline).toHaveBeenCalledOnce();
	});
});

describe('createApi submitReport', () => {
	it('posts JSON and reports success', async () => {
		const fetchFn = vi.fn(async () => json({ reportId: 5 }, 201));
		const api = createApi('http://x/api', () => {}, fetchFn);
		expect(await api.submitReport(report)).toEqual({ ok: true });
		const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('http://x/api/reports');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body as string)).toEqual(report);
	});
	it('distinguishes no connection from a rejected report', async () => {
		const down = createApi('http://x/api', () => {}, async () => {
			throw new TypeError('Failed to fetch');
		});
		const rejected = createApi('http://x/api', () => {}, async () => json({ error: 'bad' }, 500));
		expect(await down.submitReport(report)).toEqual({ ok: false, reason: 'offline' });
		expect(await rejected.submitReport(report)).toEqual({ ok: false, reason: 'rejected' });
	});
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL — cannot resolve `./api`.

- [ ] **Step 3: Implement**

`web/src/lib/status.svelte.ts`:
```ts
/** Set once any backend call falls back to sample data; drives the page-wide offline banner. */
export const status = $state({ offline: false });

export function markOffline(): void {
	status.offline = true;
}
```

`web/src/lib/api.ts`:
```ts
import sampleAlerts from './sample/alerts.json';
import sampleDisasters from './sample/disasters.json';
import sampleRoutes from './sample/evacuation-routes.json';
import sampleShelters from './sample/shelters.json';
import type { FetchFn } from './sources/http';
import type { DbAlert, Disaster, EvacRoute, ReportInput, Shelter } from './types';

export type Loaded<T> = { data: T; live: boolean };
export type PostResult = { ok: true } | { ok: false; reason: 'offline' | 'rejected' };

export function createApi(base: string, onOffline: () => void, fetchFn: FetchFn = (u, i) => fetch(u, i)) {
	async function get<T>(path: string, fallback: T): Promise<Loaded<T>> {
		try {
			const res = await fetchFn(base + path, { signal: AbortSignal.timeout(6000) });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return { data: (await res.json()) as T, live: true };
		} catch {
			onOffline();
			return { data: fallback, live: false };
		}
	}

	async function post(path: string, body: unknown): Promise<PostResult> {
		try {
			const res = await fetchFn(base + path, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(10_000)
			});
			return res.ok ? { ok: true } : { ok: false, reason: 'rejected' };
		} catch {
			return { ok: false, reason: 'offline' };
		}
	}

	return {
		shelters: () => get<Shelter[]>('/shelters', sampleShelters as Shelter[]),
		disasters: () => get<Disaster[]>('/disasters', sampleDisasters as Disaster[]),
		alerts: () => get<DbAlert[]>('/alerts', sampleAlerts as DbAlert[]),
		evacuationRoutes: () => get<EvacRoute[]>('/evacuation/routes', sampleRoutes as EvacRoute[]),
		submitReport: (r: ReportInput) => post('/reports', r)
	};
}
```

`web/src/lib/config.ts`:
```ts
import { env } from '$env/dynamic/public';
import { createApi } from './api';
import { markOffline } from './status.svelte';

export const api = createApi(env.PUBLIC_API_URL || 'http://localhost:5000/api', markOffline);
```

- [ ] **Step 4: Run tests**

Run: `npm test && npm run check`
Expected: all unit tests PASS; `svelte-check found 0 errors`.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/status.svelte.ts web/src/lib/api.ts web/src/lib/config.ts web/src/lib/api.test.ts
git commit -m "web: add backend API wrapper with sample fallback and offline flag"
```

---

### Task 6: Messages (EN/TH), formatting and label lookups

**Files:**
- Modify: `web/messages/en.json`, `web/messages/th.json` (replace whole files)
- Create: `web/messages/TH_REVIEW.md`, `web/src/lib/format.ts`, `web/src/lib/labels.ts`, `web/src/lib/motion.ts`
- Test: `web/src/lib/format.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `weather-codes.ts`, `sources/openmeteo.ts` (`Pm25Band`)
- Produces:
  - all `m.*` message functions listed in `en.json` below
  - `format.ts`: `fmtTime(d, locale?)`, `fmtDate(d, locale?)`, `fmtDateTime(d, locale?)`, `fmtDay(d, locale?)`, `fmtHour(d, locale?)` — each `(d: Date | string, locale?: 'en' | 'th') => string`, Bangkok time zone
  - `labels.ts`: `kindLabel(k: HazardKind)`, `levelLabel(l: Level)`, `shelterStatusLabel(s: Shelter['Status'])`, `shelterStatusLevel(s: Shelter['Status']): Level`, `wxLabel(k: WeatherKey)`, `wxIcon(k: WeatherKey)`, `pm25Label(b: Pm25Band)`, `pm25Level(b: Pm25Band): Level`, `reportTypeLabel(t: ReportType)`, `reportSeverityLabel(s: ReportSeverity)`
  - `motion.ts`: `ms(n: number): number`

- [ ] **Step 1: Replace `web/messages/en.json`**

```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"app_name": "DEMS Thailand",
	"tabs_label": "Main",
	"nav_home": "Home",
	"nav_map": "Map",
	"nav_shelters": "Shelters",
	"nav_report": "Report",
	"nav_info": "Info",
	"lang_switch_label": "ไทย",
	"assistant_button": "Assistant",
	"assistant_title": "Assistant",
	"assistant_coming_soon": "Coming soon: an emergency-information assistant that runs on your device, even without internet.",
	"close": "Close",
	"loading": "Loading…",
	"sample": "SAMPLE",
	"sample_hint": "Sample data from this demo's database, not real.",
	"source_updated": "{source} · updated {time}",
	"source_unavailable": "{source} unavailable right now.",
	"retry": "Try again",
	"offline_banner": "Showing sample data: backend offline.",
	"banner_none": "No active warnings for Thailand right now.",
	"banner_live_source": "GDACS alert",
	"map_unavailable": "Map can't be shown on this device.",
	"sheet_toggle": "Expand or collapse panel",
	"home_find_shelter": "Find nearest shelter",
	"home_shelter_distance": "{km} km away",
	"home_no_shelter": "No open shelters with a known location.",
	"home_evacuation": "Evacuation",
	"home_report": "Report incident",
	"home_weather": "Weather",
	"home_conditions": "Conditions here",
	"home_nearby_events": "Recent events",
	"location_label": "Location",
	"location_use_gps": "Use my location",
	"location_pick": "Choose province",
	"location_default": "Bangkok (default)",
	"location_gps": "Your location",
	"location_denied": "Location unavailable. Choose a province instead.",
	"pm25_title": "Air quality (PM2.5)",
	"pm25_band_very_good": "Very good",
	"pm25_band_good": "Good",
	"pm25_band_moderate": "Moderate",
	"pm25_band_unhealthy_some": "Starting to affect health",
	"pm25_band_unhealthy": "Affects health",
	"rain_title": "Rain chance (24 h)",
	"river_title": "River flow (model)",
	"river_rising": "Rising: peak {peak} m³/s on {date}",
	"river_steady": "Steady: about {today} m³/s",
	"river_none": "No river model data for this spot.",
	"river_note": "GloFAS model forecast, not an official flood warning.",
	"events_live": "Live sources",
	"events_sample": "From this demo's database",
	"events_empty": "No events in the last 12 months.",
	"filter_all": "All",
	"filter_label": "Filter by type",
	"kind_flood": "Flood",
	"kind_cyclone": "Tropical cyclone",
	"kind_earthquake": "Earthquake",
	"kind_drought": "Drought",
	"kind_wildfire": "Wildfire",
	"kind_volcano": "Volcano",
	"kind_other": "Other",
	"level_info": "Info",
	"level_watch": "Watch",
	"level_warning": "Warning",
	"level_danger": "Danger",
	"view_list": "List",
	"view_map": "Map",
	"view_label": "View",
	"open_source_link": "Details at source",
	"event_current": "Ongoing",
	"disasters_title": "Disasters & hazards",
	"shelters_title": "Shelters",
	"shelters_sample_note": "Every shelter on this page is sample data.",
	"shelter_capacity": "{occupied} / {capacity} people",
	"shelter_distance_unknown": "Distance unknown",
	"shelter_status_available": "Open",
	"shelter_status_full": "Full",
	"shelter_status_closed": "Closed",
	"shelter_status_maintenance": "Under maintenance",
	"shelter_directions": "Directions",
	"shelter_on_map": "Show on map",
	"evac_title": "Evacuation",
	"evac_intro": "Head to the nearest open shelter. Directions open in your phone's maps app.",
	"evac_routes": "Planned routes",
	"evac_route_meta": "{km} km · about {min} min · {status}",
	"evac_nearest": "Nearest open shelters",
	"weather_title": "Weather",
	"weather_now": "Now",
	"weather_next24": "Next 24 hours",
	"weather_7day": "7 days",
	"weather_wind": "Wind {speed} km/h",
	"weather_rain_mm": "{mm} mm",
	"wx_clear": "Clear",
	"wx_mainly_clear": "Partly cloudy",
	"wx_overcast": "Cloudy",
	"wx_fog": "Fog",
	"wx_drizzle": "Drizzle",
	"wx_rain": "Rain",
	"wx_snow": "Snow",
	"wx_thunder": "Thunderstorm",
	"report_title": "Report an incident",
	"report_step": "Step {n} of 3",
	"report_what": "What happened?",
	"report_type_label": "Type",
	"rtype_flood": "Flood",
	"rtype_earthquake": "Earthquake",
	"rtype_fire": "Fire",
	"rtype_storm": "Storm",
	"rtype_landslide": "Landslide",
	"rtype_tsunami": "Tsunami",
	"rtype_drought": "Drought",
	"rtype_other": "Other",
	"report_severity_label": "How serious?",
	"rsev_minor": "Minor",
	"rsev_moderate": "Moderate",
	"rsev_severe": "Severe",
	"rsev_critical": "Critical",
	"report_description_label": "Describe what you see",
	"report_where": "Where is it?",
	"report_location_label": "Place name or landmark",
	"report_use_gps": "Use my current location",
	"report_gps_set": "Location attached ({lat}, {lon})",
	"report_contact": "Contact (optional)",
	"report_name": "Name",
	"report_email": "Email",
	"report_phone": "Phone",
	"report_contact_note": "Only the response team sees this.",
	"report_next": "Next",
	"report_back": "Back",
	"report_submit": "Send report",
	"report_sending": "Sending…",
	"report_done_title": "Report sent",
	"report_done_body": "Thank you. If anyone is in danger right now, call 1669 or 191.",
	"report_again": "Send another report",
	"report_error_offline": "Couldn't reach the server. Your report is still here; try again when you have signal.",
	"report_error_rejected": "The server rejected the report. Please check the details and try again.",
	"report_required": "Please fill this in.",
	"report_description_short": "Please write at least 10 characters.",
	"emergency_call_first": "In danger now? Call 1669 (ambulance) or 191 (police) first.",
	"info_title": "Emergency info",
	"info_numbers": "Emergency numbers",
	"num_1784": "Disaster prevention (DDPM)",
	"num_1669": "Ambulance & medical",
	"num_191": "Police",
	"num_199": "Fire",
	"info_more": "More",
	"about_title": "About this demo",
	"about_intro": "DEMS Thailand is a student project. It is built like a real public tool, but it is not an official service.",
	"about_real": "Real (live public sources)",
	"about_sample": "Sample (this demo's own database)",
	"about_real_weather": "Weather, air quality, river flow: Open-Meteo",
	"about_real_events": "Disaster alerts: GDACS",
	"about_real_quakes": "Earthquakes: USGS",
	"about_real_map": "Map: OpenFreeMap / OpenStreetMap contributors",
	"about_sample_shelters": "Shelters and their capacity",
	"about_sample_disasters": "Disasters and alerts in the database",
	"about_sample_routes": "Evacuation routes",
	"about_reports": "Reports you send are stored in the demo database only and are not seen by any authority.",
	"about_th_note": "Thai translations are drafts awaiting native review."
}
```

- [ ] **Step 2: Replace `web/messages/th.json`** (same keys; drafts listed in `TH_REVIEW.md`)

```json
{
	"$schema": "https://inlang.com/schema/inlang-message-format",
	"app_name": "DEMS ประเทศไทย",
	"tabs_label": "เมนูหลัก",
	"nav_home": "หน้าแรก",
	"nav_map": "แผนที่",
	"nav_shelters": "ที่พักพิง",
	"nav_report": "แจ้งเหตุ",
	"nav_info": "ข้อมูล",
	"lang_switch_label": "English",
	"assistant_button": "ผู้ช่วย",
	"assistant_title": "ผู้ช่วย",
	"assistant_coming_soon": "เร็ว ๆ นี้: ผู้ช่วยข้อมูลเหตุฉุกเฉินที่ทำงานบนอุปกรณ์ของคุณ แม้ไม่มีอินเทอร์เน็ต",
	"close": "ปิด",
	"loading": "กำลังโหลด…",
	"sample": "ตัวอย่าง",
	"sample_hint": "ข้อมูลตัวอย่างจากฐานข้อมูลของเดโมนี้ ไม่ใช่ข้อมูลจริง",
	"source_updated": "{source} · อัปเดต {time}",
	"source_unavailable": "ไม่สามารถโหลดข้อมูลจาก {source} ได้ในขณะนี้",
	"retry": "ลองอีกครั้ง",
	"offline_banner": "กำลังแสดงข้อมูลตัวอย่าง: เซิร์ฟเวอร์ไม่พร้อมใช้งาน",
	"banner_none": "ขณะนี้ไม่มีคำเตือนสำหรับประเทศไทย",
	"banner_live_source": "การแจ้งเตือนจาก GDACS",
	"map_unavailable": "ไม่สามารถแสดงแผนที่บนอุปกรณ์นี้ได้",
	"sheet_toggle": "ขยายหรือย่อแผง",
	"home_find_shelter": "ค้นหาที่พักพิงใกล้ที่สุด",
	"home_shelter_distance": "ห่างออกไป {km} กม.",
	"home_no_shelter": "ไม่มีที่พักพิงที่เปิดอยู่และทราบตำแหน่ง",
	"home_evacuation": "การอพยพ",
	"home_report": "แจ้งเหตุ",
	"home_weather": "สภาพอากาศ",
	"home_conditions": "สภาพบริเวณนี้",
	"home_nearby_events": "เหตุการณ์ล่าสุด",
	"location_label": "ตำแหน่ง",
	"location_use_gps": "ใช้ตำแหน่งของฉัน",
	"location_pick": "เลือกจังหวัด",
	"location_default": "กรุงเทพฯ (ค่าเริ่มต้น)",
	"location_gps": "ตำแหน่งของคุณ",
	"location_denied": "ไม่สามารถระบุตำแหน่งได้ กรุณาเลือกจังหวัดแทน",
	"pm25_title": "คุณภาพอากาศ (PM2.5)",
	"pm25_band_very_good": "ดีมาก",
	"pm25_band_good": "ดี",
	"pm25_band_moderate": "ปานกลาง",
	"pm25_band_unhealthy_some": "เริ่มมีผลกระทบต่อสุขภาพ",
	"pm25_band_unhealthy": "มีผลกระทบต่อสุขภาพ",
	"rain_title": "โอกาสฝนตก (24 ชม.)",
	"river_title": "ปริมาณน้ำในแม่น้ำ (แบบจำลอง)",
	"river_rising": "เพิ่มขึ้น: สูงสุด {peak} ลบ.ม./วินาที วันที่ {date}",
	"river_steady": "คงที่: ประมาณ {today} ลบ.ม./วินาที",
	"river_none": "ไม่มีข้อมูลแบบจำลองแม่น้ำสำหรับจุดนี้",
	"river_note": "พยากรณ์จากแบบจำลอง GloFAS ไม่ใช่ประกาศเตือนภัยน้ำท่วมอย่างเป็นทางการ",
	"events_live": "แหล่งข้อมูลสด",
	"events_sample": "จากฐานข้อมูลของเดโมนี้",
	"events_empty": "ไม่มีเหตุการณ์ในช่วง 12 เดือนที่ผ่านมา",
	"filter_all": "ทั้งหมด",
	"filter_label": "กรองตามประเภท",
	"kind_flood": "น้ำท่วม",
	"kind_cyclone": "พายุหมุนเขตร้อน",
	"kind_earthquake": "แผ่นดินไหว",
	"kind_drought": "ภัยแล้ง",
	"kind_wildfire": "ไฟป่า",
	"kind_volcano": "ภูเขาไฟ",
	"kind_other": "อื่น ๆ",
	"level_info": "ข้อมูล",
	"level_watch": "เฝ้าระวัง",
	"level_warning": "เตือนภัย",
	"level_danger": "อันตราย",
	"view_list": "รายการ",
	"view_map": "แผนที่",
	"view_label": "มุมมอง",
	"open_source_link": "ดูรายละเอียดที่แหล่งข้อมูล",
	"event_current": "กำลังเกิดขึ้น",
	"disasters_title": "ภัยพิบัติและเหตุอันตราย",
	"shelters_title": "ที่พักพิง",
	"shelters_sample_note": "ที่พักพิงทั้งหมดในหน้านี้เป็นข้อมูลตัวอย่าง",
	"shelter_capacity": "{occupied} / {capacity} คน",
	"shelter_distance_unknown": "ไม่ทราบระยะทาง",
	"shelter_status_available": "เปิดรับ",
	"shelter_status_full": "เต็ม",
	"shelter_status_closed": "ปิด",
	"shelter_status_maintenance": "ปิดซ่อมบำรุง",
	"shelter_directions": "นำทาง",
	"shelter_on_map": "ดูบนแผนที่",
	"evac_title": "การอพยพ",
	"evac_intro": "มุ่งหน้าไปยังที่พักพิงที่เปิดอยู่และใกล้ที่สุด การนำทางจะเปิดในแอปแผนที่ของโทรศัพท์",
	"evac_routes": "เส้นทางที่วางแผนไว้",
	"evac_route_meta": "{km} กม. · ประมาณ {min} นาที · {status}",
	"evac_nearest": "ที่พักพิงที่เปิดอยู่ใกล้ที่สุด",
	"weather_title": "สภาพอากาศ",
	"weather_now": "ขณะนี้",
	"weather_next24": "24 ชั่วโมงข้างหน้า",
	"weather_7day": "7 วันข้างหน้า",
	"weather_wind": "ลม {speed} กม./ชม.",
	"weather_rain_mm": "{mm} มม.",
	"wx_clear": "ท้องฟ้าแจ่มใส",
	"wx_mainly_clear": "มีเมฆบางส่วน",
	"wx_overcast": "เมฆมาก",
	"wx_fog": "หมอก",
	"wx_drizzle": "ฝนปรอย",
	"wx_rain": "ฝนตก",
	"wx_snow": "หิมะ",
	"wx_thunder": "พายุฝนฟ้าคะนอง",
	"report_title": "แจ้งเหตุ",
	"report_step": "ขั้นตอนที่ {n} จาก 3",
	"report_what": "เกิดอะไรขึ้น",
	"report_type_label": "ประเภท",
	"rtype_flood": "น้ำท่วม",
	"rtype_earthquake": "แผ่นดินไหว",
	"rtype_fire": "ไฟไหม้",
	"rtype_storm": "พายุ",
	"rtype_landslide": "ดินถล่ม",
	"rtype_tsunami": "สึนามิ",
	"rtype_drought": "ภัยแล้ง",
	"rtype_other": "อื่น ๆ",
	"report_severity_label": "ความรุนแรง",
	"rsev_minor": "เล็กน้อย",
	"rsev_moderate": "ปานกลาง",
	"rsev_severe": "รุนแรง",
	"rsev_critical": "วิกฤต",
	"report_description_label": "อธิบายสิ่งที่คุณเห็น",
	"report_where": "เกิดเหตุที่ไหน",
	"report_location_label": "ชื่อสถานที่หรือจุดสังเกต",
	"report_use_gps": "ใช้ตำแหน่งปัจจุบันของฉัน",
	"report_gps_set": "แนบตำแหน่งแล้ว ({lat}, {lon})",
	"report_contact": "ข้อมูลติดต่อ (ไม่บังคับ)",
	"report_name": "ชื่อ",
	"report_email": "อีเมล",
	"report_phone": "โทรศัพท์",
	"report_contact_note": "เฉพาะทีมตอบสนองเหตุเท่านั้นที่เห็นข้อมูลนี้",
	"report_next": "ถัดไป",
	"report_back": "ย้อนกลับ",
	"report_submit": "ส่งรายงาน",
	"report_sending": "กำลังส่ง…",
	"report_done_title": "ส่งรายงานแล้ว",
	"report_done_body": "ขอบคุณ หากมีผู้ตกอยู่ในอันตรายขณะนี้ โปรดโทร 1669 หรือ 191",
	"report_again": "แจ้งเหตุอีกครั้ง",
	"report_error_offline": "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ข้อมูลรายงานของคุณยังอยู่ โปรดลองอีกครั้งเมื่อมีสัญญาณ",
	"report_error_rejected": "เซิร์ฟเวอร์ไม่รับรายงานนี้ โปรดตรวจสอบข้อมูลแล้วลองอีกครั้ง",
	"report_required": "โปรดกรอกข้อมูลนี้",
	"report_description_short": "โปรดเขียนอย่างน้อย 10 ตัวอักษร",
	"emergency_call_first": "ตกอยู่ในอันตรายตอนนี้? โทร 1669 (การแพทย์ฉุกเฉิน) หรือ 191 (ตำรวจ) ก่อน",
	"info_title": "ข้อมูลฉุกเฉิน",
	"info_numbers": "หมายเลขฉุกเฉิน",
	"num_1784": "ป้องกันและบรรเทาสาธารณภัย (ปภ.)",
	"num_1669": "การแพทย์ฉุกเฉิน",
	"num_191": "ตำรวจ",
	"num_199": "ดับเพลิง",
	"info_more": "เพิ่มเติม",
	"about_title": "เกี่ยวกับเดโมนี้",
	"about_intro": "DEMS ประเทศไทยเป็นโครงการของนักศึกษา สร้างขึ้นให้เหมือนเครื่องมือสาธารณะจริง แต่ไม่ใช่บริการอย่างเป็นทางการ",
	"about_real": "ข้อมูลจริง (แหล่งข้อมูลสาธารณะแบบสด)",
	"about_sample": "ข้อมูลตัวอย่าง (ฐานข้อมูลของเดโมนี้)",
	"about_real_weather": "สภาพอากาศ คุณภาพอากาศ ปริมาณน้ำในแม่น้ำ: Open-Meteo",
	"about_real_events": "การแจ้งเตือนภัยพิบัติ: GDACS",
	"about_real_quakes": "แผ่นดินไหว: USGS",
	"about_real_map": "แผนที่: OpenFreeMap / ผู้ร่วมพัฒนา OpenStreetMap",
	"about_sample_shelters": "ที่พักพิงและความจุ",
	"about_sample_disasters": "ภัยพิบัติและการแจ้งเตือนในฐานข้อมูล",
	"about_sample_routes": "เส้นทางอพยพ",
	"about_reports": "รายงานที่คุณส่งจะถูกเก็บในฐานข้อมูลของเดโมเท่านั้น และไม่ถูกส่งถึงหน่วยงานใด",
	"about_th_note": "คำแปลภาษาไทยเป็นฉบับร่างที่รอการตรวจทานจากเจ้าของภาษา"
}
```

- [ ] **Step 3: Create `web/messages/TH_REVIEW.md`**

```markdown
# Thai copy — needs native review

Every value in `th.json` is a draft written by Claude, not checked by a native speaker.
Before relying on the Thai UI, ask a Thai speaker to read `th.json` next to `en.json` and fix:

- Tone: should feel like a calm public-service app (กรมป้องกันและบรรเทาสาธารณภัย style), not marketing.
- Emergency wording: `emergency_call_first`, `report_done_body`, `banner_none`, `river_note` matter most.
- Terms: `sample` ("ตัวอย่าง") is shown as a badge on sample data; check it reads as "not real data".
- Province names and database text (shelter names, alert titles) stay in English: they come from the demo database.

When reviewed, delete this file in the same commit as the fixes.
```

- [ ] **Step 4: Write the failing format test**

`web/src/lib/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { fmtDate, fmtTime } from './format';

const d = new Date('2026-10-09T04:05:00Z'); // 11:05 in Bangkok

describe('format', () => {
	it('shows Bangkok time', () => {
		expect(fmtTime(d, 'en')).toBe('11:05');
	});
	it('uses Buddhist-era years in Thai', () => {
		expect(fmtDate(d, 'th')).toContain('2569');
		expect(fmtDate(d, 'en')).toContain('2026');
	});
});
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — cannot resolve `./format`.

- [ ] **Step 6: Implement `format.ts`, `labels.ts`, `motion.ts`**

`web/src/lib/format.ts`:
```ts
import { getLocale } from '$lib/paraglide/runtime.js';

type Loc = 'en' | 'th';
const TZ = 'Asia/Bangkok';
const tag = (l: Loc) => (l === 'th' ? 'th-TH-u-ca-buddhist' : 'en-GB');
const fmt = (opts: Intl.DateTimeFormatOptions) => (d: Date | string, l: Loc = getLocale()) =>
	new Intl.DateTimeFormat(tag(l), { timeZone: TZ, ...opts }).format(new Date(d));

export const fmtTime = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtHour = fmt({ hour: '2-digit', hour12: false });
export const fmtDate = fmt({ day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDay = fmt({ weekday: 'short', day: 'numeric' });
export const fmtDateTime = fmt({ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
```

`web/src/lib/motion.ts`:
```ts
const reduced =
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animation duration in ms, or 0 when the user asked for reduced motion. */
export const ms = (n: number): number => (reduced ? 0 : n);
```

`web/src/lib/labels.ts`:
```ts
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from '@lucide/svelte';
import { m } from '$lib/paraglide/messages.js';
import type { Pm25Band } from './sources/openmeteo';
import type { HazardKind, Level, ReportSeverity, ReportType, Shelter } from './types';
import type { WeatherKey } from './weather-codes';

export const kindLabel = (k: HazardKind): string =>
	({
		flood: m.kind_flood,
		cyclone: m.kind_cyclone,
		earthquake: m.kind_earthquake,
		drought: m.kind_drought,
		wildfire: m.kind_wildfire,
		volcano: m.kind_volcano,
		other: m.kind_other
	})[k]();

export const levelLabel = (l: Level): string =>
	({ info: m.level_info, watch: m.level_watch, warning: m.level_warning, danger: m.level_danger })[l]();

export const shelterStatusLabel = (s: Shelter['Status']): string =>
	({
		Available: m.shelter_status_available,
		Full: m.shelter_status_full,
		Closed: m.shelter_status_closed,
		'Under Maintenance': m.shelter_status_maintenance
	})[s]();

export const shelterStatusLevel = (s: Shelter['Status']): Level =>
	s === 'Available' ? 'info' : s === 'Full' ? 'danger' : 'warning';

export const wxLabel = (k: WeatherKey): string =>
	({
		clear: m.wx_clear,
		mainly_clear: m.wx_mainly_clear,
		overcast: m.wx_overcast,
		fog: m.wx_fog,
		drizzle: m.wx_drizzle,
		rain: m.wx_rain,
		snow: m.wx_snow,
		thunder: m.wx_thunder
	})[k]();

export const wxIcon = (k: WeatherKey) =>
	({
		clear: Sun,
		mainly_clear: CloudSun,
		overcast: Cloud,
		fog: CloudFog,
		drizzle: CloudDrizzle,
		rain: CloudRain,
		snow: CloudSnow,
		thunder: CloudLightning
	})[k];

export const pm25Label = (b: Pm25Band): string =>
	({
		very_good: m.pm25_band_very_good,
		good: m.pm25_band_good,
		moderate: m.pm25_band_moderate,
		unhealthy_some: m.pm25_band_unhealthy_some,
		unhealthy: m.pm25_band_unhealthy
	})[b]();

const PM25_LEVEL: Record<Pm25Band, Level> = {
	very_good: 'info',
	good: 'info',
	moderate: 'watch',
	unhealthy_some: 'warning',
	unhealthy: 'danger'
};
export const pm25Level = (b: Pm25Band): Level => PM25_LEVEL[b];

export const reportTypeLabel = (t: ReportType): string =>
	({
		Flood: m.rtype_flood,
		Earthquake: m.rtype_earthquake,
		Fire: m.rtype_fire,
		Storm: m.rtype_storm,
		Landslide: m.rtype_landslide,
		Tsunami: m.rtype_tsunami,
		Drought: m.rtype_drought,
		Other: m.rtype_other
	})[t]();

export const reportSeverityLabel = (s: ReportSeverity): string =>
	({ Minor: m.rsev_minor, Moderate: m.rsev_moderate, Severe: m.rsev_severe, Critical: m.rsev_critical })[s]();
```

- [ ] **Step 7: Run tests and type check**

Run: `npm test && npm run check`
Expected: all PASS; 0 errors.

- [ ] **Step 8: Commit**

```bash
git add web/messages web/src/lib/format.ts web/src/lib/format.test.ts web/src/lib/labels.ts web/src/lib/motion.ts
git commit -m "web: add EN/TH messages, Bangkok-time formatting and label lookups"
```

---

### Task 7: Component kit and app shell

**Files:**
- Create: `web/src/lib/components/SampleBadge.svelte`, `SourceStamp.svelte`, `StatusPill.svelte`, `ActionButton.svelte`, `EmptyState.svelte`, `Sheet.svelte`, `AssistantSheet.svelte`, `OfflineBanner.svelte`, `AlertBanner.svelte`, `EventList.svelte`, `LangToggle.svelte`, `Shell.svelte` (all under `web/src/lib/components/`)
- Modify: `web/src/routes/+layout.svelte`

**Interfaces:**
- Consumes: `banner.ts` (`Banner`), `severity.ts`, `labels.ts`, `format.ts`, `motion.ts`, `status.svelte.ts`, `types.ts`, Paraglide `m` and runtime
- Produces (props):
  - `SampleBadge` — none
  - `SourceStamp` — `{ source: string; updatedAt: Date }`
  - `StatusPill` — `{ level: Level; label: string }`
  - `ActionButton` — `{ href: string; icon: IconComponent; label: string; sub?: string; primary?: boolean }`
  - `EmptyState` — `{ icon: IconComponent; text: string; actionLabel?: string; onaction?: () => void }`
  - `Sheet` — `{ open?: boolean (bindable); title: string; children: Snippet }`
  - `AssistantSheet` — `{ open?: boolean (bindable) }`
  - `AlertBanner` — `{ banner: Banner }`
  - `EventList` — `{ events: HazardEvent[]; limit?: number; onselect?: (e: HazardEvent) => void }`
  - `Shell` — `{ children: Snippet }`; sets CSS var `--header-h` on `<html>`
  - `IconComponent` = `Component<{ size?: number; strokeWidth?: number; class?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>` (exported from `types.ts`, add it there)

- [ ] **Step 1: Add the icon type to `types.ts`**

Append to `web/src/lib/types.ts`:
```ts
import type { Component } from 'svelte';

/** Any @lucide/svelte icon. */
export type IconComponent = Component<{
	size?: number;
	strokeWidth?: number;
	class?: string;
	'aria-hidden'?: boolean | 'true' | 'false';
}>;
```
(Move the `import type { Component }` line to the top of the file.)

- [ ] **Step 2: Create the small display components**

`SampleBadge.svelte`:
```svelte
<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
</script>

<span
	class="inline-block rounded-sm bg-ink px-1.5 py-0.5 align-middle font-mono text-[10px] font-medium tracking-wider text-paper"
	title={m.sample_hint()}
>
	{m.sample()}<span class="sr-only">: {m.sample_hint()}</span>
</span>
```

`SourceStamp.svelte`:
```svelte
<script lang="ts">
	import { fmtTime } from '$lib/format';
	import { m } from '$lib/paraglide/messages.js';

	let { source, updatedAt }: { source: string; updatedAt: Date } = $props();
</script>

<p class="font-mono text-[11px] text-muted">{m.source_updated({ source, time: fmtTime(updatedAt) })}</p>
```

`StatusPill.svelte`:
```svelte
<script lang="ts">
	import { LEVEL_CLASS } from '$lib/severity';
	import type { Level } from '$lib/types';

	let { level, label }: { level: Level; label: string } = $props();
</script>

<span class="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold {LEVEL_CLASS[level]}">{label}</span>
```

`ActionButton.svelte`:
```svelte
<script lang="ts">
	import type { IconComponent } from '$lib/types';

	let {
		href,
		icon: Icon,
		label,
		sub,
		primary = false
	}: { href: string; icon: IconComponent; label: string; sub?: string; primary?: boolean } = $props();
</script>

<a
	{href}
	class="flex min-h-14 items-center gap-3 rounded-xl px-4 py-3 font-semibold {primary
		? 'bg-ink text-paper'
		: 'border border-ink bg-paper'}"
>
	<Icon size={22} aria-hidden="true" />
	<span class="flex flex-col leading-tight">
		{label}
		{#if sub}<span class="text-xs font-normal opacity-80">{sub}</span>{/if}
	</span>
</a>
```

`EmptyState.svelte`:
```svelte
<script lang="ts">
	import type { IconComponent } from '$lib/types';

	let {
		icon: Icon,
		text,
		actionLabel,
		onaction
	}: { icon: IconComponent; text: string; actionLabel?: string; onaction?: () => void } = $props();
</script>

<div class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-rule px-4 py-6 text-center text-sm text-muted">
	<Icon size={28} aria-hidden="true" />
	<p>{text}</p>
	{#if actionLabel && onaction}
		<button type="button" onclick={onaction} class="rounded-md border border-ink px-3 py-1.5 font-semibold text-ink">
			{actionLabel}
		</button>
	{/if}
</div>
```

`OfflineBanner.svelte`:
```svelte
<script lang="ts">
	import { WifiOff } from '@lucide/svelte';
	import { slide } from 'svelte/transition';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { status } from '$lib/status.svelte';
</script>

{#if status.offline}
	<div
		role="status"
		class="flex items-center justify-center gap-2 bg-ink px-4 py-1.5 text-sm font-semibold text-paper"
		transition:slide={{ duration: ms(200) }}
	>
		<WifiOff size={16} aria-hidden="true" />{m.offline_banner()}
	</div>
{/if}
```

- [ ] **Step 3: Create `Sheet.svelte` and `AssistantSheet.svelte`**

`Sheet.svelte`:
```svelte
<script lang="ts">
	import { X } from '@lucide/svelte';
	import { Dialog } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';

	let { open = $bindable(false), title, children }: { open?: boolean; title: string; children: Snippet } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay forceMount>
			{#snippet child({ props, open: isOpen })}
				{#if isOpen}
					<div {...props} class="fixed inset-0 z-40 bg-ink/40" transition:fade={{ duration: ms(150) }}></div>
				{/if}
			{/snippet}
		</Dialog.Overlay>
		<Dialog.Content forceMount>
			{#snippet child({ props, open: isOpen })}
				{#if isOpen}
					<div
						{...props}
						class="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-none md:rounded-l-3xl"
						transition:fly={{ y: 40, duration: ms(220) }}
					>
						<div class="mb-3 flex items-center justify-between gap-4">
							<Dialog.Title class="text-lg font-bold">{title}</Dialog.Title>
							<Dialog.Close class="rounded-md p-2 hover:bg-ink/10" aria-label={m.close()}>
								<X size={20} aria-hidden="true" />
							</Dialog.Close>
						</div>
						{@render children()}
					</div>
				{/if}
			{/snippet}
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
```

`AssistantSheet.svelte`:
```svelte
<script lang="ts">
	// Slot for the future in-browser assistant (WebLLM + RAG, Model Lab repo src/lib/assistant/).
	// That work replaces this file's body; nothing else in the app needs to change.
	import { MessagesSquare } from '@lucide/svelte';
	import { m } from '$lib/paraglide/messages.js';
	import Sheet from './Sheet.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Sheet bind:open title={m.assistant_title()}>
	<div class="flex flex-col items-center gap-3 py-8 text-center">
		<MessagesSquare size={40} aria-hidden="true" class="text-muted" />
		<p class="max-w-xs text-muted">{m.assistant_coming_soon()}</p>
	</div>
</Sheet>
```

- [ ] **Step 4: Create `AlertBanner.svelte` and `EventList.svelte`**

`AlertBanner.svelte`:
```svelte
<script lang="ts">
	import { CircleCheck, ExternalLink } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import type { Banner } from '$lib/banner';
	import { fmtDateTime } from '$lib/format';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { levelOf } from '$lib/severity';
	import SampleBadge from './SampleBadge.svelte';

	let { banner }: { banner: Banner } = $props();

	const tone = $derived(
		banner.kind === 'live' ? banner.event.level : banner.kind === 'sample' ? levelOf(banner.alert.Severity) : 'info'
	);
	const solid = $derived(
		tone === 'danger' ? 'bg-alarm text-white' : tone === 'warning' ? 'bg-caution text-ink' : 'bg-ink text-paper'
	);
</script>

{#if banner.kind === 'none'}
	<div
		role="status"
		class="flex items-center gap-2 rounded-xl border border-rule bg-paper px-4 py-3 text-sm font-semibold"
		in:fly={{ y: -12, duration: ms(220) }}
	>
		<CircleCheck size={18} aria-hidden="true" />{m.banner_none()}
	</div>
{:else}
	<div role="alert" class="rounded-xl px-4 py-3 shadow-sm {solid}" in:fly={{ y: -12, duration: ms(220) }}>
		{#if banner.kind === 'live'}
			<p class="font-mono text-[11px] font-medium tracking-wider uppercase opacity-90">
				{m.banner_live_source()} · {fmtDateTime(banner.event.time)}
			</p>
			<p class="text-base leading-snug font-bold">{banner.event.title}</p>
			<a
				href={banner.event.url}
				target="_blank"
				rel="noopener"
				class="mt-1 inline-flex items-center gap-1 text-sm underline"
			>
				{m.open_source_link()}<ExternalLink size={14} aria-hidden="true" />
			</a>
		{:else}
			<p class="font-mono text-[11px] font-medium tracking-wider uppercase opacity-90">
				{banner.alert.AffectedRegion} <SampleBadge />
			</p>
			<p class="text-base leading-snug font-bold">{banner.alert.Title}</p>
			<p class="text-sm opacity-90">{banner.alert.Message}</p>
		{/if}
	</div>
{/if}
```

`EventList.svelte`:
```svelte
<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import { flip } from 'svelte/animate';
	import { fmtDateTime } from '$lib/format';
	import { kindLabel } from '$lib/labels';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { LEVEL_STRIPE } from '$lib/severity';
	import type { HazardEvent } from '$lib/types';

	let {
		events,
		limit = Infinity,
		onselect
	}: { events: HazardEvent[]; limit?: number; onselect?: (e: HazardEvent) => void } = $props();
</script>

<ul class="divide-y divide-rule">
	{#each events.slice(0, limit) as e (e.id)}
		<li animate:flip={{ duration: ms(200) }}>
			{#snippet body()}
				<span class="w-1.5 self-stretch rounded-sm {LEVEL_STRIPE[e.level]}" aria-hidden="true"></span>
				<span class="flex min-w-0 flex-1 flex-col">
					<span class="font-semibold">{e.title}</span>
					<span class="font-mono text-[11px] text-muted">
						{kindLabel(e.kind)} · {fmtDateTime(e.time)} · {e.source}
						{#if e.current}<span class="ml-1 rounded bg-alarm px-1 text-white">{m.event_current()}</span>{/if}
					</span>
				</span>
			{/snippet}
			{#if onselect}
				<button type="button" onclick={() => onselect(e)} class="flex w-full gap-3 py-3 text-left">
					{@render body()}
				</button>
			{:else}
				<a href={e.url} target="_blank" rel="noopener" class="flex gap-3 py-3">
					{@render body()}<ExternalLink size={16} aria-hidden="true" class="mt-1 shrink-0 text-muted" />
				</a>
			{/if}
		</li>
	{/each}
</ul>
```

- [ ] **Step 5: Create `LangToggle.svelte` and `Shell.svelte`**

`LangToggle.svelte`:
```svelte
<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, getLocale, localizeHref } from '$lib/paraglide/runtime.js';

	const other = getLocale() === 'en' ? 'th' : 'en';
	const href = $derived(localizeHref(deLocalizeHref(page.url.pathname), { locale: other }));
</script>

<!-- Full reload: messages are rendered once per load, so switching language reloads the page. -->
<a
	{href}
	hreflang={other}
	lang={other}
	data-sveltekit-reload
	class="rounded-md border border-ink px-2.5 py-1.5 font-mono text-xs font-medium"
>
	{m.lang_switch_label()}
</a>
```

`Shell.svelte`:
```svelte
<script lang="ts">
	import { House, Info, Map as MapIcon, MessagesSquare, Tent, TriangleAlert } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref } from '$lib/paraglide/runtime.js';
	import type { IconComponent } from '$lib/types';
	import AssistantSheet from './AssistantSheet.svelte';
	import LangToggle from './LangToggle.svelte';
	import OfflineBanner from './OfflineBanner.svelte';

	let { children }: { children: Snippet } = $props();
	let assistantOpen = $state(false);
	let headerH = $state(56);

	const tabs: { path: string; label: () => string; icon: IconComponent }[] = [
		{ path: '/', label: m.nav_home, icon: House },
		{ path: '/disasters', label: m.nav_map, icon: MapIcon },
		{ path: '/shelters', label: m.nav_shelters, icon: Tent },
		{ path: '/report', label: m.nav_report, icon: TriangleAlert },
		{ path: '/info', label: m.nav_info, icon: Info }
	];
	const current = $derived(deLocalizeHref(page.url.pathname));
	const active = (p: string) => (p === '/' ? current === '/' : current.startsWith(p));

	$effect(() => {
		document.documentElement.style.setProperty('--header-h', `${headerH}px`);
	});
</script>

<header bind:clientHeight={headerH} class="glass fixed inset-x-0 top-0 z-30 border-x-0 border-t-0">
	<div class="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
		<a href={localizeHref('/')} class="font-bold tracking-tight">{m.app_name()}</a>
		<nav aria-label={m.tabs_label()} class="ml-6 hidden gap-1 md:flex">
			{#each tabs as t (t.path)}
				<a
					href={localizeHref(t.path)}
					aria-current={active(t.path) ? 'page' : undefined}
					class="rounded-md px-3 py-1.5 text-sm font-semibold {active(t.path) ? 'bg-ink text-paper' : 'hover:bg-ink/10'}"
				>
					{t.label()}
				</a>
			{/each}
		</nav>
		<div class="ml-auto flex items-center gap-2">
			<LangToggle />
			<button
				type="button"
				onclick={() => (assistantOpen = true)}
				class="flex items-center gap-1.5 rounded-md border border-ink px-2.5 py-1.5 text-sm font-semibold"
			>
				<MessagesSquare size={16} aria-hidden="true" />{m.assistant_button()}
			</button>
		</div>
	</div>
	<OfflineBanner />
</header>

<main>{@render children()}</main>

<nav
	aria-label={m.tabs_label()}
	class="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<ul class="grid grid-cols-5">
		{#each tabs as t (t.path)}
			<li>
				<a
					href={localizeHref(t.path)}
					aria-current={active(t.path) ? 'page' : undefined}
					class="flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold {active(t.path)
						? 'text-ink'
						: 'text-muted'}"
				>
					<t.icon size={22} strokeWidth={active(t.path) ? 2.4 : 1.8} aria-hidden="true" />
					{t.label()}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<AssistantSheet bind:open={assistantOpen} />
```

- [ ] **Step 6: Use the shell in the root layout**

Replace `web/src/routes/+layout.svelte`:
```svelte
<script lang="ts">
	import '../app.css';
	import type { Snippet } from 'svelte';
	import Shell from '$lib/components/Shell.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<Shell>{@render children()}</Shell>
```

- [ ] **Step 7: Verify**

Run: `npm run check && npm test`
Expected: 0 errors; tests PASS.
Then `npm run dev`, open `http://localhost:3001` at a phone width (375px) and confirm by eye: glass top bar with "DEMS Thailand", "ไทย" and "Assistant"; five bottom tabs with icons, no emoji; tapping "Assistant" opens the sheet with the "Coming soon" text; tapping "ไทย" reloads at `/th` with Thai labels. Stop the dev server.

- [ ] **Step 8: Commit**

```bash
git add web/src/lib/components web/src/lib/types.ts web/src/routes/+layout.svelte
git commit -m "web: add component kit and civic app shell with assistant slot"
```

---

### Task 8: Map, bottom sheet, location

**Files:**
- Create: `web/src/lib/location.svelte.ts`, `web/src/lib/components/MapView.svelte`, `web/src/lib/components/BottomSheet.svelte`, `web/src/lib/components/LocationPicker.svelte`

**Interfaces:**
- Consumes: `sheet.ts` (`nearestSnap`), `motion.ts`, `types.ts` (`MapMarker`, `Pt`), `src/lib/sample/provinces.json`
- Produces:
  - `location.svelte.ts`: `type Place = Pt & { name: string; via: 'default' | 'gps' | 'province' }`, `here: { place: Place; error: boolean }` (reactive), `setPlace(p: Place): void`, `useGps(): Promise<void>`, `PROVINCES: (Pt & { name: string })[]`
  - `MapView` props: `{ markers: MapMarker[]; center: Pt; zoom?: number; focus?: Pt | null; onselect?: (id: string) => void; class?: string }`
  - `BottomSheet` props: `{ label: string; children: Snippet }`
  - `LocationPicker` props: none (reads/writes `here`)

- [ ] **Step 1: Implement `location.svelte.ts`**

```ts
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
```

- [ ] **Step 2: Implement `MapView.svelte`**

```svelte
<script lang="ts">
	import { MapPinOff } from '@lucide/svelte';
	import { Map as MlMap, Marker, NavigationControl } from 'maplibre-gl';
	import 'maplibre-gl/dist/maplibre-gl.css';
	import { untrack } from 'svelte';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import type { MapMarker, Pt } from '$lib/types';
	import EmptyState from './EmptyState.svelte';

	let {
		markers,
		center,
		zoom = 5,
		focus = null,
		onselect,
		class: klass = ''
	}: {
		markers: MapMarker[];
		center: Pt;
		zoom?: number;
		focus?: Pt | null;
		onselect?: (id: string) => void;
		class?: string;
	} = $props();

	let el: HTMLDivElement;
	let map = $state<MlMap | null>(null);
	let failed = $state(false);

	$effect(() => {
		const start = untrack(() => center);
		let mm: MlMap;
		try {
			mm = new MlMap({
				container: el,
				style: 'https://tiles.openfreemap.org/styles/positron',
				center: [start.lon, start.lat],
				zoom: untrack(() => zoom),
				attributionControl: { compact: true }
			});
		} catch {
			// No WebGL (old phones, some locked-down browsers): show a message, lists still work.
			failed = true;
			return;
		}
		mm.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
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
		if (map && focus) {
			map.flyTo({ center: [focus.lon, focus.lat], zoom: Math.max(map.getZoom(), 9), duration: ms(900) });
		}
	});
</script>

<div class="relative {klass}">
	<div bind:this={el} class="absolute inset-0" class:hidden={failed}></div>
	{#if failed}
		<div class="absolute inset-0 flex items-center justify-center p-6">
			<EmptyState icon={MapPinOff} text={m.map_unavailable()} />
		</div>
	{/if}
</div>
```

- [ ] **Step 3: Implement `BottomSheet.svelte`**

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Spring } from 'svelte/motion';
	import { ms } from '$lib/motion';
	import { nearestSnap } from '$lib/sheet';

	let { label, children }: { label: string; children: Snippet } = $props();

	const snaps = () => [168, Math.round(window.innerHeight * 0.5), Math.round(window.innerHeight * 0.85)];
	const instant = ms(1) === 0;
	const height = new Spring(168, { stiffness: 0.18, damping: 0.75 });
	let index = $state(0);
	let drag: { startY: number; startH: number; lastY: number; lastT: number; v: number } | null = null;

	function go(i: number) {
		index = i;
		height.set(snaps()[i], { instant });
	}
	function down(e: PointerEvent) {
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		drag = { startY: e.clientY, startH: height.current, lastY: e.clientY, lastT: e.timeStamp, v: 0 };
	}
	function move(e: PointerEvent) {
		if (!drag) return;
		const dt = e.timeStamp - drag.lastT || 1;
		drag.v = (drag.lastY - e.clientY) / dt;
		drag.lastY = e.clientY;
		drag.lastT = e.timeStamp;
		const s = snaps();
		height.set(Math.min(s[2], Math.max(s[0], drag.startH + (drag.startY - e.clientY))), { instant: true });
	}
	function up() {
		if (!drag) return;
		const tap = Math.abs(drag.lastY - drag.startY) < 6;
		const v = drag.v;
		drag = null;
		go(tap ? (index + 1) % 3 : nearestSnap(height.current, snaps(), v));
	}
	function key(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			go((index + 1) % 3);
		}
	}
</script>

<!-- Phone: draggable glass sheet above the tab bar. Desktop: fixed glass side panel. -->
<section
	aria-label={label}
	class="glass fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 flex flex-col rounded-t-3xl md:top-[calc(var(--header-h)+1rem)] md:right-auto md:bottom-4 md:left-4 md:h-auto! md:w-96 md:rounded-3xl"
	style="height: {height.current}px"
>
	<button
		type="button"
		class="mx-auto block shrink-0 touch-none px-8 py-3 md:hidden"
		aria-label={label}
		aria-expanded={index > 0}
		onpointerdown={down}
		onpointermove={move}
		onpointerup={up}
		onpointercancel={up}
		onkeydown={key}
	>
		<span class="block h-1 w-10 rounded bg-muted/60"></span>
	</button>
	<div class="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:pt-4">{@render children()}</div>
</section>
```

- [ ] **Step 4: Implement `LocationPicker.svelte`**

```svelte
<script lang="ts">
	import { LocateFixed } from '@lucide/svelte';
	import { here, PROVINCES, setPlace, useGps } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';

	let busy = $state(false);
	const name = $derived(
		here.place.via === 'gps' ? m.location_gps() : here.place.via === 'default' ? m.location_default() : here.place.name
	);

	async function gps() {
		busy = true;
		await useGps();
		busy = false;
	}
	function pick(e: Event) {
		const p = PROVINCES.find((x) => x.name === (e.currentTarget as HTMLSelectElement).value);
		if (p) setPlace({ ...p, via: 'province' });
	}
</script>

<div class="flex flex-wrap items-center gap-2 text-sm">
	<span class="font-semibold">{m.location_label()}: {name}</span>
	<button
		type="button"
		onclick={gps}
		disabled={busy}
		class="inline-flex min-h-9 items-center gap-1 rounded-md border border-ink px-2 font-semibold disabled:opacity-50"
	>
		<LocateFixed size={14} aria-hidden="true" />{m.location_use_gps()}
	</button>
	<label class="inline-flex">
		<span class="sr-only">{m.location_pick()}</span>
		<select onchange={pick} class="min-h-9 rounded-md border border-ink bg-paper px-2">
			<option value="">{m.location_pick()}</option>
			{#each PROVINCES as p (p.name)}
				<option value={p.name} selected={here.place.via === 'province' && here.place.name === p.name}>{p.name}</option>
			{/each}
		</select>
	</label>
	{#if here.error}<p role="status" class="w-full text-alarm">{m.location_denied()}</p>{/if}
</div>
```

- [ ] **Step 5: Verify**

Run: `npm run check && npm test`
Expected: 0 errors; tests PASS. (These components are exercised end-to-end from Task 9.)

- [ ] **Step 6: Commit**

```bash
git add web/src/lib/location.svelte.ts web/src/lib/components/MapView.svelte web/src/lib/components/BottomSheet.svelte web/src/lib/components/LocationPicker.svelte
git commit -m "web: add map view, draggable bottom sheet and location picker"
```

---

### Task 9: Home page, Conditions cards, Playwright setup

**Files:**
- Create: `web/src/lib/components/Conditions.svelte`, `web/playwright.config.ts`, `web/tests/e2e/fixtures.ts`, `web/tests/e2e/home.spec.ts`
- Modify: `web/src/routes/+page.svelte` (replace)

**Interfaces:**
- Consumes: `api` (config), `here`, `pickBanner`, `sortByDistance`, `toNum`, `sourced`, `getGdacs`, `getQuakes`, `getForecast`, `getAir`, `getRiver`, `pm25Band`, labels, components from Tasks 7–8
- Produces: `Conditions` props `{ place: Pt }`; e2e `test`/`expect` from `tests/e2e/fixtures.ts` with option `backend: 'up' | 'down'` (default `'up'`) and automatic mocks for all external hosts

- [ ] **Step 1: Create Playwright config and fixtures**

`web/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests/e2e',
	webServer: {
		command: 'npm run build && npm run preview',
		port: 3001,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	},
	use: { ...devices['Pixel 7'], baseURL: 'http://localhost:3001' }
});
```

`web/tests/e2e/fixtures.ts`:
```ts
import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const fx = (name: string) => read(`../../src/lib/sources/fixtures/${name}.json`);
const sample = (name: string) => read(`../../src/lib/sample/${name}.json`);
const json = { contentType: 'application/json' };

const API: Record<string, string> = {
	'/shelters': 'shelters',
	'/disasters': 'disasters',
	'/alerts': 'alerts',
	'/evacuation/routes': 'evacuation-routes'
};

/** Every external host is mocked so tests are deterministic and work offline. */
export const test = base.extend<{ backend: 'up' | 'down'; mocks: void }>({
	backend: ['up', { option: true }],
	mocks: [
		async ({ page, backend }, use) => {
			await page.route('https://tiles.openfreemap.org/**', (r) => r.abort());
			await page.route('https://api.open-meteo.com/**', (r) => r.fulfill({ ...json, body: fx('forecast') }));
			await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ ...json, body: fx('air') }));
			await page.route('https://flood-api.open-meteo.com/**', (r) => r.fulfill({ ...json, body: fx('river') }));
			await page.route('https://earthquake.usgs.gov/**', (r) => r.fulfill({ ...json, body: fx('usgs') }));
			await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ ...json, body: fx('gdacs') }));
			await page.route('http://localhost:5000/api/**', async (r) => {
				if (backend === 'down') return r.abort('connectionrefused');
				if (r.request().method() === 'POST') {
					return r.fulfill({ ...json, status: 201, body: '{"message":"ok","reportId":99}' });
				}
				const file = API[new URL(r.request().url()).pathname.replace(/^\/api/, '')];
				return file ? r.fulfill({ ...json, body: sample(file) }) : r.fulfill({ status: 404, body: '' });
			});
			await use();
		},
		{ auto: true }
	]
});

export { expect };
```

- [ ] **Step 2: Write the failing Home e2e tests**

`web/tests/e2e/home.spec.ts`:
```ts
import { expect, test } from './fixtures';

test('home shows the shell, a sample alert and the nearest shelter', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Shelters' }).last()).toBeVisible();
	await expect(page.getByRole('alert')).toContainText('SAMPLE');
	await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toContainText('km away');
	await expect(page.getByText('Air quality (PM2.5)')).toBeVisible();
	await expect(page.getByText('41.2')).toBeVisible();
});

test('Thai locale renders Thai labels', async ({ page }) => {
	await page.goto('/th');
	await expect(page.locator('html')).toHaveAttribute('lang', 'th');
	await expect(page.getByRole('link', { name: 'ที่พักพิง' }).last()).toBeVisible();
});

test.describe('backend down', () => {
	test.use({ backend: 'down' });
	test('shows the offline banner and still renders sample shelters', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Showing sample data: backend offline.')).toBeVisible();
		await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toContainText('km away');
	});
});

test('a public source being down only affects its own card', async ({ page }) => {
	await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ status: 503, body: '' }));
	await page.goto('/');
	await expect(page.getByText('Open-Meteo unavailable right now.')).toBeVisible();
	await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toBeVisible();
});

test('no WebGL: map area explains itself, actions still work', async ({ page }) => {
	await page.addInitScript(() => {
		const orig = HTMLCanvasElement.prototype.getContext;
		// @ts-expect-error test override
		HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
			return type.startsWith('webgl') ? null : orig.call(this, type, ...rest);
		};
	});
	await page.goto('/');
	await expect(page.getByText("Map can't be shown on this device.")).toBeVisible();
	await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toBeVisible();
});

test.describe('geolocation denied', () => {
	test.use({ permissions: [] });
	test('asks for a province instead', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/');
		await page.getByRole('button', { name: 'Use my location' }).click();
		await expect(page.getByText('Location unavailable. Choose a province instead.')).toBeVisible();
	});
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: FAIL — the placeholder home page has no tabs content beyond the shell, no alert, no shelter link.

- [ ] **Step 4: Implement `Conditions.svelte`**

```svelte
<script lang="ts">
	import { CloudRain, Waves, Wind } from '@lucide/svelte';
	import { fmtDay } from '$lib/format';
	import { pm25Label, pm25Level } from '$lib/labels';
	import { m } from '$lib/paraglide/messages.js';
	import { LEVEL_STRIPE } from '$lib/severity';
	import { sourced } from '$lib/sources/http';
	import { getAir, getForecast, getRiver, pm25Band, type Air, type Forecast, type River } from '$lib/sources/openmeteo';
	import type { Pt, Sourced } from '$lib/types';
	import SourceStamp from './SourceStamp.svelte';

	let { place }: { place: Pt } = $props();

	let fc = $state<Sourced<Forecast> | null>(null);
	let air = $state<Sourced<Air> | null>(null);
	let river = $state<Sourced<River | null> | null>(null);
	let token = 0;

	function load(p: Pt) {
		const t = ++token;
		fc = air = river = null;
		sourced('Open-Meteo', () => getForecast(p)).then((r) => t === token && (fc = r));
		sourced('Open-Meteo', () => getAir(p)).then((r) => t === token && (air = r));
		sourced('Open-Meteo', () => getRiver(p)).then((r) => t === token && (river = r));
	}

	$effect(() => load({ lat: place.lat, lon: place.lon }));

	const failed = $derived([fc, air, river].some((x) => x && 'error' in x));
	const stamp = $derived([fc, air, river].find((x) => x && 'data' in x) as { source: string; updatedAt: Date } | undefined);
</script>

<div class="grid grid-cols-3 gap-2">
	<div class="flex flex-col gap-1 rounded-xl bg-paper p-3">
		<span class="flex items-center gap-1 text-xs font-semibold text-muted"><Wind size={14} aria-hidden="true" />{m.pm25_title()}</span>
		{#if air && 'data' in air}
			{@const band = pm25Band(air.data.pm25)}
			<span class="font-mono text-xl font-medium">{air.data.pm25.toFixed(1)}<span class="text-xs"> µg/m³</span></span>
			<span class="flex items-center gap-1 text-xs"><span class="h-2 w-2 rounded-full {LEVEL_STRIPE[pm25Level(band)]}" aria-hidden="true"></span>{pm25Label(band)}</span>
		{:else}
			<span class="font-mono text-xl text-muted">—</span>
		{/if}
	</div>
	<div class="flex flex-col gap-1 rounded-xl bg-paper p-3">
		<span class="flex items-center gap-1 text-xs font-semibold text-muted"><CloudRain size={14} aria-hidden="true" />{m.rain_title()}</span>
		{#if fc && 'data' in fc}
			<span class="font-mono text-xl font-medium">{Math.max(...fc.data.hours.map((h) => h.rainChance))}%</span>
		{:else}
			<span class="font-mono text-xl text-muted">—</span>
		{/if}
	</div>
	<div class="flex flex-col gap-1 rounded-xl bg-paper p-3">
		<span class="flex items-center gap-1 text-xs font-semibold text-muted"><Waves size={14} aria-hidden="true" />{m.river_title()}</span>
		{#if river && 'data' in river}
			{#if river.data}
				<span class="text-xs leading-snug">
					{river.data.rising
						? m.river_rising({ peak: river.data.peak.toFixed(1), date: fmtDay(`${river.data.peakDate}T12:00:00Z`) })
						: m.river_steady({ today: river.data.today.toFixed(1) })}
				</span>
			{:else}
				<span class="text-xs text-muted">{m.river_none()}</span>
			{/if}
		{:else}
			<span class="font-mono text-xl text-muted">—</span>
		{/if}
	</div>
</div>
<p class="mt-1 text-[11px] text-muted">{m.river_note()}</p>
{#if failed}
	<p role="status" class="mt-1 text-sm text-alarm">
		{m.source_unavailable({ source: 'Open-Meteo' })}
		<button type="button" class="ml-1 font-semibold underline" onclick={() => load({ lat: place.lat, lon: place.lon })}>{m.retry()}</button>
	</p>
{:else if stamp}
	<SourceStamp source={stamp.source} updatedAt={stamp.updatedAt} />
{/if}
```

- [ ] **Step 5: Implement the Home page**

Replace `web/src/routes/+page.svelte`:
```svelte
<script lang="ts">
	import { CloudSun, Route, Tent, TriangleAlert } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import AlertBanner from '$lib/components/AlertBanner.svelte';
	import BottomSheet from '$lib/components/BottomSheet.svelte';
	import Conditions from '$lib/components/Conditions.svelte';
	import EventList from '$lib/components/EventList.svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import SourceStamp from '$lib/components/SourceStamp.svelte';
	import { pickBanner } from '$lib/banner';
	import { api } from '$lib/config';
	import { sortByDistance, toNum } from '$lib/geo';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { getGdacs } from '$lib/sources/gdacs';
	import { sourced } from '$lib/sources/http';
	import { getQuakes } from '$lib/sources/usgs';
	import type { DbAlert, HazardEvent, MapMarker, Shelter, Sourced } from '$lib/types';

	let shelters = $state<Shelter[]>([]);
	let alerts = $state<DbAlert[] | null>(null);
	let gdacs = $state<Sourced<HazardEvent[]> | null>(null);
	let quakes = $state<Sourced<HazardEvent[]> | null>(null);

	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
		api.alerts().then((r) => (alerts = r.data));
		sourced('GDACS', getGdacs).then((r) => (gdacs = r));
		sourced('USGS', getQuakes).then((r) => (quakes = r));
	});

	const ok = (s: Sourced<HazardEvent[]> | null) => (s && 'data' in s ? s.data : []);
	const events = $derived([...ok(gdacs), ...ok(quakes)].sort((a, b) => b.time.localeCompare(a.time)));
	const banner = $derived(alerts && gdacs ? pickBanner(ok(gdacs), alerts) : null);
	const coords = (s: Shelter) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) });
	const nearest = $derived(sortByDistance(shelters.filter((s) => s.Status === 'Available'), here.place, coords).find((x) => x.km !== null));

	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...shelters.flatMap((s): MapMarker[] => {
			const c = coords(s);
			return c.lat === null || c.lon === null ? [] : [{ id: `S${s.ShelterID}`, kind: 'shelter', lat: c.lat, lon: c.lon, label: s.ShelterName }];
		}),
		...events.map((e): MapMarker => ({ id: e.id, kind: e.source === 'USGS' ? 'quake' : 'hazard', lat: e.lat, lon: e.lon, label: e.title }))
	]);
</script>

<MapView class="fixed inset-0" {markers} center={here.place} zoom={6} focus={here.place} />

<div class="fixed inset-x-3 top-[calc(var(--header-h)+0.75rem)] z-20 md:right-4 md:left-auto md:w-[26rem]">
	{#if banner}<AlertBanner {banner} />{/if}
</div>

<BottomSheet label={m.sheet_toggle()}>
	<div class="flex flex-col gap-3">
		{#if nearest}
			<ActionButton
				primary
				href={localizeHref('/shelters')}
				icon={Tent}
				label={m.home_find_shelter()}
				sub={m.home_shelter_distance({ km: nearest.km!.toFixed(1) })}
			/>
		{:else}
			<ActionButton primary href={localizeHref('/shelters')} icon={Tent} label={m.home_find_shelter()} sub={m.home_no_shelter()} />
		{/if}
		<div class="grid grid-cols-3 gap-2 text-sm">
			<ActionButton href={localizeHref('/evacuation')} icon={Route} label={m.home_evacuation()} />
			<ActionButton href={localizeHref('/report')} icon={TriangleAlert} label={m.home_report()} />
			<ActionButton href={localizeHref('/weather')} icon={CloudSun} label={m.home_weather()} />
		</div>
		<p class="text-xs text-muted"><SampleBadge /> {m.shelters_sample_note()}</p>

		<h2 class="mt-2 text-sm font-bold">{m.home_conditions()}</h2>
		<LocationPicker />
		<Conditions place={here.place} />

		<h2 class="mt-2 text-sm font-bold">{m.home_nearby_events()}</h2>
		{#if events.length}
			<EventList {events} limit={5} />
		{:else if gdacs && quakes}
			<p class="text-sm text-muted">{m.events_empty()}</p>
		{/if}
		{#each [gdacs, quakes] as s}
			{#if s && 'error' in s}
				<p class="text-sm text-alarm">{m.source_unavailable({ source: s.source })}</p>
			{:else if s}
				<SourceStamp source={s.source} updatedAt={s.updatedAt} />
			{/if}
		{/each}
	</div>
</BottomSheet>
```

- [ ] **Step 6: Run the e2e tests**

Run: `npx playwright test tests/e2e/home.spec.ts`
Expected: PASS (6 tests). If "geolocation denied" fails because Chromium auto-grants, keep `context.clearPermissions()` and confirm the denial path by setting `test.use({ geolocation: undefined, permissions: [] })`; the app logic must not change.

- [ ] **Step 7: Check by eye on a phone width**

Run: `npm run dev`, open `http://localhost:3001` in Chrome DevTools at 375×812.
Expected: full-screen light map; red/amber alert card under the header with a SAMPLE badge; glass sheet at the bottom; dragging the handle snaps to three heights; tapping the handle cycles; with "Reduce motion" emulated in DevTools the sheet jumps without springing.

- [ ] **Step 8: Commit**

```bash
git add web/src/routes/+page.svelte web/src/lib/components/Conditions.svelte web/playwright.config.ts web/tests
git commit -m "web: build map-first home with alert banner, conditions and e2e setup"
```

---

### Task 10: Disasters (Map tab)

**Files:**
- Create: `web/src/routes/disasters/+page.svelte`, `web/tests/e2e/disasters.spec.ts`

**Interfaces:**
- Consumes: `api.disasters()`, `getGdacs`, `getQuakes`, `sourced`, `kindOf`, `levelOf`, labels, `EventList`, `MapView`, `Sheet`, `StatusPill`, `SampleBadge`, `SourceStamp`

- [ ] **Step 1: Write the failing e2e test**

`web/tests/e2e/disasters.spec.ts`:
```ts
import { expect, test } from './fixtures';

test('lists live GDACS events and sample disasters separately', async ({ page }) => {
	await page.goto('/disasters');
	await expect(page.getByRole('heading', { name: 'Disasters & hazards' })).toBeVisible();
	await expect(page.getByText('Flood in Thailand')).toBeVisible();
	await expect(page.getByText('M5.3 · 81 km SSW of Banda Aceh, Indonesia')).toBeVisible();
	const sample = page.getByRole('region', { name: "From this demo's database" });
	await expect(sample.getByText('SAMPLE').first()).toBeVisible();
});

test('filtering by type narrows both lists', async ({ page }) => {
	await page.goto('/disasters');
	await page.getByRole('button', { name: 'Earthquake', exact: true }).click();
	await expect(page.getByText('Flood in Thailand')).toHaveCount(0);
	await expect(page.getByText('M5.3 · 81 km SSW of Banda Aceh, Indonesia')).toBeVisible();
});

test('selecting an event opens its details', async ({ page }) => {
	await page.goto('/disasters');
	await page.getByRole('button', { name: /Flood in Thailand/ }).click();
	await expect(page.getByRole('dialog')).toContainText('Details at source');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/disasters.spec.ts`
Expected: FAIL — `/disasters` is a 404.

- [ ] **Step 3: Implement the page**

`web/src/routes/disasters/+page.svelte`:
```svelte
<script lang="ts">
	import { ExternalLink, List, Map as MapIcon } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import EventList from '$lib/components/EventList.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import Sheet from '$lib/components/Sheet.svelte';
	import SourceStamp from '$lib/components/SourceStamp.svelte';
	import StatusPill from '$lib/components/StatusPill.svelte';
	import { api } from '$lib/config';
	import { fmtDate, fmtDateTime } from '$lib/format';
	import { toNum } from '$lib/geo';
	import { kindLabel, levelLabel } from '$lib/labels';
	import { here } from '$lib/location.svelte';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { kindOf, levelOf } from '$lib/severity';
	import { getGdacs } from '$lib/sources/gdacs';
	import { sourced } from '$lib/sources/http';
	import { getQuakes } from '$lib/sources/usgs';
	import type { Disaster, HazardEvent, HazardKind, MapMarker, Sourced } from '$lib/types';

	let gdacs = $state<Sourced<HazardEvent[]> | null>(null);
	let quakes = $state<Sourced<HazardEvent[]> | null>(null);
	let disasters = $state<Disaster[]>([]);
	let kind = $state<'all' | HazardKind>('all');
	let view = $state<'list' | 'map'>('list');
	let selected = $state<{ type: 'event'; e: HazardEvent } | { type: 'sample'; d: Disaster } | null>(null);
	let sheetOpen = $state(false);

	function loadLive() {
		gdacs = quakes = null;
		sourced('GDACS', getGdacs).then((r) => (gdacs = r));
		sourced('USGS', getQuakes).then((r) => (quakes = r));
	}
	onMount(() => {
		loadLive();
		api.disasters().then((r) => (disasters = r.data));
	});

	const ok = (s: Sourced<HazardEvent[]> | null) => (s && 'data' in s ? s.data : []);
	const allLive = $derived([...ok(gdacs), ...ok(quakes)].sort((a, b) => b.time.localeCompare(a.time)));
	const live = $derived(allLive.filter((e) => kind === 'all' || e.kind === kind));
	const sample = $derived(disasters.filter((d) => kind === 'all' || kindOf(d.DisasterType) === kind));
	const kinds = $derived([...new Set<HazardKind>([...allLive.map((e) => e.kind), ...disasters.map((d) => kindOf(d.DisasterType))])]);

	const markers = $derived<MapMarker[]>([
		...live.map((e): MapMarker => ({ id: e.id, kind: e.source === 'USGS' ? 'quake' : 'hazard', lat: e.lat, lon: e.lon, label: e.title })),
		...sample.flatMap((d): MapMarker[] => {
			const lat = toNum(d.Latitude);
			const lon = toNum(d.Longitude);
			return lat === null || lon === null ? [] : [{ id: `D${d.DisasterID}`, kind: 'sample', lat, lon, label: d.DisasterName }];
		})
	]);

	function openEvent(e: HazardEvent) {
		selected = { type: 'event', e };
		sheetOpen = true;
	}
	function openSample(d: Disaster) {
		selected = { type: 'sample', d };
		sheetOpen = true;
	}
	function onMarker(id: string) {
		const e = live.find((x) => x.id === id);
		if (e) return openEvent(e);
		const d = sample.find((x) => `D${x.DisasterID}` === id);
		if (d) openSample(d);
	}
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.disasters_title()}</h1>

	<div class="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label={m.filter_label()}>
		{#each ['all', ...kinds] as k (k)}
			<button
				type="button"
				aria-pressed={kind === k}
				onclick={() => (kind = k as typeof kind)}
				class="rounded-full border border-ink px-3 py-1 text-sm font-semibold {kind === k ? 'bg-ink text-paper' : ''}"
			>
				{k === 'all' ? m.filter_all() : kindLabel(k as HazardKind)}
			</button>
		{/each}
	</div>

	<div class="mt-3 inline-flex rounded-md border border-ink" role="group" aria-label={m.view_label()}>
		<button type="button" aria-pressed={view === 'list'} onclick={() => (view = 'list')} class="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold {view === 'list' ? 'bg-ink text-paper' : ''}">
			<List size={16} aria-hidden="true" />{m.view_list()}
		</button>
		<button type="button" aria-pressed={view === 'map'} onclick={() => (view = 'map')} class="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold {view === 'map' ? 'bg-ink text-paper' : ''}">
			<MapIcon size={16} aria-hidden="true" />{m.view_map()}
		</button>
	</div>

	{#if view === 'map'}
		<MapView class="mt-4 h-[60vh] overflow-hidden rounded-xl border border-rule" {markers} center={here.place} zoom={5} onselect={onMarker} />
	{:else}
		<section class="mt-6" aria-label={m.events_live()}>
			<h2 class="text-sm font-bold tracking-wide uppercase">{m.events_live()}</h2>
			{#if live.length}
				<EventList events={live} onselect={openEvent} />
			{:else if gdacs && quakes}
				<p class="py-3 text-sm text-muted">{m.events_empty()}</p>
			{:else}
				<p class="py-3 text-sm text-muted">{m.loading()}</p>
			{/if}
			{#each [gdacs, quakes] as s}
				{#if s && 'error' in s}
					<p class="text-sm text-alarm">
						{m.source_unavailable({ source: s.source })}
						<button type="button" class="ml-1 font-semibold underline" onclick={loadLive}>{m.retry()}</button>
					</p>
				{:else if s}
					<SourceStamp source={s.source} updatedAt={s.updatedAt} />
				{/if}
			{/each}
		</section>

		<section class="mt-8" aria-label={m.events_sample()}>
			<h2 class="flex items-center gap-2 text-sm font-bold tracking-wide uppercase">{m.events_sample()} <SampleBadge /></h2>
			<ul class="divide-y divide-rule">
				{#each sample as d (d.DisasterID)}
					<li animate:flip={{ duration: ms(200) }}>
						<button type="button" onclick={() => openSample(d)} class="flex w-full items-start gap-3 py-3 text-left">
							<StatusPill level={levelOf(d.Severity)} label={levelLabel(levelOf(d.Severity))} />
							<span class="flex flex-col">
								<span class="font-semibold">{d.DisasterName}</span>
								<span class="text-xs text-muted">{kindLabel(kindOf(d.DisasterType))} · {d.AffectedRegion} · {fmtDate(d.StartDate)}</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<Sheet bind:open={sheetOpen} title={selected?.type === 'event' ? selected.e.title : (selected?.d.DisasterName ?? '')}>
	{#if selected?.type === 'event'}
		<div class="flex flex-col gap-2 text-sm">
			<StatusPill level={selected.e.level} label={levelLabel(selected.e.level)} />
			<p>{kindLabel(selected.e.kind)} · {fmtDateTime(selected.e.time)} · {selected.e.source}</p>
			<a href={selected.e.url} target="_blank" rel="noopener" class="inline-flex items-center gap-1 font-semibold underline">
				{m.open_source_link()}<ExternalLink size={14} aria-hidden="true" />
			</a>
		</div>
	{:else if selected?.type === 'sample'}
		<div class="flex flex-col gap-2 text-sm">
			<p><SampleBadge /></p>
			<StatusPill level={levelOf(selected.d.Severity)} label={levelLabel(levelOf(selected.d.Severity))} />
			<p>{kindLabel(kindOf(selected.d.DisasterType))} · {selected.d.AffectedRegion} · {fmtDate(selected.d.StartDate)}</p>
			{#if selected.d.Description}<p>{selected.d.Description}</p>{/if}
		</div>
	{/if}
</Sheet>
```

- [ ] **Step 4: Run e2e**

Run: `npx playwright test tests/e2e/disasters.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/disasters web/tests/e2e/disasters.spec.ts
git commit -m "web: add disasters map tab with live and sample groups"
```

---

### Task 11: Shelters and Evacuation

**Files:**
- Create: `web/src/routes/shelters/+page.svelte`, `web/src/routes/evacuation/+page.svelte`, `web/tests/e2e/shelters.spec.ts`

**Interfaces:**
- Consumes: `api.shelters()`, `api.evacuationRoutes()`, `sortByDistance`, `toNum`, `occupancyPct`, `here`, `shelterStatusLabel`, `shelterStatusLevel`, `MapView`, `LocationPicker`, `StatusPill`, `SampleBadge`

- [ ] **Step 1: Write the failing e2e test**

`web/tests/e2e/shelters.spec.ts`:
```ts
import { expect, test } from './fixtures';

test('shelters are sorted by distance, labelled as sample, with directions', async ({ page }) => {
	await page.goto('/shelters');
	await expect(page.getByRole('heading', { name: 'Shelters' })).toBeVisible();
	await expect(page.getByText('Every shelter on this page is sample data.')).toBeVisible();
	const first = page.getByRole('listitem').filter({ hasText: 'km' }).first();
	await expect(first.getByRole('link', { name: 'Directions' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
	const kms = await page.locator('[data-km]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-km'))));
	expect(kms).toEqual([...kms].sort((a, b) => a - b));
});

test('evacuation shows nearest open shelters and sample routes', async ({ page }) => {
	await page.goto('/evacuation');
	await expect(page.getByText('In danger now? Call 1669 (ambulance) or 191 (police) first.')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Planned routes' })).toContainText('SAMPLE');
	await expect(page.getByRole('link', { name: 'Directions' }).first()).toBeVisible();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/shelters.spec.ts`
Expected: FAIL — routes are 404.

- [ ] **Step 3: Implement Shelters**

`web/src/routes/shelters/+page.svelte`:
```svelte
<script lang="ts">
	import { List, Map as MapIcon, MapPin, Navigation } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import MapView from '$lib/components/MapView.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import StatusPill from '$lib/components/StatusPill.svelte';
	import { api } from '$lib/config';
	import { occupancyPct, sortByDistance, toNum } from '$lib/geo';
	import { shelterStatusLabel, shelterStatusLevel } from '$lib/labels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { MapMarker, Pt, Shelter } from '$lib/types';

	let shelters = $state<Shelter[] | null>(null);
	let view = $state<'list' | 'map'>('list');
	let focus = $state<Pt | null>(null);

	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
	});

	const coords = (s: Shelter) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) });
	const sorted = $derived(shelters ? sortByDistance(shelters, here.place, coords) : []);
	const markers = $derived<MapMarker[]>([
		{ id: 'me', kind: 'me', lat: here.place.lat, lon: here.place.lon, label: m.location_label() },
		...sorted.flatMap(({ item: s }): MapMarker[] => {
			const c = coords(s);
			return c.lat === null || c.lon === null ? [] : [{ id: `S${s.ShelterID}`, kind: 'shelter', lat: c.lat, lon: c.lon, label: s.ShelterName }];
		})
	]);
	const directions = (p: Pt) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;

	function showOnMap(s: Shelter) {
		const c = coords(s);
		if (c.lat === null || c.lon === null) return;
		focus = { lat: c.lat, lon: c.lon };
		view = 'map';
	}
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.shelters_title()}</h1>
	<p class="mt-1 text-sm text-muted"><SampleBadge /> {m.shelters_sample_note()}</p>
	<div class="mt-3"><LocationPicker /></div>

	<div class="mt-3 inline-flex rounded-md border border-ink" role="group" aria-label={m.view_label()}>
		<button type="button" aria-pressed={view === 'list'} onclick={() => (view = 'list')} class="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold {view === 'list' ? 'bg-ink text-paper' : ''}">
			<List size={16} aria-hidden="true" />{m.view_list()}
		</button>
		<button type="button" aria-pressed={view === 'map'} onclick={() => (view = 'map')} class="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold {view === 'map' ? 'bg-ink text-paper' : ''}">
			<MapIcon size={16} aria-hidden="true" />{m.view_map()}
		</button>
	</div>

	{#if view === 'map'}
		<MapView class="mt-4 h-[60vh] overflow-hidden rounded-xl border border-rule" {markers} center={here.place} zoom={8} {focus} />
	{:else if shelters === null}
		<p class="mt-4 text-sm text-muted">{m.loading()}</p>
	{:else}
		<ul class="mt-4 flex flex-col gap-3">
			{#each sorted as { item: s, km } (s.ShelterID)}
				{@const pct = occupancyPct(s.CurrentOccupancy, s.Capacity)}
				{@const c = coords(s)}
				<li class="rounded-xl border border-rule bg-white/60 p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="font-semibold">{s.ShelterName}</p>
							<p class="text-xs text-muted">{s.Address}, {s.City}</p>
						</div>
						<StatusPill level={shelterStatusLevel(s.Status)} label={shelterStatusLabel(s.Status)} />
					</div>
					<p class="mt-2 font-mono text-sm" data-km={km ?? undefined}>
						{km === null ? m.shelter_distance_unknown() : m.home_shelter_distance({ km: km.toFixed(1) })}
					</p>
					<div class="mt-2 h-2 overflow-hidden rounded-full bg-rule" aria-hidden="true">
						<div class="h-full {pct >= 90 ? 'bg-alarm' : 'bg-ink'}" style="width: {pct}%"></div>
					</div>
					<p class="mt-1 text-xs text-muted">{m.shelter_capacity({ occupied: s.CurrentOccupancy, capacity: s.Capacity })}</p>
					{#if c.lat !== null && c.lon !== null}
						<div class="mt-3 flex gap-2">
							<a href={directions({ lat: c.lat, lon: c.lon })} target="_blank" rel="noopener" class="inline-flex min-h-10 items-center gap-1 rounded-md bg-ink px-3 text-sm font-semibold text-paper">
								<Navigation size={16} aria-hidden="true" />{m.shelter_directions()}
							</a>
							<button type="button" onclick={() => showOnMap(s)} class="inline-flex min-h-10 items-center gap-1 rounded-md border border-ink px-3 text-sm font-semibold">
								<MapPin size={16} aria-hidden="true" />{m.shelter_on_map()}
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>
```

- [ ] **Step 4: Implement Evacuation**

`web/src/routes/evacuation/+page.svelte`:
```svelte
<script lang="ts">
	import { Navigation, PhoneCall } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import { api } from '$lib/config';
	import { sortByDistance, toNum } from '$lib/geo';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { EvacRoute, Shelter } from '$lib/types';

	let shelters = $state<Shelter[]>([]);
	let routes = $state<EvacRoute[] | null>(null);

	onMount(() => {
		api.shelters().then((r) => (shelters = r.data));
		api.evacuationRoutes().then((r) => (routes = r.data));
	});

	const nearest = $derived(
		sortByDistance(shelters.filter((s) => s.Status === 'Available'), here.place, (s) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) }))
			.filter((x) => x.km !== null)
			.slice(0, 3)
	);
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.evac_title()}</h1>
	<p class="mt-3 flex items-start gap-2 rounded-xl bg-alarm p-3 text-sm font-semibold text-white">
		<PhoneCall size={18} aria-hidden="true" class="mt-0.5 shrink-0" />{m.emergency_call_first()}
	</p>
	<p class="mt-3">{m.evac_intro()}</p>
	<div class="mt-3"><LocationPicker /></div>

	<h2 class="mt-6 flex items-center gap-2 text-sm font-bold tracking-wide uppercase">{m.evac_nearest()} <SampleBadge /></h2>
	<ul class="mt-2 divide-y divide-rule">
		{#each nearest as { item: s, km } (s.ShelterID)}
			<li class="flex items-center justify-between gap-3 py-3">
				<span>
					<span class="block font-semibold">{s.ShelterName}</span>
					<span class="font-mono text-xs text-muted">{m.home_shelter_distance({ km: km!.toFixed(1) })}</span>
				</span>
				<a
					href={`https://www.google.com/maps/dir/?api=1&destination=${toNum(s.Latitude)},${toNum(s.Longitude)}`}
					target="_blank"
					rel="noopener"
					class="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-md bg-ink px-3 text-sm font-semibold text-paper"
				>
					<Navigation size={16} aria-hidden="true" />{m.shelter_directions()}
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-8 flex items-center gap-2 text-sm font-bold tracking-wide uppercase">{m.evac_routes()} <SampleBadge /></h2>
	{#if routes === null}
		<p class="mt-2 text-sm text-muted">{m.loading()}</p>
	{:else}
		<ul class="mt-2 divide-y divide-rule">
			{#each routes as r (r.RouteID)}
				<li class="py-3">
					<p class="font-semibold">{r.RouteName}</p>
					<p class="text-sm">{r.StartPoint} → {r.EndPoint}</p>
					<p class="font-mono text-xs text-muted">{m.evac_route_meta({ km: r.Distance, min: r.EstimatedTime, status: r.Status })}</p>
				</li>
			{/each}
		</ul>
	{/if}
</div>
```

- [ ] **Step 5: Run e2e**

Run: `npx playwright test tests/e2e/shelters.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add web/src/routes/shelters web/src/routes/evacuation web/tests/e2e/shelters.spec.ts
git commit -m "web: add shelters list/map and evacuation page with directions hand-off"
```

---

### Task 12: Weather

**Files:**
- Create: `web/src/routes/weather/+page.svelte`, `web/tests/e2e/weather.spec.ts`

**Interfaces:**
- Consumes: `getForecast`, `sourced`, `weatherKey`, `wxLabel`, `wxIcon`, `fmtHour`, `fmtDay`, `here`, `LocationPicker`, `Conditions`, `SourceStamp`

- [ ] **Step 1: Write the failing e2e test**

`web/tests/e2e/weather.spec.ts`:
```ts
import { expect, test } from './fixtures';

test('weather shows live forecast with its source', async ({ page }) => {
	await page.goto('/weather');
	await expect(page.getByRole('heading', { name: 'Weather' })).toBeVisible();
	await expect(page.getByText('31°')).toBeVisible();
	await expect(page.getByText('Rain').first()).toBeVisible();
	await expect(page.getByText('Wind 9.5 km/h')).toBeVisible();
	await expect(page.getByText(/Open-Meteo · updated/).first()).toBeVisible();
	await expect(page.getByText('SAMPLE')).toHaveCount(0);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/weather.spec.ts`
Expected: FAIL — `/weather` is a 404.

- [ ] **Step 3: Implement the page**

`web/src/routes/weather/+page.svelte`:
```svelte
<script lang="ts">
	import { Droplets } from '@lucide/svelte';
	import Conditions from '$lib/components/Conditions.svelte';
	import LocationPicker from '$lib/components/LocationPicker.svelte';
	import SourceStamp from '$lib/components/SourceStamp.svelte';
	import { fmtDay, fmtHour } from '$lib/format';
	import { wxIcon, wxLabel } from '$lib/labels';
	import { here } from '$lib/location.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { sourced } from '$lib/sources/http';
	import { getForecast, type Forecast } from '$lib/sources/openmeteo';
	import type { Pt, Sourced } from '$lib/types';
	import { weatherKey } from '$lib/weather-codes';

	let fc = $state<Sourced<Forecast> | null>(null);
	let token = 0;

	function load(p: Pt) {
		const t = ++token;
		fc = null;
		sourced('Open-Meteo', () => getForecast(p)).then((r) => t === token && (fc = r));
	}
	$effect(() => load({ lat: here.place.lat, lon: here.place.lon }));
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.weather_title()}</h1>
	<div class="mt-3"><LocationPicker /></div>

	{#if fc === null}
		<p class="mt-6 text-sm text-muted">{m.loading()}</p>
	{:else if 'error' in fc}
		<p role="status" class="mt-6 text-sm text-alarm">
			{m.source_unavailable({ source: fc.source })}
			<button type="button" class="ml-1 font-semibold underline" onclick={() => load({ lat: here.place.lat, lon: here.place.lon })}>{m.retry()}</button>
		</p>
	{:else}
		{@const now = fc.data.now}
		{@const NowIcon = wxIcon(weatherKey(now.code))}
		<section class="mt-6 flex items-center gap-4" aria-label={m.weather_now()}>
			<NowIcon size={56} aria-hidden="true" />
			<div>
				<p class="font-mono text-5xl font-medium">{Math.round(now.temp)}°</p>
				<p class="font-semibold">{wxLabel(weatherKey(now.code))}</p>
				<p class="text-sm text-muted">{m.weather_wind({ speed: now.wind })}</p>
			</div>
		</section>

		<h2 class="mt-8 text-sm font-bold tracking-wide uppercase">{m.weather_next24()}</h2>
		<ol class="mt-2 flex gap-2 overflow-x-auto pb-2">
			{#each fc.data.hours.filter((_, i) => i % 3 === 0) as h (h.time.getTime())}
				<li class="flex min-w-16 flex-col items-center rounded-xl border border-rule px-2 py-2 text-sm">
					<span class="font-mono text-xs text-muted">{fmtHour(h.time)}</span>
					<span class="font-mono font-medium">{Math.round(h.temp)}°</span>
					<span class="flex items-center gap-0.5 text-xs"><Droplets size={12} aria-hidden="true" />{h.rainChance}%</span>
				</li>
			{/each}
		</ol>

		<h2 class="mt-6 text-sm font-bold tracking-wide uppercase">{m.weather_7day()}</h2>
		<ul class="mt-2 divide-y divide-rule">
			{#each fc.data.days as d (d.date.getTime())}
				{@const DayIcon = wxIcon(weatherKey(d.code))}
				<li class="flex items-center gap-3 py-2">
					<span class="w-20 font-mono text-sm">{fmtDay(d.date)}</span>
					<DayIcon size={20} aria-hidden="true" />
					<span class="flex-1 text-sm">{wxLabel(weatherKey(d.code))}</span>
					<span class="font-mono text-sm">{Math.round(d.min)}° / {Math.round(d.max)}°</span>
					<span class="w-16 text-right font-mono text-xs text-muted">{m.weather_rain_mm({ mm: d.rain.toFixed(1) })}</span>
				</li>
			{/each}
		</ul>
		<SourceStamp source={fc.source} updatedAt={fc.updatedAt} />
	{/if}

	<h2 class="mt-8 text-sm font-bold tracking-wide uppercase">{m.home_conditions()}</h2>
	<div class="mt-2 rounded-2xl bg-rule/40 p-2"><Conditions place={here.place} /></div>
</div>
```

- [ ] **Step 4: Run e2e**

Run: `npx playwright test tests/e2e/weather.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/weather web/tests/e2e/weather.spec.ts
git commit -m "web: add live weather page (Open-Meteo forecast, air, river)"
```

---

### Task 13: Report flow

**Files:**
- Create: `web/src/routes/report/+page.svelte`, `web/tests/e2e/report.spec.ts`

**Interfaces:**
- Consumes: `emptyForm`, `validateStep`, `toReportInput`, `StepErrors`, `ReportForm` (report.ts), `REPORT_TYPES`, `REPORT_SEVERITIES`, `reportTypeLabel`, `reportSeverityLabel`, `api.submitReport` (returns `PostResult`)

- [ ] **Step 1: Write the failing e2e tests**

`web/tests/e2e/report.spec.ts`:
```ts
import { expect, test } from './fixtures';

async function fill(page: import('@playwright/test').Page) {
	await page.goto('/report');
	await page.getByRole('radio', { name: 'Flood' }).check();
	await page.getByRole('radio', { name: 'Severe' }).check();
	await page.getByLabel('Describe what you see').fill('Water up to the knees on the main road');
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByLabel('Place name or landmark').fill('Mae Rim market');
	await page.getByRole('button', { name: 'Next' }).click();
}

test('validates step 1 before moving on', async ({ page }) => {
	await page.goto('/report');
	await page.getByRole('button', { name: 'Next' }).click();
	await expect(page.getByText('Please fill this in.').first()).toBeVisible();
	await expect(page.getByText('Step 1 of 3')).toBeVisible();
});

test('sends one report and shows the done screen', async ({ page }) => {
	let posts = 0;
	page.on('request', (r) => r.method() === 'POST' && r.url().endsWith('/api/reports') && posts++);
	await fill(page);
	const send = page.getByRole('button', { name: 'Send report' });
	await send.dblclick();
	await expect(page.getByRole('heading', { name: 'Report sent' })).toBeVisible();
	expect(posts).toBe(1);
});

test.describe('backend down', () => {
	test.use({ backend: 'down' });
	test('keeps the form and explains the problem', async ({ page }) => {
		await fill(page);
		await page.getByRole('button', { name: 'Send report' }).click();
		await expect(page.getByText(/Couldn't reach the server/)).toBeVisible();
		await page.getByRole('button', { name: 'Back' }).click();
		await page.getByRole('button', { name: 'Back' }).click();
		await expect(page.getByLabel('Describe what you see')).toHaveValue('Water up to the knees on the main road');
	});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/report.spec.ts`
Expected: FAIL — `/report` is a 404.

- [ ] **Step 3: Implement the page**

`web/src/routes/report/+page.svelte`:
```svelte
<script lang="ts">
	import { CircleCheck, LocateFixed, PhoneCall } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { api } from '$lib/config';
	import { reportSeverityLabel, reportTypeLabel } from '$lib/labels';
	import { ms } from '$lib/motion';
	import { m } from '$lib/paraglide/messages.js';
	import { emptyForm, toReportInput, validateStep, type StepErrors } from '$lib/report';
	import { REPORT_SEVERITIES, REPORT_TYPES } from '$lib/types';

	let form = $state(emptyForm());
	let step = $state<1 | 2 | 3 | 'done'>(1);
	let errors = $state<StepErrors>({});
	let sending = $state(false);
	let failure = $state<'offline' | 'rejected' | null>(null);
	let gpsError = $state(false);

	const msg = (e: 'required' | 'short' | undefined) =>
		e === 'required' ? m.report_required() : e === 'short' ? m.report_description_short() : '';

	function next() {
		if (step !== 1 && step !== 2) return;
		errors = validateStep(step, form);
		if (Object.keys(errors).length === 0) step = step === 1 ? 2 : 3;
	}
	function back() {
		failure = null;
		if (step === 2) step = 1;
		else if (step === 3) step = 2;
	}
	function gps() {
		gpsError = false;
		if (!('geolocation' in navigator)) {
			gpsError = true;
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(p) => {
				form.lat = p.coords.latitude;
				form.lon = p.coords.longitude;
			},
			() => (gpsError = true),
			{ timeout: 10_000 }
		);
	}
	async function submit() {
		if (sending) return;
		sending = true;
		failure = null;
		const r = await api.submitReport(toReportInput(form));
		sending = false;
		if (r.ok) step = 'done';
		else failure = r.reason;
	}
	function again() {
		form = emptyForm();
		errors = {};
		step = 1;
	}
	const field = 'w-full rounded-md border border-ink bg-white px-3 py-2';
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.report_title()}</h1>
	<p class="mt-3 flex items-start gap-2 rounded-xl bg-alarm p-3 text-sm font-semibold text-white">
		<PhoneCall size={18} aria-hidden="true" class="mt-0.5 shrink-0" />{m.emergency_call_first()}
	</p>

	{#if step === 'done'}
		<section class="mt-8 flex flex-col items-center gap-3 text-center" in:fly={{ y: 12, duration: ms(220) }}>
			<CircleCheck size={48} aria-hidden="true" />
			<h2 class="text-xl font-bold">{m.report_done_title()}</h2>
			<p>{m.report_done_body()}</p>
			<button type="button" onclick={again} class="rounded-md border border-ink px-4 py-2 font-semibold">{m.report_again()}</button>
		</section>
	{:else}
		<p class="mt-4 font-mono text-xs text-muted">{m.report_step({ n: step })}</p>
		<form class="mt-2 flex flex-col gap-4" onsubmit={(e) => { e.preventDefault(); if (step === 3) submit(); else next(); }} novalidate>
			{#if step === 1}
				<fieldset>
					<legend class="font-semibold">{m.report_what()} — {m.report_type_label()}</legend>
					<div class="mt-2 grid grid-cols-2 gap-2">
						{#each REPORT_TYPES as t (t)}
							<label class="flex min-h-11 items-center gap-2 rounded-md border border-rule px-3 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper">
								<input type="radio" name="type" value={t} bind:group={form.type} class="accent-ink" />{reportTypeLabel(t)}
							</label>
						{/each}
					</div>
					{#if errors.type}<p class="mt-1 text-sm text-alarm" role="alert">{msg(errors.type)}</p>{/if}
				</fieldset>
				<fieldset>
					<legend class="font-semibold">{m.report_severity_label()}</legend>
					<div class="mt-2 grid grid-cols-2 gap-2">
						{#each REPORT_SEVERITIES as s (s)}
							<label class="flex min-h-11 items-center gap-2 rounded-md border border-rule px-3 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-paper">
								<input type="radio" name="severity" value={s} bind:group={form.severity} class="accent-ink" />{reportSeverityLabel(s)}
							</label>
						{/each}
					</div>
					{#if errors.severity}<p class="mt-1 text-sm text-alarm" role="alert">{msg(errors.severity)}</p>{/if}
				</fieldset>
				<label class="flex flex-col gap-1">
					<span class="font-semibold">{m.report_description_label()}</span>
					<textarea bind:value={form.description} rows="4" maxlength="2000" class={field}></textarea>
					{#if errors.description}<span class="text-sm text-alarm" role="alert">{msg(errors.description)}</span>{/if}
				</label>
			{:else if step === 2}
				<h2 class="font-semibold">{m.report_where()}</h2>
				<label class="flex flex-col gap-1">
					<span>{m.report_location_label()}</span>
					<input bind:value={form.place} maxlength="255" class={field} />
				</label>
				<button type="button" onclick={gps} class="inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-ink px-3 font-semibold">
					<LocateFixed size={16} aria-hidden="true" />{m.report_use_gps()}
				</button>
				{#if form.lat !== null && form.lon !== null}
					<p class="font-mono text-sm">{m.report_gps_set({ lat: form.lat.toFixed(4), lon: form.lon.toFixed(4) })}</p>
				{/if}
				{#if gpsError}<p class="text-sm text-alarm" role="status">{m.location_denied()}</p>{/if}
				{#if errors.place}<p class="text-sm text-alarm" role="alert">{msg(errors.place)}</p>{/if}
			{:else}
				<h2 class="font-semibold">{m.report_contact()}</h2>
				<p class="text-sm text-muted">{m.report_contact_note()}</p>
				<label class="flex flex-col gap-1"><span>{m.report_name()}</span><input bind:value={form.name} maxlength="100" autocomplete="name" class={field} /></label>
				<label class="flex flex-col gap-1"><span>{m.report_email()}</span><input type="email" bind:value={form.email} maxlength="100" autocomplete="email" class={field} /></label>
				<label class="flex flex-col gap-1"><span>{m.report_phone()}</span><input type="tel" bind:value={form.phone} maxlength="20" autocomplete="tel" class={field} /></label>
				{#if failure}
					<p class="rounded-md border border-alarm p-3 text-sm text-alarm" role="alert">
						{failure === 'offline' ? m.report_error_offline() : m.report_error_rejected()}
					</p>
				{/if}
			{/if}

			<div class="flex gap-2">
				{#if step !== 1}
					<button type="button" onclick={back} class="min-h-12 rounded-md border border-ink px-4 font-semibold">{m.report_back()}</button>
				{/if}
				{#if step === 3}
					<button type="submit" disabled={sending} class="min-h-12 flex-1 rounded-md bg-ink px-4 font-semibold text-paper disabled:opacity-60">
						{sending ? m.report_sending() : m.report_submit()}
					</button>
				{:else}
					<button type="submit" class="min-h-12 flex-1 rounded-md bg-ink px-4 font-semibold text-paper">{m.report_next()}</button>
				{/if}
			</div>
		</form>
	{/if}
</div>
```

- [ ] **Step 4: Run e2e**

Run: `npx playwright test tests/e2e/report.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/report web/tests/e2e/report.spec.ts
git commit -m "web: add three-step incident report with offline-safe submit"
```

---

### Task 14: Info and About

**Files:**
- Create: `web/src/routes/info/+page.svelte`, `web/tests/e2e/info.spec.ts`

**Interfaces:**
- Consumes: messages only, `ActionButton`, `SampleBadge`

- [ ] **Step 1: Write the failing e2e test**

`web/tests/e2e/info.spec.ts`:
```ts
import { expect, test } from './fixtures';

test('emergency numbers are tap-to-call', async ({ page }) => {
	await page.goto('/info');
	for (const n of ['1784', '1669', '191', '199']) {
		await expect(page.locator(`a[href="tel:${n}"]`)).toBeVisible();
	}
});

test('about section says what is real and what is sample', async ({ page }) => {
	await page.goto('/info');
	await expect(page.getByRole('heading', { name: 'About this demo' })).toBeVisible();
	await expect(page.getByText('Weather, air quality, river flow: Open-Meteo')).toBeVisible();
	await expect(page.getByText('Shelters and their capacity')).toBeVisible();
	await expect(page.getByText(/not an official service/)).toBeVisible();
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test tests/e2e/info.spec.ts`
Expected: FAIL — `/info` is a 404.

- [ ] **Step 3: Implement the page**

`web/src/routes/info/+page.svelte`:
```svelte
<script lang="ts">
	import { CloudSun, Phone, Route } from '@lucide/svelte';
	import ActionButton from '$lib/components/ActionButton.svelte';
	import SampleBadge from '$lib/components/SampleBadge.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';

	const numbers = [
		{ n: '1669', label: m.num_1669 },
		{ n: '191', label: m.num_191 },
		{ n: '199', label: m.num_199 },
		{ n: '1784', label: m.num_1784 }
	];
</script>

<div class="page">
	<h1 class="text-2xl font-bold">{m.info_title()}</h1>

	<h2 class="mt-6 text-sm font-bold tracking-wide uppercase">{m.info_numbers()}</h2>
	<ul class="mt-2 grid gap-2 sm:grid-cols-2">
		{#each numbers as x (x.n)}
			<li>
				<a href={`tel:${x.n}`} class="flex min-h-16 items-center gap-3 rounded-xl bg-ink px-4 text-paper">
					<Phone size={22} aria-hidden="true" />
					<span class="font-mono text-2xl font-medium">{x.n}</span>
					<span class="text-sm">{x.label()}</span>
				</a>
			</li>
		{/each}
	</ul>

	<h2 class="mt-8 text-sm font-bold tracking-wide uppercase">{m.info_more()}</h2>
	<div class="mt-2 grid gap-2 sm:grid-cols-2">
		<ActionButton href={localizeHref('/weather')} icon={CloudSun} label={m.home_weather()} />
		<ActionButton href={localizeHref('/evacuation')} icon={Route} label={m.home_evacuation()} />
	</div>

	<section id="about" class="mt-10 rounded-2xl border border-rule p-5">
		<h2 class="text-lg font-bold">{m.about_title()}</h2>
		<p class="mt-2">{m.about_intro()}</p>
		<h3 class="mt-4 font-semibold">{m.about_real()}</h3>
		<ul class="mt-1 list-disc pl-5 text-sm">
			<li>{m.about_real_weather()}</li>
			<li>{m.about_real_events()}</li>
			<li>{m.about_real_quakes()}</li>
			<li>{m.about_real_map()}</li>
		</ul>
		<h3 class="mt-4 flex items-center gap-2 font-semibold">{m.about_sample()} <SampleBadge /></h3>
		<ul class="mt-1 list-disc pl-5 text-sm">
			<li>{m.about_sample_shelters()}</li>
			<li>{m.about_sample_disasters()}</li>
			<li>{m.about_sample_routes()}</li>
		</ul>
		<p class="mt-4 text-sm">{m.about_reports()}</p>
		<p class="mt-2 text-sm text-muted">{m.about_th_note()}</p>
	</section>
</div>
```

- [ ] **Step 4: Run e2e**

Run: `npx playwright test tests/e2e/info.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/routes/info web/tests/e2e/info.spec.ts
git commit -m "web: add emergency info page and about-this-demo section"
```

---

### Task 15: Accessibility sweep, README honesty, final verification

**Files:**
- Create: `web/tests/e2e/a11y.spec.ts`
- Modify: `README.md` (repo root) — lines 8, 31–38, 48, 114–135, 238–240 as shown below

**Interfaces:**
- Consumes: all routes

- [ ] **Step 1: Write the accessibility test**

`web/tests/e2e/a11y.spec.ts`:
```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

for (const path of ['/', '/disasters', '/shelters', '/evacuation', '/weather', '/report', '/info', '/th']) {
	test(`no serious accessibility violations on ${path}`, async ({ page }) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
		const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
	});
}
```

- [ ] **Step 2: Run it and fix real problems**

Run: `npx playwright test tests/e2e/a11y.spec.ts`
Expected: PASS. If it fails, fix the cause in the component it names (typical: `color-contrast` on `text-muted` over glass → use `text-ink`; missing accessible name → add `aria-label` from a message). Do not disable axe rules. Re-run until green.

- [ ] **Step 3: Update the README claims**

In `README.md` (repo root):

Replace line 8:
```markdown
![DEMS](https://img.shields.io/badge/Status-Production%20Ready-green)
```
with:
```markdown
![DEMS](https://img.shields.io/badge/Status-Student%20demo-blue)
```

Replace the "For Citizens" list (lines 32–38):
```markdown
- 🔥 **Real-time Disaster Tracking** - View active disasters on interactive maps
- 🏠 **Emergency Shelter Finder** - Locate nearest safe shelters with capacity info
- 🚗 **Evacuation Planning** - AI-powered route planning to avoid danger zones
- 🌤️ **Weather Monitoring** - 5-day forecasts and severe weather alerts
- 📍 **Disaster Reporting** - Submit reports with photos and location
- 👥 **Volunteer Portal** - Register to help during emergencies
- 🤖 **AI Assistant** - 24/7 chatbot for emergency guidance
```
with:
```markdown
- **Hazard map** - live GDACS disaster alerts and USGS earthquakes, plus sample disasters from the demo database
- **Shelter finder** - sample shelters sorted by distance, with directions handed off to your phone's maps app
- **Evacuation** - nearest open shelters and sample evacuation routes (no automatic route planning)
- **Weather** - live forecast, PM2.5 air quality and river-flow model data from Open-Meteo
- **Incident reporting** - three-step report with optional GPS location
- **Volunteer portal** - register to help during emergencies
- **English / Thai** - full language switch (Thai copy awaiting native review)
- **Assistant** - placeholder; an offline, on-device assistant is planned
```

After the "For Administrators" list (after line 48, before the next `---` or heading), insert:
```markdown

### What's real vs sample

| Data | Where it comes from |
|---|---|
| Weather, air quality, river flow | Open-Meteo (live) |
| Disaster alerts | GDACS (live) |
| Earthquakes | USGS (live) |
| Shelters, disasters, alerts, evacuation routes, volunteers, supplies | Demo MySQL database (sample data, marked **SAMPLE** in the UI) |
| Admin login | Hard-coded demo credentials (`admin` / `admin123`); not real security |

The new citizen UI lives in `web/` (SvelteKit). The old Next.js UI in `frontend/` is kept until the redesign is complete.
```

Replace the Backend line:
```markdown
- **Weather API**: OpenWeatherMap
```
with:
```markdown
- **Weather**: `/api/weather` returns mock data; the new UI uses Open-Meteo directly
```

Replace the two lines:
```markdown
- **AI Chatbot**: Context-aware assistance
- **Real-time Updates**: Auto-refresh every 30s
```
with:
```markdown
- **Assistant**: placeholder only (the old keyword-matching chatbot is not AI)
- **Live data**: public hazard sources fetched on page load
```

Replace the roadmap line:
```markdown
- [ ] AI Disaster Prediction
```
with:
```markdown
- [ ] Offline on-device emergency assistant (WebLLM + retrieval)
```

Also change `- [ ] Multi-language Support (Thai/English)` to `- [x] Multi-language Support (Thai/English)`.

- [ ] **Step 4: Full verification**

Run, from `web/`:
```bash
npm run check
npm test
npx playwright test
```
Expected: `svelte-check found 0 errors and 0 warnings`; all Vitest files PASS; all Playwright tests PASS.

Then check by eye with the real backend running (`cd backend && node server-disaster.js` in another terminal) and `npm run dev`:
- `http://localhost:3001` at 375px wide: no offline banner; sample alert, nearest shelter distance, live conditions.
- Stop the backend and reload: offline banner appears; shelters still listed.
- `http://localhost:3001/th`: Thai labels everywhere except database text.
- Grep for forbidden words in the new UI: `grep -rniE "\bAI\b|smart|intelligen" src messages` → no matches.

- [ ] **Step 5: Commit**

```bash
git add web/tests/e2e/a11y.spec.ts README.md
git commit -m "web: add accessibility checks; make README claims match the code"
```

---

## Spec coverage notes (deviations, decided while planning)

- **Photo upload** (spec §7 Report) is **not** in Phase 1: `POST /api/reports` has no photo field and Phase 1 does not change the backend. Add it with the backend phase.
- **`GlassPanel` component** is replaced by the `.glass` CSS class (no behaviour, so no component).
- **shadcn-svelte / vaul-svelte** are not used in Phase 1: Bits UI `Dialog` covers sheets, and `vaul-svelte` for Svelte 5 is still a stale pre-release (`1.0.0-next.7`, last published 2025-03), so the bottom sheet is ~80 lines in `BottomSheet.svelte` with a tested snap function. shadcn-svelte can be added in Phase 2 when admin tables and forms need it.
- **SvelteKit 2** is pinned even though 3.0 is out (spec says 2; matches the Model Lab repo; 3.0 is days old).
- **Adapter:** `adapter-auto` instead of `adapter-vercel` (same result on Vercel; `adapter-vercel` cannot build on Windows without symlink rights).
- **Province picker** lists the 27 provinces present in the demo database's `ThailandLocations` table, not all 77.
- **Shelter "Call" button** omitted: all shelter phones are scrubbed sample numbers, so a call button would dial a fake number.
