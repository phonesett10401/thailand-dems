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
	await expect(page.getByText('no risk here right now')).toHaveCount(0);
});

test('one feed down: level still computed, the missing feed is named', async ({ page }) => {
	await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ status: 503, body: '' }));
	await page.goto('/');
	await expect(page.getByText('Unavailable right now: Air quality.')).toBeVisible();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Flooding near you');
	await expect(page.getByText('no risk here right now')).not.toContainText('Haze');
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
