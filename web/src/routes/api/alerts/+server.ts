import { json } from '@sveltejs/kit';
import { withDb } from '$lib/server/db';
import { listAlerts } from '$lib/server/queries';

export const GET = async () => json(await withDb(listAlerts));
