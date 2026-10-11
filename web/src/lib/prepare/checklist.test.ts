import { describe, expect, it } from 'vitest';
import { CHECK_KEY, loadChecks, saveChecks, toggled } from './checklist';

const mem = () => {
	const s = new Map<string, string>();
	return { getItem: (k: string) => s.get(k) ?? null, setItem: (k: string, v: string) => void s.set(k, v) };
};
const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };

describe('go-bag checklist', () => {
	it('round-trips through storage', () => {
		const st = mem();
		saveChecks(new Set(['water', 'meds']), st);
		expect([...loadChecks(st)].sort()).toEqual(['meds', 'water']);
		expect(st.getItem(CHECK_KEY)).toBe('["water","meds"]');
	});
	it('toggles without mutating', () => {
		const a = new Set(['water']);
		const b = toggled(a, 'water');
		expect(a.has('water')).toBe(true);
		expect(b.has('water')).toBe(false);
		expect(toggled(b, 'food').has('food')).toBe(true);
	});
	it('blocked or corrupt storage never throws', () => {
		expect(loadChecks(broken)).toEqual(new Set());
		expect(() => saveChecks(new Set(['x']), broken)).not.toThrow();
		const st = mem();
		st.setItem(CHECK_KEY, '{not json');
		expect(loadChecks(st)).toEqual(new Set());
		expect(loadChecks(null)).toEqual(new Set());
	});
});
