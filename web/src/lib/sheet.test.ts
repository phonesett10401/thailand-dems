import { describe, expect, it } from 'vitest';
import { nearestSnap } from './sheet';

const snaps = [168, 400, 700];

describe('nearestSnap', () => {
	it('picks the closest snap when released slowly', () => {
		expect(nearestSnap(180, snaps)).toBe(0);
		expect(nearestSnap(330, snaps)).toBe(1);
		expect(nearestSnap(690, snaps, 0.1)).toBe(2);
	});
	it('a fast flick up goes to the next taller snap', () => {
		expect(nearestSnap(200, snaps, 1.2)).toBe(1);
		expect(nearestSnap(450, snaps, 1.2)).toBe(2);
		expect(nearestSnap(700, snaps, 1.2)).toBe(2);
	});
	it('a fast flick down goes to the next shorter snap', () => {
		expect(nearestSnap(650, snaps, -1.2)).toBe(1);
		expect(nearestSnap(380, snaps, -1.2)).toBe(0);
		expect(nearestSnap(168, snaps, -1.2)).toBe(0);
	});
});
