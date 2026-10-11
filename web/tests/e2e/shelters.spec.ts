import { expect, test } from './fixtures';

test('shelters sorted by distance, labelled as sample', async ({ page }) => {
	await page.goto('/shelters');
	await expect(page.getByRole('heading', { name: 'Shelters', level: 1 })).toBeVisible();
	await expect(page.getByText('Every shelter on this page is sample data.')).toBeVisible();
	const kms = await page.locator('[data-km]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-km'))));
	expect(kms.length).toBeGreaterThan(1);
	expect(kms).toEqual([...kms].sort((a, b) => a - b));
});

test('filters narrow the list', async ({ page }) => {
	await page.goto('/shelters');
	await page.getByRole('button', { name: 'Clean-air room' }).click();
	await expect(page.getByRole('button', { name: /Chiang Mai University Shelter/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /Bangkok Stadium/ })).toHaveCount(0);
	await page.getByRole('button', { name: 'Pets' }).click();
	await expect(page.getByText('No shelters match these filters.')).toBeVisible();
});

test('detail sheet offers our route guide and a Google Maps fallback', async ({ page }) => {
	await page.goto('/shelters');
	await page.getByRole('button', { name: /Bangkok Stadium/ }).click();
	const sheet = page.getByRole('dialog');
	await expect(sheet.getByRole('link', { name: 'Route' })).toHaveAttribute('href', /\/route\?to=shelter:\d+/);
	await expect(sheet.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
});

test('?focus= opens that shelter', async ({ page }) => {
	await page.goto('/shelters?focus=3');
	await expect(page.getByRole('dialog')).toBeVisible();
});

test('sample evacuation routes are listed at the bottom', async ({ page }) => {
	await page.goto('/shelters');
	await expect(page.getByRole('heading', { name: /Evacuation routes · Sample/ })).toBeVisible();
	await expect(page.getByText('Highway 1 - North Route')).toBeVisible();
});
