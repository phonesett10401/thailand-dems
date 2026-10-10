import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { faviconHref, faviconSvg, LEVEL_HEX } from './logo';

describe('favicon', () => {
	it('paints only the arc in the level colour', () => {
		for (const l of ['safe', 'watch', 'warning', 'unknown'] as const) {
			const svg = faviconSvg(l);
			expect(svg).toContain(`stroke="${LEVEL_HEX[l]}"`);
			expect(svg.match(/#[0-9a-f]{6}/gi)?.filter((c) => c === LEVEL_HEX[l])).toHaveLength(1);
		}
	});
	it('follows light/dark browser chrome for the shield and person', () => {
		expect(faviconSvg('safe')).toContain('prefers-color-scheme:dark');
	});
	it('is a data URL', () => {
		expect(faviconHref('watch')).toMatch(/^data:image\/svg\+xml,/);
	});
});

describe('static icons', () => {
	it('static/favicon.svg matches the live logo (re-run scripts/make-icons.js if this fails)', () => {
		const file = readFileSync(new URL('../../static/favicon.svg', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
		expect(file).toBe(faviconSvg('warning') + '\n');
	});
});
