import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearRouteCache, orsRoute, parseRouteReq } from './route';

const BKK = { lat: 13.7563, lon: 100.5018 };
const DEST = { lat: 13.73, lon: 100.53 };
const ok = (avoid: unknown[] = []) => ({ from: BKK, to: DEST, mode: 'foot', avoid });
const ORS = {
	features: [
		{
			geometry: { coordinates: [[100.5018, 13.7563], [100.51, 13.75], [100.53, 13.73]] },
			properties: {
				summary: { distance: 1234.5, duration: 900 },
				segments: [
					{
						steps: [
							{ distance: 400, duration: 300, type: 11, name: 'Rama IV Road', way_points: [0, 1] },
							{ distance: 834.5, duration: 600, type: 0, name: '-', way_points: [1, 2] },
							{ distance: 0, duration: 0, type: 10, name: '-', way_points: [2, 2] }
						]
					}
				]
			}
		}
	]
};
const res = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });

describe('parseRouteReq', () => {
	it('accepts a valid request', () => {
		expect(parseRouteReq(ok([{ lat: 13.8, lon: 100.5, km: 10 }]))).toEqual({ ok: true, value: { from: BKK, to: DEST, mode: 'foot', avoid: [{ lat: 13.8, lon: 100.5, km: 10 }] } });
	});
	it.each([
		[null, 'Body must be JSON'],
		[{ ...ok(), from: { lat: 'x', lon: 1 } }, 'from and to need lat and lon'],
		[{ ...ok(), to: { lat: 35.6, lon: 139.7 } }, 'outside Thailand'],
		[{ ...ok(), mode: 'plane' }, 'mode must be foot, car or bike'],
		[ok(Array.from({ length: 11 }, () => ({ lat: 13.8, lon: 100.5, km: 1 }))), 'at most 10 avoid zones'],
		[ok([{ lat: 13.8, lon: 100.5, km: 16 }]), 'each zone needs lat, lon and km (0–15)']
	])('rejects %j', (body, error) => {
		expect(parseRouteReq(body)).toEqual({ ok: false, error });
	});
});

describe('orsRoute', () => {
	beforeEach(() => clearRouteCache());
	const q = parseRouteReq(ok([{ lat: 13.8, lon: 100.5, km: 10 }])) as { ok: true; value: Parameters<typeof orsRoute>[0] };

	it('calls ORS with the profile, key, coordinates and avoid polygons, and maps the answer', async () => {
		const f = vi.fn(async () => res(200, ORS));
		const r = await orsRoute(q.value, 'KEY', f as typeof fetch, 0);
		const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://api.heigit.org/openrouteservice/v2/directions/foot-walking/geojson');
		expect((init.headers as Record<string, string>).Authorization).toBe('KEY');
		const body = JSON.parse(init.body as string);
		expect(body.coordinates).toEqual([[100.5018, 13.7563], [100.53, 13.73]]);
		expect(body.options.avoid_polygons.type).toBe('MultiPolygon');
		expect(r).toEqual({
			line: [[100.5018, 13.7563], [100.51, 13.75], [100.53, 13.73]],
			distance: 1234.5,
			duration: 900,
			steps: [
				{ type: 11, name: 'Rama IV Road', distance: 400, duration: 300, at: 0 },
				{ type: 0, name: '', distance: 834.5, duration: 600, at: 1 },
				{ type: 10, name: '', distance: 0, duration: 0, at: 2 }
			],
			avoided: true
		});
	});
	it('retries without avoid polygons when ORS rejects them, and says so', async () => {
		const f = vi.fn().mockResolvedValueOnce(res(400, { error: { code: 2003 } })).mockResolvedValueOnce(res(200, ORS));
		const r = await orsRoute(q.value, 'KEY', f as typeof fetch, 0);
		expect(f).toHaveBeenCalledTimes(2);
		expect(JSON.parse((f.mock.calls[1][1] as RequestInit).body as string).options).toBeUndefined();
		expect(r?.avoided).toBe(false);
	});
	it('returns null when ORS is down or the network fails', async () => {
		expect(await orsRoute(q.value, 'KEY', (async () => res(503)) as typeof fetch, 0)).toBeNull();
		expect(await orsRoute(q.value, 'KEY', (async () => { throw new Error('net'); }) as typeof fetch, 0)).toBeNull();
	});
	it('caches the same request for 10 minutes', async () => {
		const f = vi.fn(async () => res(200, ORS));
		await orsRoute(q.value, 'KEY', f as typeof fetch, 0);
		await orsRoute(q.value, 'KEY', f as typeof fetch, 9 * 60_000);
		expect(f).toHaveBeenCalledTimes(1);
		await orsRoute(q.value, 'KEY', f as typeof fetch, 11 * 60_000);
		expect(f).toHaveBeenCalledTimes(2);
	});
});
