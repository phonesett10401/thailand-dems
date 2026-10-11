import type { SceneId } from './timeline';

export type Caption = { title: string; sub?: string };
// ponytail: English only; Thai later = add a `th` entry with the same shape.
export const CAPTIONS: { en: Record<SceneId, Caption> } = {
	en: {
		logo: { title: 'DEMS Thailand', sub: 'Disaster alerts for everyone in Thailand' },
		map: { title: 'Live hazards from public data', sub: 'Across the whole country' },
		level: { title: 'Know your level', sub: 'Safe · Watch · Warning' },
		route: { title: 'Find a shelter. Get there safely.', sub: 'Routes steer around danger zones' },
		prepare: { title: 'A go-bag for each emergency', sub: 'In English and Thai' },
		how: { title: 'Open data in. Clear advice out.' },
		cta: { title: 'Try it now', sub: 'Free, no sign-up' }
	}
};

export const LABELS = {
	en: {
		sources: [
			{ name: 'Open-Meteo', what: 'Weather, air, rivers' },
			{ name: 'USGS', what: 'Earthquakes' },
			{ name: 'GDACS', what: 'Global disaster alerts' }
		],
		outputs: [
			{ name: 'Citizens', phase2: false },
			{ name: 'Volunteers', phase2: true },
			{ name: 'Admins', phase2: true }
		],
		phase2: 'Phase 2',
		url: 'thailand-dems.vercel.app',
		place: 'Bangkok',
		shelter: 'Bangkok Stadium Evacuation Center'
	}
};
