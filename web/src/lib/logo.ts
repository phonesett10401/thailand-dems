import type { Overall } from './levels';

export const LEVEL_HEX: Record<Overall, string> = {
	safe: '#30d158',
	watch: '#ffb020',
	warning: '#ff453a',
	unknown: '#6b6b72'
};
// 64×64 grid. The shield and person never change colour; only the arc does.
export const SHIELD = 'M32 4 L54 11 V30 C54 44 45 53 32 60 C19 53 10 44 10 30 V11 Z';
export const ARC = 'M22 27 A11 11 0 0 1 42 27';
export const BODY = 'M24 47 C24 41.5 27.5 38.5 32 38.5 C36.5 38.5 40 41.5 40 47 Z';

export function faviconSvg(level: Overall): string {
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
		`<style>.f{fill:#141416}.s{stroke:#141416}@media (prefers-color-scheme:dark){.f{fill:#fff}.s{stroke:#fff}}</style>` +
		`<path class="s" d="${SHIELD}" fill="none" stroke-width="4.5" stroke-linejoin="round"/>` +
		`<path d="${ARC}" fill="none" stroke="${LEVEL_HEX[level]}" stroke-width="4" stroke-linecap="round"/>` +
		`<circle class="f" cx="32" cy="31" r="4.6"/><path class="f" d="${BODY}"/></svg>`
	);
}

export const faviconHref = (level: Overall) => `data:image/svg+xml,${encodeURIComponent(faviconSvg(level))}`;
