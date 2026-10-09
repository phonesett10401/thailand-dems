# Thailand DEMS — UI Redesign Design

Date: 2026-10-09 · Status: approved in conversation, awaiting written-spec review

## 1. Purpose

Rebuild the DEMS frontend so it works as a believable public emergency tool **and** as an honest portfolio piece: built like a real product, openly presented as a student demo. Success means:

- A citizen on a phone reaches "nearest shelter" or "report incident" without logging in, in English or Thai.
- Nothing in the UI or README claims more than the code does. Every sample value is labelled; every live value names its source and time.
- Admin pages are clearly a separate, denser console.
- The future in-browser assistant (WebLLM + RAG from the Model Lab repo) has a clean slot to drop into.

## 2. Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Goal | Both: real-feeling public tool, openly a demo |
| Language | English default, full TH/EN toggle |
| Auth | Citizen pages public; admin keeps the hard-coded demo login, labelled as such |
| Citizen look | **A · Civic Signal** + glass over the map |
| Admin look | **B · Night Ops** + smoked glass over the map |
| Neumorphism | Not used (fails contrast) |
| Framework | **SvelteKit 2 + Svelte 5 + TypeScript**, new app in `web/`, old `frontend/` kept until cutover |
| Data | Real hazard data from keyless public sources; own-DB data tagged SAMPLE; bundled sample fallback when the backend is down |
| Phases | 1 foundation + citizen core · 2 admin · 3 volunteer |

## 3. Stack (`web/`)

- SvelteKit 2, Svelte 5 runes, TypeScript, Vite. Vercel adapter.
- Tailwind v4, tokens as CSS variables.
- shadcn-svelte / Bits UI (Dialog, Select, Tabs, Toast, Table, Dropdown); vaul-svelte (bottom sheet / side sheet).
- Motion: built-in `svelte/transition`, `svelte/animate`, `svelte/motion`. No animation library.
- Map: `svelte-maplibre` + OpenFreeMap vector tiles (no key). Light style for citizen, dark for admin.
- i18n: Paraglide (`/` English, `/th/...` Thai).
- Fonts (Fontsource, self-hosted): IBM Plex Sans Thai + IBM Plex Mono (citizen); Bai Jamjuree + JetBrains Mono (admin). All cover Thai script.
- Icons: `@lucide/svelte`. **No emoji in UI.**
- Exact versions are verified for compatibility at the start of Phase 1, not assumed.

## 4. Visual system

### Tokens
- `theme-civic` (citizen): paper `#f6f4ef`, ink `#141414`, alarm `#d7261e`, caution `#e8a317`, rule `#d8d3c8`, muted `#555`.
- `theme-ops` (admin): charcoal `#121417`, surface `#1c1f24`, line `#2a2d33`, amber `#f2a33a`, alarm `#d7261e`, text `#e8e6e1`, muted `#8d8a84`.
- Root layout applies `theme-ops` under `/admin/*`, `theme-civic` everywhere else.
- Severity colours are defined once (one mapping module) and reused by every page, replacing the per-page `getSeverityColor` copies.

### Glass rules
- Glass only on surfaces floating over the map: top bar, bottom sheet, admin overlay panels.
- Everything else is solid. Alerts and primary buttons are **always solid**, so contrast never depends on what is behind them.
- Blur is dropped under `prefers-reduced-transparency` or when `backdrop-filter` is unsupported (solid fallback colour).

### Motion rules
- Allowed: sheet springs, alert slide-in, list stagger, `animate:flip` on filter, map fly-to, one-time number count-up on admin overview.
- Not allowed: looping decorations, floating blobs, hover scale on cards, pulsing (except a single amber dot on a brand-new admin report).
- Everything respects `prefers-reduced-motion` (transitions become instant).

### Accessibility
- WCAG AA contrast in both themes; touch targets ≥ 44px; visible focus rings; all icons have labels; forms have real `<label>`s.

## 5. Honesty rules (apply to every phase)

1. Data from the project's own MySQL DB carries a visible **SAMPLE** tag on the component showing it, not just in a footer.
2. Data from a public source shows `Source · updated HH:MM` on its card.
3. No "AI", "smart" or "intelligent" wording anywhere. Renames: Resource Intelligence → **Capacity planning**; Smart Recommendations → **Rule-based suggestions**.
4. Evacuation "route planning" is not presented as computed routing. Routes are SAMPLE; real directions are handed off to the phone's maps app.
5. Admin login states on screen that the credentials are public and it is a client-side demo gate, not security.
6. When the backend is unreachable: page-wide banner "Showing sample data: backend offline", admin writes disabled with an explanation, no fake success toasts.
7. README drops "Production Ready", "AI-powered", "24/7 AI Assistant" and gains a "What's real vs sample" table (end of Phase 1).
8. An "About this demo" page lists every data source and what is real vs sample.

## 6. Data layer (`web/src/lib/`)

- `api.ts` — fetch wrapper for the existing Express API, base URL from `PUBLIC_API_URL` (fixes the hard-coded `http://localhost:5000/api` in `frontend/lib/api.js`). Same endpoints as today.
- `sources/openmeteo.ts` — forecast (24 h + 7 day), air quality (PM2.5), river flood (GloFAS). No key.
- `sources/usgs.ts` — earthquakes near Thailand (GeoJSON feed). No key.
- `sources/gdacs.ts` — global disaster alerts filtered to Thailand (ISO3 `THA`). Browser access (CORS) to be verified in Phase 1; if blocked, this source moves to a backend proxy route and is out of Phase 1.
- Every source returns `{ data, source, updatedAt }`.
- `sample/*.json` — generated once from the local DB by a script (`web/scripts/export-sample.ts`). The script **replaces all names, emails and phone numbers with obviously fake values** and drops test records (e.g. "2nd Test"). Used when `api.ts` cannot reach the backend.
- Location: asked once; on refusal the user picks a province. Coordinates never leave the device except as Open-Meteo query parameters.
- Not in this redesign (backend phase, later): TMD warnings/forecast proxy (`TMD_NWP_TOKEN`), NASA FIRMS hotspots (`FIRMS_MAP_KEY`). Both keys live only in `backend/.env`.

## 7. Phase 1 — foundation + citizen core (theme A)

### Shell
- Phone: glass top bar (logo, EN | ไทย, Assistant button) + bottom tab bar **Home · Map · Shelters · Report · Info**.
- Desktop: same items in the top bar.
- No login anywhere on citizen routes.

### Pages
- **Home `/`** — full-screen map (GDACS + USGS events, SAMPLE shelters). Solid red alert banner for the nearest active alert, or "No active warnings near you". Vaul bottom sheet:
  - collapsed: "Find nearest shelter · X km" (primary), Evacuation, Report, Weather;
  - half: PM2.5, rain, flood-risk cards;
  - full: nearby events list.
- **Map `/disasters`** — real GDACS/USGS events and DB disasters (SAMPLE) in separate groups; list ↔ map; filter by type/severity; row opens a detail sheet.
- **Shelters `/shelters`** — list ↔ map sorted by distance; capacity bar; "Directions" opens Google/Apple Maps; all SAMPLE.
- **Evacuation `/evacuation`** — DB zones/routes as SAMPLE + "Get directions to shelter" hand-off. Reached from Home and Info.
- **Weather `/weather`** — Open-Meteo forecast, air quality, flood risk; fully live, source + time on each card. Reached from Home and Info.
- **Report `/report`** — 3 steps: what happened → where (map pin / GPS) → optional photo + contact → done. Posts to existing `/api/reports`; clear error if backend is down.
- **Info `/info`** — tap-to-call emergency numbers (1784 DDPM, 1669 ambulance, 191 police, 199 fire), links to Weather/Evacuation, "About this demo".

### i18n
- `messages/en.json`, `messages/th.json`; no hard-coded UI strings in components.
- Thai strings drafted by Claude, listed in `web/messages/TH_REVIEW.md` for native review.
- Thai dates use Buddhist-era years (`th-TH-u-ca-buddhist`).

### Assistant slot
- "Assistant" button in both shells opens `AssistantSheet.svelte`: "Coming soon: an offline emergency-information assistant." No chat UI, no keyword bot. This file is the single replacement point for the future WebLLM/RAG assistant (Model Lab `src/lib/assistant/`).

### Shared components (kit)
`Shell`, `GlassPanel`, `AlertBanner`, `ActionButton`, `StatusPill`, `SampleBadge`, `SourceStamp`, `OfflineBanner`, `Sheet`, `EmptyState`, `MapView`, `LangToggle`, `AssistantSheet`. Each in its own file with one purpose.

## 8. Phase 2 — admin (theme B)

- **Login `/admin/login`** — single dark card with permanent amber notice: demo credentials `admin` / `admin123`, client-side demo gate, not security. Guard lives once in `/admin/+layout.ts`.
- **Shell** — desktop left sidebar grouped by task:
  - Overview
  - Incidents: Disasters, Alerts, Citizen reports
  - Resources: Shelters, Supplies, Volunteers, Agencies
  - Response: Escalation tiers, Capacity planning
  - Phone: sidebar in a sheet. Top bar: "DEMS / ADMIN", DEMO MODE chip, EN/TH, live/sample indicator, log out.
- `/supplies` and `/volunteers` move to `/admin/supplies`, `/admin/volunteers`.
- **Overview `/admin`** — dark map full-bleed, smoked-glass panels: active incidents, shelter load %, volunteers deployed, incoming reports feed (click → fly to).
- **List pages** — one pattern: dense table, filter bar, status pills; create/edit in a right-side sheet (replaces `/admin/disasters/create` page); delete confirm dialog naming the item.
- **Agency detail** — full page with tabs: Profile, Resources, MOU, Activation history.
- **Tiers** — stepped 1–4 indicator, escalation timeline, deployments table.
- **Capacity planning** — current resource-intelligence data, relabelled per §5.

## 9. Phase 3 — volunteer

- `volunteer-portal` and `volunteer-dashboard` rebuilt in theme A with the same kit; existing volunteer-auth API unchanged. Detailed screen design is done at the start of Phase 3 (short in-chat design), since it reuses the Phase 1 kit.

## 10. Testing

- `svelte-check` (types) on every change.
- Vitest for logic: distance sort, severity mapping, sample fallback in `api.ts`, scrubbing in `export-sample.ts`, source parsers.
- Playwright on a phone viewport: Home renders in EN and TH; offline banner appears when the API is down; Report flow reaches the done screen against a running backend; `@axe-core/playwright` reports no serious violations on each citizen page.
- Phase 2 adds: admin guard redirects, writes disabled when offline.

## 11. Deploy and cutover

- Old `frontend/` keeps deploying unchanged during all phases.
- `web/` uses the SvelteKit Vercel adapter. After Phase 3, one commit deletes `frontend/` and points `vercel.json` at `web/`.
- Work stays on the feature branch; **owner approval required before any push to `main`** (it may deploy).
- No secrets in the repo; `web/.env.example` documents `PUBLIC_API_URL` only.
- Commits carry no Claude attribution lines (owner rule).

## 12. Out of scope

- Real authentication (backend).
- TMD and FIRMS integrations (backend proxy, later).
- PWA / offline caching.
- The WebLLM/RAG assistant itself.
- Backend changes (none are needed for Phases 1–3).
- Fixing the `DROP DATABASE` in `schema-disaster.sql` or consolidating the conflicting setup docs (worth a separate task).

## 13. Risks

- **GDACS browser access** may be blocked (CORS) → fallback: drop from Phase 1, add via backend later.
- **Thai copy quality** depends on native review.
- **Blur performance** on low-end Android → solid fallback rule in §4.
- **Library versions** (shadcn-svelte, vaul-svelte, svelte-maplibre vs Svelte 5 / Tailwind 4) → verified at Phase 1 start; substitute Bits UI primitives if a wrapper lags.
