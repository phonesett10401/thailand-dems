// Loads env files for one-off scripts without printing anything.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const read = (url) => (existsSync(url) ? parseEnv(readFileSync(url, 'utf8')) : {});

export function loadEnvs() {
	return {
		web: read(new URL('../../.env', import.meta.url)),
		backend: read(new URL('../../../backend/.env', import.meta.url))
	};
}

export function need(env, ...keys) {
	const missing = keys.filter((k) => !env[k]);
	if (missing.length) throw new Error(`Missing in .env: ${missing.join(', ')}`);
	return env;
}
