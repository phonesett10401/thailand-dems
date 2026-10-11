import { describe, expect, it } from 'vitest';
import type { Hazard } from '../levels';
import { bagFor, BASICS, defaultKit, EXTRAS, GUIDE, GUIDE_FOR, GUIDES, KITS, NUMBERS, stepsFor } from './guides';

const hz = (type: Hazard['type'], level: Hazard['level'], sample = false): Hazard => ({
	id: type, type, level, name: null, value: null, km: null, lat: null, lon: null, time: null, source: 't', sample, url: null
});

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
	it('emergency numbers include 1784', () => {
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

describe('go-bag by emergency', () => {
	it('bagFor(null) is the basics', () => expect(bagFor(null)).toEqual(BASICS));
	it('every kit starts with the basics, has unique ids and holds its extras', () => {
		for (const k of KITS) {
			const bag = bagFor(k);
			expect(bag.slice(0, BASICS.length), k).toEqual(BASICS);
			expect(new Set(bag.map((i) => i.id)).size, k).toBe(bag.length);
			for (const e of EXTRAS[k]) expect(bag.map((i) => i.id), k).toContain(e.id);
		}
	});
	it('masks only for smoke', () => {
		expect(bagFor('smoke').map((i) => i.id)).toContain('masks');
		expect(bagFor('flood').map((i) => i.id)).not.toContain('masks');
	});
	it('every item has en and th text', () => {
		for (const i of [...BASICS, ...Object.values(EXTRAS).flat()]) {
			expect(i.text.en.trim(), i.id).not.toBe('');
			expect(i.text.th.trim(), i.id).not.toBe('');
		}
	});
	it('defaultKit picks the worst live hazard that has a kit', () => {
		expect(defaultKit([])).toBeNull();
		expect(defaultKit([hz('smoke', 'warning', true)])).toBeNull();
		expect(defaultKit([hz('smoke', 'watch')])).toBe('smoke');
		expect(defaultKit([hz('heat', 'watch'), hz('flood', 'warning')])).toBe('flood');
		expect(defaultKit([hz('smoke', 'safe')])).toBeNull();
		expect(defaultKit([hz('volcano', 'warning')])).toBeNull();
	});
});
