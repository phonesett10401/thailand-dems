import { describe, expect, it } from 'vitest';
import { randomPassword, volunteerEmail } from './volunteers.js';

describe('volunteerEmail', () => {
	it('uses a reserved example domain so no real person gets mail', () => {
		expect(volunteerEmail('Kulap.B')).toBe('kulap.b@volunteers.example.com');
		expect(volunteerEmail('nok ka!')).toBe('nokka@volunteers.example.com');
	});
});

describe('randomPassword', () => {
	it('is 16 url-safe characters and different each time', () => {
		const a = randomPassword();
		expect(a).toMatch(/^[A-Za-z0-9_-]{16}$/);
		expect(randomPassword()).not.toBe(a);
	});
});
