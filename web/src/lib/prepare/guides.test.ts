import { describe, expect, it } from 'vitest';
import type { Hazard } from '../levels';
import { COUNTRIES } from '../countries';
import { bagFor, BASICS, defaultKit, EXTRAS, GUIDE, GUIDE_FOR, GUIDES, gx, guideForSmhi, KIT_NOTE, KITS, smhiCode, stepsFor } from './guides';

const holes = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((x) => x[0]).sort();
const hz = (type: Hazard['type'], level: Hazard['level'], sample = false): Hazard => ({
	id: type, type, level, name: null, value: null, km: null, lat: null, lon: null, time: null, source: 't', sample, url: null
});

describe('guides', () => {
	it('every guide has a title, a summary and at least 3 items per phase, in all three languages', () => {
		for (const id of GUIDES) {
			const g = GUIDE[id];
			for (const t of [g.title, g.summary, ...g.before, ...g.during, ...g.after]) {
				expect(t.en.trim(), id).not.toBe('');
				expect(t.th.trim(), id).not.toBe('');
				expect(t.my.trim(), id).not.toBe('');
				expect(holes(t.my), id).toEqual(holes(t.en));
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
		expect(stepsFor(hz('smoke', 'watch'), 'watch')).toEqual(GUIDE.smoke.before.slice(0, 3));
		expect(stepsFor(hz('smoke', 'warning'), 'warning')).toEqual(GUIDE.smoke.during.slice(0, 3));
		expect(stepsFor(hz('smoke', 'safe'), 'safe')).toEqual([]);
		expect(stepsFor(hz('volcano', 'warning'), 'warning')).toEqual([]);
	});
	it('has the cold and snow guides with life-critical steps', () => {
		expect(GUIDES).toContain('cold');
		expect(GUIDES).toContain('snow');
		const all = (id: 'cold' | 'snow') => [...GUIDE[id].before, ...GUIDE[id].during, ...GUIDE[id].after];
		for (const id of ['cold', 'snow'] as const) for (const t of all(id)) expect(t.th.trim(), id).not.toBe('');
		const during = GUIDE.cold.during.map((s) => gx(s, COUNTRIES.SE)).join(' | ');
		expect(during).toMatch(/hypotherm/i);
		expect(during).toMatch(/112/);
		expect(during).toMatch(/carbon monoxide|generator|indoors/i);
	});
	it('no guide text hardcodes a number or agency', () => {
		for (const id of GUIDES) {
			const g = GUIDE[id];
			for (const x of [g.title, g.summary, ...g.before, ...g.during, ...g.after]) expect(`${x.en} ${x.th} ${x.my}`, id).not.toMatch(/\d{3,4}|DDPM|TMD|SMHI|ปภ\.|กรมอุตุ/);
		}
	});
	it('maps real SMHI event codes to guides', () => {
		const want: Record<string, string | null> = {
			WIND: 'storm', WIND_MOUNTAINS: 'storm', WIND_SEA: 'storm', THUNDER: 'storm', SNOW: 'snow', RAIN: 'flood', HIGH_FLOW: 'flood', FLOODING: 'flood',
			HIGH_SEALEVEL: 'flood', HIGH_TEMPERATURES: 'heat', STRONG_COOLING: 'cold', WATER_SHORTAGE: null, LOW_SEA_LEVEL: null, FIRE: null, BLACK_ICE: null, ICE_ACCRETION: null
		};
		for (const [code, g] of Object.entries(want)) expect(guideForSmhi(code), code).toBe(g);
	});
	it('reads the SMHI code from an official hazard id', () => {
		expect(smhiCode(hz('official', 'watch'))).toBeNull();
		expect(smhiCode({ ...hz('official', 'watch'), id: 'smhi-HIGH_TEMPERATURES-1' })).toBe('HIGH_TEMPERATURES');
		expect(smhiCode({ ...hz('official', 'watch'), id: 'smhi-WIND-1-2' })).toBe('WIND');
		expect(smhiCode({ ...hz('smoke', 'watch'), id: 'smhi-WIND-1' })).toBeNull();
	});
	it('the life-critical step is among the three shown at Warning', () => {
		const en = (type: Hazard['type'], c: keyof typeof COUNTRIES = 'TH') => stepsFor(hz(type, 'warning'), 'warning').map((s) => gx(s, COUNTRIES[c])).join(' | ');
		expect(en('storm')).toMatch(/evacuate/);
		expect(en('heat')).toMatch(/1669/);
		expect(en('heat', 'SE')).toMatch(/call 112/);
		expect(en('heat', 'MM')).toMatch(/call 192/);
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
	it('cold kit', () => {
		const ids = bagFor('cold').map((i) => i.id);
		expect(bagFor('cold').slice(0, BASICS.length)).toEqual(BASICS);
		for (const id of ['warmlayers', 'hatgloves', 'powerbank', 'handwarmers', 'thermos']) expect(ids).toContain(id);
		expect(new Set(ids).size).toBe(ids.length);
	});
	it('masks only for smoke', () => {
		expect(bagFor('smoke').map((i) => i.id)).toContain('masks');
		expect(bagFor('flood').map((i) => i.id)).not.toContain('masks');
		expect(bagFor('chemical').map((i) => i.id)).not.toContain('masks');
	});
	it('every item and kit note has en, th and my text', () => {
		for (const n of Object.values(KIT_NOTE)) expect(n!.my.trim()).not.toBe('');
		for (const i of [...BASICS, ...Object.values(EXTRAS).flat()]) {
			expect(i.text.en.trim(), i.id).not.toBe('');
			expect(i.text.th.trim(), i.id).not.toBe('');
			expect(i.text.my.trim(), i.id).not.toBe('');
			expect(holes(i.text.my), i.id).toEqual(holes(i.text.en));
		}
	});
	it('defaultKit picks the worst live hazard that has a kit', () => {
		expect(defaultKit([])).toBeNull();
		expect(defaultKit([hz('smoke', 'warning', true)])).toBeNull();
		expect(defaultKit([hz('smoke', 'watch')])).toBe('smoke');
		expect(defaultKit([hz('heat', 'watch'), hz('flood', 'warning')])).toBe('flood');
		expect(defaultKit([hz('smoke', 'watch'), hz('flood', 'watch')])).toBe('smoke');
		expect(defaultKit([hz('smoke', 'safe')])).toBeNull();
		expect(defaultKit([hz('volcano', 'warning')])).toBeNull();
	});
	it('SMHI official warnings get steps and a kit through their event code', () => {
		const off = (code: string, level: Hazard['level'] = 'warning'): Hazard => ({ ...hz('official', level), id: `smhi-${code}-1` });
		expect(stepsFor(off('WIND'), 'warning')).toEqual(GUIDE.storm.during.slice(0, 3));
		expect(stepsFor(off('WIND', 'watch'), 'watch')).toEqual(GUIDE.storm.before.slice(0, 3));
		expect(stepsFor(off('FIRE'), 'warning')).toEqual([]);
		expect(defaultKit([off('WIND')])).toBe('storm');
		expect(defaultKit([off('SNOW')])).toBe('cold');
		expect(defaultKit([off('STRONG_COOLING')])).toBe('cold');
		expect(defaultKit([off('HIGH_FLOW')])).toBe('flood');
		expect(defaultKit([off('HIGH_TEMPERATURES')])).toBe('heat');
		expect(defaultKit([off('FIRE')])).toBeNull();
	});
});
