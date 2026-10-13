import { m } from '$lib/paraglide/messages.js';
import type { Pm25Band } from './sources/openmeteo';
import { fmtDateTime } from './format';
import { sortByDistance, toNum } from './geo';
import type { FeedKey, Hazard, HazardType, Overall } from './levels';
import type { Pt, ReportSeverity, ReportType, Shelter } from './types';
import { areaName } from './countries/se-areas';
import { smhiCode } from './sources/smhi';

const MSG = m as unknown as Record<string, (() => string) | undefined>;
/** An SMHI event in the reader's language; SMHI's English name for a code we don't know. */
export const smhiEventName = (code: string | null, fallbackEn: string): string => (code && MSG[`smhi_ev_${code.toLowerCase()}`]?.()) || fallbackEn;
/** List/sheet title: an official warning by its event, anything else by its hazard type. */
export const hazTitle = (h: Hazard): string => (h.type === 'official' && h.name ? smhiEventName(smhiCode(h), h.name) : hazName(h.type));

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
	if (h.type === 'official' && h.name) {
		const areas = h.areas?.map((a) => areaName(a.id, a.en)).join(', ');
		const parts = [hazTitle(h), areas, h.time && Date.parse(h.time) > Date.now() ? m.line_from({ time: fmtDateTime(h.time) }) : null];
		return parts.filter(Boolean).join(' · ');
	}
	if (h.name && h.km !== null) return m.line_event({ name: h.name, km: km0(h.km) });
	return h.name ?? '';
}

export const levelWord = (l: Overall): string =>
	({ safe: m.lvl_safe, watch: m.lvl_watch, warning: m.lvl_warning, unknown: m.lvl_unknown })[l]();

export const feedName = (k: FeedKey): string =>
	({ air: m.feed_air, forecast: m.feed_forecast, river: m.feed_river, gdacs: m.feed_gdacs, quakes: m.feed_quakes, smhi: m.feed_smhi })[k]();

/** "Haze and flooding": distinct hazard names, worst first, at most three. */
export function nowTitle(items: (HazardType | { type: HazardType; name: string | null; id?: string })[]): string {
	if (!items.length) return '';
	// official SMHI warnings read as their event ("Snow"), not "Official warning"
	const label = (i: (typeof items)[number]) => (typeof i === 'string' ? hazName(i) : i.type === 'official' && i.name ? smhiEventName(i.id ? smhiCode({ type: i.type, id: i.id }) : null, i.name) : hazName(i.type));
	const names = [...new Set(items.map(label))].slice(0, 3);
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
	[hazName(h.type) + (h.name ? `: ${h.type === 'official' ? hazTitle(h) : h.name}` : ''), levelWord(h.level), ...(h.sample ? [m.sample_tag()] : [])].join(' · ');

const NUM_LABEL: Record<string, () => string> = {
	'1784': m.num_1784, '1669': m.num_1669, '191': m.num_191, '199': m.num_199, '1155': m.num_1155, '1182': m.num_1182,
	mm_199: m.num_mm_199, mm_192: m.num_mm_192, mm_191: m.num_mm_191,
	se_112: m.num_se_112, se_1177: m.num_se_1177, se_11414: m.num_se_11414, se_11313: m.num_se_11313
};
export const numLabel = (key: string): string => NUM_LABEL[key]?.() ?? key;
/** "11414" → "114 14" for display; the tel: link keeps the digits only. */
export const showTel = (tel: string): string => (tel === '11414' ? '114 14' : tel === '11313' ? '113 13' : tel);
