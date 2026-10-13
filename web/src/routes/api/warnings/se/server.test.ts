import { describe, expect, it } from 'vitest';
import raw from '$lib/sources/fixtures/smhi-warnings.json';
import { _makeSmhiHandler, _STALE_MAX } from './+server';

const ok = (async () => new Response(JSON.stringify(raw))) as unknown as typeof fetch;
const down = (async () => new Response('x', { status: 500 })) as unknown as typeof fetch;
const status = async (p: Promise<unknown>) => p.then(() => 200, (e) => e.status);

describe('SMHI proxy cache', () => {
	it('fails with 503 when the first call fails', async () => {
		expect(await status(_makeSmhiHandler()(down))).toBe(503);
	});
	it('serves stale data for up to an hour, then 503', async () => {
		let t = 0;
		const h = _makeSmhiHandler(() => t);
		expect((await h(ok)).length).toBeGreaterThan(0);
		t = 10 * 60_000;
		expect(await status(h(down))).toBe(200);
		t = _STALE_MAX + 1;
		expect(await status(h(down))).toBe(503);
	});
	it('treats a non-array response as a failure', async () => {
		const obj = (async () => new Response('{}')) as unknown as typeof fetch;
		expect(await status(_makeSmhiHandler()(obj))).toBe(503);
	});
});
