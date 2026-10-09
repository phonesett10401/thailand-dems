import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const fx = (name: string) => read(`../../src/lib/sources/fixtures/${name}.json`);
const sample = (name: string) => read(`../../src/lib/sample/${name}.json`);
const json = { contentType: 'application/json' };

const API: Record<string, string> = {
	'/shelters': 'shelters',
	'/disasters': 'disasters',
	'/alerts': 'alerts',
	'/evacuation/routes': 'evacuation-routes'
};

/** Every external host is mocked so tests are deterministic and work offline. */
export const test = base.extend<{ backend: 'up' | 'down'; mocks: void }>({
	backend: ['up', { option: true }],
	mocks: [
		async ({ page, backend }, use) => {
			await page.route('https://tiles.openfreemap.org/**', (r) => r.abort());
			await page.route('https://api.open-meteo.com/**', (r) => r.fulfill({ ...json, body: fx('forecast') }));
			await page.route('https://air-quality-api.open-meteo.com/**', (r) => r.fulfill({ ...json, body: fx('air') }));
			await page.route('https://flood-api.open-meteo.com/**', (r) => r.fulfill({ ...json, body: fx('river') }));
			await page.route('https://earthquake.usgs.gov/**', (r) => r.fulfill({ ...json, body: fx('usgs') }));
			await page.route('https://www.gdacs.org/**', (r) => r.fulfill({ ...json, body: fx('gdacs') }));
			await page.route(
				(url) => url.pathname.startsWith('/api/'),
				async (r) => {
					if (backend === 'down') return r.abort('connectionrefused');
					if (r.request().method() === 'POST') {
						return r.fulfill({ ...json, status: 201, body: '{"reportId":99}' });
					}
					const file = API[new URL(r.request().url()).pathname.replace(/^\/api/, '')];
					return file ? r.fulfill({ ...json, body: sample(file) }) : r.fulfill({ status: 404, body: '' });
				}
			);
			await use();
		},
		{ auto: true }
	]
});

export { expect };
