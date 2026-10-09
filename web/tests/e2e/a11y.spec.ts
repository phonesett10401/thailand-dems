import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

for (const path of ['/', '/disasters', '/shelters', '/evacuation', '/weather', '/report', '/info', '/th']) {
	test(`no serious accessibility violations on ${path}`, async ({ page }) => {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
		const bad = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
		expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
	});
}
