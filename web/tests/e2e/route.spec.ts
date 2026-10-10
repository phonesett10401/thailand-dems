import { expect, test } from './fixtures';

test('route to a shelter: summary, steps in words, mode switch re-requests', async ({ page }) => {
	const modes: string[] = [];
	page.on('request', (r) => r.url().endsWith('/api/route') && modes.push(JSON.parse(r.postData() ?? '{}').mode));
	await page.goto('/route?to=shelter:2');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Route to');
	await expect(page.getByText('3.9 km · 47 min')).toBeVisible();
	await expect(page.getByText('Turn left onto Rama IV Road')).toBeVisible();
	await expect(page.getByText(/^Arrive at /)).toBeVisible();
	await page.getByRole('button', { name: 'Drive' }).click();
	await expect.poll(() => modes).toEqual(['foot', 'car']);
});

test('routing down: straight-line fallback and Google Maps link', async ({ page }) => {
	await page.route((u) => u.pathname === '/api/route', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Routing unavailable"}' }));
	await page.goto('/route?to=shelter:2');
	await expect(page.getByRole('alert')).toContainText('Straight-line distance');
	await expect(page.getByRole('link', { name: 'Open in Google Maps' })).toBeVisible();
});

test('outside Thailand is explained, not a spinner', async ({ page }) => {
	await page.route((u) => u.pathname === '/api/route', (r) => r.fulfill({ status: 400, contentType: 'application/json', body: '{"message":"outside Thailand"}' }));
	await page.goto('/route?to=shelter:2');
	await expect(page.getByRole('alert')).toHaveText('Routing works inside Thailand only.');
});

test('no destination asks you to pick a shelter', async ({ page }) => {
	await page.goto('/route');
	await expect(page.getByRole('link', { name: 'Pick a shelter' })).toHaveAttribute('href', '/shelters');
});
