import { expect, test } from './fixtures';

test('top bar: logo, live, SOS calls 1784, Demo chip opens About', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: /DEMS/ }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: "Call 1784, emergency number" })).toHaveAttribute('href', 'tel:1784');
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
	test('the place picker asks for an area instead', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/');
		await page.getByLabel('Change location').click();
		const picker = page.locator('header details');
		await picker.getByRole('button', { name: 'Use my location' }).click();
		await expect(picker.getByText('Location unavailable. Choose an area instead.')).toBeVisible();
	});
});

test.describe('375 px width', () => {
	test.use({ viewport: { width: 375, height: 812 } });
	for (const [path, sos, demo] of [
		['/', "Call 1784, emergency number", 'About this demo and its data'],
		['/th', 'โทร 1784 หมายเลขฉุกเฉิน', 'เกี่ยวกับเดโมนี้และข้อมูล']
	]) {
		test(`SOS and Demo chip fit inside the viewport on ${path}`, async ({ page }) => {
			await page.goto(path);
			for (const name of [sos, demo]) {
				const box = await page.getByRole('link', { name }).boundingBox();
				expect(box).not.toBeNull();
				expect(box!.x).toBeGreaterThanOrEqual(0);
				expect(box!.x + box!.width).toBeLessThanOrEqual(375);
				expect(box!.height).toBeGreaterThanOrEqual(44);
			}
		});
	}
});
