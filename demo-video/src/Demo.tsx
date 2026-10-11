import type { FC } from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { C } from './brand';
import './fonts';
import { LogoScene } from './scenes/LogoScene';
import { MapScene } from './scenes/MapScene';
import { SCENES, type SceneId } from './timeline';
import type { SceneProps } from './ui';

const VIEWS: Partial<Record<SceneId, FC<SceneProps>>> = { logo: LogoScene, map: MapScene };

export function Demo(props: SceneProps) {
	return (
		<AbsoluteFill style={{ background: C.bg }}>
			{SCENES.map((s) => {
				const View = VIEWS[s.id];
				return View ? (
					<Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id}>
						<View {...props} />
					</Sequence>
				) : null;
			})}
		</AbsoluteFill>
	);
}
