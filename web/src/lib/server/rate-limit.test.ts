import { describe, expect, it } from 'vitest';
import { ipHash, RATE, rateLimitSalt } from './rate-limit';

describe('rate limit', () => {
	it('allows 5 reports per 10-minute window', () => {
		expect(RATE).toEqual({ max: 5, windowMinutes: 10 });
	});
	it('hashes IPs with a salt and never returns the raw IP', () => {
		const h = ipHash('203.0.113.7', 'salt');
		expect(h).toMatch(/^[a-f0-9]{64}$/);
		expect(h).not.toContain('203');
		expect(ipHash('203.0.113.7', 'other')).not.toBe(h);
	});
	it('refuses to hash with a missing or short salt (a known salt makes IP hashes reversible)', () => {
		expect(() => rateLimitSalt(undefined)).toThrow();
		expect(() => rateLimitSalt('dev')).toThrow();
		expect(rateLimitSalt('sb_secret_0123456789abcdef')).toBe('sb_secret_0123456789abcdef');
	});
});
