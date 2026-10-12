import { error, json } from '@sveltejs/kit';
import { normaliseSmhi, type SmhiWarning } from '$lib/sources/smhi';

const URL = 'https://opendata-download-warnings.smhi.se/ibww/api/version/1/warning.json';
const TTL = 5 * 60_000;
let cache: { at: number; data: SmhiWarning[] } | null = null; // ponytail: per-instance cache; fine for SMHI's update rate

export const GET = async ({ fetch }) => {
	if (!cache || Date.now() - cache.at > TTL) {
		try {
			const r = await fetch(URL, { signal: AbortSignal.timeout(8000) });
			if (!r.ok) throw new Error(String(r.status));
			cache = { at: Date.now(), data: normaliseSmhi(await r.json()) };
		} catch {
			if (!cache) error(503, 'SMHI unavailable'); // otherwise serve the stale copy
		}
	}
	return json(cache!.data, { headers: { 'cache-control': 'public, s-maxage=300' } });
};
