// Keeps real personal data out of the repo. Used only by export-sample.js.

const PERSON = ['ContactPerson', 'UserName', 'FirstName', 'LastName', 'VerifiedBy'];
const EMAIL = ['Email', 'UserEmail', 'ContactEmail'];
const PHONE = ['ContactPhone', 'UserPhone', 'Phone', 'EmergencyContact', 'EmergencyPhone'];

/** @param {Record<string, unknown>[]} rows */
export function scrubRecords(rows) {
	return rows.map((row, i) => {
		const o = { ...row };
		for (const k of PERSON) if (o[k]) o[k] = `Sample Person ${i + 1}`;
		for (const k of EMAIL) if (o[k]) o[k] = `sample${i + 1}@example.invalid`;
		for (const k of PHONE) if (o[k]) o[k] = '000-000-0000';
		return o;
	});
}

// Any word starting with "test" (test, Tester, testing123) in any text field marks a dev leftover.
const TEST = /\btest/i;

/** @param {Record<string, unknown>[]} rows */
export function dropTestRecords(rows) {
	return rows.filter((r) => !Object.values(r).some((v) => typeof v === 'string' && TEST.test(v)));
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const PHONE_RE = /\b0\d{1,2}-?\d{3}-?\d{4}\b/g;

/**
 * Safety net after scrubbing: any email or Thai phone number that is not one of our fakes.
 * @param {unknown[]} rows
 */
export function findPii(rows) {
	const text = JSON.stringify(rows);
	const emails = (text.match(EMAIL_RE) ?? []).filter((e) => !e.endsWith('@example.invalid'));
	const phones = (text.match(PHONE_RE) ?? []).filter((p) => p !== '000-000-0000');
	return [...phones, ...emails];
}
