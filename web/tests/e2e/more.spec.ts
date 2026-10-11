import { expect, test } from './fixtures';

test('More links to report, about and staff sign-in; coming-soon items are inert', async ({ page }) => {
	await page.goto('/more');
	await expect(page.getByRole('link', { name: 'Report an incident' })).toHaveAttribute('href', '/report');
	await expect(page.getByRole('link', { name: 'About and data sources' })).toHaveAttribute('href', '/about');
	await expect(page.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin/login');
	await expect(page.getByText('Ask DEMS')).toBeVisible();
	await expect(page.getByRole('link', { name: /Ask DEMS/ })).toHaveCount(0);
});

test('About explains sources, sample data, thresholds and limits', async ({ page }) => {
	await page.goto('/about');
	await expect(page.getByText('PM2.5: Watch above 37.5 µg/m³, Warning above 75 (Thai PCD)')).toBeVisible();
	await expect(page.getByText(/never Safe/)).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Limits' })).toBeVisible();
});
