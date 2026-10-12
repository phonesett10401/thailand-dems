import { m } from '$lib/paraglide/messages.js';
import type { Pm25Band } from './sources/openmeteo';
import { sortByDistance, toNum } from './geo';
import type { FeedKey, Hazard, HazardType, Overall } from './levels';
import type { Pt, ReportSeverity, ReportType, Shelter } from './types';

export const shelterStatusLabel = (s: Shelter['Status']): string =>
	({
		Available: m.shelter_status_available,
		Full: m.shelter_status_full,
		Closed: m.shelter_status_closed,
		'Under Maintenance': m.shelter_status_maintenance
	})[s]();

export const pm25Label = (b: Pm25Band): string =>
	({
		very_good: m.pm25_band_very_good,
		good: m.pm25_band_good,
		moderate: m.pm25_band_moderate,
		unhealthy_some: m.pm25_band_unhealthy_some,
		unhealthy: m.pm25_band_unhealthy
	})[b]();

export const reportTypeLabel = (t: ReportType): string =>
	({
		Flood: m.rtype_flood,
		Earthquake: m.rtype_earthquake,
		Fire: m.rtype_fire,
		Storm: m.rtype_storm,
		Landslide: m.rtype_landslide,
		Tsunami: m.rtype_tsunami,
		Drought: m.rtype_drought,
		Other: m.rtype_other
	})[t]();

export const reportSeverityLabel = (s: ReportSeverity): string =>
	({ Minor: m.rsev_minor, Moderate: m.rsev_moderate, Severe: m.rsev_severe, Critical: m.rsev_critical })[s]();

const HAZ_NAME: Record<HazardType, () => string> = {
	flood: m.haz_flood,
	rain: m.haz_rain,
	storm: m.haz_storm,
	smoke: m.haz_smoke,
	heat: m.haz_heat,
	earthquake: m.haz_earthquake,
	tsunami: m.haz_tsunami,
	landslide: m.haz_landslide,
	drought: m.haz_drought,
	wildfire: m.haz_wildfire,
	volcano: m.haz_volcano,
	chemical: m.haz_chemical,
	official: m.haz_official,
	other: m.haz_other
};
export const hazName = (t: HazardType): string => HAZ_NAME[t]();

export const HAZ_CODE: Record<HazardType, string> = {
	flood: 'FL',
	rain: 'RN',
	storm: 'ST',
	smoke: 'PM',
	heat: '°C',
	earthquake: 'EQ',
	tsunami: 'TS',
	landslide: 'LS',
	drought: 'DR',
	wildfire: 'WF',
	volcano: 'VO',
	chemical: 'CH',
	official: 'OF',
	other: '!'
};

const km0 = (km: number | null) => (km === null ? '' : km.toFixed(0));
export function hazLine(h: Hazard): string {
	if (h.type === 'smoke' && h.value !== null) return m.line_pm25({ value: h.value.toFixed(1) });
	if (h.type === 'heat' && h.value !== null) return m.line_heat({ value: h.value.toFixed(0) });
	if (h.type === 'rain' && h.value !== null) return m.line_rain({ value: h.value.toFixed(0) });
	if (h.id === 'river') return m.line_river();
	if (h.type === 'earthquake' && h.value !== null)
		return h.km === null ? `M${h.value.toFixed(1)}` : m.line_quake({ mag: h.value.toFixed(1), km: km0(h.km) });
	if (h.name && h.km !== null) return m.line_event({ name: h.name, km: km0(h.km) });
	return h.name ?? '';
}

export const levelWord = (l: Overall): string =>
	({ safe: m.lvl_safe, watch: m.lvl_watch, warning: m.lvl_warning, unknown: m.lvl_unknown })[l]();

export const feedName = (k: FeedKey): string =>
	({ air: m.feed_air, forecast: m.feed_forecast, river: m.feed_river, gdacs: m.feed_gdacs, quakes: m.feed_quakes, smhi: m.feed_smhi })[k]();

/** "Haze and flooding": distinct hazard names, worst first, at most three. */
export function nowTitle(types: HazardType[]): string {
	if (!types.length) return '';
	const names = [...new Set(types)].slice(0, 3).map(hazName);
	const s =
		names.length === 1
			? m.now_title_1({ a: names[0] })
			: names.length === 2
				? m.now_title_2({ a: names[0], b: names[1] })
				: m.now_title_3({ a: names[0], b: names[1], c: names[2] });
	const lower = s.toLowerCase(); // no-op for Thai
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function nearestOpen(shelters: Shelter[], at: Pt): { s: Shelter; km: number } | null {
	const hit = sortByDistance(
		shelters.filter((s) => s.Status === 'Available'),
		at,
		(s) => ({ lat: toNum(s.Latitude), lon: toNum(s.Longitude) })
	).find((x) => x.km !== null);
	return hit ? { s: hit.item, km: hit.km! } : null;
}

export const markerLabel = (h: Hazard): string =>
	[hazName(h.type) + (h.name ? `: ${h.name}` : ''), levelWord(h.level), ...(h.sample ? [m.sample_tag()] : [])].join(' · ');
