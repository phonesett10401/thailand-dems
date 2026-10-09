import type { HazardKind, Level } from './types';

export function levelOf(s: string): Level {
	switch (s) {
		case 'Catastrophic':
		case 'Emergency':
		case 'Critical':
		case 'Red':
			return 'danger';
		case 'Severe':
		case 'Warning':
		case 'Orange':
			return 'warning';
		case 'Moderate':
		case 'Green':
			return 'watch';
		default:
			return 'info';
	}
}

export function kindOf(disasterType: string): HazardKind {
	switch (disasterType) {
		case 'Flood':
			return 'flood';
		case 'Earthquake':
			return 'earthquake';
		case 'Hurricane':
			return 'cyclone';
		case 'Wildfire':
			return 'wildfire';
		case 'Drought':
			return 'drought';
		case 'Volcanic Eruption':
			return 'volcano';
		default:
			return 'other';
	}
}

export const LEVEL_RANK: Record<Level, number> = { info: 0, watch: 1, warning: 2, danger: 3 };

/** Pill styles. Literal class strings so Tailwind can see them. */
export const LEVEL_CLASS: Record<Level, string> = {
	danger: 'bg-alarm text-white',
	warning: 'bg-caution text-ink',
	watch: 'bg-ink/10 text-ink',
	info: 'border border-rule text-ink'
};

/** Left-edge stripe on list rows. */
export const LEVEL_STRIPE: Record<Level, string> = {
	danger: 'bg-alarm',
	warning: 'bg-caution',
	watch: 'bg-ink/40',
	info: 'bg-rule'
};
