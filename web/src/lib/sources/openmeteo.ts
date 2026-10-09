import type { Pt } from '../types';
import { fetchJson } from './http';

type RawForecast = {
	current: { time: number; temperature_2m: number; precipitation: number; wind_speed_10m: number; weather_code: number };
	hourly: { time: number[]; temperature_2m: number[]; precipitation_probability: number[] };
	daily: {
		time: number[];
		weather_code: number[];
		temperature_2m_max: number[];
		temperature_2m_min: number[];
		precipitation_sum: number[];
	};
};
type RawAir = { current: { time: number; pm2_5: number; us_aqi: number } };
type RawRiver = { daily: { time: string[]; river_discharge: (number | null)[] } };

export type Forecast = {
	now: { time: Date; temp: number; precip: number; wind: number; code: number };
	hours: { time: Date; temp: number; rainChance: number }[];
	days: { date: Date; code: number; max: number; min: number; rain: number }[];
};
export type Air = { time: Date; pm25: number; aqi: number };
export type River = { today: number; peak: number; peakDate: string; rising: boolean };
export type Pm25Band = 'very_good' | 'good' | 'moderate' | 'unhealthy_some' | 'unhealthy';

const unix = (s: number) => new Date(s * 1000);
const where = (p: Pt) => `latitude=${p.lat.toFixed(3)}&longitude=${p.lon.toFixed(3)}`;
const TZ = 'timezone=Asia%2FBangkok&timeformat=unixtime';

export const forecastUrl = (p: Pt) =>
	`https://api.open-meteo.com/v1/forecast?${where(p)}&current=temperature_2m,precipitation,wind_speed_10m,weather_code&hourly=temperature_2m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7&forecast_hours=24&${TZ}`;
export const airUrl = (p: Pt) =>
	`https://air-quality-api.open-meteo.com/v1/air-quality?${where(p)}&current=pm2_5,us_aqi&${TZ}`;
export const riverUrl = (p: Pt) =>
	`https://flood-api.open-meteo.com/v1/flood?${where(p)}&daily=river_discharge&forecast_days=7`;

export function parseForecast(r: RawForecast): Forecast {
	return {
		now: {
			time: unix(r.current.time),
			temp: r.current.temperature_2m,
			precip: r.current.precipitation,
			wind: r.current.wind_speed_10m,
			code: r.current.weather_code
		},
		hours: r.hourly.time
			.map((t, i) => ({
				time: unix(t),
				temp: r.hourly.temperature_2m[i],
				rainChance: r.hourly.precipitation_probability[i]
			}))
			.filter(complete),
		days: r.daily.time
			.map((t, i) => ({
				date: unix(t),
				code: r.daily.weather_code[i],
				max: r.daily.temperature_2m_max[i],
				min: r.daily.temperature_2m_min[i],
				rain: r.daily.precipitation_sum[i]
			}))
			.filter(complete)
	};
}

/** Open-Meteo returns null for gaps at the edge of a model run; drop those rows. */
const complete = (row: object) => Object.values(row).every((v) => v !== null && v !== undefined);

export function parseAir(r: RawAir): Air {
	return { time: unix(r.current.time), pm25: r.current.pm2_5, aqi: r.current.us_aqi };
}

export function parseRiver(r: RawRiver): River | null {
	const v = r.daily.river_discharge;
	if (!v.length || v[0] === null) return null;
	let peakIdx = 0;
	v.forEach((x, i) => {
		if (x !== null && x > (v[peakIdx] ?? -Infinity)) peakIdx = i;
	});
	const today = v[0];
	const peak = v[peakIdx] as number;
	return { today, peak, peakDate: r.daily.time[peakIdx], rising: peak > today * 1.5 && peak - today > 1 };
}

/** Thai Pollution Control Department 24-hour PM2.5 bands (µg/m³). */
export function pm25Band(v: number): Pm25Band {
	if (v <= 15) return 'very_good';
	if (v <= 25) return 'good';
	if (v <= 37.5) return 'moderate';
	if (v <= 75) return 'unhealthy_some';
	return 'unhealthy';
}

async function must<T>(p: Promise<T | null>): Promise<T> {
	const v = await p;
	if (v === null) throw new Error('empty response');
	return v;
}

export const getForecast = async (p: Pt) => parseForecast(await must(fetchJson<RawForecast>(forecastUrl(p))));
export const getAir = async (p: Pt) => parseAir(await must(fetchJson<RawAir>(airUrl(p))));
export const getRiver = async (p: Pt) => parseRiver(await must(fetchJson<RawRiver>(riverUrl(p))));
