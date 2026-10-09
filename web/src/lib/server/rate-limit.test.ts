import { describe, expect, it } from 'vitest';
import { allowed, ipHash, RATE } from './rate-limit';

describe('rate limit', () => {
	it('allows up to 5 reports per window', () => {
		expect(RATE).toEqual({ max: 5, windowMinutes: 10 });
		expect(allowed(4)).toBe(true);
		expect(allowed(5)).toBe(false);
	});
	it('hashes IPs with a salt and never returns the raw IP', () => {
		const h = ipHash('203.0.113.7', 'salt');
		expect(h).toMatch(/^[a-f0-9]{64}$/);
		expect(h).not.toContain('203');
		expect(ipHash('203.0.113.7', 'other')).not.toBe(h);
	});
});
