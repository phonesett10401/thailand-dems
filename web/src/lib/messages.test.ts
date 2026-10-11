import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import th from '../../messages/th.json';

describe('messages', () => {
	it('every English key has a Thai translation and vice versa', () => {
		const keys = (o: object) => Object.keys(o).filter((k) => k !== '$schema').sort();
		expect(keys(th)).toEqual(keys(en));
	});
	it('no empty strings', () => {
		for (const [k, v] of Object.entries({ ...en, ...th })) if (k !== '$schema') expect(String(v).trim(), k).not.toBe('');
	});
});
