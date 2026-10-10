import { describe, expect, it } from 'vitest';
import { GO_BAG, GUIDE, GUIDE_FOR, GUIDES, NUMBERS, stepsFor } from './guides';

describe('guides', () => {
	it('every guide has a title, a summary and at least 3 items per phase, in both languages', () => {
		for (const id of GUIDES) {
			const g = GUIDE[id];
			for (const t of [g.title, g.summary, ...g.before, ...g.during, ...g.after]) {
				expect(t.en.trim(), id).not.toBe('');
				expect(t.th.trim(), id).not.toBe('');
			}
			expect(g.before.length, id).toBeGreaterThanOrEqual(3);
			expect(g.during.length, id).toBeGreaterThanOrEqual(3);
			expect(g.after.length, id).toBeGreaterThanOrEqual(3);
		}
	});
	it('maps hazards to guides', () => {
		expect(GUIDE_FOR.rain).toBe('flash-flood');
		expect(GUIDE_FOR.wildfire).toBe('smoke');
		expect(GUIDE_FOR.volcano).toBeUndefined();
	});
	it('what-to-do steps: watch = first 3 Before, warning = first 3 During, safe = none', () => {
		expect(stepsFor('smoke', 'watch')).toEqual(GUIDE.smoke.before.slice(0, 3));
		expect(stepsFor('smoke', 'warning')).toEqual(GUIDE.smoke.during.slice(0, 3));
		expect(stepsFor('smoke', 'safe')).toEqual([]);
		expect(stepsFor('volcano', 'warning')).toEqual([]);
	});
	it('go-bag ids are unique and emergency numbers include 1784', () => {
		expect(new Set(GO_BAG.map((i) => i.id)).size).toBe(GO_BAG.length);
		expect(NUMBERS.map((n) => n.tel)).toEqual(['1784', '1669', '191', '199', '1155', '1182']);
	});
	it('the life-critical step is among the three shown at Warning', () => {
		const en = (type: Parameters<typeof stepsFor>[0]) => stepsFor(type, 'warning').map((s) => s.en).join(' | ');
		expect(en('storm')).toMatch(/evacuate/);
		expect(en('heat')).toMatch(/1669/);
		expect(en('tsunami')).toMatch(/30 m/);
		expect(en('flood')).toMatch(/only if you are dry/);
	});
});
