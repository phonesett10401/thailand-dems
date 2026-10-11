import { expect, test } from './fixtures';

test('prepare lists the ten guides, the go-bag and tap-to-call numbers', async ({ page }) => {
	await page.goto('/prepare');
	await expect(page.getByRole('heading', { name: 'Prepare', level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: /Smoke and haze/ })).toHaveAttribute('href', '/prepare/smoke');
	await expect(page.getByRole('link', { name: /^Call 1784, Disaster hotline/ })).toHaveAttribute('href', 'tel:1784');
	await page.getByRole('button', { name: 'Basics only' }).click();
	await expect(page.getByText('0 of 13 ready')).toBeVisible();
});

test('the go-bag defaults to the emergency active near you', async ({ page }) => {
	await page.goto('/prepare');
	const group = page.getByRole('group', { name: 'Emergency' });
	await expect(group.getByRole('button', { name: 'Haze' })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText(/Showing extras for .*, active near you now\./)).toBeVisible();
	await expect(page.getByText('N95 masks')).toBeVisible();
	await expect(page.getByText('0 of 16 ready')).toBeVisible();
});

test('Basics only hides the extras', async ({ page }) => {
	await page.goto('/prepare');
	await page.getByRole('button', { name: 'Basics only' }).click();
	await expect(page.getByText('N95 masks')).toHaveCount(0);
	await expect(page.getByText('0 of 13 ready')).toBeVisible();
});

test('the Flood chip adds boots and drops N95; the haze chip brings N95 back', async ({ page }) => {
	await page.goto('/prepare');
	const group = page.getByRole('group', { name: 'Emergency' });
	await group.getByRole('button', { name: 'Flooding' }).click();
	await expect(page.getByText('Rubber boots')).toBeVisible();
	await expect(page.getByText('N95 masks')).toHaveCount(0);
	await group.getByRole('button', { name: 'Haze' }).click();
	await expect(page.getByText('N95 masks')).toBeVisible();
});

test('a ticked basics item stays ticked when you switch emergency', async ({ page }) => {
	await page.goto('/prepare');
	await page.getByRole('button', { name: 'Basics only' }).click();
	await page.getByText('First-aid kit').click();
	await page.getByRole('group', { name: 'Emergency' }).getByRole('button', { name: 'Flooding' }).click();
	await expect(page.getByLabel('First-aid kit')).toBeChecked();
	await expect(page.getByText('1 of 17 ready')).toBeVisible();
});

test('go-bag ticks survive a reload', async ({ page }) => {
	await page.goto('/prepare');
	await page.getByRole('button', { name: 'Basics only' }).click();
	await page.getByText('First-aid kit').click();
	await expect(page.getByText('1 of 13 ready')).toBeVisible();
	await page.reload();
	await page.getByRole('button', { name: 'Basics only' }).click();
	await expect(page.getByText('1 of 13 ready')).toBeVisible();
});

test('a guide shows Before, During and After', async ({ page }) => {
	await page.goto('/prepare/earthquake');
	await expect(page.getByRole('heading', { name: 'Earthquake', level: 1 })).toBeVisible();
	for (const h of ['Before', 'During', 'After']) await expect(page.getByRole('heading', { name: h })).toBeVisible();
	await expect(page.getByText('Drop to the floor, cover your head, hold on to sturdy furniture.')).toBeVisible();
});

test('an unknown guide is a 404', async ({ page }) => {
	await page.goto('/prepare/meteor');
	await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('Thai guide text', async ({ page }) => {
	await page.goto('/th/prepare/flood');
	await expect(page.getByRole('heading', { name: 'น้ำท่วม', level: 1 })).toBeVisible();
});
