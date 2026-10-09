import { describe, expect, it } from 'vitest';
import air from './fixtures/air.json';
import forecast from './fixtures/forecast.json';
import river from './fixtures/river.json';
import { parseAir, parseForecast, parseRiver, pm25Band } from './openmeteo';

describe('parseForecast', () => {
	it('maps current, 24 hours and 7 days', () => {
		const f = parseForecast(forecast);
		expect(f.now).toEqual({ time: new Date(1791518400 * 1000), temp: 31.4, precip: 0.2, wind: 9.5, code: 61 });
		expect(f.hours).toHaveLength(24);
		expect(f.hours[3]).toEqual({ time: new Date(1791529200 * 1000), temp: 33.0, rainChance: 60 });
		expect(f.days).toHaveLength(7);
		expect(f.days[4]).toEqual({ date: new Date(1791824400 * 1000), code: 95, max: 30.1, min: 24.2, rain: 22.8 });
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
