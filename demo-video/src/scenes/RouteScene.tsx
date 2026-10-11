import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../brand';
import { CAPTIONS, LABELS } from '../captions';
import { msg } from '../i18n';
import { Phone, PhoneHeader, Stage, TabBar, type SceneProps } from '../ui';

// Phone-map coordinates (390 wide). The route bends around the danger zone (centre 195,360, r 95).
const START: [number, number] = [90, 600];
const SHELTER: [number, number] = [300, 140];
const ROUTE = 'M90 600 C 60 480, 70 330, 150 240 S 260 150, 300 140';
const ROADS = ['M0 520 L390 470', 'M40 0 L120 760', 'M0 250 L390 210', 'M260 0 L330 760', 'M0 650 L390 690'];

export function RouteScene({ layout, lang }: SceneProps) {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const zone = spring({ frame: f, fps, config: { damping: 200 } });
	const draw = interpolate(f, [12, 70], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
	const card = spring({ frame: f - 70, fps, config: { damping: 200 } });
	return (
		<Stage layout={layout} caption={CAPTIONS.en.route}>
			<Phone layout={layout}>
				<PhoneHeader arc={C.warning} place={LABELS.en.place} />
				<svg width={390} height={700} style={{ display: 'block', background: '#0f0f12' }}>
					{ROADS.map((d) => <path key={d} d={d} stroke="rgba(255,255,255,0.08)" strokeWidth={6} fill="none" />)}
					<circle cx={195} cy={360} r={95 * zone} fill={`${C.warning}2e`} stroke={C.warning} strokeWidth={2} strokeDasharray="6 6" />
					<path d={`M${START.join(' ')} L${SHELTER.join(' ')}`} stroke="rgba(255,255,255,0.18)" strokeWidth={3} strokeDasharray="4 8" fill="none" />
					<path d={ROUTE} stroke={C.info} strokeWidth={7} strokeLinecap="round" fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
					<circle cx={START[0]} cy={START[1]} r={10} fill={C.info} stroke={C.text} strokeWidth={3} />
					<rect x={SHELTER[0] - 13} y={SHELTER[1] - 13} width={26} height={26} rx={7} fill={C.text} />
				</svg>
				<div style={{ position: 'absolute', left: 16, right: 16, bottom: 92, padding: 18, borderRadius: 20, background: C.raised, border: `1px solid ${C.line}`, opacity: card, transform: `translateY(${(1 - card) * 20}px)` }}>
					<div style={{ fontSize: 17, fontWeight: 600 }}>{msg(lang, 'route_title', { name: LABELS.en.shelter })}</div>
					<div style={{ fontSize: 15, color: C.muted, marginTop: 6 }}>{msg(lang, 'route_summary', { km: 3.9, min: 47 })}</div>
				</div>
				<TabBar lang={lang} active="nav_shelters" />
			</Phone>
		</Stage>
	);
}
