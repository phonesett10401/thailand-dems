import type { SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient | null;
			user: { id: string; email: string | null; role: 'admin' | 'volunteer' | null } | null;
		}
	}
}
export {};
