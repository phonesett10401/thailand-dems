import { describe, expect, it } from 'vitest';
import { AUDIO, BPM, FPS, LEVEL_CUES, PREP_CUES, SCENES, TOTAL, beatFrame, scene } from './timeline';

const exact = (k: number) => (k * 60 * FPS) / BPM;

describe('timeline', () => {
	it('scenes are back to back and fill exactly 35 s', () => {
		expect(SCENES[0].from).toBe(0);
		for (let i = 1; i < SCENES.length; i++) expect(SCENES[i].from).toBe(SCENES[i - 1].from + SCENES[i - 1].duration);
		const last = SCENES[SCENES.length - 1];
		expect(last.from + last.duration).toBe(TOTAL);
		expect(TOTAL).toBe(35 * FPS);
	});
	it('every cut lands within 1 frame of a beat', () => {
		for (const s of SCENES) expect(Math.abs(s.from - exact(s.beat))).toBeLessThanOrEqual(1);
	});
	it('scene order follows the storyboard', () => {
		expect(SCENES.map((s) => s.id)).toEqual(['logo', 'map', 'level', 'route', 'prepare', 'how', 'cta']);
	});
	it('Warning lands on the music lift (video frame 442) inside the level scene', () => {
		const lv = scene('level');
		expect(LEVEL_CUES.warning).toBe(442);
		expect(LEVEL_CUES.watch).toBeGreaterThan(lv.from);
		expect(LEVEL_CUES.warning).toBeGreaterThan(LEVEL_CUES.watch);
		expect(LEVEL_CUES.warning).toBeLessThan(lv.from + lv.duration);
	});
	it('prepare cues sit inside the prepare scene', () => {
		const p = scene('prepare');
		for (const f of [PREP_CUES.flip, ...PREP_CUES.ticks]) {
			expect(f).toBeGreaterThan(p.from);
			expect(f).toBeLessThan(p.from + p.duration);
		}
	});
	it('audio is silent before the track gets loud again at frame 1024', () => {
		expect(AUDIO.fadeOutStart).toBeLessThan(AUDIO.fadeOutEnd);
		expect(AUDIO.fadeOutEnd).toBeLessThanOrEqual(1002);
	});
	it('beatFrame rounds the beat grid', () => {
		expect(beatFrame(0)).toBe(0);
		expect(beatFrame(18)).toBe(442);
		expect(beatFrame(38)).toBe(933);
	});
});
