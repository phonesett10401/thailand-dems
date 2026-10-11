import { beforeEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => ({ made: 0, ended: 0, hang: true }));
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_URL: 'postgres://test' } }));
vi.mock('postgres', () => ({
	default: () => {
		fake.made++;
		const s = (() => (fake.hang ? new Promise(() => {}) : Promise.resolve([{ ok: 1 }]))) as unknown as {
			end: () => Promise<void>;
		};
		s.end = async () => void fake.ended++;
		return s;
	}
}));

const { withDb, withTimeout } = await import('./db');

describe('withTimeout', () => {
	it('rejects with "db timeout" when the promise never settles', async () => {
		await expect(withTimeout(new Promise(() => {}), 20)).rejects.toThrow('db timeout');
	});
	it('passes a fast result through', async () => {
		await expect(withTimeout(Promise.resolve(7), 20)).resolves.toBe(7);
	});
});

describe('withDb', () => {
	beforeEach(() => Object.assign(fake, { made: 0, ended: 0, hang: true }));

	it('a hung query becomes a 503 and the dead client is dropped, so the next call reconnects', async () => {
		await expect(withDb((s) => s`select 1`, 20)).rejects.toMatchObject({ status: 503 });
		expect(fake.ended).toBe(1);
		fake.hang = false;
		await expect(withDb((s) => s`select 1`, 20)).resolves.toEqual([{ ok: 1 }]);
		expect(fake.made).toBe(2); // a fresh client was created after the drop
	});

	it('other errors pass through untouched and keep the client', async () => {
		await expect(withDb(() => Promise.reject(new Error('bad sql')), 20)).rejects.toThrow('bad sql');
		expect(fake.ended).toBe(0);
	});
});
