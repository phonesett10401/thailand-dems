import { expect, it } from 'vitest';
import { ROUTE, ROUTE_KM, SHELTER, START, STRAIGHT_KM, TURN, ZONE } from './bangkok';

const inCanvas = ([x, y]: number[]) => x >= 0 && x <= 390 && y >= 0 && y <= 700;

it('route and places are well formed', () => {
	expect(ROUTE.startsWith('M')).toBe(true);
	expect(inCanvas(START)).toBe(true);
	expect(inCanvas(SHELTER)).toBe(true);
	expect(ROUTE_KM).toBeGreaterThan(STRAIGHT_KM);
});
it('every route vertex stays outside the danger zone (2 px tolerance)', () => {
	const n = ROUTE.match(/-?\d+(\.\d+)?/g)!.map(Number);
	expect(n.length % 2).toBe(0);
	for (let i = 0; i < n.length; i += 2) expect(Math.hypot(n[i] - ZONE.cx, n[i + 1] - ZONE.cy)).toBeGreaterThan(ZONE.r - 2);
});
it('has a turn instruction part-way along the route', () => {
	expect(TURN.text.trim()).not.toBe('');
	expect(TURN.at).toBeGreaterThan(0);
	expect(TURN.at).toBeLessThan(1);
});
