import { describe, expect, it } from 'vitest';
import { weatherKey } from './weather-codes';

describe('weatherKey', () => {
	it('groups WMO codes', () => {
		expect(weatherKey(0)).toBe('clear');
		expect(weatherKey(2)).toBe('mainly_clear');
		expect(weatherKey(3)).toBe('overcast');
		expect(weatherKey(45)).toBe('fog');
		expect(weatherKey(53)).toBe('drizzle');
		expect(weatherKey(63)).toBe('rain');
		expect(weatherKey(81)).toBe('rain');
		expect(weatherKey(73)).toBe('snow');
		expect(weatherKey(95)).toBe('thunder');
		expect(weatherKey(999)).toBe('overcast');
	});
});
