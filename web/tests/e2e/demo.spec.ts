import { expect, test } from './fixtures';

// Playwright's Chromium can't play H.264, so we check intent: the right sources, the frame shape, and play() calls.
test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => {
		(window as unknown as { __plays: number }).__plays = 0;
		HTMLMediaElement.prototype.play = function () {
			(window as unknown as { __plays: number }).__plays++;
			return Promise.resolve();
		};
	});
});

const ratio = (page: import('@playwright/test').Page) =>
	page.locator('.demo-frame').evaluate((el) => {
		const r = el.getBoundingClientRect();
		return Math.round((r.width / r.height) * 100) / 100;
	});

test('upright phone gets the vertical video; the page explains DEMS', async ({ page }) => {
	await page.goto('/demo');
	await expect(page.getByRole('heading', { name: 'Disaster alerts, explained', level: 1 })).toBeVisible();
	const sources = page.locator('video source');
	await expect(sources.first()).toHaveAttribute('src', '/demo/demo-9x16.mp4');
	await expect(sources.first()).toHaveAttribute('media', '(max-width: 767px) and (orientation: portrait)');
	await expect(sources.nth(1)).toHaveAttribute('src', '/demo/demo-16x9.mp4');
	expect(await ratio(page)).toBeCloseTo(0.56, 1);
	await expect(page.getByText(/not official warnings/)).toBeVisible();
});

for (const [name, size] of [['landscape phone', { width: 915, height: 412 }], ['tablet', { width: 1024, height: 768 }]] as const) {
	test(`${name} gets the wide video frame`, async ({ page }) => {
		await page.setViewportSize(size);
		await page.goto('/demo');
		expect(await ratio(page)).toBeCloseTo(1.78, 1);
	});
}

test('landscape phone: the whole video frame fits on screen (controls reachable)', async ({ page }) => {
	await page.setViewportSize({ width: 915, height: 412 });
	await page.goto('/demo');
	const bottom = await page.locator('.demo-frame').evaluate((el) => el.getBoundingClientRect().bottom);
	expect(bottom).toBeLessThanOrEqual(412);
});

test('autoplays muted, and the sound button unmutes', async ({ page }) => {
	await page.goto('/demo');
	await expect.poll(() => page.evaluate(() => (window as unknown as { __plays: number }).__plays)).toBeGreaterThan(0);
	const video = page.locator('video');
	expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
	await page.getByRole('button', { name: 'Sound' }).click();
	await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'true');
	expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(false);
});

test('reduced motion: the video does not start by itself', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/demo');
	await page.waitForLoadState('networkidle');
	expect(await page.evaluate(() => (window as unknown as { __plays: number }).__plays)).toBe(0);
});

test('Try the live app goes to Now; roles and under-the-hood sections work', async ({ page }) => {
	await page.goto('/demo');
	await expect(page.getByText('Phase 2')).toHaveCount(2);
	const arch = page.locator('details', { hasText: 'Architecture' });
	await arch.locator('summary').click();
	await expect(arch.getByText(/SvelteKit app does both/)).toBeVisible();
	await expect(page.getByText(/Watch above 37.5/)).toBeAttached();
	await page.getByRole('link', { name: 'Try the live app' }).click();
	await expect(page).toHaveURL(/\/$/);
});

test('Thai demo page is in Thai and plays the English video', async ({ page }) => {
	await page.goto('/th/demo');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('ระบบเตือนภัยพิบัติ อธิบายแบบเข้าใจง่าย');
	await expect(page.locator('video source').nth(1)).toHaveAttribute('src', '/demo/demo-16x9.mp4');
});
