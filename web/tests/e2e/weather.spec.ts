import { expect, test } from './fixtures';

test('weather shows live forecast with its source', async ({ page }) => {
	await page.goto('/weather');
	await expect(page.getByRole('heading', { name: 'Weather' })).toBeVisible();
	await expect(page.getByRole('region', { name: 'Now' }).getByText('31°')).toBeVisible();
	await expect(page.getByText('Rain').first()).toBeVisible();
	await expect(page.getByText('Wind 9.5 km/h')).toBeVisible();
	await expect(page.getByText(/Open-Meteo · updated/).first()).toBeVisible();
	await expect(page.getByText('SAMPLE')).toHaveCount(0);
});
