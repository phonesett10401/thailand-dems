import { expect, test } from './fixtures';

test('emergency numbers are tap-to-call', async ({ page }) => {
	await page.goto('/info');
	for (const n of ['1784', '1669', '191', '199']) {
		await expect(page.locator(`a[href="tel:${n}"]`)).toBeVisible();
	}
});

test('about section says what is real and what is sample', async ({ page }) => {
	await page.goto('/info');
	await expect(page.getByRole('heading', { name: 'About this demo' })).toBeVisible();
	await expect(page.getByText('Weather, air quality, river flow: Open-Meteo')).toBeVisible();
	await expect(page.getByText('Shelters and their capacity')).toBeVisible();
	await expect(page.getByText(/not an official service/)).toBeVisible();
});
