import { distanceKm } from './geo';
import { m } from './paraglide/messages.js';
import type { Pt } from './types';
import type { Zone } from './zones';

export type Mode = 'foot' | 'car' | 'bike';
export type RouteReq = { from: Pt; to: Pt; mode: Mode; avoid: Zone[] };
/** `type` is the OpenRouteService instruction code (0 = left … 13 = keep right); `at` indexes `line`. */
export type Step = { type: number; name: string; distance: number; duration: number; at: number };
export type RouteRes = { line: [number, number][]; distance: number; duration: number; steps: Step[]; avoided: boolean };

export type RouteFail = 'limited' | 'unavailable' | 'offline' | 'outside';

export const routeError = (status: number, body = ''): RouteFail =>
	status === 429 ? 'limited' : status === 400 && body.includes('outside Thailand') ? 'outside' : 'unavailable';

export async function getRoute(
	req: RouteReq,
	fetchFn: typeof fetch = (u, i) => fetch(u, i)
): Promise<{ ok: true; data: RouteRes } | { ok: false; reason: RouteFail }> {
	try {
		const res = await fetchFn('/api/route', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(req),
			signal: AbortSignal.timeout(15_000)
		});
		if (res.ok) return { ok: true, data: (await res.json()) as RouteRes };
		return { ok: false, reason: routeError(res.status, await res.text()) };
	} catch {
		return { ok: false, reason: 'offline' };
	}
}

const STEP: Record<number, (i: { name: string }) => string> = {
	0: m.step_0,
	1: m.step_1,
	2: m.step_2,
	3: m.step_3,
	4: m.step_4,
	5: m.step_5,
	6: m.step_6,
	8: m.step_8,
	9: m.step_9,
	10: m.step_10,
	11: m.step_11,
	12: m.step_12,
	13: m.step_13
};
/** ORS has no Thai, so we write the instructions ourselves from its codes. */
export function stepText(s: Step, destination: string): string {
	if (s.type === 7) return m.step_7();
	const name = s.type === 10 ? destination : s.name || m.step_unnamed();
	return (STEP[s.type] ?? m.step_6)({ name });
}

export function bearing(a: Pt, b: Pt): number {
	const r = (d: number) => (d * Math.PI) / 180;
	const y = Math.sin(r(b.lon - a.lon)) * Math.cos(r(b.lat));
	const x = Math.cos(r(a.lat)) * Math.sin(r(b.lat)) - Math.sin(r(a.lat)) * Math.cos(r(b.lat)) * Math.cos(r(b.lon - a.lon));
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
const DIRS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
export const compass = (deg: number) => DIRS[Math.round(deg / 45) % 8];

export function nearestIndex(line: [number, number][], p: Pt): number {
	let best = 0;
	let bestKm = Infinity;
	line.forEach(([lon, lat], i) => {
		const km = distanceKm(p, { lat, lon });
		if (km < bestKm) [best, bestKm] = [i, km];
	});
	return best;
}
// ponytail: distance to the nearest vertex, not the segment; fine because ORS lines have dense vertices.
export const offRoute = (line: [number, number][], p: Pt, meters = 50): boolean =>
	line.length > 0 && distanceKm(p, { lat: line[nearestIndex(line, p)][1], lon: line[nearestIndex(line, p)][0] }) * 1000 > meters;

export function currentStep(steps: Step[], index: number): number {
	let cur = 0;
	steps.forEach((s, i) => {
		if (s.at <= index) cur = i;
	});
	return cur;
}
