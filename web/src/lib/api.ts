import sampleAlerts from './sample/alerts.json';
import sampleDisasters from './sample/disasters.json';
import sampleRoutes from './sample/evacuation-routes.json';
import sampleShelters from './sample/shelters.json';
import type { FetchFn } from './sources/http';
import type { DbAlert, Disaster, EvacRoute, ReportInput, Shelter } from './types';

export type Loaded<T> = { data: T; live: boolean };
export type PostResult = { ok: true } | { ok: false; reason: 'offline' | 'rejected' };

export function createApi(base: string, onOffline: () => void, fetchFn: FetchFn = (u, i) => fetch(u, i)) {
	async function get<T>(path: string, fallback: T): Promise<Loaded<T>> {
		try {
			const res = await fetchFn(base + path, { signal: AbortSignal.timeout(6000) });
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return { data: (await res.json()) as T, live: true };
		} catch {
			onOffline();
			return { data: fallback, live: false };
		}
	}

	async function post(path: string, body: unknown): Promise<PostResult> {
		try {
			const res = await fetchFn(base + path, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(10_000)
			});
			return res.ok ? { ok: true } : { ok: false, reason: 'rejected' };
		} catch {
			return { ok: false, reason: 'offline' };
		}
	}

	return {
		shelters: () => get<Shelter[]>('/shelters', sampleShelters as Shelter[]),
		disasters: () => get<Disaster[]>('/disasters', sampleDisasters as Disaster[]),
		alerts: () => get<DbAlert[]>('/alerts', sampleAlerts as DbAlert[]),
		evacuationRoutes: () => get<EvacRoute[]>('/evacuation/routes', sampleRoutes as EvacRoute[]),
		// backend/routes/userReports.js: router.post('/create', …)
		submitReport: (r: ReportInput) => post('/reports/create', r)
	};
}
