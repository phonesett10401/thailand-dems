import { expect, it } from 'vitest';
import { PLACES, THAI_PATH } from './thailand';

it('places sit inside the 600×1000 canvas, north above south', () => {
	expect(THAI_PATH.startsWith('M')).toBe(true);
	for (const [x, y] of Object.values(PLACES)) {
		expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(600);
		expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(1000);
	}
	expect(PLACES.chiangmai[1]).toBeLessThan(PLACES.bangkok[1]);
	expect(PLACES.bangkok[1]).toBeLessThan(PLACES.nakhonsi[1]);
});
