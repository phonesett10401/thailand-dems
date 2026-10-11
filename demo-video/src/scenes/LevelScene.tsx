import { AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../brand';
import { ROUTE_KM } from '../bangkok';
import { CAPTIONS, LABELS } from '../captions';
import { msg } from '../i18n';
import { BPM, FPS, LEVEL_CUES, scene } from '../timeline';
import { Phone, PhoneHeader, Stage, TabBar, useAppear, type SceneProps } from '../ui';

const LEVELS = [['safe', C.safe], ['watch', C.watch], ['warning', C.warning]] as const;
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const RING_LIFE = 75; // frames; with a beat every ~24.5 frames, at most 3 rings are visible

export function LevelScene({ layout, lang }: SceneProps) {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const wide = layout === 'wide';
	const start = scene('level').from;
	const watchAt = LEVEL_CUES.watch - start;
	const warnAt = LEVEL_CUES.warning - start;
	const state = f < watchAt ? 'safe' : f < warnAt ? 'watch' : 'warning';
	const col = interpolateColors(f, [watchAt - 6, watchAt, warnAt - 6, warnAt], [C.safe, C.watch, C.watch, C.warning]);
	const pulse = state === 'warning' ? (Math.sin((f - warnAt) / 5) + 1) / 2 : 0;
	const flash = state === 'warning' ? 0.6 * (1 - spring({ frame: f - warnAt, fps, config: { damping: 30 } })) : 0;
	const since = state === 'safe' ? 0 : state === 'watch' ? watchAt : warnAt;
	const swap = spring({ frame: f - since, fps, config: { damping: 200 } });

	// These follow the real rules: haze PM2.5 41.2 > 37.5 is Watch; 112 mm of rain ≥ 90 is Warning.
	// Same sentence-casing as the app's nowTitle() (web/src/lib/labels.ts); no-op for Thai.
	const sentence = (s: string) => s.toLowerCase().charAt(0).toUpperCase() + s.toLowerCase().slice(1);
	const title =
		state === 'safe' ? msg(lang, 'now_safe_title')
		: state === 'watch' ? sentence(msg(lang, 'now_title_1', { a: msg(lang, 'haz_smoke') }))
		: sentence(msg(lang, 'now_title_2', { a: msg(lang, 'haz_rain'), b: msg(lang, 'haz_smoke') }));
	const pm = interpolate(f, [watchAt + 8, watchAt + 28], [0, 41.2], clamp).toFixed(1);
	const rain = Math.round(interpolate(f, [warnAt + 8, warnAt + 28], [0, 112], clamp));
	const lines: { text: string; dot: string }[] =
		state === 'watch' ? [{ text: msg(lang, 'line_pm25', { value: pm }), dot: C.watch }]
		: state === 'warning' ? [{ text: msg(lang, 'line_rain', { value: rain }), dot: C.warning }, { text: msg(lang, 'line_pm25', { value: '41.2' }), dot: C.watch }]
		: [];

	const pills = useAppear(10);
	const s = wide ? 1.12 : 1.45;
	const beat = (60 * FPS) / BPM;
	const rings = state === 'warning'
		? Array.from({ length: Math.floor((f - warnAt) / beat) + 1 }, (_, k) => (f - warnAt - k * beat) / RING_LIFE).filter((p) => p < 1)
		: [];
	const glowA = interpolate(f, [0, 12], [0, 0.3], clamp);

	const scale = (
		<div style={{ display: 'flex', gap: 18, justifyContent: 'center', fontFamily: FONT, ...pills }}>
			{LEVELS.map(([k, c], i) => {
				const on = state === k;
				const at = [0, watchAt, warnAt][i];
				const pop = on ? 1 + 0.08 * spring({ frame: f - at, fps, config: { damping: 14 } }) : 1;
				return (
					<div key={k} style={{
						display: 'flex', alignItems: 'center', gap: 14, height: 68, padding: '0 28px', borderRadius: 999, fontSize: 32, fontWeight: 700,
						color: on ? c : C.muted, border: `2px solid ${on ? c : 'rgba(255,255,255,0.14)'}`,
						background: on ? `color-mix(in srgb, ${c} 15%, transparent)` : 'transparent', transform: `scale(${pop})`
					}}>
						<span style={{ width: 16, height: 16, borderRadius: 8, background: on ? c : C.muted, opacity: on ? 1 : 0.6 }} />
						{msg(lang, `lvl_${k}`)}
					</div>
				);
			})}
		</div>
	);

	return (
		<Stage layout={layout} caption={{ title: CAPTIONS.en.level.title }} below={scale}>
			<div style={{ position: 'relative' }}>
				<div style={{ position: 'absolute', left: '50%', top: '50%', width: 1300, height: 1300, transform: 'translate(-50%,-50%)', borderRadius: 650, opacity: glowA, background: `radial-gradient(closest-side, ${col}, transparent)` }} />
				{rings.map((p, i) => (
					<div key={i} style={{
						position: 'absolute', left: '50%', top: '50%', width: 410 * s, height: 410 * s, borderRadius: '50%', border: `3px solid ${C.warning}`,
						transform: `translate(-50%,-50%) scale(${1 + 0.8 * p})`, opacity: 0.6 * (1 - p)
					}} />
				))}
				<Phone layout={layout}>
					<PhoneHeader arc={col} place={LABELS.en.place} glow={pulse} />
					<div style={{ padding: '30px 22px', opacity: swap, transform: `translateY(${(1 - swap) * 16}px)` }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 12, color: col, fontWeight: 800, fontSize: 40, lineHeight: 1 }}>
							<span style={{ width: 16, height: 16, borderRadius: 8, background: col }} />
							{msg(lang, `lvl_${state}`)}
						</div>
						<div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginTop: 20 }}>{title}</div>
						{state === 'safe' && <div style={{ fontSize: 17, color: C.muted, marginTop: 14 }}>{msg(lang, 'now_safe_body', { place: LABELS.en.place })}</div>}
						{lines.length > 0 && (
							<div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
								{lines.map((l, i) => (
									<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17 }}>
										<span style={{ width: 9, height: 9, borderRadius: 5, background: l.dot, flex: 'none' }} />
										{l.text}
									</div>
								))}
							</div>
						)}
						<div style={{ fontSize: 13, color: C.muted, marginTop: 18 }}>{msg(lang, 'now_guidance')}</div>
						{state === 'warning' && (
							<div style={{ marginTop: 22, padding: '16px 16px 16px 18px', borderRadius: 20, background: C.raised, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 12 }}>
								<div style={{ flex: 1 }}>
									<div style={{ fontSize: 13, color: C.muted }}>{msg(lang, 'now_shelter')}</div>
									<div style={{ fontSize: 18, fontWeight: 600, marginTop: 5, lineHeight: 1.2 }}>{LABELS.en.shelter}</div>
									<div style={{ fontSize: 15, color: C.muted, marginTop: 4 }}>{ROUTE_KM} km</div>
								</div>
								<div style={{ flex: 'none', padding: '9px 16px', borderRadius: 999, background: C.text, color: C.bg, fontWeight: 700, fontSize: 15 }}>{msg(lang, 'shelter_route')} →</div>
							</div>
						)}
					</div>
					<TabBar lang={lang} active="nav_now" />
					<AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(circle at 50% 30%, ${C.warning}55, transparent 70%)`, opacity: flash }} />
				</Phone>
			</div>
		</Stage>
	);
}
