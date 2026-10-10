import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from '@lucide/svelte';
import { m } from '$lib/paraglide/messages.js';
import type { Pm25Band } from './sources/openmeteo';
import { sortByDistance, toNum } from './geo';
import type { FeedKey, Hazard, HazardType, Overall } from './levels';
import type { HazardKind, Level, Pt, ReportSeverity, ReportType, Shelter } from './types';
import type { WeatherKey } from './weather-codes';

export const kindLabel = (k: HazardKind): string =>
	({
		flood: m.kind_flood,
		cyclone: m.kind_cyclone,
		earthquake: m.kind_earthquake,
		drought: m.kind_drought,
		wildfire: m.kind_wildfire,
		volcano: m.kind_volcano,
		other: m.kind_other
	})[k]();

export const levelLabel = (l: Level): string =>
	({ info: m.level_info, watch: m.level_watch, warning: m.level_warning, danger: m.level_danger })[l]();

export const shelterStatusLabel = (s: Shelter['Status']): string =>
	({
		Available: m.shelter_status_available,
		Full: m.shelter_status_full,
		Closed: m.shelter_status_closed,
		'Under Maintenance': m.shelter_status_maintenance
	})[s]();

export const shelterStatusLevel = (s: Shelter['Status']): Level =>
	s === 'Available' ? 'info' : s === 'Full' ? 'danger' : 'warning';

export const wxLabel = (k: WeatherKey): string =>
	({
		clear: m.wx_clear,
		mainly_clear: m.wx_mainly_clear,
		overcast: m.wx_overcast,
		fog: m.wx_fog,
		drizzle: m.wx_drizzle,
		rain: m.wx_rain,
		snow: m.wx_snow,
		thunder: m.wx_thunder
	})[k]();

export const wxIcon = (k: WeatherKey) =>
	({
		clear: Sun,
		mainly_clear: CloudSun,
		overcast: Cloud,
		fog: CloudFog,
		drizzle: CloudDrizzle,
		rain: CloudRain,
		snow: CloudSnow,
		thunder: CloudLightning
	})[k];

export const pm25Label = (b: Pm25Band): string =>
	({
		very_good: m.pm25_band_very_good,
		good: m.pm25_band_good,
		moderate: m.pm25_band_moderate,
		unhealthy_some: m.pm25_band_unhealthy_some,
		unhealthy: m.pm25_band_unhealthy
	})[b]();

const PM25_LEVEL: Record<Pm25Band, Level> = {
	very_good: 'info',
	good: 'info',
	moderate: 'watch',
	unhealthy_some: 'warning',
	unhealthy: 'danger'
};
export const pm25Level = (b: Pm25Band): Level => PM25_LEVEL[b];

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
	other: '!'
};

const km0 = (km: number | null) => (km === null ? '' : km.toFixed(0));
export function hazLine(h: Hazard): string {
	if (h.type === 'smoke' && h.value !== null) return m.line_pm25({ value: h.value.toFixed(1) });
	if (h.type === 'heat' && h.value !== null) return m.line_heat({ value: h.value.toFixed(0) });
	if (h.type === 'rain' && h.value !== null) return m.line_rain({ value: h.value.toFixed(0) });
	if (h.id === 'river') return m.line_river();
	if (h.type === 'earthquake' && h.value !== null) return m.line_quake({ mag: h.value.toFixed(1), km: km0(h.km) });
	if (h.name && h.km !== null) return m.line_event({ name: h.name, km: km0(h.km) });
	return h.name ?? '';
}

export const levelWord = (l: Overall): string =>
	({ safe: m.lvl_safe, watch: m.lvl_watch, warning: m.lvl_warning, unknown: m.lvl_unknown })[l]();

export const feedName = (k: FeedKey): string =>
	({ air: m.feed_air, forecast: m.feed_forecast, river: m.feed_river, gdacs: m.feed_gdacs, quakes: m.feed_quakes })[k]();

/** "Haze and flooding": distinct hazard names, worst first, at most three. */
export function nowTitle(types: HazardType[]): string {
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
