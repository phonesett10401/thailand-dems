import { expect, test } from './fixtures';

test('lists live GDACS events and sample disasters separately', async ({ page }) => {
	await page.goto('/disasters');
	await expect(page.getByRole('heading', { name: 'Disasters & hazards' })).toBeVisible();
	await expect(page.getByText('Flood in Thailand')).toBeVisible();
	await expect(page.getByText('M5.3 · 81 km SSW of Banda Aceh, Indonesia')).toBeVisible();
	const sample = page.getByRole('region', { name: "From this demo's database" });
	await expect(sample.getByText('SAMPLE').first()).toBeVisible();
});

test('filtering by type narrows both lists', async ({ page }) => {
	await page.goto('/disasters');
	await page.getByRole('button', { name: 'Earthquake', exact: true }).click();
	await expect(page.getByText('Flood in Thailand')).toHaveCount(0);
	await expect(page.getByText('M5.3 · 81 km SSW of Banda Aceh, Indonesia')).toBeVisible();
});

test('selecting an event opens its details', async ({ page }) => {
	await page.goto('/disasters');
	await page.getByRole('button', { name: /Flood in Thailand/ }).click();
	await expect(page.getByRole('dialog')).toContainText('Details at source');
});
