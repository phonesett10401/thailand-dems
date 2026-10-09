// Usage: npm run db:create-admin -- you@example.com           (create; asks for a password)
//        npm run db:create-admin -- --promote you@example.com (give an existing user the admin role)
import readline from 'node:readline';
import { createClient } from '@supabase/supabase-js';
import { loadEnvs, need } from './env.js';

const { web } = loadEnvs();
need(web, 'PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY');
const admin = createClient(web.PUBLIC_SUPABASE_URL, web.SUPABASE_SECRET_KEY, {
	auth: { persistSession: false, autoRefreshToken: false }
});
const args = process.argv.slice(2);
const promote = args[0] === '--promote';
const email = promote ? args[1] : args[0];
if (!email) throw new Error('Give an email address.');

function askHidden(question) {
	return new Promise((resolve) => {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
		process.stdout.write(question);
		rl._writeToOutput = () => {}; // don't echo what is typed
		rl.question('', (answer) => {
			rl.close();
			process.stdout.write('\n');
			resolve(answer);
		});
	});
}

if (promote) {
	let found = null;
	for (let page = 1; !found; page++) {
		const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
		if (error) throw error;
		found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
		if (data.users.length < 200) break;
	}
	if (!found) throw new Error('No user with that email.');
	const { error } = await admin.auth.admin.updateUserById(found.id, {
		app_metadata: { ...found.app_metadata, role: 'admin' }
	});
	if (error) throw error;
	console.log('promoted to admin');
} else {
	const password = await askHidden('New admin password (min 12 characters): ');
	if (password.length < 12) throw new Error('Password too short.');
	const { error } = await admin.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
		app_metadata: { role: 'admin' }
	});
	if (error) throw error;
	console.log('admin created');
}
