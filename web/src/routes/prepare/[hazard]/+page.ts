import { error } from '@sveltejs/kit';
import { GUIDES, type GuideId } from '$lib/prepare/guides';

export const load = ({ params }) => {
	if (!(GUIDES as readonly string[]).includes(params.hazard)) error(404, 'Unknown guide');
	return { id: params.hazard as GuideId };
};
