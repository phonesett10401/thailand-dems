import { describe, expect, it } from 'vitest';
import { dropTestRecords, findPii, scrubRecords } from './scrub.js';

describe('scrubRecords', () => {
	it('replaces people, emails and phones with obviously fake values', () => {
		const out = scrubRecords([
			{ ShelterName: 'Ayutthaya Temple Shelter', ContactPerson: 'Thawatchai B.', ContactPhone: '035-555-0808' },
			{ UserName: 'Real Person', UserEmail: 'real@gmail.com', UserPhone: '0612312345' }
		]);
		expect(out[0]).toEqual({ ShelterName: 'Ayutthaya Temple Shelter', ContactPerson: 'Sample Person 1', ContactPhone: '000-000-0000' });
		expect(out[1]).toEqual({ UserName: 'Sample Person 2', UserEmail: 'sample2@example.invalid', UserPhone: '000-000-0000' });
	});
	it('leaves empty personal fields empty', () => {
		expect(scrubRecords([{ ContactPhone: null }])).toEqual([{ ContactPhone: null }]);
	});
});

describe('dropTestRecords', () => {
	it('removes rows whose names or text say "test"', () => {
		const rows = [{ DisasterName: '2nd Test' }, { DisasterName: 'Chiang Mai Flood' }, { Title: 'x', DisasterName: 'Test' }, { Description: 'contest results' }];
		expect(dropTestRecords(rows)).toEqual([{ DisasterName: 'Chiang Mai Flood' }, { Description: 'contest results' }]);
	});
});

describe('findPii', () => {
	it('flags real-looking emails and Thai phone numbers anywhere in the data', () => {
		expect(findPii([{ note: 'call 081-234-5678 or mail a.b@gmail.com' }])).toEqual(['081-234-5678', 'a.b@gmail.com']);
		expect(findPii([{ x: '000-000-0000', y: 'sample1@example.invalid', z: '035-555-0808' }])).toEqual(['035-555-0808']);
	});
});
