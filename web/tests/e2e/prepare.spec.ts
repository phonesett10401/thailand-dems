import { expect, test } from './fixtures';

test('prepare lists the ten guides, the go-bag and tap-to-call numbers', async ({ page }) => {
	await page.goto('/prepare');
	await expect(page.getByRole('heading', { name: 'Prepare', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: /Smoke and haze/ })).toHaveAttribute('href', '/prepare/smoke');
	await expect(page.getByRole('link', { name: /^Call 1784, Disaster hotline/ })).toHaveAttribute('href', 'tel:1784');
	await expect(page.getByText('0 of 15 ready')).toBeVisible();
});

test('go-bag ticks survive a reload', async ({ page }) => {
	await page.goto('/prepare');
	await page.getByText('First-aid kit').click();
	await expect(page.getByText('1 of 15 ready')).toBeVisible();
	await page.reload();
	await expect(page.getByText('1 of 15 ready')).toBeVisible();
});

test('a guide shows Before, During and After', async ({ page }) => {
	await page.goto('/prepare/earthquake');
	await expect(page.getByRole('heading', { name: 'Earthquake', level: 1 })).toBeVisible();
	for (const h of ['Before', 'During', 'After']) await expect(page.getByRole('heading', { name: h })).toBeVisible();
	await expect(page.getByText('Drop to the floor, cover your head, hold on to sturdy furniture.')).toBeVisible();
});

test('an unknown guide is a 404', async ({ page }) => {
	await page.goto('/prepare/meteor');
	await expect(page.getByText('404')).toBeVisible();
});

test('Thai guide text', async ({ page }) => {
	await page.goto('/th/prepare/flood');
	await expect(page.getByRole('heading', { name: 'น้ำท่วม', level: 1 })).toBeVisible();
});
