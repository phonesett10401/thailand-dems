import { error, json } from '@sveltejs/kit';
import { withDb } from '$lib/server/db';
import { listShelters } from '$lib/server/queries';

const COUNTRIES = ['TH', 'MM', 'SE'];

export const GET = async ({ url }) => {
	const c = url.searchParams.get('country') ?? 'TH';
	if (!COUNTRIES.includes(c)) error(400, 'Unknown country');
	return json(await withDb((s) => listShelters(s, c)));
};
