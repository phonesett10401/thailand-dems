// Creates a Supabase Auth user (role: volunteer) for each volunteer account without one.
// Passwords are written to web/volunteer-logins.local.txt (gitignored), never printed.
import { appendFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { loadEnvs, need } from './env.js';
import { randomPassword, volunteerEmail } from './volunteers.js';

const { web } = loadEnvs();
need(web, 'DATABASE_URL', 'PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY');
const sql = postgres(web.DATABASE_URL, { prepare: false, max: 1 });
const admin = createClient(web.PUBLIC_SUPABASE_URL, web.SUPABASE_SECRET_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});
const out = new URL('../../volunteer-logins.local.txt', import.meta.url);

const todo = await sql`select account_id, username from public.volunteer_accounts where user_id is null order by account_id`;
let created = 0;
for (const a of todo) {
	const password = randomPassword();
	const { data, error } = await admin.auth.admin.createUser({
		email: volunteerEmail(a.username),
		password,
		email_confirm: true,
		app_metadata: { role: 'volunteer' }
	});
	if (error) {
		console.log(`account ${a.account_id}: ${error.message}`);
		continue;
	}
	await sql`update public.volunteer_accounts set user_id = ${data.user.id} where account_id = ${a.account_id}`;
	await appendFile(out, `${a.username}\t${password}\n`);
	created++;
}
console.log(`volunteer users created: ${created} of ${todo.length}`);
await sql.end();
