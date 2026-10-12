import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

const pickCountry = async (page: Page, name: string) => {
	await page.goto('/more');
	await page.getByRole('button', { name: new RegExp(name) }).click();
};
const sos = (page: Page) => page.getByRole('link', { name: /^Call \d+, emergency number$/ });
const tab = (page: Page, name: string) => page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name });

test('Myanmar: SOS 199, its regions, shelters in development', async ({ page }) => {
	await pickCountry(page, 'Myanmar');
	await expect(sos(page)).toHaveAttribute('href', 'tel:199');
	await expect(sos(page)).toHaveText(/SOS · 199/);
	await page.getByLabel('Change location').click();
	await expect(page.getByRole('option', { name: 'Mandalay Region' })).toBeAttached();
	await page.goto('/shelters');
	await expect(page.getByText('Shelters: in development')).toBeVisible();
	await expect(page.locator('[data-km]')).toHaveCount(0);
});

test('Sweden: SOS 112, MCF link, SMHI warning with official badge; Thailand restored', async ({ page }) => {
	await page.route('**/api/warnings/se', (r) =>
		r.fulfill({
			contentType: 'application/json',
			body: JSON.stringify([{ areaId: 1, level: 'warning', event: 'Wind', code: 'WIND', start: '2026-10-13T06:00:00Z', end: null }])
		})
	);
	await page.clock.setFixedTime(new Date('2026-10-13T08:00:00Z'));
	await pickCountry(page, 'Sweden');
	await expect(sos(page)).toHaveAttribute('href', 'tel:112');
	await page.goto('/shelters');
	const mcf = page.getByRole('link', { name: /MCF/ });
	await expect(mcf).toHaveAttribute('href', /^https:\/\/www\.mcf\.se/);
	await page.goto('/');
	await expect(page.locator('.lv-warning').getByText('Warning', { exact: true }).first()).toBeVisible();
	await expect(page.getByRole('button', { name: /Wind/ })).toBeVisible();
	await expect(page.getByText('Official: SMHI')).toBeVisible();

	await pickCountry(page, 'Thailand');
	await expect(sos(page)).toHaveAttribute('href', 'tel:1784');
	await page.goto('/shelters');
	await expect(page.getByRole('button', { name: /Bangkok Stadium/ })).toBeVisible();
	await expect(page.getByText(/Example shelters/)).toBeVisible();
});

test('Sweden: an orange SMHI wind warning shows the storm steps on Now', async ({ page }) => {
	await page.route('**/api/warnings/se', (r) =>
		r.fulfill({
			contentType: 'application/json',
			body: JSON.stringify([{ areaId: 1, level: 'warning', event: 'Wind', code: 'WIND', start: '2026-10-13T06:00:00Z', end: null }])
		})
	);
	await page.clock.setFixedTime(new Date('2026-10-13T08:00:00Z'));
	await pickCountry(page, 'Sweden');
	await page.goto('/');
	await expect(page.getByText('What to do now')).toBeVisible();
	await expect(page.getByText('Stay indoors, away from windows and glass doors.')).toBeVisible();
});

test('a place picked in Thailand does not leak into Sweden and returns on switch back', async ({ page }) => {
	await page.goto('/');
	await page.getByLabel('Change location').click();
	await page.getByLabel('Choose an area').selectOption('Chiang Mai');
	await expect(page.getByLabel('Change location')).toContainText('Chiang Mai');
	await pickCountry(page, 'Sweden');
	await expect(page.getByLabel('Change location')).toContainText('Stockholm');
	await pickCountry(page, 'Thailand');
	await expect(page.getByLabel('Change location')).toContainText('Chiang Mai');
});

test('GPS in Sweden while in Thailand offers a switch; Not now is remembered', async ({ page, context }) => {
	await context.grantPermissions(['geolocation']);
	await context.setGeolocation({ latitude: 59.33, longitude: 18.07 });
	await page.goto('/');
	await page.getByLabel('Change location').click();
	await page.getByRole('button', { name: 'Use my location' }).click();
	const banner = page.getByRole('status').filter({ hasText: "You're in Sweden" });
	await expect(banner).toBeVisible();
	await expect(sos(page)).toHaveAttribute('href', 'tel:1784');
	await banner.getByRole('button', { name: 'Not now' }).click();
	await expect(banner).toHaveCount(0);
	await tab(page, 'Map').click();
	await expect(page).toHaveURL(/\/map/);
	await expect(page.getByText("You're in Sweden")).toHaveCount(0);
	// remembered for the session: asking again after a reload shows no banner
	await page.reload();
	await page.getByLabel('Change location').click();
	await page.getByRole('button', { name: 'Use my location' }).click();
	await expect(page.getByLabel('Change location')).toContainText('Your location');
	await expect(page.getByText("You're in Sweden")).toHaveCount(0);
});

test('Switch changes country and keeps the GPS position as the place', async ({ page, context }) => {
	await context.grantPermissions(['geolocation']);
	await context.setGeolocation({ latitude: 59.33, longitude: 18.07 });
	await page.goto('/');
	await page.getByLabel('Change location').click();
	await page.getByRole('button', { name: 'Use my location' }).click();
	await page.getByRole('button', { name: 'Switch', exact: true }).click();
	await expect(sos(page)).toHaveAttribute('href', 'tel:112');
	await expect(page.getByLabel('Change location')).toContainText('Your location');
});

test('Switch drops the old country shelters from Now', async ({ page, context }) => {
	await context.grantPermissions(['geolocation']);
	await context.setGeolocation({ latitude: 59.33, longitude: 18.07 });
	const sample: { ShelterName: string }[] = JSON.parse(readFileSync('src/lib/sample/shelters.json', 'utf8'));
	const thai = new RegExp(sample.map((x) => x.ShelterName).join('|'));
	await page.goto('/');
	await expect(page.getByText(thai).first()).toBeVisible();
	await page.getByLabel('Change location').click();
	await page.getByRole('button', { name: 'Use my location' }).click();
	await page.getByRole('button', { name: 'Switch', exact: true }).click();
	await expect(sos(page)).toHaveAttribute('href', 'tel:112');
	await expect(page.getByText(thai)).toHaveCount(0);
});

test('the chosen country survives a reload', async ({ page }) => {
	await pickCountry(page, 'Sweden');
	await page.reload();
	await expect(sos(page)).toHaveAttribute('href', 'tel:112');
});

for (const path of ['/my', '/my/map', '/my/shelters', '/my/prepare', '/my/more']) {
	test(`Burmese: ${path} is in Myanmar script with no raw message keys`, async ({ page }) => {
		await page.goto(path);
		await expect(page.locator('html')).toHaveAttribute('lang', 'my');
		await expect(page.locator('h1').first()).toHaveText(/[က-႟]/);
		const text = await page.locator('main').innerText();
		expect(text).not.toMatch(/now_|prep_/);
	});
}

test('the language links go between all three languages', async ({ page }) => {
	await page.goto('/more');
	const langs = page.getByRole('group', { name: 'Language' });
	await expect(langs.getByRole('link', { name: 'EN' })).toHaveAttribute('aria-current', 'true');
	await langs.getByRole('link', { name: 'မြန်မာ' }).click();
	await expect(page).toHaveURL(/\/my\/more$/);
	await expect(page.locator('html')).toHaveAttribute('lang', 'my');
	await page.getByRole('group', { name: 'ဘာသာစကား' }).getByRole('link', { name: 'ไทย' }).click();
	await expect(page).toHaveURL(/\/th\/more$/);
});

test('Burmese headlines get room for stacked marks', async ({ page }) => {
	for (const path of ['/my/prepare', '/my/prepare/earthquake', '/my/shelters']) {
		await page.goto(path);
		const ratio = await page.locator('h1.headline').first().evaluate((h) => {
			const s = getComputedStyle(h);
			return parseFloat(s.lineHeight) / parseFloat(s.fontSize);
		});
		expect(ratio, path).toBeGreaterThanOrEqual(1.3);
	}
});

test('safety texts name the chosen country numbers and agencies', async ({ page }) => {
	await page.goto('/report');
	await expect(page.getByText('In danger now? Call 1669 (ambulance) or 191 (police) first.')).toBeVisible();
	await pickCountry(page, 'Myanmar');
	await page.goto('/report');
	await expect(page.getByText('In danger now? Call 192 (ambulance) or 199 (police) first.')).toBeVisible();
	await page.goto('/about');
	await expect(page.getByText(/Always follow the Department of Disaster Management and the Department of Meteorology and Hydrology, and call 199 in an emergency\./)).toBeVisible();
	await pickCountry(page, 'Sweden');
	await page.goto('/report');
	await expect(page.getByText('In danger now? Call 112 first.')).toBeVisible();
});

test.describe('Sweden with no earthquakes', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('dems.country', 'SE'));
		await page.route('https://earthquake.usgs.gov/**', (r) =>
			r.fulfill({ contentType: 'application/json', body: JSON.stringify({ type: 'FeatureCollection', features: [] }) })
		);
	});

	test('Now does not call an empty quake list unavailable, and asks USGS about Sweden', async ({ page }) => {
		const quakeReq = page.waitForRequest((r) => r.url().includes('earthquake.usgs.gov'));
		await page.goto('/');
		expect((await quakeReq).url()).toContain('minlatitude=53');
		await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Checking hazards near you…');
		await expect(page.getByText(/Unavailable right now/)).toHaveCount(0);
	});

	test('desktop Now shows the MCF card instead of an empty shelter card', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await expect(page.getByRole('link', { name: /MCF/ })).toBeVisible();
	});

	test('desktop Shelters has no empty map column', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/shelters');
		await expect(page.getByRole('link', { name: /MCF/ })).toBeVisible();
		const col = await page.getByRole('heading', { level: 1 }).evaluate((h) => {
			const wrap = h.closest('.page')!.parentElement!;
			return getComputedStyle(wrap).gridTemplateColumns.split(' ').length;
		});
		expect(col).toBe(1);
	});
});

test.describe('Sweden map: SMHI warning areas', () => {
	const poly = (x: number, y: number) => ({ type: 'Polygon', coordinates: [[[x, y], [x + 2, y], [x + 2, y + 1], [x, y]]] });
	const rows = [
		{ areaId: 23, level: 'watch', event: 'Snow', code: 'SNOW', start: '2026-10-01T00:00:00Z', end: null, zoneId: 1, areas: ['Jämtland County'], geometry: poly(13, 63) },
		{ areaId: 99, level: 'warning', event: 'Wind at sea', code: 'WIND_SEA', start: '2026-10-01T00:00:00Z', end: null, zoneId: 2, areas: ['Bothnian Sea'], geometry: poly(19, 61) }
	];
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('dems.country', 'SE'));
		await page.route('https://earthquake.usgs.gov/**', (r) => r.fulfill({ contentType: 'application/json', body: '{"type":"FeatureCollection","features":[]}' }));
		await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: '{"features":[]}' }));
	});

	test('chips, list rows with area names, and chip toggling', async ({ page }) => {
		await page.route('**/api/warnings/se', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(rows) }));
		await page.goto('/map');
		const snow = page.getByRole('button', { name: 'Snow', exact: true });
		await expect(snow).toBeVisible();
		await expect(page.getByRole('button', { name: 'Wind at sea', exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'List', exact: true }).click();
		const rowSnow = page.getByRole('button', { name: /^Snow.*Jämtland County/ });
		await expect(rowSnow).toBeVisible();
		await expect(page.getByRole('button', { name: /^Wind at sea.*Bothnian Sea/ })).toBeVisible();
		await snow.click();
		await expect(rowSnow).toBeHidden();
		await expect(page.getByRole('button', { name: /^Wind at sea.*Bothnian Sea/ })).toBeVisible();
	});

	test('a row opens the details sheet', async ({ page }) => {
		await page.route('**/api/warnings/se', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(rows) }));
		await page.goto('/map');
		await page.getByRole('button', { name: 'List', exact: true }).click();
		await page.getByRole('button', { name: /^Wind at sea.*Bothnian Sea/ }).click();
		await expect(page.getByRole('dialog')).toContainText('SMHI');
	});

	test('no warnings says so', async ({ page }) => {
		await page.route('**/api/warnings/se', (r) => r.fulfill({ contentType: 'application/json', body: '[]' }));
		await page.goto('/map');
		await page.getByRole('button', { name: 'List', exact: true }).click();
		await expect(page.getByText('No SMHI warnings right now.').last()).toBeVisible();
	});
});
