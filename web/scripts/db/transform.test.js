import { describe, expect, it } from 'vitest';
import { assertEmpty, enforceForeignKeys, isBlankReport, transformRows } from './transform.js';

const model = {
	tables: [
		{
			name: 'volunteeraccounts',
			columns: [
				{ name: 'AccountID', dataType: 'int', columnType: 'int', generation: '' },
				{ name: 'Username', dataType: 'varchar', columnType: 'varchar(50)', generation: '' },
				{ name: 'Password', dataType: 'varchar', columnType: 'varchar(255)', generation: '' },
				{ name: 'IsActive', dataType: 'tinyint', columnType: 'tinyint(1)', generation: '' }
			]
		},
		{
			name: 'reliefsupplies',
			columns: [
				{ name: 'SupplyID', dataType: 'int', columnType: 'int', generation: '' },
				{ name: 'AvailableQuantity', dataType: 'decimal', columnType: 'decimal(10,2)', generation: '(`a` - `b`)' }
			]
		}
	]
};
const opts = { dropColumns: { volunteeraccounts: ['Password'] } };

describe('transformRows', () => {
	it('renames to snake_case, converts booleans and never copies passwords', () => {
		const out = transformRows('volunteeraccounts', [{ AccountID: 1, Username: 'kulap', Password: 'plain', IsActive: 1 }], model, opts);
		expect(out).toEqual([{ account_id: 1, username: 'kulap', is_active: true }]);
	});
	it('skips generated columns (Postgres computes them)', () => {
		expect(transformRows('reliefsupplies', [{ SupplyID: 3, AvailableQuantity: '9.00' }], model, opts)).toEqual([{ supply_id: 3 }]);
	});
	it('drops dev leftovers', () => {
		const rows = [
			{ AccountID: 1, Username: 'tester1', IsActive: 1 },
			{ AccountID: 2, Username: 'kulap', IsActive: 0 }
		];
		expect(transformRows('volunteeraccounts', rows, model, opts).map((r) => r.account_id)).toEqual([2]);
	});
});

describe('enforceForeignKeys', () => {
	const fkModel = {
		tables: [
			{ name: 'disasters', primaryKey: ['DisasterID'], foreignKeys: [] },
			{
				name: 'alerts',
				primaryKey: ['AlertID'],
				foreignKeys: [{ columns: ['DisasterID'], refTable: 'disasters', refColumns: ['DisasterID'], onDelete: 'SET NULL' }]
			},
			{
				name: 'disastershelters',
				primaryKey: ['ID'],
				foreignKeys: [{ columns: ['DisasterID'], refTable: 'disasters', refColumns: ['DisasterID'], onDelete: 'CASCADE' }]
			},
			{
				name: 'capacityalerts',
				primaryKey: ['CapID'],
				foreignKeys: [{ columns: ['LinkID'], refTable: 'disastershelters', refColumns: ['ID'], onDelete: 'CASCADE' }]
			}
		]
	};
	it('applies each foreign key rule to rows whose parent was dropped, transitively', () => {
		const data = {
			disasters: [{ disaster_id: 1 }],
			alerts: [{ alert_id: 10, disaster_id: 1 }, { alert_id: 11, disaster_id: 15 }, { alert_id: 12, disaster_id: null }],
			disaster_shelters: [{ id: 100, disaster_id: 1 }, { id: 101, disaster_id: 15 }],
			capacity_alerts: [{ cap_id: 7, link_id: 101 }, { cap_id: 8, link_id: 100 }]
		};
		const out = enforceForeignKeys(data, fkModel);
		expect(out.alerts).toEqual([{ alert_id: 10, disaster_id: 1 }, { alert_id: 11, disaster_id: null }, { alert_id: 12, disaster_id: null }]);
		expect(out.disaster_shelters).toEqual([{ id: 100, disaster_id: 1 }]);
		expect(out.capacity_alerts).toEqual([{ cap_id: 8, link_id: 100 }]);
	});
});

describe('isBlankReport', () => {
	it('flags reports with no content at all', () => {
		expect(isBlankReport({ UserName: null, UserEmail: null, UserPhone: null, Description: null, ReportedLocation: null })).toBe(true);
		expect(isBlankReport({ UserName: null, Description: 'Water rising', ReportedLocation: null })).toBe(false);
	});
});

describe('assertEmpty', () => {
	it('refuses to import into a database that already has rows', () => {
		expect(() => assertEmpty({ shelters: 0, alerts: 0 })).not.toThrow();
		expect(() => assertEmpty({ shelters: 11, alerts: 0 })).toThrow('shelters');
	});
});
