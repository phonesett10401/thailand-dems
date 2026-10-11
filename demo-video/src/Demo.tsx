import type { FC } from 'react';
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile } from 'remotion';
import { C } from './brand';
import './fonts';
import { CtaScene } from './scenes/CtaScene';
import { HowScene } from './scenes/HowScene';
import { LevelScene } from './scenes/LevelScene';
import { LogoScene } from './scenes/LogoScene';
import { MapScene } from './scenes/MapScene';
import { PrepareScene } from './scenes/PrepareScene';
import { RouteScene } from './scenes/RouteScene';
import { AUDIO, MUSIC_TRIM, SCENES, type SceneId } from './timeline';
import type { SceneProps } from './ui';

const VIEWS: Record<SceneId, FC<SceneProps>> = {
	logo: LogoScene, map: MapScene, level: LevelScene, route: RouteScene, prepare: PrepareScene, how: HowScene, cta: CtaScene
};

const volume = (f: number) =>
	interpolate(f, [0, AUDIO.fadeInEnd, AUDIO.fadeOutStart, AUDIO.fadeOutEnd], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

export function Demo(props: SceneProps) {
	return (
		<AbsoluteFill style={{ background: C.bg }}>
			{SCENES.map((s) => {
				const View = VIEWS[s.id];
				return (
					<Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id}>
						<View {...props} />
					</Sequence>
				);
			})}
			<Html5Audio src={staticFile('music.mp3')} trimBefore={MUSIC_TRIM} volume={volume} />
		</AbsoluteFill>
	);
}
