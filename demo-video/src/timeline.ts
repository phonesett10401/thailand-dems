// Measured from the track (ffmpeg, 2026-10-11): 73.35 BPM; trimming 214 frames (7.13 s)
// puts a beat on video frame 0, the lift on frame 442, the ease-off on 957, and the
// track gets loud again on frame 1024.
export const FPS = 30;
export const TOTAL = 35 * FPS;
export const BPM = 73.35;
export const MUSIC_TRIM = 214;
export const beatFrame = (k: number) => Math.round((k * 60 * FPS) / BPM);

export type SceneId = 'logo' | 'map' | 'level' | 'route' | 'prepare' | 'how' | 'cta';
const BEATS: [SceneId, number][] = [['logo', 0], ['map', 4], ['level', 10], ['route', 21], ['prepare', 27], ['how', 32], ['cta', 38]];

export const SCENES = BEATS.map(([id, beat], i) => {
	const from = beatFrame(beat);
	const end = i + 1 < BEATS.length ? beatFrame(BEATS[i + 1][1]) : TOTAL;
	return { id, beat, from, duration: end - from };
});
export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;

/** Absolute frames. Safe → Watch (haze) → Warning (heavy rain) on the music lift. */
export const LEVEL_CUES = { watch: beatFrame(13), warning: beatFrame(18) };
/** Absolute frames: go-bag items tick on beats; the screen flips to Thai on beat 30. */
export const PREP_CUES = { ticks: [beatFrame(28), beatFrame(29), beatFrame(30), beatFrame(31)], flip: beatFrame(30) };
export const AUDIO = { fadeInEnd: 10, fadeOutStart: 957, fadeOutEnd: 1000 };
