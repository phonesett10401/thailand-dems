import { expect, test } from './fixtures';

test('top bar: logo, live, SOS calls 1784, Demo chip opens About', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /DEMS/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: "Call 1784, Thailand's disaster hotline" })).toHaveAttribute('href', 'tel:1784');
	await expect(page.getByRole('link', { name: 'About this demo and its data' })).toHaveAttribute('href', '/about');
});

test('phone tab bar has the five tabs', async ({ page }) => {
	await page.goto('/');
	const nav = page.getByRole('navigation').last();
	for (const name of ['Now', 'Map', 'Shelters', 'Prepare', 'More']) {
		await expect(nav.getByRole('link', { name })).toBeVisible();
	}
});

test('the browser tab icon shows the live level colour', async ({ page }) => {
	await page.goto('/');
	// fixtures: PM2.5 41.2 → Watch (amber)
	await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /%23ffb020/);
});

test.describe('first visit', () => {
	test.use({ seenNote: false });
	test('the note shows once', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('note')).toContainText('student project');
		await page.getByRole('button', { name: 'Got it' }).click();
		await page.reload();
		await expect(page.getByRole('note')).toHaveCount(0);
	});
});

for (const [from, to] of [
	['/disasters', '/map'],
	['/info', '/about'],
	['/weather', '/'],
	['/evacuation', '/shelters'],
	['/th/disasters', '/th/map']
]) {
	test(`${from} redirects to ${to}`, async ({ request }) => {
		const r = await request.get(from, { maxRedirects: 0 });
		expect(r.status()).toBe(308);
		expect(r.headers().location).toBe(to);
	});
}

test.describe('geolocation denied', () => {
	test.use({ permissions: [] });
	test('the place picker asks for a province instead', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/');
		await page.getByLabel('Change location').click();
		const picker = page.locator('header details');
		await picker.getByRole('button', { name: 'Use my location' }).click();
		await expect(picker.getByText('Location unavailable. Choose a province instead.')).toBeVisible();
	});
});
