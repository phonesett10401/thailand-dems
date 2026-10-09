import { REPORT_SEVERITIES, REPORT_TYPES, type ReportInput } from '$lib/types';

type Result = { ok: true; value: ReportInput } | { ok: false; error: string };

const optText = (v: unknown, max: number) =>
	v === null || v === undefined || (typeof v === 'string' && v.length <= max);
const optCoord = (v: unknown, limit: number) =>
	v === null || v === undefined || (typeof v === 'number' && Math.abs(v) <= limit);

/** Validates an untrusted report body against the DB enums and column limits. */
export function parseReport(body: unknown): Result {
	if (!body || typeof body !== 'object') return { ok: false, error: 'Invalid body' };
	const b = body as Record<string, unknown>;
	if (!REPORT_TYPES.includes(b.DisasterType as never)) return { ok: false, error: 'DisasterType' };
	if (!REPORT_SEVERITIES.includes(b.Severity as never)) return { ok: false, error: 'Severity' };
	if (typeof b.Description !== 'string' || !b.Description.trim() || b.Description.length > 2000)
		return { ok: false, error: 'Description' };
	if (typeof b.ReportedLocation !== 'string' || b.ReportedLocation.length > 255)
		return { ok: false, error: 'ReportedLocation' };
	if (!optCoord(b.Latitude, 90) || !optCoord(b.Longitude, 180)) return { ok: false, error: 'Coordinates' };
	if (!optText(b.UserName, 100) || !optText(b.UserEmail, 100) || !optText(b.UserPhone, 20))
		return { ok: false, error: 'Contact' };
	return {
		ok: true,
		value: {
			DisasterType: b.DisasterType as ReportInput['DisasterType'],
			Severity: b.Severity as ReportInput['Severity'],
			Description: b.Description,
			ReportedLocation: b.ReportedLocation,
			Latitude: (b.Latitude as number | null) ?? null,
			Longitude: (b.Longitude as number | null) ?? null,
			UserName: (b.UserName as string | null) ?? null,
			UserEmail: (b.UserEmail as string | null) ?? null,
			UserPhone: (b.UserPhone as string | null) ?? null
		}
	};
}
