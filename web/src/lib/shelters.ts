import { occupancyPct, sortByDistance, toNum } from './geo';
import type { Pt, Shelter } from './types';

export type Facility = 'medical' | 'pets' | 'cleanAir';
export type Filter = 'open' | 'space' | Facility;
export type ShelterRow = { s: Shelter; km: number | null; lat: number | null; lon: number | null; pct: number; facilities: Facility[] };

// ponytail: keyword match on the free-text Facilities column; switch to real columns when the admin console edits them.
const FACILITY: Record<Facility, RegExp> = { medical: /medic|first aid/i, pets: /\bpet/i, cleanAir: /air purif/i };

export function shelterRows(list: Shelter[], at: Pt): ShelterRow[] {
	return sortByDistance(list, at, (s) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) })).map(({ item: s, km }) => ({
		s,
		km,
		lat: toNum(s.Latitude),
		lon: toNum(s.Longitude),
		pct: occupancyPct(s.CurrentOccupancy, s.Capacity),
		facilities: (Object.keys(FACILITY) as Facility[]).filter((f) => FACILITY[f].test(s.Facilities ?? ''))
	}));
}

export function applyFilters(rows: ShelterRow[], on: Set<Filter>): ShelterRow[] {
	return rows.filter(
		(r) =>
			(!on.has('open') || r.s.Status === 'Available') &&
			(!on.has('space') || (r.s.Status === 'Available' && r.pct < 90)) &&
			[...on].every((f) => f === 'open' || f === 'space' || r.facilities.includes(f))
	);
}
