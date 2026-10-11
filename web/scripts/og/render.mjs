// Renders scripts/og/og.html to static/og.png (1200×630 link-preview image).
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto('file:///' + here('./og.html').replaceAll('\\', '/'));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: here('../../static/og.png') });
await browser.close();
