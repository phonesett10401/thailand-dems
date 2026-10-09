import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from '@lucide/svelte';
import { m } from '$lib/paraglide/messages.js';
import type { Pm25Band } from './sources/openmeteo';
import type { HazardKind, Level, ReportSeverity, ReportType, Shelter } from './types';
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
