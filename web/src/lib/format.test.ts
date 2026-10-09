import { describe, expect, it } from 'vitest';
import { fmtDate, fmtTime } from './format';

const d = new Date('2026-10-09T04:05:00Z'); // 11:05 in Bangkok

describe('format', () => {
	it('shows Bangkok time', () => {
		expect(fmtTime(d, 'en')).toBe('11:05');
	});
	it('uses Buddhist-era years in Thai', () => {
		expect(fmtDate(d, 'th')).toContain('2569');
		expect(fmtDate(d, 'en')).toContain('2026');
	});
});
