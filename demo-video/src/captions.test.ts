import { expect, it } from 'vitest';
import { CAPTIONS, LABELS } from './captions';
import { SCENES } from './timeline';

it('every scene has a non-empty English caption', () => {
	for (const s of SCENES) expect(CAPTIONS.en[s.id].title.trim()).not.toBe('');
});
it('diagram labels are filled and Volunteers/Admins are Phase 2', () => {
	expect(LABELS.en.sources).toHaveLength(3);
	expect(LABELS.en.outputs.map((o) => o.phase2)).toEqual([false, true, true]);
	expect(LABELS.en.phase2).toBe('Phase 2');
	for (const t of [...LABELS.en.sources.flatMap((s) => [s.name, s.what]), ...LABELS.en.outputs.map((o) => o.name), LABELS.en.url])
		expect(t.trim()).not.toBe('');
});
