import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../brand';
import { CAPTIONS } from '../captions';
import { PLACES, THAI_PATH, THAI_VIEWBOX } from '../thailand';
import { beatFrame, scene } from '../timeline';
import { Stage, type SceneProps } from '../ui';

// One hazard dot per beat after the cut: haze north, flood centre, quake west, storm south.
const DOTS = [
	{ at: PLACES.chiangmai, color: C.watch, beat: 5 },
	{ at: PLACES.ayutthaya, color: C.warning, beat: 6 },
	{ at: PLACES.maesot, color: C.watch, beat: 7 },
	{ at: PLACES.nakhonsi, color: C.watch, beat: 8 }
];

export function MapScene({ layout }: SceneProps) {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const start = scene('map').from;
	const h = layout === 'wide' ? 880 : 1150;
	const outline = interpolate(f, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
	return (
		<Stage layout={layout} caption={CAPTIONS.en.map}>
			<svg viewBox={THAI_VIEWBOX} height={h} width={h * 0.6}>
				<path d={THAI_PATH} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.3)" strokeWidth={2} opacity={outline} />
				<circle cx={PLACES.bangkok[0]} cy={PLACES.bangkok[1]} r={6} fill={C.text} opacity={outline} />
				{DOTS.map((d, i) => {
					const local = f - (beatFrame(d.beat) - start);
					const p = spring({ frame: local, fps, config: { damping: 12 } });
					const ring = (Math.max(local, 0) % 40) / 40;
					return (
						<g key={i} opacity={local < 0 ? 0 : 1}>
							<circle cx={d.at[0]} cy={d.at[1]} r={10 + ring * 40} fill="none" stroke={d.color} strokeWidth={3} opacity={(1 - ring) * 0.8} />
							<circle cx={d.at[0]} cy={d.at[1]} r={12 * p} fill={d.color} />
						</g>
					);
				})}
			</svg>
		</Stage>
	);
}
