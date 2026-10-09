import { expect, test } from './fixtures';

test('home shows the shell, a sample alert and the nearest shelter', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Shelters' }).last()).toBeVisible();
	await expect(page.getByRole('alert')).toContainText('SAMPLE');
	await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toContainText('km away');
	await expect(page.getByText('Air quality (PM2.5)')).toBeVisible();
	await expect(page.getByText('41.2')).toBeVisible();
});

test('the map loads its worker without errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
	page.on('pageerror', (err) => errors.push(err.message));
	await page.goto('/');
	await expect(page.locator('.maplibregl-canvas')).toBeVisible();
	const box = await page.locator('.maplibregl-map').boundingBox();
	expect(box?.height).toBeGreaterThan(400);
	await page.waitForTimeout(1500);
	expect(errors.filter((e) => /worker/i.test(e))).toEqual([]);
});

test('Thai locale renders Thai labels', async ({ page }) => {
	await page.goto('/th');
	await expect(page.locator('html')).toHaveAttribute('lang', 'th');
	await expect(page.getByRole('link', { name: 'ที่พักพิง' }).last()).toBeVisible();
});

test.describe('backend down', () => {
	test.use({ backend: 'down' });
	test('shows the offline banner and still renders sample shelters', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Showing sample data: backend offline.')).toBeVisible();
		await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toContainText('km away');
	});
});

test('a public source being down only affects its own card', async ({ page }) => {
	await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ status: 503, body: '' }));
	await page.goto('/');
	await expect(page.getByText('Open-Meteo unavailable right now.')).toBeVisible();
	await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toBeVisible();
});

test('GDACS down on home offers a retry that recovers', async ({ page }) => {
	let fail = true;
	await page.route('https://www.gdacs.org/**', (r) =>
		fail ? r.fulfill({ status: 503, body: '' }) : r.fallback()
	);
	await page.goto('/');
	await expect(page.getByText('GDACS unavailable right now.')).toBeVisible();
	fail = false;
	await page.getByRole('button', { name: 'Try again' }).click();
	await expect(page.getByText('GDACS unavailable right now.')).toHaveCount(0);
	await expect(page.getByText('Flood in Thailand')).toBeVisible();
});

test('an empty forecast shows a dash, never "-Infinity"', async ({ page }) => {
	await page.route('https://api.open-meteo.com/**', (r) =>
		r.fulfill({
			contentType: 'application/json',
			body: JSON.stringify({
				current: { time: 1791518400, temperature_2m: 30, precipitation: 0, wind_speed_10m: 5, weather_code: 0 },
				hourly: { time: [], temperature_2m: [], precipitation_probability: [] },
				daily: { time: [], weather_code: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [] }
			})
		})
	);
	await page.goto('/');
	await expect(page.getByText('41.2')).toBeVisible();
	await expect(page.getByText(/Infinity/)).toHaveCount(0);
});

test('no WebGL: map area explains itself, actions still work', async ({ page }) => {
	await page.addInitScript(() => {
		const orig = HTMLCanvasElement.prototype.getContext;
		// @ts-expect-error test override
		HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
			return type.startsWith('webgl') ? null : orig.call(this, type, ...rest);
		};
	});
	await page.goto('/');
	await expect(page.getByText("Map can't be shown on this device.")).toBeVisible();
	await expect(page.getByRole('link', { name: /Find nearest shelter/ })).toBeVisible();
});

test.describe('geolocation denied', () => {
	test.use({ permissions: [] });
	test('asks for a province instead', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/');
		await page.getByRole('button', { name: 'Use my location' }).click();
		await expect(page.getByText('Location unavailable. Choose a province instead.')).toBeVisible();
	});
});
