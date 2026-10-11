// Track: "Background Technology Theme" (The_Mountain). Measured with ffmpeg: 84 BPM; trimming
// 15 frames (0.5 s) puts a beat on video frame 0, and the drop (track 7.648 s = beat 10) lands on
// frame 214, the start of the level scene. The track does not wind down, so the audio fades out.
export const FPS = 30;
export const TOTAL = 35 * FPS;
export const BPM = 84;
export const MUSIC_TRIM = 15;
export const beatFrame = (k: number) => Math.round((k * 60 * FPS) / BPM);

export type SceneId = 'logo' | 'map' | 'level' | 'route' | 'prepare' | 'how' | 'cta';
const BEATS: [SceneId, number][] = [['logo', 0], ['map', 5], ['level', 10], ['route', 25], ['prepare', 31], ['how', 37], ['cta', 43]];

export const SCENES = BEATS.map(([id, beat], i) => {
	const from = beatFrame(beat);
	const end = i + 1 < BEATS.length ? beatFrame(BEATS[i + 1][1]) : TOTAL;
	return { id, beat, from, duration: end - from };
});
export const scene = (id: SceneId) => SCENES.find((s) => s.id === id)!;

/** Absolute frames. Safe → Watch (haze) → Warning (heavy rain) after the drop. */
export const LEVEL_CUES = { watch: beatFrame(14), warning: beatFrame(19) };
/** Absolute frames: go-bag items tick on beats; the screen flips to Thai on beat 34. */
export const PREP_CUES = { ticks: [beatFrame(32), beatFrame(33), beatFrame(34), beatFrame(35)], flip: beatFrame(34) };
export const AUDIO = { fadeInEnd: 6, fadeOutStart: 990, fadeOutEnd: 1046 };
