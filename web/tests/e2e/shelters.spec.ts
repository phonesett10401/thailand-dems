import { expect, test } from './fixtures';

test('shelters are sorted by distance, labelled as sample, with directions', async ({ page }) => {
	await page.goto('/shelters');
	await expect(page.getByRole('heading', { name: 'Shelters' })).toBeVisible();
	await expect(page.getByText('Every shelter on this page is sample data.')).toBeVisible();
	const first = page.getByRole('listitem').filter({ hasText: 'km' }).first();
	await expect(first.getByRole('link', { name: 'Directions' })).toHaveAttribute('href', /google\.com\/maps\/dir/);
	const kms = await page
		.locator('[data-km]')
		.evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-km'))));
	expect(kms.length).toBeGreaterThan(1);
	expect(kms).toEqual([...kms].sort((a, b) => a - b));
});
