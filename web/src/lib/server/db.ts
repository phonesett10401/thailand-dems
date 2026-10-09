import postgres from 'postgres';
import { env } from '$env/dynamic/private';

let client: postgres.Sql | null = null;

/** One small pool per server instance. Transaction pooler → no prepared statements. */
export function sql(): postgres.Sql {
	if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
	client ??= postgres(env.DATABASE_URL, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
	return client;
}
