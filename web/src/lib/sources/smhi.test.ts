import { describe, expect, it } from 'vitest';
import raw from './fixtures/smhi-warnings.json';
import { normaliseSmhi } from './smhi';

describe('normaliseSmhi', () => {
	const w = normaliseSmhi(raw);
	it('maps Yellow → watch and Orange/Red → warning, one row per affected area', () => {
		expect(w.filter((x) => x.areaId === 1)).toEqual([expect.objectContaining({ level: 'warning', event: 'Wind', code: 'WIND' })]);
		expect(w.filter((x) => x.code === 'SNOW').map((x) => x.areaId).sort()).toEqual([24, 25]);
		expect(w.find((x) => x.code === 'RAIN')?.level).toBe('warning');
	});
	it('ignores MESSAGE and any unknown level', () => expect(w.some((x) => x.code === 'WATER_SHORTAGE')).toBe(false));
	it('survives junk', () => {
		expect(normaliseSmhi(null)).toEqual([]);
		expect(normaliseSmhi([{ nope: 1 }])).toEqual([]);
	});
});
