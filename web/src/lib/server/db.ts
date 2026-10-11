import { error } from '@sveltejs/kit';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';

let client: postgres.Sql | null = null;

/** One small pool per server instance. Transaction pooler → no prepared statements. */
export function sql(): postgres.Sql {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	client ??= postgres(env.DATABASE_URL, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
	return client;
}

/**
 * Every query goes through here. A query that hangs (e.g. a dead pooler socket after the
 * instance sat idle) fails after `ms` as a 503, and the dead client is dropped so the next
 * request reconnects instead of hanging too.
 */
export async function withDb<T>(fn: (s: postgres.Sql) => Promise<T>, ms = 8000): Promise<T> {
	const s = sql();
	try {
		return await withTimeout(fn(s), ms);
	} catch (e) {
		if (client === s && (e as Error).message === 'db timeout') {
			client = null;
			s.end({ timeout: 0 }).catch(() => {});
		}
		if ((e as Error).message === 'db timeout') error(503, 'Database unavailable');
		throw e;
	}
}

export async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
	let t: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([p, new Promise<never>((_, no) => (t = setTimeout(() => no(new Error('db timeout')), ms)))]);
	} finally {
		clearTimeout(t);
	}
}
