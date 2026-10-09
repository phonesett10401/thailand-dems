import { describe, expect, it } from 'vitest';
import { pickBanner } from './banner';
import type { DbAlert, HazardEvent } from './types';

const ev = (over: Partial<HazardEvent>): HazardEvent => ({
	id: 'GDACS-FL-1',
	source: 'GDACS',
	kind: 'flood',
	title: 'Flood in Thailand',
	level: 'warning',
	lat: 13,
	lon: 100,
	time: '2026-10-01T00:00:00Z',
	current: true,
	url: 'https://www.gdacs.org/x',
	...over
});
const al = (over: Partial<DbAlert>): DbAlert => ({
	AlertID: 1,
	AlertType: 'Early Warning',
	Severity: 'Warning',
	Title: 'Flood watch',
	Message: 'msg',
	AffectedRegion: 'Ayutthaya',
	IssuedAt: '2025-11-24T12:42:49.000Z',
	ExpiresAt: '2025-12-01T12:42:49.000Z',
	Status: 'Active',
	...over
});

describe('pickBanner', () => {
	it('prefers the most severe current GDACS event', () => {
		const b = pickBanner(
			[ev({ id: 'a', level: 'warning' }), ev({ id: 'b', level: 'danger' }), ev({ id: 'c', level: 'danger', current: false })],
			[al({})]
		);
		expect(b).toEqual({ kind: 'live', event: expect.objectContaining({ id: 'b' }) });
	});
	it('ignores non-current events and USGS quakes for the banner', () => {
		const b = pickBanner([ev({ current: false }), ev({ id: 'q', source: 'USGS', current: true })], []);
		expect(b).toEqual({ kind: 'none' });
	});
	it('falls back to the most severe active sample alert, newest first, ignoring expiry dates', () => {
		const b = pickBanner(
			[],
			[
				al({ AlertID: 1, Severity: 'Warning' }),
				al({ AlertID: 2, Severity: 'Emergency', IssuedAt: '2025-01-01T00:00:00Z' }),
				al({ AlertID: 3, Severity: 'Emergency', IssuedAt: '2025-06-01T00:00:00Z' }),
				al({ AlertID: 4, Severity: 'Emergency', Status: 'Expired' })
			]
		);
		expect(b).toEqual({ kind: 'sample', alert: expect.objectContaining({ AlertID: 3 }) });
	});
	it('returns none when nothing is active', () => {
		expect(pickBanner([], [al({ Status: 'Cancelled' })])).toEqual({ kind: 'none' });
	});
});
