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
