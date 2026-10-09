import { describe, expect, it, vi } from 'vitest';
import { createApi } from './api';
import sampleShelters from './sample/shelters.json';
import type { ReportInput } from './types';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const report: ReportInput = {
	DisasterType: 'Flood',
	Severity: 'Severe',
	Description: 'Water rising fast',
	ReportedLocation: 'Mae Rim',
	Latitude: null,
	Longitude: null,
	UserName: null,
	UserEmail: null,
	UserPhone: null
};

describe('createApi GET', () => {
	it('returns live data from the backend', async () => {
		const onOffline = vi.fn();
		const fetchFn = vi.fn(async () => json([{ ShelterID: 1 }]));
		const api = createApi('http://x/api', onOffline, fetchFn);
		expect(await api.shelters()).toEqual({ data: [{ ShelterID: 1 }], live: true });
		expect(fetchFn).toHaveBeenCalledWith('http://x/api/shelters', expect.anything());
		expect(onOffline).not.toHaveBeenCalled();
	});

	it('falls back to bundled sample data and flags offline when the backend is unreachable', async () => {
		const onOffline = vi.fn();
		const api = createApi('http://x/api', onOffline, async () => {
			throw new TypeError('Failed to fetch');
		});
		expect(await api.shelters()).toEqual({ data: sampleShelters, live: false });
		expect(onOffline).toHaveBeenCalledOnce();
	});

	it('also falls back on a server error', async () => {
		const onOffline = vi.fn();
		const api = createApi('http://x/api', onOffline, async () => json({ error: 'db down' }, 500));
		expect((await api.shelters()).live).toBe(false);
		expect(onOffline).toHaveBeenCalledOnce();
	});
});

describe('createApi submitReport', () => {
	it('posts JSON and reports success', async () => {
		const fetchFn = vi.fn(async () => json({ reportId: 5 }, 201));
		const api = createApi('http://x/api', () => {}, fetchFn);
		expect(await api.submitReport(report)).toEqual({ ok: true });
		const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('http://x/api/reports');
		expect(init.method).toBe('POST');
		expect(JSON.parse(init.body as string)).toEqual(report);
	});
	it('reports a rate limit separately', async () => {
		const limited = createApi('http://x/api', () => {}, async () => json({ error: 'Too many reports' }, 429));
		expect(await limited.submitReport(report)).toEqual({ ok: false, reason: 'limited' });
	});
	it('distinguishes no connection from a rejected report', async () => {
		const down = createApi('http://x/api', () => {}, async () => {
			throw new TypeError('Failed to fetch');
		});
		const rejected = createApi('http://x/api', () => {}, async () => json({ error: 'bad' }, 500));
		expect(await down.submitReport(report)).toEqual({ ok: false, reason: 'offline' });
		expect(await rejected.submitReport(report)).toEqual({ ok: false, reason: 'rejected' });
	});
});
