import { createHash } from 'node:crypto';

/** Enforced atomically by public.reserve_report_slot (migration 0003). */
export const RATE = { max: 5, windowMinutes: 10 };
/** Only this hash is stored; the raw IP never reaches the database. */
export const ipHash = (ip: string, salt: string) => createHash('sha256').update(`${salt}:${ip}`).digest('hex');

/** Fail closed: with a missing or guessable salt, every IPv4 hash could be reversed by brute force. */
export function rateLimitSalt(secret: string | undefined): string {
	if (!secret || secret.length < 16) throw new Error('SUPABASE_SECRET_KEY must be set to salt IP hashes');
	return secret;
}
