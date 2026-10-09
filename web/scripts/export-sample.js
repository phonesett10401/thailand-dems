// One-off: copy the demo database's citizen-facing tables into src/lib/sample/ as the offline
// fallback. Run with the backend up: `npm run export-sample`. Re-run only when the seed data changes.
import { mkdir, writeFile } from 'node:fs/promises';
import { dropTestRecords, findPii, scrubRecords } from './scrub.js';

const BASE = process.env.PUBLIC_API_URL || 'http://localhost:5000/api';
const OUT = new URL('../src/lib/sample/', import.meta.url);
const JOBS = {
	shelters: '/shelters',
	disasters: '/disasters',
	alerts: '/alerts',
	'evacuation-routes': '/evacuation/routes',
	provinces: '/locations/provinces'
};

await mkdir(OUT, { recursive: true });
for (const [name, path] of Object.entries(JOBS)) {
	const res = await fetch(BASE + path);
	if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
	const rows = await res.json();
	const clean = name === 'provinces' ? rows : scrubRecords(dropTestRecords(rows));
	const leaks = findPii(clean);
	if (leaks.length) throw new Error(`${name}: personal data still present (${leaks.length} values), not writing`);
	await writeFile(new URL(`${name}.json`, OUT), JSON.stringify(clean, null, '\t') + '\n');
	console.log(`${name}: ${clean.length} rows`);
}
