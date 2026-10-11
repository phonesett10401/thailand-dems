import type { Hazard, HazardType } from './levels';

export type Zone = { lat: number; lon: number; km: number };

/** Smoke, heat and quakes do not close roads; these do. */
export const BLOCKS_ROADS: HazardType[] = ['flood', 'storm', 'tsunami', 'landslide', 'wildfire', 'chemical'];
// ponytail: one fixed radius per type; use the event's real footprint if a feed ever provides one.
export const ZONE_KM: Record<string, number> = { flood: 10, storm: 15, tsunami: 5, landslide: 3, wildfire: 5, chemical: 5 };

export function zonesFrom(hazards: Hazard[]): Zone[] {
	return hazards
		.filter((x) => !x.sample && x.level === 'warning' && BLOCKS_ROADS.includes(x.type) && x.lat !== null && x.lon !== null)
		.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
		.slice(0, 10)
		.map((x) => ({ lat: x.lat!, lon: x.lon!, km: ZONE_KM[x.type] }));
}

/** Closed ring of [lon, lat] points, angle 0 = east, counter-clockwise. */
export function circle(z: Zone, points = 16): [number, number][] {
	const dLat = z.km / 111.32;
	const dLon = z.km / (111.32 * Math.cos((z.lat * Math.PI) / 180));
	const ring: [number, number][] = [];
	for (let i = 0; i < points; i++) {
		const a = (i / points) * 2 * Math.PI;
		ring.push([z.lon + dLon * Math.cos(a), z.lat + dLat * Math.sin(a)]);
	}
	ring.push(ring[0]);
	return ring;
}
