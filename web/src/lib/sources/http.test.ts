import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCache, fetchJson, sourced } from './http';

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

describe('fetchJson', () => {
	beforeEach(() => clearCache());

	it('returns parsed JSON and caches by URL', async () => {
		const f = vi.fn(async () => ok({ a: 1 }));
		expect(await fetchJson('u1', { fetchFn: f })).toEqual({ a: 1 });
		expect(await fetchJson('u1', { fetchFn: f })).toEqual({ a: 1 });
		expect(f).toHaveBeenCalledTimes(1);
	});

	it('returns null for 204 No Content', async () => {
		expect(await fetchJson('u2', { fetchFn: async () => new Response(null, { status: 204 }) })).toBeNull();
	});

	it('throws on HTTP errors and does not cache the failure', async () => {
		const f = vi.fn(async () => new Response('x', { status: 503 }));
		await expect(fetchJson('u3', { fetchFn: f })).rejects.toThrow('503');
		await expect(fetchJson('u3', { fetchFn: f })).rejects.toThrow('503');
		expect(f).toHaveBeenCalledTimes(2);
	});
});

describe('sourced', () => {
	it('wraps data with source and time', async () => {
		const r = await sourced('Open-Meteo', async () => 42);
		expect(r).toEqual({ data: 42, source: 'Open-Meteo', updatedAt: expect.any(Date) });
	});
	it('turns failures into an error marker instead of throwing', async () => {
		const r = await sourced('USGS', async () => {
			throw new Error('timeout');
		});
		expect(r).toEqual({ error: true, source: 'USGS' });
	});
});
