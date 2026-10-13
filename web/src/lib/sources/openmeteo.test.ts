import { describe, expect, it } from 'vitest';
import air from './fixtures/air.json';
import forecast from './fixtures/forecast.json';
import river from './fixtures/river.json';
import { country } from '../country.svelte';
import { airUrl, forecastUrl, parseAir, parseForecast, parseRiver, pm25Band, rainBand } from './openmeteo';

describe('parseForecast', () => {
	it('maps current, 24 hours and 7 days', () => {
		const f = parseForecast(forecast);
		expect(f.now).toEqual({ time: new Date(1791518400 * 1000), temp: 31.4, precip: 0.2, wind: 9.5, code: 61 });
		expect(f.hours).toHaveLength(24);
		expect(f.hours[3]).toEqual({ time: new Date(1791529200 * 1000), temp: 33.0, rainChance: 60 });
		expect(f.days).toHaveLength(7);
		expect(f.days[4]).toEqual({ date: new Date(1791824400 * 1000), code: 95, max: 30.1, min: 24.2, rain: 22.8, feels: 33.1 });
	});
});

describe('parseForecast with gaps', () => {
	it('drops hours and days that contain null values instead of crashing later', () => {
		const raw = structuredClone(forecast) as unknown as {
			hourly: { temperature_2m: (number | null)[] };
			daily: { precipitation_sum: (number | null)[]; temperature_2m_max: (number | null)[] };
		};
		raw.hourly.temperature_2m[0] = null;
		raw.daily.precipitation_sum[6] = null;
		raw.daily.temperature_2m_max[5] = null;
		const f = parseForecast(raw as never);
		expect(f.hours).toHaveLength(23);
		expect(f.days).toHaveLength(5);
		expect(f.days.every((d) => typeof d.rain === 'number' && typeof d.max === 'number')).toBe(true);
	});
});

describe('parseAir', () => {
	it('reads PM2.5 and AQI', () => {
		expect(parseAir(air)).toEqual({ time: new Date(1791518400 * 1000), pm25: 41.2, aqi: 114 });
	});
});

describe('parseRiver', () => {
	it('finds the 7-day peak and flags a big rise', () => {
		expect(parseRiver(river)).toEqual({ today: 4.8, peak: 12.6, peakDate: '2026-10-12', rising: true });
	});
	it('is steady when the peak is not much above today', () => {
		const r = parseRiver({ daily: { time: ['a', 'b'], river_discharge: [10, 12] } });
		expect(r?.rising).toBe(false);
	});
	it('is not rising when the peak is normal for the last 30 days (Yangon, 2026-10-13)', () => {
		const past = [3.97, 2.41, 2.52, 3.88, 3.0, 2.85, 4.92, 5.46, 7.61, 7.02, 5.62, 3.61, 2.72, 3.19, 4.01, 7.61, 14.45, 9.14, 6.1, 3.83, 2.6, 1.86, 1.5, 1.8, 1.65, 1.4, 1.0, 0.52, 0.6, 0.79];
		const next = [0.8, 1.19, 2.21, 4.16, 3.15, 2.72, 1.94];
		const v = [...past, ...next];
		const r = parseRiver({ daily: { time: v.map((_, i) => `d${i}`), river_discharge: v } });
		expect(r).toEqual({ today: 0.8, peak: 4.16, peakDate: 'd33', rising: false });
	});
	it('is rising when the peak beats the last 30 days', () => {
		const v = [...Array(30).fill(5), 4, 6, 9, 12, 8, 6, 5];
		expect(parseRiver({ daily: { time: v.map((_, i) => `d${i}`), river_discharge: v } })?.rising).toBe(true);
	});
	it('returns null when the model has no data here', () => {
		expect(parseRiver({ daily: { time: [], river_discharge: [] } })).toBeNull();
		expect(parseRiver({ daily: { time: ['a'], river_discharge: [null] } })).toBeNull();
	});
});

describe('pm25Band (Thai PCD 24-hour bands)', () => {
	it('classifies concentrations', () => {
		expect(pm25Band(10)).toBe('very_good');
		expect(pm25Band(15)).toBe('very_good');
		expect(pm25Band(20)).toBe('good');
		expect(pm25Band(30)).toBe('moderate');
		expect(pm25Band(50)).toBe('unhealthy_some');
		expect(pm25Band(120)).toBe('unhealthy');
	});
});

describe('request day follows the country', () => {
	it('asks for the time zone of the current country', () => {
		const p = { lat: 59.33, lon: 18.07 };
		country.code = 'SE';
		expect(forecastUrl(p)).toContain('timezone=Europe%2FStockholm');
		expect(airUrl(p)).toContain('timezone=Europe%2FStockholm');
		country.code = 'TH';
		expect(forecastUrl(p)).toContain('timezone=Asia%2FBangkok');
	});
});

describe('rainBand (TMD daily bands)', () => {
	it('classifies a day of rain', () => {
		expect(rainBand(0)).toBe('none');
		expect(rainBand(0.05)).toBe('none');
		expect(rainBand(9)).toBe('light');
		expect(rainBand(10)).toBe('light');
		expect(rainBand(10.1)).toBe('moderate');
		expect(rainBand(35)).toBe('moderate');
		expect(rainBand(35.1)).toBe('heavy');
		expect(rainBand(90)).toBe('heavy');
		expect(rainBand(90.1)).toBe('very_heavy');
	});
});
