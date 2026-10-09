import type { HazardEvent, Level } from '../types';
import { fetchJson } from './http';

type RawQuakes = {
	features: {
		id: string;
		properties: { mag: number | null; place: string; time: number; url: string };
		geometry: { coordinates: number[] };
	}[];
};

const DAY = 86_400_000;

/** Thailand and neighbours, last 30 days, M3+. */
export function usgsUrl(now = new Date()): string {
	const start = new Date(now.getTime() - 30 * DAY).toISOString().slice(0, 10);
	return `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=4&maxlatitude=22&minlongitude=95&maxlongitude=107&minmagnitude=3&orderby=time&limit=50&starttime=${start}`;
}

export function quakeLevel(mag: number): Level {
	if (mag >= 6) return 'danger';
	if (mag >= 5) return 'warning';
	if (mag >= 4) return 'watch';
	return 'info';
}

export function parseQuakes(raw: RawQuakes | null, now = Date.now()): HazardEvent[] {
	return (raw?.features ?? []).map((f) => {
		const mag = f.properties.mag ?? 0;
		return {
			id: `USGS-${f.id}`,
			source: 'USGS',
			kind: 'earthquake',
			title: `M${mag.toFixed(1)} · ${f.properties.place}`,
			level: quakeLevel(mag),
			lat: f.geometry.coordinates[1],
			lon: f.geometry.coordinates[0],
			time: new Date(f.properties.time).toISOString(),
			current: now - f.properties.time < 3 * DAY,
			url: f.properties.url
		};
	});
}

export const getQuakes = async () => parseQuakes(await fetchJson<RawQuakes>(usgsUrl()));
