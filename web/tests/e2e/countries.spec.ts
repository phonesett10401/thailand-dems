import type { Page } from '@playwright/test';
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

test('Sweden: SOS 112, MSB link, SMHI warning with official badge; Thailand restored', async ({ page }) => {
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
