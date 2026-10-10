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
	const chip = page.getByRole('button', { name: 'Flooding', exact: true });
	await expect(chip).toHaveAttribute('aria-pressed', 'true');
	await chip.click();
	await expect(chip).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByRole('button', { name: 'Shelters', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('floating Report button goes to the report form', async ({ page }) => {
	await page.goto('/map');
	await expect(page.getByRole('link', { name: 'Report' })).toHaveAttribute('href', '/report');
});

test('phone: List chip shows every hazard', async ({ page }) => {
	await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: currentFlood }));
	await page.goto('/map');
	const row = page.getByRole('button', { name: /^Flooding Flood in Ayutthaya/ });
	await expect(row).toBeHidden();
	await page.getByRole('button', { name: 'List', exact: true }).click();
	await expect(row).toBeVisible();
});

test('no WebGL: map area explains itself', async ({ page }) => {
	await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: currentFlood }));
	await page.addInitScript(() => {
		const orig = HTMLCanvasElement.prototype.getContext;
		// @ts-expect-error test override
		HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
			return type.startsWith('webgl') ? null : orig.call(this, type, ...rest);
		};
	});
	await page.goto('/map');
	await expect(page.getByText("Map can't be shown on this device.")).toBeVisible();
	await expect(page.getByRole('button', { name: /^Flooding Flood in Ayutthaya/ })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Report' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'List', exact: true })).toHaveCount(0);
});

test('marker hit areas are 44 px', async ({ page }) => {
	await page.goto('/map');
	const dot = page.locator('.map-dot-me');
	await expect(dot).toBeVisible();
	// 14 px dot + 2 px borders = 10 px padding box; inset -17 px each side makes 44.
	const inset = await dot.evaluate((el) => getComputedStyle(el, '::before').top);
	expect(inset).toBe('-17px');
	const other = await page.evaluate(() => {
		const d = document.createElement('div');
		d.className = 'map-dot';
		document.body.append(d);
		const t = getComputedStyle(d, '::before').top;
		d.remove();
		return t;
	});
	expect(other).toBe('-16px');
});

test.describe('desktop', () => {
	test.use({ viewport: { width: 1440, height: 900 } });
	test('lists every hazard on the left', async ({ page }) => {
		await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: currentFlood }));
		await page.goto('/map');
		await expect(page.getByRole('heading', { name: 'Hazards in Thailand' })).toBeVisible();
		await expect(page.getByRole('button', { name: /^Flooding Flood in Ayutthaya/ })).toBeVisible();
	});
});
