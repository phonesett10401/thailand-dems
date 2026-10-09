import { createHash } from 'node:crypto';

export const RATE = { max: 5, windowMinutes: 10 };
export const allowed = (recentCount: number) => recentCount < RATE.max;
/** Only this hash is stored; the raw IP never reaches the database. */
export const ipHash = (ip: string, salt: string) => createHash('sha256').update(`${salt}:${ip}`).digest('hex');
