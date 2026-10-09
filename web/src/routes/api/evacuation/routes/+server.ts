import { json } from '@sveltejs/kit';
import routes from '$lib/sample/evacuation-routes.json';

// There is no routes table: the old Express endpoint returned this same hard-coded list.
// The UI labels it SAMPLE.
export const GET = () => json(routes);
