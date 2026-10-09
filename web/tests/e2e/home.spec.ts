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
