import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

for (const path of ['/', '/map', '/shelters', '/report', '/th', '/route?to=shelter:2', '/prepare', '/prepare/flood', '/more', '/about', '/demo', '/th/demo']) {
	test(`no serious accessibility violations on ${path}`, async ({ page }) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		if (path.includes('demo')) await page.locator('details').evaluateAll((ds) => ds.forEach((d) => d.setAttribute('open', '')));
		const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
		const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
	});
}
