import { describe, expect, it } from 'vitest';
import { parseReport } from './report-input';

const good = {
	DisasterType: 'Flood',
	Severity: 'Severe',
	Description: 'Water rising fast',
	ReportedLocation: 'Mae Rim',
	Latitude: 18.9,
	Longitude: 98.9,
	UserName: null,
	UserEmail: null,
	UserPhone: null
};

describe('parseReport', () => {
	it('accepts a valid report', () => {
		expect(parseReport(good)).toEqual({ ok: true, value: good });
	});
	it('rejects unknown enums, empty text and impossible coordinates', () => {
		expect(parseReport({ ...good, DisasterType: 'Meteor' }).ok).toBe(false);
		expect(parseReport({ ...good, Severity: 'Huge' }).ok).toBe(false);
		expect(parseReport({ ...good, Description: '   ' }).ok).toBe(false);
		expect(parseReport({ ...good, Latitude: 120 }).ok).toBe(false);
		expect(parseReport({ ...good, Longitude: 'east' }).ok).toBe(false);
		expect(parseReport(null).ok).toBe(false);
	});
	it('enforces database column limits', () => {
		expect(parseReport({ ...good, UserPhone: '0'.repeat(21) }).ok).toBe(false);
		expect(parseReport({ ...good, ReportedLocation: 'p'.repeat(256) }).ok).toBe(false);
		expect(parseReport({ ...good, Description: 'd'.repeat(2001) }).ok).toBe(false);
	});
});
