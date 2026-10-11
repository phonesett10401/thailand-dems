import type { ReactNode } from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../brand';
import { CAPTIONS, LABELS } from '../captions';
import { LogoMark, Stage, type SceneProps } from '../ui';

type Box = { x: number; y: number };

export function HowScene({ layout }: SceneProps) {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const wide = layout === 'wide';
	const W = 900, H = wide ? 700 : 1150;
	const L = LABELS.en;
	// Sources → DEMS → outputs, left→right (wide) or top→bottom (tall).
	const col = (i: number, n: number, along: number): Box =>
		wide ? { x: along, y: (H / (n + 1)) * (i + 1) } : { x: (W / (n + 1)) * (i + 1), y: along };
	const src = L.sources.map((_, i) => col(i, 3, wide ? 150 : 140));
	const hub: Box = wide ? { x: W / 2, y: H / 2 } : { x: W / 2, y: H / 2 };
	const out = L.outputs.map((_, i) => col(i, 3, wide ? W - 150 : H - 140));
	const appear = (d: number) => spring({ frame: f - d, fps, config: { damping: 200 } });
	const flow = (f % 30) / 30;
	const lines = [...src.map((s) => [s, hub] as const), ...out.map((o, i) => [hub, o, L.outputs[i].phase2] as const)];
	const node = (b: Box, d: number, children: ReactNode, dim = false) => (
		<div style={{ position: 'absolute', left: b.x, top: b.y, transform: `translate(-50%,-50%) scale(${0.9 + 0.1 * appear(d)})`, opacity: appear(d) * (dim ? 0.45 : 1), padding: wide ? '16px 22px' : '14px 10px', color: C.text, boxSizing: 'border-box', borderRadius: 20, background: C.raised, border: `1px solid ${C.line}`, fontFamily: FONT, textAlign: 'center', width: wide ? 220 : 205 }}>{children}</div>
	);
	return (
		<Stage layout={layout} caption={CAPTIONS.en.how}>
			<div style={{ position: 'relative', width: W, height: H }}>
				<svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
					{lines.map(([a, b, dim], i) => (
						<g key={i} opacity={interpolate(f, [10 + i * 3, 25 + i * 3], [0, dim ? 0.35 : 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
							<line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.18)" strokeWidth={3} />
							<circle cx={a.x + (b.x - a.x) * flow} cy={a.y + (b.y - a.y) * flow} r={7} fill={C.info} />
						</g>
					))}
				</svg>
				{L.sources.map((s, i) => (
					<div key={s.name}>{node(src[i], i * 4, <><div style={{ fontSize: 26, fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 18, color: C.muted, marginTop: 4 }}>{s.what}</div></>)}</div>
				))}
				<div style={{ position: 'absolute', left: hub.x, top: hub.y, transform: 'translate(-50%,-50%)', opacity: appear(12) }}>
					<LogoMark size={wide ? 170 : 190} arc={C.safe} glow={0.6} />
				</div>
				{L.outputs.map((o, i) => (
					<div key={o.name}>{node(out[i], 20 + i * 4, <><div style={{ fontSize: 26, fontWeight: 700 }}>{o.name}</div>{o.phase2 && <div style={{ fontSize: 16, color: C.muted, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L.phase2}</div>}</>, o.phase2)}</div>
				))}
			</div>
		</Stage>
	);
}
