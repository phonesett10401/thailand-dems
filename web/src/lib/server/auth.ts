import { error } from '@sveltejs/kit';

export function requireRole(locals: App.Locals, role: 'admin' | 'volunteer') {
	if (!locals.user) error(401, 'Sign in required');
	if (locals.user.role !== role) error(403, 'Not allowed');
	return locals.user;
}
