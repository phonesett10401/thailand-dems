import { describe, expect, it } from 'vitest';
import shelters from '$lib/sample/shelters.json';
import { COLUMN_NAMES } from './column-names';
import { pascalize } from './rows';

describe('pascalize', () => {
	it('maps snake_case columns back to the API names and leaves aliased keys alone', () => {
		expect(pascalize({ shelter_id: 8, shelter_name: 'A', AvailableSpace: 3 })).toEqual({
			ShelterID: 8,
			ShelterName: 'A',
			AvailableSpace: 3
		});
	});
	it('can rebuild every key the citizen UI receives for shelters', () => {
		const pascal = new Set(Object.values(COLUMN_NAMES));
		const computed = ['AvailableSpace', 'OccupancyPercent', 'ActiveDisasterCount'];
		for (const key of Object.keys(shelters[0])) {
			expect(pascal.has(key) || computed.includes(key), key).toBe(true);
		}
	});
});
