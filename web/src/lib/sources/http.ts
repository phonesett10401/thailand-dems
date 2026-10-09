import type { Sourced } from '../types';

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const cache = new Map<string, { at: number; value: Promise<unknown> }>();

/** GET JSON with a timeout. 204 → null. Successful responses are cached per URL for ttlMs. */
export function fetchJson<T>(
	url: string,
	{
		ttlMs = 10 * 60_000,
		timeoutMs = 8000,
		fetchFn = (u, i) => fetch(u, i)
	}: { ttlMs?: number; timeoutMs?: number; fetchFn?: FetchFn } = {}
): Promise<T | null> {
	const hit = cache.get(url);
	if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T | null>;
	const value = (async () => {
		const res = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
		if (res.status === 204) return null;
		if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
		return (await res.json()) as T;
	})();
	cache.set(url, { at: Date.now(), value });
	value.catch(() => cache.delete(url));
	return value;
}

export function clearCache(): void {
	cache.clear();
}

/** Never throws: UI cards render either data + source stamp, or "source unavailable" + retry. */
export async function sourced<T>(source: string, load: () => Promise<T>): Promise<Sourced<T>> {
	try {
		return { data: await load(), source, updatedAt: new Date() };
	} catch {
		return { error: true, source };
	}
}
