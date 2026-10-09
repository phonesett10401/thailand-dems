import { describe, expect, it } from 'vitest';
import { emptyForm, toReportInput, validateStep } from './report';

describe('validateStep', () => {
	it('step 1 requires type, severity and a description of 10+ characters', () => {
		expect(validateStep(1, emptyForm())).toEqual({ type: 'required', severity: 'required', description: 'required' });
		const f = { ...emptyForm(), type: 'Flood' as const, severity: 'Severe' as const, description: '  short  ' };
		expect(validateStep(1, f)).toEqual({ description: 'short' });
		expect(validateStep(1, { ...f, description: 'Water up to the knees on Rama 2' })).toEqual({});
	});
	it('step 2 needs a place name or GPS coordinates', () => {
		expect(validateStep(2, emptyForm())).toEqual({ place: 'required' });
		expect(validateStep(2, { ...emptyForm(), place: 'Mae Rim market' })).toEqual({});
		expect(validateStep(2, { ...emptyForm(), lat: 18.9, lon: 98.9 })).toEqual({});
	});
});

describe('toReportInput', () => {
	const base = {
		...emptyForm(),
		type: 'Flood' as const,
		severity: 'Severe' as const,
		description: '  Water rising fast  ',
		place: ' Mae Rim '
	};
	it('trims text and turns empty optional fields into null', () => {
		expect(toReportInput(base)).toEqual({
			DisasterType: 'Flood',
			Severity: 'Severe',
			Description: 'Water rising fast',
			ReportedLocation: 'Mae Rim',
			Latitude: null,
			Longitude: null,
			UserName: null,
			UserEmail: null,
			UserPhone: null
		});
	});
	it('uses coordinates as the place when no place name is given', () => {
		const out = toReportInput({ ...base, place: '', lat: 18.912345678, lon: 98.912345678 });
		expect(out.ReportedLocation).toBe('18.91235, 98.91235');
		expect(out.Latitude).toBe(18.912345678);
	});
	it('cuts fields to the database column limits', () => {
		const out = toReportInput({ ...base, name: 'n'.repeat(150), email: 'e'.repeat(150), phone: '0'.repeat(30), place: 'p'.repeat(300) });
		expect(out.UserName).toHaveLength(100);
		expect(out.UserEmail).toHaveLength(100);
		expect(out.UserPhone).toHaveLength(20);
		expect(out.ReportedLocation).toHaveLength(255);
	});
});
