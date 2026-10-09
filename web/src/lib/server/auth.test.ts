import { describe, expect, it } from 'vitest';
import { requireRole } from './auth';

const locals = (user: App.Locals['user']) => ({ supabase: null, user }) as App.Locals;
const status = (fn: () => unknown) => {
	try {
		fn();
		return 200;
	} catch (e) {
		return (e as { status: number }).status;
	}
};

describe('requireRole', () => {
	it('401 when signed out', () => {
		expect(status(() => requireRole(locals(null), 'admin'))).toBe(401);
	});
	it('403 for the wrong role (a volunteer asking for admin data)', () => {
		expect(status(() => requireRole(locals({ id: 'u', email: null, role: 'volunteer' }), 'admin'))).toBe(403);
	});
	it('403 when the role claim is missing', () => {
		expect(status(() => requireRole(locals({ id: 'u', email: null, role: null }), 'admin'))).toBe(403);
	});
	it('returns the user for the right role', () => {
		const u = { id: 'u', email: 'a@b.c', role: 'admin' as const };
		expect(requireRole(locals(u), 'admin')).toEqual(u);
	});
});
