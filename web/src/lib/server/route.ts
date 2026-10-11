import type { RouteReq, RouteRes } from '$lib/route';
import type { Pt } from '$lib/types';
import { circle, type Zone } from '$lib/zones';

/** Separate bucket from reports: the hash is prefixed `route:` before reserve_report_slot. */
export const ROUTE_RATE = { max: 30, windowMinutes: 10 } as const;

const PROFILE = { foot: 'foot-walking', car: 'driving-car', bike: 'cycling-regular' } as const;
const inThailand = (p: Pt) => p.lat >= 5 && p.lat <= 21 && p.lon >= 97 && p.lon <= 106;
const isPt = (v: unknown): v is Pt =>
	typeof v === 'object' && v !== null && Number.isFinite((v as Pt).lat) && Number.isFinite((v as Pt).lon);

export function parseRouteReq(b: unknown): { ok: true; value: RouteReq } | { ok: false; error: string } {
	if (typeof b !== 'object' || b === null) return { ok: false, error: 'Body must be JSON' };
	const { from, to, mode, avoid = [] } = b as Record<string, unknown>;
	if (!isPt(from) || !isPt(to)) return { ok: false, error: 'from and to need lat and lon' };
	if (!inThailand(from) || !inThailand(to)) return { ok: false, error: 'outside Thailand' };
	if (mode !== 'foot' && mode !== 'car' && mode !== 'bike') return { ok: false, error: 'mode must be foot, car or bike' };
	if (!Array.isArray(avoid) || avoid.length > 10) return { ok: false, error: 'at most 10 avoid zones' };
	for (const z of avoid) {
		if (!isPt(z) || typeof (z as Zone).km !== 'number' || !((z as Zone).km > 0 && (z as Zone).km <= 15)) {
			return { ok: false, error: 'each zone needs lat, lon and km (0–15)' };
		}
	}
	return {
		ok: true,
		value: {
			from: { lat: from.lat, lon: from.lon },
			to: { lat: to.lat, lon: to.lon },
			mode,
			avoid: (avoid as Zone[]).map((z) => ({ lat: z.lat, lon: z.lon, km: z.km }))
		}
	};
}

type OrsStep = { distance: number; duration: number; type: number; name: string; way_points: [number, number] };
type OrsJson = {
	features?: {
		geometry: { coordinates: number[][] };
		properties: { summary?: { distance?: number; duration?: number }; segments?: { steps?: OrsStep[] }[] };
	}[];
};

// ponytail: per-instance memory cache; a shared store (KV) if traffic ever needs it.
const cache = new Map<string, { at: number; value: RouteRes }>();
const TTL = 10 * 60_000;
const r4 = (n: number) => n.toFixed(4);
const keyOf = (q: RouteReq) =>
	[q.mode, r4(q.from.lat), r4(q.from.lon), r4(q.to.lat), r4(q.to.lon), ...q.avoid.map((z) => `${r4(z.lat)},${r4(z.lon)},${z.km}`)].join('|');
export const clearRouteCache = () => cache.clear();

export async function orsRoute(q: RouteReq, apiKey: string, fetchFn: typeof fetch = fetch, now = Date.now()): Promise<RouteRes | null> {
	const key = keyOf(q);
	const hit = cache.get(key);
	if (hit && now - hit.at < TTL) return hit.value;

	const call = (avoid: Zone[]) =>
		fetchFn(`https://api.heigit.org/openrouteservice/v2/directions/${PROFILE[q.mode]}/geojson`, {
			method: 'POST',
			headers: { Authorization: apiKey, 'content-type': 'application/json', accept: 'application/geo+json' },
			body: JSON.stringify({
				coordinates: [
					[q.from.lon, q.from.lat],
					[q.to.lon, q.to.lat]
				],
				instructions: true,
				units: 'm',
				...(avoid.length ? { options: { avoid_polygons: { type: 'MultiPolygon', coordinates: avoid.map((z) => [circle(z)]) } } } : {})
			}),
			signal: AbortSignal.timeout(10_000)
		});

	try {
		let avoided = q.avoid.length > 0;
		let res = await call(q.avoid);
		// ORS refuses some avoid polygons (too large, overlapping the start): route without them and tell the user.
		if (!res.ok && res.status === 400 && avoided) {
			res = await call([]);
			avoided = false;
		}
		if (!res.ok) return null;
		const f = ((await res.json()) as OrsJson).features?.[0];
		if (!f) return null;
		const value: RouteRes = {
			line: f.geometry.coordinates.map((c) => [c[0], c[1]] as [number, number]),
			distance: f.properties.summary?.distance ?? 0,
			duration: f.properties.summary?.duration ?? 0,
			steps: (f.properties.segments ?? [])
				.flatMap((s) => s.steps ?? [])
				.map((s) => ({ type: s.type, name: s.name === '-' ? '' : s.name, distance: s.distance, duration: s.duration, at: s.way_points[0] })),
			avoided
		};
		cache.set(key, { at: now, value });
		return value;
	} catch {
		return null;
	}
}
