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

test('a type with only sample hazards gets a grey chip dot, not red or amber', async ({ page }) => {
	await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ contentType: 'application/json', body: '{"features":[]}' }));
	await page.route('https://flood-api.open-meteo.com/**', (r) => r.abort());
	await page.goto('/map');
	const dot = page.getByRole('button', { name: 'Flooding', exact: true }).locator('i');
	await expect(dot).toBeVisible();
	await expect(dot).toHaveCSS('background-color', 'rgb(107, 107, 114)');
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
	await expect.poll(() => dot.evaluate((el) => getComputedStyle(el, '::before').top)).toBe('-17px');
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

test('readings for your own spot (haze) are drawn at your location and follow their chip', async ({ page }) => {
	await page.goto('/map');
	const haze = page.getByRole('button', { name: 'Haze · Watch' });
	await expect(haze).toBeVisible();
	await page.getByRole('button', { name: 'Haze', exact: true }).click();
	await expect(haze).toHaveCount(0);
});

test('the map says it shows the whole region, not just what is near you', async ({ page }) => {
	await page.goto('/map');
	await expect(page.getByText('The map shows the whole region. Your level only counts hazards near you.')).toBeVisible();
});
