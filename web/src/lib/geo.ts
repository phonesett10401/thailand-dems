import type { Pt } from './types';

export function toNum(v: unknown): number | null {
	if (v === null || v === undefined || v === '') return null;
	const n = Number(v);
	return Number.isFinite(n) ? n : null;
}

export function distanceKm(a: Pt, b: Pt): number {
	const rad = (d: number) => (d * Math.PI) / 180;
	const dLat = rad(b.lat - a.lat);
	const dLon = rad(b.lon - a.lon);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function sortByDistance<T>(
	items: T[],
	from: Pt,
	coords: (t: T) => { lat: number | null; lon: number | null }
): { item: T; km: number | null }[] {
	return items
		.map((item) => {
			const { lat, lon } = coords(item);
			return { item, km: lat === null || lon === null ? null : distanceKm(from, { lat, lon }) };
		})
		.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
}

export function occupancyPct(occupied: number, capacity: number): number {
	if (!(capacity > 0)) return 100;
	return Math.min(100, Math.max(0, Math.round((occupied / capacity) * 100)));
}
