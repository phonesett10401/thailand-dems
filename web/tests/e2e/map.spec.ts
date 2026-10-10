import { expect, test } from './fixtures';

const currentFlood = JSON.stringify({
	features: [
		{
			geometry: { type: 'Point', coordinates: [100.6, 14.0] },
			properties: { eventtype: 'FL', eventid: 9, name: 'Flood in Ayutthaya', alertlevel: 'Red', iscurrent: 'true', fromdate: '2026-10-09T00:00:00', url: { report: 'https://gdacs.org/x' } }
		}
	]
});

test('the map loads its worker without errors', async ({ page }) => {
	const errors: string[] = [];
	page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
	page.on('pageerror', (err) => errors.push(err.message));
	await page.goto('/map');
	await expect(page.locator('.maplibregl-canvas')).toBeVisible();
	const box = await page.locator('.maplibregl-map').boundingBox();
	expect(box?.height).toBeGreaterThan(400);
	await page.waitForTimeout(1500);
	expect(errors.filter((e) => /worker/i.test(e))).toEqual([]);
});

test('layer chips toggle hazard types and shelters', async ({ page }) => {
	await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: currentFlood }));
	await page.goto('/map');
	const layers = page.getByRole('group', { name: 'Map layers' });
	const chip = layers.getByRole('button', { name: 'Flooding' });
	await expect(chip).toHaveAttribute('aria-pressed', 'true');
	await chip.click();
	await expect(chip).toHaveAttribute('aria-pressed', 'false');
	await expect(layers.getByRole('button', { name: 'Shelters' })).toHaveAttribute('aria-pressed', 'true');
});

test('floating Report button goes to the report form', async ({ page }) => {
	await page.goto('/map');
	await expect(page.getByRole('link', { name: 'Report' })).toHaveAttribute('href', '/report');
});

test('no WebGL: map area explains itself', async ({ page }) => {
	await page.addInitScript(() => {
		const orig = HTMLCanvasElement.prototype.getContext;
		// @ts-expect-error test override
		HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
			return type.startsWith('webgl') ? null : orig.call(this, type, ...rest);
		};
	});
	await page.goto('/map');
	await expect(page.getByText("Map can't be shown on this device.")).toBeVisible();
});

test.describe('desktop', () => {
	test.use({ viewport: { width: 1440, height: 900 } });
	test('lists every hazard on the left', async ({ page }) => {
		await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: currentFlood }));
		await page.goto('/map');
		await expect(page.getByRole('heading', { name: 'Hazards in Thailand' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Flooding.*Flood in Ayutthaya/ })).toBeVisible();
	});
});
