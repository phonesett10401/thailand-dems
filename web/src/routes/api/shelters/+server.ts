import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { listShelters } from '$lib/server/queries';

export const GET = async () => json(await listShelters(sql()));
