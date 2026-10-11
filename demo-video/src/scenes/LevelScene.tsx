import { AbsoluteFill, interpolateColors, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../brand';
import { CAPTIONS, LABELS } from '../captions';
import { msg } from '../i18n';
import { LEVEL_CUES, scene } from '../timeline';
import { Phone, PhoneHeader, Stage, TabBar, type SceneProps } from '../ui';

export function LevelScene({ layout, lang }: SceneProps) {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const start = scene('level').from;
	const watchAt = LEVEL_CUES.watch - start;
	const warnAt = LEVEL_CUES.warning - start;
	const state = f < watchAt ? 'safe' : f < warnAt ? 'watch' : 'warning';
	const col = interpolateColors(f, [watchAt - 6, watchAt, warnAt - 6, warnAt], [C.safe, C.watch, C.watch, C.warning]);
	const pulse = state === 'warning' ? (Math.sin((f - warnAt) / 5) + 1) / 2 : 0;
	const flash = state === 'warning' ? 1 - spring({ frame: f - warnAt, fps, config: { damping: 30 } }) : 0;
	const swap = spring({ frame: f - (state === 'safe' ? 0 : state === 'watch' ? watchAt : warnAt), fps, config: { damping: 200 } });

	// These follow the real rules: haze PM2.5 41.2 > 37.5 is Watch; 112 mm of rain ≥ 90 is Warning.
	// Same sentence-casing as the app's nowTitle() (web/src/lib/labels.ts); no-op for Thai.
	const sentence = (s: string) => s.toLowerCase().charAt(0).toUpperCase() + s.toLowerCase().slice(1);
	const title =
		state === 'safe' ? msg(lang, 'now_safe_title')
		: state === 'watch' ? sentence(msg(lang, 'now_title_1', { a: msg(lang, 'haz_smoke') }))
		: sentence(msg(lang, 'now_title_2', { a: msg(lang, 'haz_rain'), b: msg(lang, 'haz_smoke') }));
	const lines =
		state === 'safe' ? [msg(lang, 'now_safe_body', { place: LABELS.en.place })]
		: state === 'watch' ? [msg(lang, 'line_pm25', { value: 41.2 })]
		: [msg(lang, 'line_rain', { value: 112 }), msg(lang, 'line_pm25', { value: 41.2 })];

	return (
		<Stage layout={layout} caption={CAPTIONS.en.level}>
			<Phone layout={layout}>
				<PhoneHeader arc={col} place={LABELS.en.place} glow={pulse} />
				<div style={{ padding: '28px 22px', opacity: swap, transform: `translateY(${(1 - swap) * 16}px)` }}>
					<div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: `${col}26`, color: col, fontWeight: 700, fontSize: 22 }}>
						<span style={{ width: 12, height: 12, borderRadius: 6, background: col }} />
						{msg(lang, `lvl_${state}`)}
					</div>
					<div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', marginTop: 22 }}>{title}</div>
					{lines.map((l) => (
						<div key={l} style={{ fontSize: 17, color: C.muted, marginTop: 10 }}>{l}</div>
					))}
					<div style={{ fontSize: 13, color: C.muted, marginTop: 18 }}>{msg(lang, 'now_guidance')}</div>
					{state === 'warning' && (
						<div style={{ marginTop: 26, padding: 18, borderRadius: 20, background: C.raised, border: `1px solid ${C.line}` }}>
							<div style={{ fontSize: 13, color: C.muted }}>{msg(lang, 'now_shelter')}</div>
							<div style={{ fontSize: 19, fontWeight: 600, marginTop: 6 }}>{LABELS.en.shelter}</div>
							<div style={{ fontSize: 15, color: C.muted, marginTop: 4 }}>3.7 km</div>
						</div>
					)}
				</div>
				<TabBar lang={lang} active="nav_now" />
				<AbsoluteFill style={{ pointerEvents: 'none', background: `radial-gradient(circle at 50% 30%, ${C.warning}55, transparent 70%)`, opacity: flash }} />
			</Phone>
		</Stage>
	);
}
