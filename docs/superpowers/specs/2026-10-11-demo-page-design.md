# Demo page + video — design (Spec 2)

Date: 2026-10-11 · Status: approved in chat, awaiting written-spec review

## Goal

A `/demo` page that explains DEMS Thailand to the **public and the owner's teachers**. It opens with a ~35 s animated video. Then come plain-words copy and a "Try the live app" button, the three roles, and an "Under the hood" section for teachers. No recruiter section.

## Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Visual style | **Animated recreation** of the app (Remotion), not screen recordings. The levels are scripted. |
| Sound | On-screen captions + music. Track: **"Cinematic Corporate" by alex-morgan** (Pixabay, no Content ID). |
| Music timing | Start 7 s into the track. Its lift (~22 s in the track) lands on Warning at 15 s; its ease-off (~38 s) lands on the CTA at ~31 s. Fade out at the end. 74 BPM → beat = 0.811 s. |
| Language | **English first.** Thai video later if the owner likes it. Captions live in one list file so Thai is a translation + render. |
| Shapes | **16:9 (1920×1080) and 9:16 (1080×1920)**, both on the page (see Page). |
| Build | Separate Remotion project `demo-video/`, rendered locally to MP4 + poster JPG, served as static files. No Remotion code ships to visitors. |

## 1. Video storyboard (35 s, 30 fps = 1050 frames)

Scene cuts snap to the nearest beat of the track (offset 7 s). The times below are targets; the final frames are rounded to beats.

| Time | Scene | Visual | Caption (EN) |
|---|---|---|---|
| 0–3 s | Logo | Shield outline draws itself; the person fades in; the arc lights up green | **DEMS Thailand** · Disaster alerts for everyone in Thailand |
| 3–8 s | Map | Dark Thailand outline; hazard dots pop in on beats: haze (north), flood (central), quake (west), storm (south) | Live hazards from public data, across the country |
| 8–17 s | Level (phone) | Now screen, Bangkok. Safe (green) → 11 s Watch (amber, PM2.5 rising) → 15 s Warning (red, heavy rain 112 mm; haze stays). Levels follow the real rules: the river model is Watch-only, so Warning comes from rain ≥ 90 mm. The logo arc changes colour; it pulses at Warning. Music lift at 15 s | Know your level → Safe · Watch · Warning |
| 17–22 s | Route (phone) | Map; the route line draws *around* a red flood zone to a shelter pin; distance and time chip | Find a shelter. Get there safely. · Routes steer around danger zones |
| 22–26 s | Prepare (phone) | Go-bag list; Flood chip on; items tick; the EN → ไทย toggle flips the screen to Thai | A go-bag for each emergency, in English and Thai |
| 26–31 s | How it works | Sources (Open-Meteo weather/air/river · USGS quakes · GDACS global alerts) flow into the DEMS shield, then out to **Citizens**, with **Volunteers** and **Admins** dimmed and tagged "Phase 2" | Open data in. Clear advice out. |
| 31–35 s | CTA | Logo + **thailand-dems.vercel.app**; music eases off and fades | Try it now. Free, no sign-up. |

Tall (9:16) layout: same scenes and timing. Captions at the top, the phone in the middle, and the How-it-works flow runs top → bottom.

Honesty: the scripted levels are an illustration (the page says so). Volunteer and Admin are tagged Phase 2.

## 2. Demo page (`/demo`, `/th/demo`)

1. **Video**
   - `<video autoplay muted loop playsinline>` with a poster and native controls.
   - A visible 🔊 unmute button.
   - Source chosen by the browser:
     - `<source media="(max-width: 767px) and (orientation: portrait)" src="/demo/demo-9x16.mp4">` for upright phones
     - then `demo-16x9.mp4` for everything else: landscape phones, tablets, desktop.
   - The frame's `aspect-ratio` follows the same media query, so the layout doesn't jump.
   - Only one file is downloaded.
   - `prefers-reduced-motion: reduce` → no autoplay; the poster plus play button show instead.
   - `/th/demo` plays the English video until a Thai one exists.
2. **Plain words**
   - Headline "Disaster alerts, explained".
   - Three short lines: it checks public weather, air, river, quake and global-alert data near you, gives one level (Safe/Watch/Warning), and shows the nearest shelter and a safe way there.
   - Honesty note: "A student project. Levels are estimates from public data, not official warnings. Shelters are sample data. The video is an illustration."
   - Primary button **Try the live app** → `/` (localized).
3. **Who it's for**: three cards.
   - Citizen (live now): level, map, shelters, safe routes, go-bag, report an incident.
   - Volunteer (Phase 2): checks and updates incident reports in the field.
   - Admin (Phase 2): manages shelters and reports, sends alerts.
4. **Under the hood** (teachers): six `<details>` sections, each a few short paragraphs; a simple diagram where it helps.
   1. Architecture: SvelteKit on Vercel (hnd1), Supabase Postgres (Tokyo), and why.
   2. Data flow: sources → server → level rules → screen. Includes the threshold table and the rules "Unknown, never Safe" and "stale after 3 h".
   3. Database and security: row-level security, roles, rate limits on reports and routes, secrets server-side only, DB timeouts → 503.
   4. Testing: unit tests (Vitest), browser tests (Playwright) with axe accessibility checks. Counts are stated as "100+ / 70+" so they don't go stale.
   5. Real vs sample data: what is live and what is sample.
   6. History: Express + MySQL → SvelteKit + Supabase, and why.
5. **Wiring**
   - More page: the "Demo tour (coming soon)" row becomes a link to `/demo` (drop "coming soon").

All copy goes through Paraglide, EN and TH. New TH keys are appended to `messages/TH_REVIEW.md`. Rules carried from Spec 1: tap targets ≥ 44 px, WCAG AA contrast, dark-glass style, CSS layout switching (no `MediaQuery` `{#if}`).

## 3. Build and test

**`demo-video/`** (sibling of `web/`, its own `package.json`; not built by Vercel)
- Remotion compositions `Demo16x9` (1920×1080) and `Demo9x16` (1080×1920), 30 fps, 1050 frames.
- One component per scene: `Logo`, `MapScene`, `Level`, `Route`, `Prepare`, `HowItWorks`, `Cta`. Each takes `layout: 'wide' | 'tall'`.
- `captions/en.ts`: all caption strings (Thai later = `captions/th.ts`).
- `timeline.ts`: scene start and length in frames, derived from beat positions.
- Brand: colour tokens as in the app; Geist + Anuphan via Fontsource; logo paths imported from `web/src/lib/logo.ts` (single source).
- Thailand outline: a simplified Natural Earth (public domain) path baked into an SVG constant.
- Music: `public/music.mp3` (Pixabay licence permits inclusion), `<Audio startFrom={7*30}>` with a volume fade.
- `npm run render` writes `web/static/demo/demo-16x9.mp4`, `demo-9x16.mp4`, `poster-16x9.jpg` and `poster-9x16.jpg`. H.264, ~5–8 MB each. The outputs are committed.
- Remotion licence: free for individuals and small teams (student project qualifies).

**Tests**
- Video (Vitest in `demo-video/`):
  - scene lengths sum to 1050
  - every cut lands within 1 frame of a beat
  - no empty caption
  - both compositions use the same scene list
- Web e2e (Playwright):
  - upright phone viewport gets the 9:16 source, tablet and desktop get 16:9
  - "Try the live app" navigates to `/`
  - the `<details>` sections expand
  - More → `/demo` link
  - reduced-motion → no autoplay
  - axe clean on `/demo`
- Messages: the existing EN/TH key-parity test covers the new keys.

**Failure behaviour**
- Video fails to load → the poster and all copy remain.
- Autoplay blocked → poster + play button.
- Only the matching file is downloaded.

## Out of scope

- Thai video (after owner review)
- Voice narration
- Social-media posting
- Remotion Player / cloud rendering
- Phase 2 volunteer and admin features themselves
- A separate share image for `/demo` (the site-wide card from PR #4 is used; a second `og:image` tag would conflict with it)
