import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import th from '../../messages/th.json';
import my from '../../messages/my.json';

const keys = (o: object) => Object.keys(o).filter((k) => k !== '$schema').sort();
const holes = (s: string) => [...s.matchAll(/\{\w+\}/g)].map((x) => x[0]).sort();
const MY = /[က-႟]/;

describe('messages', () => {
	it('every English key has a Thai and a Burmese translation and vice versa', () => {
		expect(keys(th)).toEqual(keys(en));
		expect(keys(my)).toEqual(keys(en));
	});
	it('no empty strings', () => {
		for (const o of [en, th, my]) for (const [k, v] of Object.entries(o)) if (k !== '$schema') expect(String(v).trim(), k).not.toBe('');
	});
	it('Burmese is in Myanmar script, except names and symbols left as in English', () => {
		const e = en as Record<string, string>;
		for (const [k, v] of Object.entries(my as Record<string, string>)) {
			if (k === '$schema' || MY.test(v)) continue;
			expect(v, k).toBe(e[k]);
			expect(e[k].replace(/\{\w+\}/g, ''), k).not.toMatch(/[a-z]{4,}/); // placeholder names don't count
		}
	});
	it('translations keep every {placeholder}', () => {
		const e = en as Record<string, string>;
		for (const o of [th, my] as Record<string, string>[]) for (const k of keys(en)) expect(holes(o[k]), k).toEqual(holes(e[k]));
	});
});
