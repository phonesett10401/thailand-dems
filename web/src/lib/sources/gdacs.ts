import { levelOf } from '../severity';
import type { HazardEvent, HazardKind } from '../types';
import { fetchJson } from './http';

const KIND: Record<string, HazardKind> = {
	FL: 'flood',
	TC: 'cyclone',
	EQ: 'earthquake',
	DR: 'drought',
	WF: 'wildfire',
	VO: 'volcano'
};

type RawGdacs = {
	features: {
		geometry: { type: string; coordinates: unknown };
		properties: {
			eventtype: string;
			eventid: number;
			name: string;
			alertlevel: string;
			iscurrent: string;
			fromdate: string;
			url: { report: string };
		};
	}[];
};

const DAY = 86_400_000;

/** Events GDACS tagged with Thailand over the last 12 months. CORS: allowed (*). */
export function gdacsUrl(now = new Date()): string {
	const d = (x: Date) => x.toISOString().slice(0, 10);
	return `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventlist=EQ;TC;FL;VO;DR;WF&country=Thailand&fromdate=${d(new Date(now.getTime() - 365 * DAY))}&todate=${d(now)}`;
}

/** raw is null when GDACS answers 204 No Content (no events). */
export function parseGdacs(raw: RawGdacs | null): HazardEvent[] {
	const byId = new Map<string, HazardEvent>();
	for (const f of raw?.features ?? []) {
		const p = f.properties;
		const kind = KIND[p.eventtype];
		if (!kind || f.geometry?.type !== 'Point') continue;
		const [lon, lat] = f.geometry.coordinates as [number, number];
		const id = `GDACS-${p.eventtype}-${p.eventid}`;
		byId.set(id, {
			id,
			source: 'GDACS',
			kind,
			title: p.name,
			level: levelOf(p.alertlevel),
			lat,
			lon,
			time: new Date(p.fromdate.endsWith('Z') ? p.fromdate : `${p.fromdate}Z`).toISOString(),
			current: p.iscurrent === 'true',
			url: p.url.report
		});
	}
	return [...byId.values()].sort((a, b) => b.time.localeCompare(a.time));
}

export const getGdacs = async () => parseGdacs(await fetchJson<RawGdacs>(gdacsUrl()));
