import { describe, expect, it } from 'vitest';
import { bearing, compass, currentStep, getRoute, nearestIndex, offRoute, routeError, stepText } from './route';

const line: [number, number][] = [
	[100.5, 13.75],
	[100.51, 13.75],
	[100.52, 13.75]
];

describe('step text', () => {
	it('builds instructions from ORS codes, with a fallback street name and the destination at the end', () => {
		expect(stepText({ type: 0, name: 'Rama IV Road', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Turn left onto Rama IV Road');
		expect(stepText({ type: 1, name: '', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Turn right onto the road');
		expect(stepText({ type: 10, name: '', distance: 0, duration: 0, at: 2 }, 'Bangkok Stadium')).toBe('Arrive at Bangkok Stadium');
		expect(stepText({ type: 7, name: 'x', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Enter the roundabout');
		expect(stepText({ type: 99, name: 'Soi 5', distance: 1, duration: 1, at: 0 }, 'X')).toBe('Continue straight on Soi 5');
	});
});

describe('compass', () => {
	it('gives the direction to the destination', () => {
		expect(compass(bearing({ lat: 13, lon: 100 }, { lat: 14, lon: 100 }))).toBe('n');
		expect(compass(bearing({ lat: 13, lon: 100 }, { lat: 13, lon: 101 }))).toBe('e');
		expect(compass(bearing({ lat: 13, lon: 100 }, { lat: 12, lon: 99 }))).toBe('sw');
	});
});

describe('following', () => {
	it('finds the nearest point and detects leaving the route', () => {
		expect(nearestIndex(line, { lat: 13.7501, lon: 100.5101 })).toBe(1);
		expect(offRoute(line, { lat: 13.7502, lon: 100.51 })).toBe(false); // ~22 m
		expect(offRoute(line, { lat: 13.752, lon: 100.51 })).toBe(true); // ~220 m
	});
	it('the current step is the last one that starts at or before the position', () => {
		const steps = [0, 1, 2].map((at) => ({ type: 6, name: '', distance: 1, duration: 1, at }));
		expect(currentStep(steps, 0)).toBe(0);
		expect(currentStep(steps, 1)).toBe(1);
		expect(currentStep(steps, 5)).toBe(2);
	});
});

describe('errors', () => {
	it('maps HTTP answers to what the user is told', () => {
		expect(routeError(429)).toBe('limited');
		expect(routeError(400, '{"message":"outside Thailand"}')).toBe('outside');
		expect(routeError(503)).toBe('unavailable');
		expect(routeError(400, '{"message":"mode must be foot, car or bike"}')).toBe('unavailable');
	});
	it('a network failure is offline', async () => {
		const r = await getRoute({ from: { lat: 13, lon: 100 }, to: { lat: 13, lon: 100 }, mode: 'foot', avoid: [] }, (async () => {
			throw new Error('net');
		}) as typeof fetch);
		expect(r).toEqual({ ok: false, reason: 'offline' });
	});
});
