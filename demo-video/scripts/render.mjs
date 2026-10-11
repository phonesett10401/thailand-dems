// Renders both videos and posters into web/static/demo/. Needs public/music.mp3 (git-ignored, licensed).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';

const OUT = '../web/static/demo';
if (!existsSync('public/music.mp3')) {
	console.error('Missing public/music.mp3. Copy "Cinematic Corporate" by alex-morgan (Pixabay) there first.');
	process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const POSTER_FRAME = 480; // Warning on screen, red arc glowing
const run = (...a) => execFileSync('npx', ['remotion', ...a], { stdio: 'inherit', shell: true });
for (const [id, tag] of [['Demo16x9', '16x9'], ['Demo9x16', '9x16']]) {
	run('render', 'src/index.ts', id, `${OUT}/demo-${tag}.mp4`, '--codec=h264', '--crf=22', '--audio-codec=aac');
	run('still', 'src/index.ts', id, `${OUT}/poster-${tag}.jpg`, `--frame=${POSTER_FRAME}`, '--image-format=jpeg', '--jpeg-quality=85');
}
for (const f of ['demo-16x9.mp4', 'demo-9x16.mp4', 'poster-16x9.jpg', 'poster-9x16.jpg'])
	console.log(f, (statSync(`${OUT}/${f}`).size / 1e6).toFixed(1), 'MB');
