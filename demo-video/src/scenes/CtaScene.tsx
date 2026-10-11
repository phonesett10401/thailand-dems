import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../brand';
import { CAPTIONS, LABELS } from '../captions';
import { CaptionBlock, LogoMark, useAppear, type SceneProps } from '../ui';

export function CtaScene({ layout }: SceneProps) {
	const f = useCurrentFrame();
	const { durationInFrames } = useVideoConfig();
	const fadeOut = interpolate(f, [durationInFrames - 15, durationInFrames - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const url = useAppear(18);
	return (
		<AbsoluteFill style={{ background: C.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 48, opacity: fadeOut }}>
			<LogoMark size={layout === 'wide' ? 200 : 260} arc={C.safe} glow={0.8} />
			<CaptionBlock c={CAPTIONS.en.cta} layout={layout} center />
			<div style={{ ...url, fontFamily: 'Geist, sans-serif', fontSize: layout === 'wide' ? 44 : 48, fontWeight: 600, padding: '18px 36px', borderRadius: 999, background: C.text, color: C.bg }}>{LABELS.en.url}</div>
		</AbsoluteFill>
	);
}
