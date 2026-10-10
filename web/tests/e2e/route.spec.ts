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

test('hazards that arrive after the first request trigger a re-request with avoid zones', async ({ page }) => {
	const flood = JSON.stringify({
		features: [
			{
				geometry: { type: 'Point', coordinates: [100.53, 13.74] },
				properties: { eventtype: 'FL', eventid: 9, name: 'Flood in Bangkok', alertlevel: 'Red', iscurrent: 'true', fromdate: '2026-10-09T00:00:00', url: { report: 'https://gdacs.org/x' } }
			}
		]
	});
	await page.route('https://www.gdacs.org/**', async (r) => {
		await new Promise((res) => setTimeout(res, 1500));
		await r.fulfill({ contentType: 'application/json', body: flood });
	});
	const avoids: number[] = [];
	page.on('request', (r) => r.url().endsWith('/api/route') && avoids.push(JSON.parse(r.postData() ?? '{}').avoid.length));
	await page.goto('/route?to=shelter:2');
	await expect.poll(() => avoids.some((n) => n >= 1), { timeout: 10_000 }).toBe(true);
});

test.describe('location permission denied', () => {
	test.use({ permissions: [] });
	test('Start explains the failure and stays Start', async ({ page }) => {
		await page.goto('/route?to=shelter:2');
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByText('Couldn\x27t get your location. Check location permission.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Stop' })).toHaveCount(0);
	});
});
