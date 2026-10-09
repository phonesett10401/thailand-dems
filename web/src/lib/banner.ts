import { LEVEL_RANK, levelOf } from './severity';
import type { DbAlert, HazardEvent } from './types';

export type Banner = { kind: 'live'; event: HazardEvent } | { kind: 'sample'; alert: DbAlert } | { kind: 'none' };

/**
 * Real current GDACS alerts win. Otherwise show the most severe active alert from the demo
 * database (rendered with a SAMPLE badge). Sample expiry dates are ignored: the sample data is
 * frozen in time, so filtering on them would hide it forever.
 */
export function pickBanner(events: HazardEvent[], alerts: DbAlert[]): Banner {
	const live = events
		.filter((e) => e.source === 'GDACS' && e.current)
		.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level])[0];
	if (live) return { kind: 'live', event: live };

	const sample = alerts
		.filter((a) => a.Status === 'Active')
		.sort(
			(a, b) =>
				LEVEL_RANK[levelOf(b.Severity)] - LEVEL_RANK[levelOf(a.Severity)] || b.IssuedAt.localeCompare(a.IssuedAt)
		)[0];
	return sample ? { kind: 'sample', alert: sample } : { kind: 'none' };
}
