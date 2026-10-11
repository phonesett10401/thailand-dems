import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ARC, BODY, C, FONT, SHIELD } from './brand';
import type { Caption } from './captions';
import type { Layout } from './compositions';
import { msg, type Lang } from './i18n';

export type SceneProps = { layout: Layout; lang: Lang };

/** Fade + rise in, starting `delay` frames into the current Sequence. */
export function useAppear(delay = 0): CSSProperties {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const p = spring({ frame: f - delay, fps, config: { damping: 200 } });
	return { opacity: p, transform: `translateY(${(1 - p) * 24}px)` };
}

export function CaptionBlock({ c, center = false, layout }: { c: Caption; center?: boolean; layout: Layout }) {
	const a = useAppear(0);
	const b = useAppear(6);
	const big = layout === 'tall' ? 84 : 76;
	return (
		<div style={{ maxWidth: layout === 'tall' ? 920 : 680, textAlign: center ? 'center' : 'left', fontFamily: FONT }}>
			<div style={{ ...a, fontWeight: 800, fontSize: big, lineHeight: 1.05, letterSpacing: '-0.03em', color: C.text }}>{c.title}</div>
			{c.sub && <div style={{ ...b, fontSize: big * 0.45, color: C.muted, marginTop: 24 }}>{c.sub}</div>}
		</div>
	);
}

/** Caption beside the visual (wide) or above it (tall). */
export function Stage({ layout, caption, children }: { layout: Layout; caption: Caption; children: ReactNode }) {
	const wide = layout === 'wide';
	return (
		<AbsoluteFill
			style={{
				background: C.bg, display: 'flex', flexDirection: wide ? 'row' : 'column', alignItems: 'center',
				justifyContent: wide ? 'space-between' : 'flex-start', padding: wide ? '0 140px' : '150px 80px 80px', gap: wide ? 80 : 70
			}}
		>
			<CaptionBlock c={caption} layout={layout} center={!wide} />
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: wide ? 'none' : 1 }}>{children}</div>
		</AbsoluteFill>
	);
}

/** The app logo. `draw` 0→1 strokes the shield; `person` fades the arc and figure in; `glow` 0→1 adds a halo. */
export function LogoMark({ size, arc, draw = 1, person = 1, glow = 0 }: { size: number; arc: string; draw?: number; person?: number; glow?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: 'visible' }}>
			<path d={SHIELD} fill="none" stroke={C.text} strokeWidth={4.5} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
			<path d={ARC} fill="none" stroke={arc} strokeWidth={4} strokeLinecap="round" opacity={person} style={glow ? { filter: `drop-shadow(0 0 ${glow * 5}px ${arc})` } : undefined} />
			<g opacity={person}>
				<circle cx={32} cy={31} r={4.6} fill={C.text} />
				<path d={BODY} fill={C.text} />
			</g>
		</svg>
	);
}

/** A 390×844 phone, scaled for the layout. */
export function Phone({ layout, children }: { layout: Layout; children: ReactNode }) {
	const s = layout === 'wide' ? 1.05 : 1.45;
	return (
		<div style={{ width: 390 * s + 20, height: 844 * s + 20, flex: 'none' }}>
			<div
				style={{
					width: 390, height: 844, transform: `scale(${s})`, transformOrigin: 'top left', borderRadius: 56, border: '10px solid #1c1c22',
					background: C.bg, overflow: 'hidden', position: 'relative', fontFamily: FONT, color: C.text, boxShadow: '0 40px 120px rgba(0,0,0,0.6)'
				}}
			>
				{children}
			</div>
		</div>
	);
}

export function PhoneHeader({ arc, place, glow = 0 }: { arc: string; place: string; glow?: number }) {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '54px 20px 14px', borderBottom: `1px solid ${C.line}` }}>
			<LogoMark size={30} arc={arc} glow={glow} />
			<span style={{ width: 10, height: 10, borderRadius: 5, background: arc }} />
			<span style={{ fontSize: 17, color: C.muted }}>{place}</span>
		</div>
	);
}

const TABS = ['nav_now', 'nav_map', 'nav_shelters', 'nav_prepare', 'nav_more'];
export function TabBar({ lang, active }: { lang: Lang; active: string }) {
	return (
		<div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'space-around', padding: '14px 8px 30px', borderTop: `1px solid ${C.line}`, background: 'rgba(10,10,12,0.9)' }}>
			{TABS.map((k) => (
				<span key={k} style={{ fontSize: 12, color: k === active ? C.text : C.muted, fontWeight: k === active ? 600 : 400 }}>{msg(lang, k)}</span>
			))}
		</div>
	);
}
