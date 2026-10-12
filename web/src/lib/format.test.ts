import { describe, expect, it } from 'vitest';
import { fmtDate, fmtTime } from './format';
import { setCountry } from './country.svelte';

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

describe('format in Burmese', () => {
	it('formats a date without throwing', () => {
		expect(typeof fmtDate(d, 'my')).toBe('string');
		expect(fmtTime(d, 'my')).toBe('11:05');
	});
});

describe('format follows the country time zone', () => {
	it('shows the same instant as different clock times', () => {
		const t: Record<string, string> = {};
		for (const c of ['TH', 'MM', 'SE'] as const) {
			setCountry(c);
			t[c] = fmtTime(d, 'en');
		}
		setCountry('TH');
		expect(t).toEqual({ TH: '11:05', MM: '10:35', SE: '06:05' });
	});
	it('rolls the date over per country', () => {
		const late = new Date('2026-12-31T18:00:00Z'); // 01:00 1 Jan in Bangkok, 19:00 31 Dec in Stockholm
		setCountry('SE');
		const se = fmtDate(late, 'en');
		setCountry('TH');
		expect(se).toContain('2026');
		expect(fmtDate(late, 'en')).toContain('2027');
	});
});
