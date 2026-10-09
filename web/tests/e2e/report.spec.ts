import { expect, test } from './fixtures';

async function fill(page: import('@playwright/test').Page) {
	await page.goto('/report');
	await page.getByRole('radio', { name: 'Flood' }).check();
	await page.getByRole('radio', { name: 'Severe' }).check();
	await page.getByLabel('Describe what you see').fill('Water up to the knees on the main road');
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByLabel('Place name or landmark').fill('Mae Rim market');
	await page.getByRole('button', { name: 'Next' }).click();
}

test('validates step 1 before moving on', async ({ page }) => {
	await page.goto('/report');
	await page.getByRole('button', { name: 'Next' }).click();
	await expect(page.getByText('Please fill this in.').first()).toBeVisible();
	await expect(page.getByText('Step 1 of 3')).toBeVisible();
});

test('sends one report and shows the done screen', async ({ page }) => {
	let posts = 0;
	page.on('request', (r) => r.method() === 'POST' && r.url().endsWith('/api/reports/create') && posts++);
	await fill(page);
	const send = page.getByRole('button', { name: 'Send report' });
	await send.dblclick();
	await expect(page.getByRole('heading', { name: 'Report sent' })).toBeVisible();
	expect(posts).toBe(1);
});

test.describe('backend down', () => {
	test.use({ backend: 'down' });
	test('keeps the form and explains the problem', async ({ page }) => {
		await fill(page);
		await page.getByRole('button', { name: 'Send report' }).click();
		await expect(page.getByText(/Couldn't reach the server/)).toBeVisible();
		await page.getByRole('button', { name: 'Back' }).click();
		await page.getByRole('button', { name: 'Back' }).click();
		await expect(page.getByLabel('Describe what you see')).toHaveValue('Water up to the knees on the main road');
	});
});
