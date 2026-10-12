import { error, json } from '@sveltejs/kit';
import { normaliseSmhi, type SmhiWarning } from '$lib/sources/smhi';

const URL = 'https://opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json';
const TTL = 5 * 60_000;
export const _STALE_MAX = 60 * 60_000; // beyond this, say "unavailable" so the client's failed-feed rule applies

type Fetch = typeof fetch;
/** Cache logic with an injectable clock, so it can be tested. ponytail: per-instance cache; fine for SMHI's update rate */
export function _makeSmhiHandler(now: () => number = Date.now) {
	let cache: { at: number; data: SmhiWarning[] } | null = null;
	return async (fetchFn: Fetch): Promise<SmhiWarning[]> => {
		if (!cache || now() - cache.at > TTL) {
			try {
				const r = await fetchFn(URL, { signal: AbortSignal.timeout(8000) });
				if (!r.ok) throw new Error(String(r.status));
				const raw = await r.json();
				if (!Array.isArray(raw)) throw new Error('unexpected SMHI response');
				cache = { at: now(), data: normaliseSmhi(raw) };
			} catch {
				if (!cache || now() - cache.at > _STALE_MAX) error(503, 'SMHI unavailable');
			}
		}
		return cache!.data;
	};
}

const handler = _makeSmhiHandler();
export const GET = async ({ fetch }) => json(await handler(fetch), { headers: { 'cache-control': 'public, s-maxage=300' } });
