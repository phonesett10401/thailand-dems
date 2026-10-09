import type { ReportInput, ReportSeverity, ReportType } from './types';

export type ReportForm = {
	type: ReportType | '';
	severity: ReportSeverity | '';
	description: string;
	place: string;
	lat: number | null;
	lon: number | null;
	name: string;
	email: string;
	phone: string;
};

export const emptyForm = (): ReportForm => ({
	type: '',
	severity: '',
	description: '',
	place: '',
	lat: null,
	lon: null,
	name: '',
	email: '',
	phone: ''
});

export type StepErrors = Partial<Record<'type' | 'severity' | 'description' | 'place', 'required' | 'short'>>;

export function validateStep(step: 1 | 2, f: ReportForm): StepErrors {
	const e: StepErrors = {};
	if (step === 1) {
		if (!f.type) e.type = 'required';
		if (!f.severity) e.severity = 'required';
		const d = f.description.trim();
		if (!d) e.description = 'required';
		else if (d.length < 10) e.description = 'short';
	} else if (!f.place.trim() && f.lat === null) {
		e.place = 'required';
	}
	return e;
}

/** Column limits from backend/db/create-user-reports.sql. */
const cut = (s: string, n: number): string | null => {
	const t = s.trim().slice(0, n);
	return t === '' ? null : t;
};

export function toReportInput(f: ReportForm): ReportInput {
	const coords = f.lat !== null && f.lon !== null ? `${f.lat.toFixed(5)}, ${f.lon.toFixed(5)}` : '';
	return {
		DisasterType: f.type as ReportType,
		Severity: f.severity as ReportSeverity,
		Description: f.description.trim().slice(0, 2000),
		ReportedLocation: cut(f.place, 255) ?? coords,
		Latitude: f.lat,
		Longitude: f.lon,
		UserName: cut(f.name, 100),
		UserEmail: cut(f.email, 100),
		UserPhone: cut(f.phone, 20)
	};
}
