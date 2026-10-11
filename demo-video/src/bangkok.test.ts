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

const pairs = () => {
	const n = ROUTE.match(/-?\d+(\.\d+)?/g)!.map(Number);
	return Array.from({ length: n.length / 2 }, (_, i) => [n[2 * i], n[2 * i + 1]] as [number, number]);
};
it('route begins at START and ends exactly at SHELTER, without overshooting', () => {
	const p = pairs();
	const d = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1]);
	expect(d(p[0], START)).toBeLessThanOrEqual(1);
	expect(d(p[p.length - 1], SHELTER)).toBeLessThanOrEqual(1);
	const last = p.slice(-Math.ceil(p.length * 0.15)).map((q) => d(q, SHELTER));
	for (let i = 1; i < last.length; i++) expect(last[i]).toBeLessThanOrEqual(last[i - 1] + 3);
});
