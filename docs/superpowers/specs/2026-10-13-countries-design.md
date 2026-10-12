# Countries: Thailand, Myanmar, Sweden, plus Burmese (Spec 3)

Date: 2026-10-13 · Status: design approved in chat, awaiting written-spec review

## Goal

DEMS works for **Thailand, Myanmar and Sweden**. Users pick a country from a chooser on the More page. Language is chosen separately: **English, ไทย and မြန်မာ (Burmese) all work in every country**. The main reason for this: millions of Myanmar people live in Thailand. It ships as **one release**: one spec, one plan, one PR.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Country choice | A **Country** row on More. It is remembered in localStorage and defaults to Thailand. If GPS places the user in another supported country, a banner offers to switch (it never switches on its own). |
| Languages | EN / TH / MY, independent of country. Sweden needs no Swedish. Burmese is AI-drafted, then **checked by the owner before merge** (`MY_REVIEW.md`). Thai stays as it is (`TH_REVIEW.md`). |
| Shelters | Thailand: **sample**, labelled more clearly, because Thailand publishes no public shelter list. Myanmar: **in development**. Sweden: **link to MSB's official shelter map**, because no open MSB dataset was found. If MSB publishes one later, load it as real data. |
| Sweden weather | **SMHI's own official warnings decide every weather level in Sweden** (yellow → Watch, orange/red → Warning, labelled "Official: SMHI"). DEMS's own weather thresholds (heat, rain, river) are **not used** in Sweden; only air (WHO), quakes (USGS) and GDACS stay DEMS rules there. |
| Name | "DEMS". The header shows the flag plus the place. The domain is unchanged. |
| Demo video | Unchanged (Thailand example). The page says it shows Thailand. |

## 1. Architecture

### Country files
`web/src/lib/countries/{th,mm,se}.ts`, plus `index.ts` (registry and types):

```ts
type CountryCode = 'TH' | 'MM' | 'SE';
type Country = {
  code: CountryCode; flag: string; name: () => string;            // name via m.*
  view: { lat: number; lon: number; zoom: number };              // map start
  bbox: [w: number, s: number, e: number, n: number];            // GPS → country detection
  defaultPlace: { name: string; lat: number; lon: number };      // Bangkok / Yangon / Stockholm
  places: { name: string; lat: number; lon: number }[];          // provinces / states+regions / län
  sos: string;                                                   // 1784 / 199 / 112
  numbers: { num: string; name: () => string }[];                // Prepare + Call buttons
  air: 'thai-pcd' | 'who-it';                                    // label only; values identical
  weather: 'dems' | 'smhi';                                      // TH/MM: DEMS heat/rain/river rules; SE: SMHI official warnings only
  shelters: 'sample' | 'in-development' | 'link';
  shelterLink?: string;                                          // SE: MSB skyddsrumskarta URL
};
```

**Places**
- **TH** keeps `src/lib/sample/provinces.json`, the 77 provinces.
- **MM** gets 15 entries: the 7 states, the 7 regions and Naypyidaw Union Territory. Each uses its capital's coordinates.
- **SE** gets the 21 län. Each uses its residence city's coordinates. The English county names must match SMHI's `affectedAreas[].en` strings exactly. A test asserts this against a recorded SMHI fixture.

**Numbers**
- TH: 1784, 1669, 191, 199, 1182 (as today).
- MM: 199 police, 192 ambulance, 191 fire.
- SE: 112 emergency, 1177 health advice, 114 14 police non-emergency, 113 13 information in a major incident.

### State
- `src/lib/country.svelte.ts` holds `country` (`$state`), `setCountry(code)` and `detectCountry(pt)`.
  - localStorage key: `dems.country`.
- Switching country resets the place to that country's default and clears the saved province.
  - The `dems.place` key is stored per country, as `dems.place.<code>`.
- `here.place` stays the single "where" for every screen.

### Server
- **Migration `0004_countries.sql`:**
  - `shelters` (and the other citizen tables the API serves: disasters, alerts) gain `country text not null default 'TH'` with a check constraint `in ('TH','MM','SE')`.
  - Existing rows become `'TH'`.
- **API:** `/api/shelters`, `/api/disasters` and `/api/alerts` take `?country=` (default `TH`) and filter on it. The sample-fallback JSON files are filtered the same way.
- **New `/api/warnings/se`:**
  - fetches `https://opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json`
  - normalises the response to `{ county: string; level: 'watch'|'warning'; event: string; start: string; end: string }[]`
  - caches it in memory for 5 minutes and sends `Cache-Control: s-maxage=300`
  - returns 503 when SMHI fails
- **Mapping:** `YELLOW` → watch; `ORANGE` and `RED` → warning. Any other code, such as `MESSAGE`, is ignored.

## 2. Hazards and levels

The engine (`levels.ts` `collect`/`assess`) stays shared. Country-dependent values come from the country file.

| Hazard | TH | MM | SE |
|---|---|---|---|
| Earthquake | M4.5 / M6 within 300 km in 24 h | same | same |
| GDACS | 300 km (cyclone 500), Orange → Watch, Red → Warning | same | same |
| Rain | 35 / 90 mm | same | — (SMHI decides) |
| River model | rising → Watch only | same | — (SMHI decides) |
| PM2.5 | >37.5 / >75, labelled "Thai PCD" | same numbers, labelled "WHO interim target 3 / 1" | same as MM |
| Heat | feels-like ≥41 / ≥54 | same as TH | — (SMHI decides) |
| **SMHI official** (new) | — | — | every SMHI warning covering the user's län (wind, snow, rain, high temperatures, …): Yellow → Watch, Orange/Red → Warning |

- **Open-Meteo:** no new fields. In SE the forecast and river feeds still load (for the condition tiles) but do not create hazards; only the air feed does.
- **New hazard type `official`** (SE). Its title is SMHI's event name in English (for example "Wind", "Snow", "High temperatures"; `sv` is not shown). It carries the badge "Official: SMHI", and its Prepare link maps SMHI event codes to DEMS guides where one exists (wind → storm, snow → snow, rain → flood, high temperatures → heat; otherwise no guide link).
- **Rules that don't change:**
  - The worst live hazard sets the level.
  - Unknown, never Safe, when every feed fails.
  - Stale after 3 h.
  - The SMHI feed is one more feed (`smhi`) in `Feeds`, and its failure shows like the others.
- **Prepare:**
  - New guides `cold` and `snow`.
  - `storm` guidance reviewed so it fits Swedish winter storms.
  - New go-bag kit `cold`: warm layers, hat, gloves, power bank, hand warmers, thermos.
  - `NUMBERS` per country.
  - Myanmar uses the existing guides (earthquake, flood, storm/cyclone, smoke, heat) with Myanmar numbers.

## 3. Burmese, screens and testing

### Burmese
- **Paraglide locales:** `["en","th","my"]`. Every message key gets an MY translation, and every guide/go-bag entry gets an `my` field.
  - `t(en, th)` becomes `t(en, th, my)`.
- **Font:** Noto Sans Myanmar via Fontsource. It is self-hosted and added to the font stack after Anuphan.
  - Burmese text gets taller line-height (`:lang(my)` rule) so stacked glyphs don't clip.
  - Every main screen is checked at 375 px.
- **Encoding:** Unicode only, no Zawgyi.
- **`web/messages/MY_REVIEW.md`:**
  - lists every key and guide text
  - marks the **life-critical steps first**: earthquake drop/cover/hold, tsunami, flood, cyclone, heatstroke
  - **the merge is blocked until the owner signs it off**
- **Translation style:** plain, natural Myanmar (not literal), with numbers in Arabic digits.
- Thai gains translations for the new keys too. They are added to `TH_REVIEW.md`.

### Screens
- **More:**
  - a **Country** row: a radio group with flag and name, at least 44 px
  - the language switch becomes EN / ไทย / မြန်မာ
- **Header:** the flag plus the place; the picker lists the country's places.
- **Banner:** "You're in {country}. Switch?" with **Switch** and **Not now** buttons. "Not now" is remembered for the session.
- **SOS:** `country.sos`. The Prepare numbers and Call buttons follow the country.
- **Shelters tab:**
  - TH: as today, with the note "Example shelters: Thailand has no public shelter list. In a real emergency, follow DDPM and local announcements."
  - MM: an "In development" card ("follow official announcements"). Shelter routing is hidden.
  - SE: a card explaining civil-defence shelters (*skyddsrum*) with a button to MSB's official shelter map. Routing to a shelter is hidden.
- **Map:** starts at the country's view. It still shows every placed hazard in the region, and the note stays.
- **Now:** SMHI warnings appear in the hazard list with the "Official: SMHI" badge.
- **Copy:**
  - "DEMS Thailand" becomes "DEMS" where it means the app.
  - The About real/sample lists and the README get per-country notes.
  - The demo page says the video shows Thailand.
  - The share image (`og.png`) is unchanged.

### Testing
**Unit**
- Every country file is complete:
  - places are non-empty with valid coordinates inside the bbox
  - the default place is inside the bbox
  - `sos` is present
- SE county names match the SMHI fixture names.
- In SE, DEMS heat/rain/river rules create no hazards; air, quakes and GDACS still do. PM2.5 label per country.
- SMHI normalisation:
  - Yellow → watch; Orange and Red → warning
  - unknown codes are ignored
  - empty and failed responses are handled
- `detectCountry` for points in TH, MM and SE, and for a point outside all three.
- EN/TH/MY key parity (the existing test, extended).

**e2e** (the fixtures gain SMHI and Myanmar/Sweden Open-Meteo responses)
- Switching to Myanmar changes SOS to 199, lists states/regions, and the Shelters tab shows "In development".
- Switching to Sweden changes SOS to 112. A mocked SMHI orange warning for Stockholm County makes Now show Warning with "Official: SMHI". Shelters shows the MSB link.
- The GPS banner offers a switch and does not switch until **Switch** is tapped.
- Burmese renders on Now, Map, Shelters, Prepare and More, with no missing keys.
- axe passes on the main pages in all three languages.

**Database**
- `0004` applies cleanly.
- `db:smoke` checks the `country` column and the default.

## Out of scope
- A Swedish (Svenska) UI
- Real shelter data for Thailand or Myanmar
- Copying MSB data unless it is confirmed open
- Official warning feeds for Thailand or Myanmar (none found as open machine-readable data)
- A new domain
- Re-rendering the demo video
- The Phase 2 admin console

## Sources checked
- SMHI IBWW warnings API: https://opendata.smhi.se/apidocs/IBWwarnings. The live endpoint `…/ibww/api/version/1/warning.json` returned 200. Fields used: `warningAreas[].warningLevel.code`, `affectedAreas[].en`, `approximateStart/End`, `event.en`.
- MSB skyddsrum: about 64–65k shelters and a public map exist, but no open dataset was found on dataportal.se (2026-10-13).
- Thailand shelters: opened per event (for example 295 in the July 2025 border unrest), with no public dataset found on data.go.th.
