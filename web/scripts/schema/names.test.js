import { describe, expect, it } from 'vitest';
import { TABLES, toSnake } from './names.js';

describe('toSnake', () => {
	it('splits PascalCase and acronyms', () => {
		expect(toSnake('ShelterName')).toBe('shelter_name');
		expect(toSnake('ShelterID')).toBe('shelter_id');
		expect(toSnake('MOUID')).toBe('mou_id');
		expect(toSnake('MOUTitle')).toBe('mou_title');
		expect(toSnake('ID')).toBe('id');
		expect(toSnake('PM25Level')).toBe('pm25_level');
	});
});

describe('TABLES', () => {
	it('maps all 35 lowercase MySQL tables to snake_case', () => {
		expect(Object.keys(TABLES)).toHaveLength(35);
		expect(TABLES.agencyactivations).toBe('agency_activations');
		expect(TABLES.agencymou).toBe('agency_mou');
		expect(TABLES.userreports).toBe('user_reports');
		expect(TABLES.facilityactivations).toBe('facility_activations');
	});
});
