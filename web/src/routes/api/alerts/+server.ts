import { json } from '@sveltejs/kit';
import { sql } from '$lib/server/db';
import { listAlerts } from '$lib/server/queries';

export const GET = async () => json(await listAlerts(sql()));
