import { describe, expect, it } from 'vitest';
import { kindOf, levelOf } from './severity';

describe('levelOf', () => {
	it('maps DB, alert and GDACS vocabularies onto four levels', () => {
		expect(levelOf('Catastrophic')).toBe('danger');
		expect(levelOf('Emergency')).toBe('danger');
		expect(levelOf('Critical')).toBe('danger');
		expect(levelOf('Red')).toBe('danger');
		expect(levelOf('Severe')).toBe('warning');
		expect(levelOf('Warning')).toBe('warning');
		expect(levelOf('Orange')).toBe('warning');
		expect(levelOf('Moderate')).toBe('watch');
		expect(levelOf('Green')).toBe('watch');
		expect(levelOf('Minor')).toBe('info');
		expect(levelOf('Info')).toBe('info');
		expect(levelOf('something new')).toBe('info');
	});
});

describe('kindOf', () => {
	it('maps DB disaster types onto hazard kinds', () => {
		expect(kindOf('Flood')).toBe('flood');
		expect(kindOf('Earthquake')).toBe('earthquake');
		expect(kindOf('Hurricane')).toBe('cyclone');
		expect(kindOf('Wildfire')).toBe('wildfire');
		expect(kindOf('Drought')).toBe('drought');
		expect(kindOf('Volcanic Eruption')).toBe('volcano');
		expect(kindOf('Industrial Accident')).toBe('other');
	});
});
