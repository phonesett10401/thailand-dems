import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { listDisasters } from '$lib/server/queries';

export const GET = async () => json(await listDisasters(sql()));
