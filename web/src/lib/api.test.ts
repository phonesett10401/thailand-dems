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
		expect(fetchFn).toHaveBeenCalledWith('http://x/api/shelters?country=TH', expect.anything());
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

describe('createApi countries', () => {
	it('sends the current country', async () => {
		const fetchFn = vi.fn(async () => json([]));
		const api = createApi('http://x/api', () => {}, fetchFn, () => 'SE');
		await api.shelters();
		expect((fetchFn.mock.calls[0] as unknown as [string])[0]).toMatch(/\/shelters\?country=SE$/);
	});
	it('falls back to an empty list outside Thailand (sample data is Thai)', async () => {
		const down = async () => {
			throw new TypeError('Failed to fetch');
		};
		const mm = createApi('http://x/api', () => {}, down, () => 'MM');
		expect((await mm.shelters()).data).toEqual([]);
		expect((await mm.disasters()).data).toEqual([]);
		expect((await mm.alerts()).data).toEqual([]);
		const th = createApi('http://x/api', () => {}, down, () => 'TH');
		expect((await th.shelters()).data).toEqual(sampleShelters);
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
	it('treats a server failure (5xx, e.g. paused database) as unreachable, not as a bad report', async () => {
		for (const status of [500, 502, 503]) {
			const down = createApi('http://x/api', () => {}, async () => json({ error: 'db' }, status));
			expect(await down.submitReport(report)).toEqual({ ok: false, reason: 'offline' });
		}
	});
	it('reports a rate limit separately', async () => {
		const limited = createApi('http://x/api', () => {}, async () => json({ error: 'Too many reports' }, 429));
		expect(await limited.submitReport(report)).toEqual({ ok: false, reason: 'limited' });
	});
	it('distinguishes no connection from a rejected report', async () => {
		const down = createApi('http://x/api', () => {}, async () => {
			throw new TypeError('Failed to fetch');
		});
		const rejected = createApi('http://x/api', () => {}, async () => json({ error: 'bad' }, 400));
		expect(await down.submitReport(report)).toEqual({ ok: false, reason: 'offline' });
		expect(await rejected.submitReport(report)).toEqual({ ok: false, reason: 'rejected' });
	});
});
