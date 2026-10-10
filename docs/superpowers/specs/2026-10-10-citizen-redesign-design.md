# Citizen redesign: design spec (Spec 1 of 2)

**Date:** 2026-10-10 · **Branch:** `redesign/citizen` (from `main`) · **Status:** draft for owner review
**Follows:** `2026-10-09-ui-redesign-design.md` (Phase 1 citizen UI) and `2026-10-10-supabase-backend-design.md`
**Next:** Spec 2, the demo page with a Remotion video (public plus teachers), built on this design system.
**Mockups:** `2026-10-10-citizen-redesign/` beside this file: `style-emergency.html` (phone, all levels), `style-desktop.html` (desktop dashboard), `logo-d-levels.html` (logo states). Open them in a browser.

## 1. Why

The owner finds the current app confusing and dated.
- Home and Map are both maps, and nothing says how they differ.
- The home panel crams every feature into one column.
- SAMPLE badges are everywhere.
- IBM Plex with hard black buttons looks old.

Goals, in priority order:
1. **"Am I safe right now?"** is answered in the first 5 seconds.
2. **"Where do I go?"** is one tap away, with our own route guide.
3. **Prepare and learn** gets its own section.

The app must cover **every hazard Thailand faces**, not only floods. It must work as a **phone app and as a desktop dashboard**, and look like a modern emergency service: dark, glassy, urgent when it needs to be.

**Approach:** rebuild inside the existing `web/` app on a branch, keeping the backend, feeds, i18n, map engine, tests and CI. Every visible part (screens, components, styles, logo, navigation) is replaced, not reskinned. It ships to `main` in one release.

## 2. Design system

### 2.1 Theme and colour tokens
Dark only for this version. Tokens live in Tailwind v4 `@theme` and replace the paper/ink tokens.

| Token | Value | Use |
|---|---|---|
| `bg` | `#0a0a0c` | page |
| `surface` | `rgb(255 255 255 / .05)` + `backdrop-filter: blur(20px)` + 1px `rgb(255 255 255 / .09)` border | glass: bars, cards, sheets, popups |
| `text` / `muted` | `#f2f2f4` / `#9a9aa0` | text |
| `safe` | `#30d158` | level Safe |
| `watch` | `#ffb020` | level Watch |
| `warning` | `#ff453a` | level Warning, SOS, brand arc |
| `unknown` | `#6b6b72` | level Unknown (no data) |
| `info` | `#0a84ff` | your location, links, rain radar, route line |

Glass is used only on floating things: the top bar, tab bar, cards over the map, sheets, popups and the level "sky". Lists and long text sit on plain `bg`.

### 2.2 Levels
There are **three levels plus Unknown**: Safe, Watch, Warning, Unknown. They replace the current `info | watch | warning | danger`.
- "Evacuate" is not a level. It is an instruction shown inside a Warning ("Leave now").
- A level is never shown by colour alone: it always has a word and an icon shape (● Safe/Watch, ▲ Warning, ? Unknown).
- At Warning, the logo arc and the level badge pulse slowly (1.4 s). The pulse is off under `prefers-reduced-motion`.
- The **sky**, a radial glow behind the status, takes the level colour. This applies on the phone home screen and the desktop left panel.

### 2.3 Typography
- **Geist** for Latin text, **Anuphan** for Thai, **Geist Mono** for numbers, times and labels. All are self-hosted through Fontsource, replacing IBM Plex.
- Headlines are weight 800 with `letter-spacing: -0.035em`.
- Labels are mono, uppercase, `letter-spacing: .08em`.

### 2.4 Logo: D "signal shield"
The mark is a white shield outline with a white person inside and an **arc above the person in the live level colour**. The SVG is in `logo-d-levels.html`.

Rules:
- **Shield and person:** never recoloured. They are white on dark and `#141416` on light browser tabs, through `prefers-color-scheme` inside the SVG favicon.
- **In the app:** a `Logo` component takes `level`. The browser-tab favicon is regenerated as an SVG data URL whenever the level changes.
- **Static places:** apple-touch-icon (180 px PNG, full-bleed dark tile, iOS rounds it), link previews and the demo page use a **red arc**.
- **Wordmark:** "DEMS" in Geist 700, with a mono `LIVE` dot beside it in the top bar.
- **Cleanup:** remove the current `favicon.svg` placeholder. The shield commit `fb5dce6` stays on its old branch and is not merged.

### 2.5 Motion
- Transitions take 150 to 250 ms with ease-out.
- A level change cross-fades the sky colour over 600 ms.
- The route line draws itself (stroke-dashoffset).
- Sheets slide up.
- Under `prefers-reduced-motion`, all of this is instant and nothing pulses.

### 2.6 Accessibility
- Text meets WCAG AA on `bg` and on glass.
- Tap targets are at least 44 px.
- Focus rings are visible.
- Each level has its word and icon, not only a colour.
- SOS is a real `<a href="tel:1784">`.
- Every map popup's content is also reachable in a list (the Now hazard list and the Map hazard list).

## 3. Navigation and screens

### 3.1 Shell (every page)
**Top bar:**
- logo with the live arc, plus `LIVE`
- location picker ("Chiang Mai ▾": use my location, or pick a province; remembered in localStorage)
- **Demo** chip, which opens About & data
- desktop only: search (`/` focuses it; places and shelters), tabs, EN/ไทย
- **SOS · 1784** button

**Phone tab bar:** Now · Map · Shelters · Prepare · More, with lucide icons. On desktop the tabs sit in the top bar, and More is a menu.

The header **Assistant** button is removed. Its slot moves into More as "Ask DEMS (coming soon)".

### 3.2 Tabs: one question each

| Tab | Route | Question | Phone | Desktop |
|---|---|---|---|---|
| Now | `/` | Am I safe where I am? | level sky, headline, hazard list, condition tiles, nearest-shelter button, "Report something" link | **dashboard**: left = phone content; right = map; bottom row = nearest shelters with fill bars, 24 h forecast of the worst hazard, timeline of today's changes |
| Map | `/map` | What is happening anywhere? | full-screen map, layer chips (each hazard type, rain radar, shelters, evacuation routes), tap → bottom sheet, floating Report button | map plus a left list of all hazards with filters |
| Shelters | `/shelters` | Where do I go? | list by distance, filters (open, has space, medical, pets, clean air) → detail sheet → **Route** | list left, map right |
| Prepare | `/prepare`, `/prepare/[hazard]` | How do I get ready? | hazard guide cards, go-bag checklist, emergency numbers | guide list left, content right |
| More | `/more` | everything else | Report an incident, Language, About & data, Demo (Spec 2), Staff sign-in, Ask DEMS (coming soon) | top-bar menu |

**Other routes:**
- `/report`: 3 steps (what, where, details). The fields and API stay as they are.
- `/about`: About & data.
- `/route`: the route guide (§5).

**Redirects (308):**
- `/disasters` → `/map`
- `/info` → `/about`
- `/weather` → `/`
- `/evacuation` → `/map?layer=routes`

Thai stays under `/th/...`. The `/admin` and `/volunteer` routes are untouched, except that they use the new tokens.

### 3.3 Now: content
1. **Where:** "Chiang Mai · your location", plus "updated 1 min ago".
2. **Level badge and headline,** written from the active hazards:
   - "No warnings near you"
   - "Flood watch 8 km away"
   - "Smoke, heat and a quake"
   - at Warning with an evacuation instruction: "Leave now. Flooding in your area."
3. **A one-line reason,** plus the guidance line: "DEMS estimate from public data. Official warnings: TMD / DDPM."
4. **Level scale:** three segments.
5. **Hazard list,** worst first. Each row has a code chip, a name, a one-line instruction and its level. Hazard types with no risk show as one greyed row ("Flood · Storm · Landslide: no risk here right now").
6. **At Warning, 3 numbered steps** specific to the hazard.
7. **Condition tiles:** rain 24 h, air PM2.5, river, quakes.
8. **Nearest shelter button.** At Warning it turns red: "Go to shelter now". It opens the route guide.

### 3.4 Hazard detail (sheet on phone, side panel on desktop)
- what it is, and its level
- what to do now: 3 steps, the first three **Before** items of the hazard's guide at Watch, the first three **During** items at Warning
- source and age, e.g. "Open-Meteo · 2 min ago"
- distance from you
- link to `/prepare/[hazard]`

### 3.5 Prepare: content
- **Hazard guides**, each with Before / During / After lists, for: flood, flash flood, storm, wildfire smoke and haze, extreme heat, earthquake, tsunami, landslide, drought, chemical incident. Guide text lives in `web/src/lib/prepare/guides.ts`, keyed by locale (EN plus a Thai draft), because these are long lists rather than UI strings.
- **Go-bag checklist:** about 15 items you can tick, saved in localStorage, with a count of how many are ready. A reset button clears it.
- **Emergency numbers,** each a tap-to-call `tel:` link:

| Number | Service |
|---|---|
| 1784 | DDPM disaster hotline |
| 1669 | medical emergency |
| 191 | police |
| 199 | fire |
| 1155 | tourist police |
| 1182 | TMD weather |

## 4. Data and honesty

### 4.1 Sources
**Live feeds:** Open-Meteo (forecast, air quality, flood/river model), USGS (earthquakes), GDACS (storms, floods, wildfires, droughts, tsunamis, volcanoes).
- They are shown with **source and age**.
- The Open-Meteo forecast request gains `apparent_temperature_max` (daily) for heat.

**Sample data:** shelters, evacuation routes, and the disasters and alerts in Supabase.
- Each sample item carries a small **"Sample"** tag.
- The top-bar **Demo** chip replaces the SAMPLE badges on every screen. It opens `/about`, which lists every source and says what is sample.

### 4.2 Level rules
`web/src/lib/levels.ts` is pure and fully unit-tested. It replaces `severity.ts`.

| Hazard | Watch | Warning | Basis |
|---|---|---|---|
| PM2.5 (current) | > 37.5 µg/m³ | > 75 µg/m³ | Thai PCD bands |
| Heat (feels-like daily max) | ≥ 41 °C | ≥ 54 °C | Thai heat-index danger bands |
| Rain (today's sum) | ≥ 35 mm | ≥ 90 mm | TMD heavy / very heavy |
| Earthquake (last 24 h) | M ≥ 4.5 within 300 km | M ≥ 6.0 within 300 km | USGS |
| GDACS events (storm, flood, wildfire, drought, tsunami, volcano) | orange within the radius | red within the radius | GDACS alert level; radius 300 km (cyclone 500 km) |
| River model | rising and peak ≥ 1.5 × today | never | model, not a measurement |
| DB disasters and alerts (sample; Active, within 100 km; an alert takes its disaster's position) | Severity Moderate/Severe or Warning | Critical, Emergency or Catastrophic | existing columns. **Listed with a Sample tag but never counted in the overall level**, so fake data never tells anyone to leave |

GDACS green events are listed as information at level Safe.

**Overall level** is the worst of the **live** hazards.

**Unknown:** if every feed fails, or the data is older than 3 hours, the level is **Unknown** (grey, "last checked HH:MM"). Unknown is never shown as Safe. If only some feeds fail, the level is computed from what loaded, and the failed sources are listed: "Air quality unavailable".

### 4.3 Safety copy
- **First visit,** one time, dismissed state in localStorage: "DEMS is a student project. Levels are estimates from public data, not official warnings. Follow TMD and DDPM instructions. In an emergency call 1784."
- **Under every level:** the guidance line from §3.3.
- **`/about`:** the full source list, thresholds (the table above in plain words), what is sample, and the project's limits.

## 5. Route guide (our own, instead of Google Maps)

### 5.1 Engine
Routing uses **OpenRouteService (ORS)** through a server route, so the key never reaches the browser.
- **Why ORS:** a free plan (about 2,000 directions a day), OpenStreetMap data, walking, driving and cycling profiles, and **`avoid_polygons`**, which routes around hazard zones. No other free engine offers that.
- **Endpoint:** `POST /api/route` with `{ from: Pt, to: Pt, mode: 'foot' | 'car' | 'bike', avoid: Zone[] }`. It calls ORS `/v2/directions/{profile}/geojson` and returns the line, distance, duration and steps.
- **Validation:**
  - points must be inside a Thailand bounding box
  - at most 10 avoid zones
  - each zone is a circle of radius ≤ 15 km, turned into a 16-point polygon on the server
- **Avoid zones:** Warning-level hazards that block roads (flood, storm, tsunami, landslide, wildfire, chemical), sent as circles. Smoke, heat and quakes do not block roads.
- **If ORS rejects the avoid polygons:** retry without them, and the UI says "Couldn't route around hazard zones. Check conditions on the way."
- **Limits:**
  - per-IP limit of 30 requests per 10 minutes, through the existing `reserve_report_slot` mechanism with the hash prefixed `route:` so it is a separate bucket
  - an in-memory cache keyed by the rounded points, mode and zones, for 10 minutes
- **Secret:** `ORS_API_KEY` in `web/.env` and Vercel env. The owner signs up at openrouteservice.org.
- **Failure:** ORS down or over quota returns 503. The UI then shows the straight-line distance and compass direction to the shelter, plus a small "Open in Google Maps" fallback link.

### 5.2 Screen `/route?to=shelter:<id>` (or `to=lat,lon`)
- **Map:** the route line in `info` blue, drawn in. Avoided zones are shaded in their level colour. Markers for start and shelter.
- **Summary card:** destination, distance, time, mode switch (walk, drive, bike), and "avoids 2 hazard zones" when it applies.
- **Steps list:** turn-by-turn text. Instructions are **built by us from ORS step `type` codes plus street names** through Paraglide, because ORS has no Thai language.
- **Start:** follows your GPS position (`watchPosition`) and highlights the current step. Off route by more than 50 m shows "Recalculate". There is no voice guidance in this version.
- **Phone:** map on top, collapsible sheet with the steps. **Desktop:** steps on the left, map on the right.

### 5.3 Entry points
- the nearest-shelter button on Now (and "Go to shelter now" at Warning)
- the Route button in the shelter detail
- the shelter popup on Map

## 6. Components and files (target)

**New:**
- `lib/levels.ts`
- `lib/zones.ts` (circle to polygon, which hazards block roads)
- `lib/route.ts` (client call and step-text builder)
- `routes/api/route/+server.ts`
- `lib/components/`:
  - shell: `Logo`, `TopBar`, `TabBar`, `SosButton`, `DemoChip`
  - status: `LevelBadge`, `LevelScale`, `Sky`
  - content: `HazardList`, `HazardSheet`, `ConditionTiles`, `ShelterCard`, `ShelterFilters`
  - route: `RouteSummary`, `RouteSteps`
  - prepare: `Checklist`, `NumberList`
  - other: `FirstVisitNote`, `GlassCard`
- new route folders: `map`, `prepare`, `more`, `about`, `route`

**Removed:**
- `AlertBanner`, `StatusPill`, `SampleBadge`, `ActionButton`, `AssistantSheet` (its slot is in More), `OfflineBanner` (replaced by Unknown plus the source list)
- `severity.ts`
- the old `disasters/`, `info/`, `weather/` and `evacuation/` pages, which become redirects

**Kept or adapted:**
- kept: `api.ts`, `config.ts`, `sources/*`, `geo.ts`, `format.ts`, `location.svelte.ts`, `status.svelte.ts`, `MapView` (restyled with a dark basemap), `BottomSheet` and `Sheet` (restyled), `LocationPicker`, `LangToggle`, `LoginForm`, and everything in `lib/server`
- **Dark map:** OpenFreeMap's dark style (the same provider as now, no key needed).

## 7. Build order

Each stage ends with `npm run check` and `npm test` green, and a push to the branch, which gives a Vercel preview link.

1. **Foundation:** tokens, fonts, `Logo` and the dynamic favicon, `levels.ts` with tests, the shell (top bar, tab bar, SOS, location, Demo chip), redirects.
2. **Now:** the phone screen and the desktop dashboard, plus the hazard sheet.
3. **Map:** dark basemap, layer chips, sheets, desktop list.
4. **Shelters:** list, filters, detail.
5. **Route guide:** the `/api/route` proxy, zones, the route screen, step text in EN/TH.
6. **Prepare:** guides, checklist, numbers.
7. **Report (3 steps), More, About, first-visit note.**
8. **Cleanup:** delete the old components, add the new Thai strings to `messages/TH_REVIEW.md`, then a final whole-branch review.

## 8. Testing

**Unit tests (Vitest):**
- `levels.ts`: every threshold at the edge (e.g. PM2.5 37.5 → Safe, 37.6 → Watch, 75.1 → Warning); the worst wins; all feeds failed → Unknown; data older than 3 h → Unknown; partial failure is listed; the river never reaches Warning; GDACS green → Safe.
- `zones.ts`: polygon closed and sized right; only road-blocking hazards become zones; at most 10.
- Route step text: every ORS type code has an EN and a TH string.
- `/api/route`: rejects points outside Thailand and too many or too-large zones; 429 over the limit; 503 when ORS fails; retries without avoid when ORS rejects polygons (mocked fetch).

**Browser tests (Playwright),** with fixtures that mock feeds and `/api/*`:
- every tab at 375 px and at 1440 px
- feeds down → grey Unknown with "last checked"
- a Warning fixture → red sky, pulsing badge, "Go to shelter now"
- reduced motion → no pulse
- SOS has `href="tel:1784"`
- old URLs redirect
- the report flow submits
- `/th/` pages render in Thai
- the checklist survives a reload
- the route screen shows steps from a mocked `/api/route`, and its fallback when the mock returns 503

**Visual check:** screenshots of each screen at both widths, compared with the mockups.

## 9. Release

- Pushes to `redesign/citizen` deploy as Vercel previews, so the owner tests on a real phone.
- **The owner adds `ORS_API_KEY`** to Vercel (Production and Preview) before stage 5 is tested.
- Merge to `main` only with the owner's explicit permission. It goes live in one switch. Vercel instant rollback is the undo.

## 10. Out of scope
- Spec 2: the demo page and Remotion video.
- Phase 2: the admin console, admin-published official alerts that override our estimates, and the assistant.
- Not in this version: light mode, push notifications, photo uploads in reports, voice navigation, offline routing.
