import { afterEach, describe, expect, it } from 'vitest';
import type { Hazard } from './levels';
import { hazLine, markerLabel, nearestOpen, nowTitle, rainOutlook, smhiEventName } from './labels';
import { overwriteGetLocale } from './paraglide/runtime.js';
import type { Shelter } from './types';

describe('nowTitle', () => {
	it('joins up to three hazard names, sentence case', () => {
		expect(nowTitle(['smoke'])).toBe('Haze near you');
		expect(nowTitle(['smoke', 'flood'])).toBe('Haze and flooding');
		expect(nowTitle(['smoke', 'heat', 'earthquake', 'rain'])).toBe('Haze, extreme heat and earthquake');
		expect(nowTitle(['smoke', 'smoke'])).toBe('Haze near you');
	});
	it('names an official SMHI warning by its event', () => {
		expect(nowTitle([{ type: 'official', name: 'Snow' }])).toBe('Snow near you');
		expect(nowTitle([{ type: 'official', name: 'Snow' }, { type: 'smoke', name: null }])).toBe('Snow and haze');
	});
});

describe('nearestOpen', () => {
	const s = (id: number, lat: string | null, status: Shelter['Status'] = 'Available'): Shelter => ({
		ShelterID: id, ShelterName: `S${id}`, ShelterType: 't', Address: 'a', City: 'c', Latitude: lat, Longitude: lat === null ? null : '100.5', Capacity: 10, CurrentOccupancy: 0, Status: status, Facilities: null
	});
	it('skips full and position-less shelters', () => {
		const r = nearestOpen([s(1, '13.76', 'Full'), s(2, null), s(3, '14.5')], { lat: 13.75, lon: 100.5 });
		expect(r?.s.ShelterID).toBe(3);
		expect(nearestOpen([s(2, null)], { lat: 13.75, lon: 100.5 })).toBeNull();
	});
});

describe('markerLabel', () => {
	const h = (o: Partial<Hazard>): Hazard => ({ id: 'x', type: 'flood', level: 'warning', name: null, value: null, km: null, lat: 1, lon: 1, time: null, source: 's', sample: false, url: null, ...o });
	it('names type, place and level; tags samples', () => {
		expect(markerLabel(h({ name: 'Ayutthaya' }))).toBe('Flooding: Ayutthaya · Warning');
		expect(markerLabel(h({ level: 'watch', sample: true }))).toBe('Flooding · Watch · Sample');
	});
});

describe('hazLine for SMHI warnings', () => {
	const off = (time: string | null): Hazard => ({ id: 'smhi-WIND-1', type: 'official', level: 'watch', name: 'Wind', value: null, km: null, lat: null, lon: null, time, source: 'SMHI', sample: false, url: null });
	it('says when a warning starts only if that is still ahead', () => {
		expect(hazLine(off('2099-01-02T06:00:00Z'))).toMatch(/^Wind · from /);
		expect(hazLine(off('2020-01-02T06:00:00Z'))).toBe('Wind');
		expect(hazLine(off(null))).toBe('Wind');
	});
});

describe('SMHI names in the reader language', () => {
	afterEach(() => overwriteGetLocale(() => 'en'));
	const zone: Hazard = { id: 'smhi-WIND_SEA-z2', type: 'official', level: 'warning', name: 'Wind at sea', value: null, km: null, lat: null, lon: null, time: null, source: 'SMHI', sample: false, url: null, areas: [{ id: 56, en: 'Kattegat' }, { id: 999, en: 'Nowhere Bay' }] };
	it('smhiEventName per locale, unknown codes fall back to SMHI English', () => {
		expect(smhiEventName('WIND_SEA', 'Wind at sea')).toBe('Wind at sea');
		expect(smhiEventName('NEW_EVENT', 'New event')).toBe('New event');
		expect(smhiEventName(null, 'New event')).toBe('New event');
		overwriteGetLocale(() => 'th');
		expect(smhiEventName('WIND_SEA', 'Wind at sea')).toMatch(/[฀-๿]/);
		overwriteGetLocale(() => 'my');
		expect(smhiEventName('WIND_SEA', 'Wind at sea')).toMatch(/[က-႟]/);
		expect(smhiEventName('NEW_EVENT', 'New event')).toBe('New event');
	});
	it('hazLine and nowTitle use the localised event and area names', () => {
		expect(hazLine(zone)).toBe('Wind at sea · Kattegat, Nowhere Bay');
		overwriteGetLocale(() => 'my');
		const line = hazLine(zone);
		expect(line).not.toMatch(/Wind at sea|Kattegat/);
		expect(line).toContain('Nowhere Bay');
		expect(nowTitle([zone])).toMatch(/^[က-႟]/);
	});
});

describe('rainOutlook', () => {
	const at = (h: number) => new Date(2026, 9, 13, h);
	const hrs = (chances: number[]) => chances.map((c, i) => ({ time: at(9 + i), temp: 30, rainChance: c }));
	it('says rain is unlikely when no hour reaches 50%', () => {
		expect(rainOutlook(hrs([10, 49, 30]))).toBe('Rain unlikely in the next 24 h');
		expect(rainOutlook([])).toBe('');
	});
	it('says rain is likely now when the first hour is 50% or more', () => {
		expect(rainOutlook(hrs([60, 20]))).toBe('Rain likely now');
	});
	it('names the first hour with a 50% chance', () => {
		expect(rainOutlook(hrs([10, 20, 50, 80]))).toMatch(/^Rain likely from 11/);
	});
});
