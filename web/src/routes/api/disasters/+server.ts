import { json } from '@sveltejs/kit';
import { withDb } from '$lib/server/db';
import { listDisasters } from '$lib/server/queries';

export const GET = async () => json(await withDb(listDisasters));
