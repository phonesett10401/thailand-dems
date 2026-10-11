import { AbsoluteFill, Easing, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { C } from '../brand';
import { CAPTIONS } from '../captions';
import { CaptionBlock, LogoMark, type SceneProps } from '../ui';

export function LogoScene({ layout }: SceneProps) {
	const f = useCurrentFrame();
	const draw = interpolate(f, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
	const person = interpolate(f, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	return (
		<AbsoluteFill style={{ background: C.bg, alignItems: 'center', justifyContent: 'center', gap: 56, flexDirection: 'column' }}>
			<LogoMark size={layout === 'wide' ? 300 : 380} arc={C.safe} draw={draw} person={person} glow={person} />
			<Sequence from={30} layout="none">
				<CaptionBlock c={CAPTIONS.en.logo} layout={layout} center />
			</Sequence>
		</AbsoluteFill>
	);
}
