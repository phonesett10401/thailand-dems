import { describe, expect, it } from 'vitest';
import { withTimeout } from './db';

describe('withTimeout', () => {
	it('rejects with "db timeout" when the promise never settles', async () => {
		await expect(withTimeout(new Promise(() => {}), 20)).rejects.toThrow('db timeout');
	});
	it('passes a fast result through', async () => {
		await expect(withTimeout(Promise.resolve(7), 20)).resolves.toBe(7);
	});
});
