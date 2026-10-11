import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { ROADS_MAJOR, ROADS_MINOR, ROUTE, ROUTE_KM, ROUTE_MIN, SHELTER, START, TURN, WATER, ZONE } from '../bangkok';
import { C } from '../brand';
import { CAPTIONS, LABELS } from '../captions';
import { msg } from '../i18n';
import { Phone, PhoneHeader, Stage, TabBar, type SceneProps } from '../ui';

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const DRAW = [12, 85] as const; // local frames the route is drawn over
const ease = Easing.inOut(Easing.quad);

// Route vertices and cumulative lengths, so the glowing tip can sit at any drawn fraction.
const NUMS = ROUTE.match(/-?\d+(\.\d+)?/g)!.map(Number);
const PTS: [number, number][] = Array.from({ length: NUMS.length / 2 }, (_, i) => [NUMS[2 * i], NUMS[2 * i + 1]]);
const CUM = PTS.reduce<number[]>((a, p, i) => [...a, i ? a[i - 1] + Math.hypot(p[0] - PTS[i - 1][0], p[1] - PTS[i - 1][1]) : 0], []);
function tipAt(t: number): [number, number] {
	const d = t * CUM[CUM.length - 1];
	let i = 1;
	while (i < CUM.length - 1 && CUM[i] < d) i++;
	const u = (d - CUM[i - 1]) / (CUM[i] - CUM[i - 1] || 1);
	return [PTS[i - 1][0] + (PTS[i][0] - PTS[i - 1][0]) * u, PTS[i - 1][1] + (PTS[i][1] - PTS[i - 1][1]) * u];
}
const drawn = (f: number) => interpolate(f, DRAW, [0, 1], { ...clamp, easing: ease });
// first local frame at which the route has passed the turn
const TURN_FRAME = Array.from({ length: DRAW[1] - DRAW[0] + 1 }, (_, i) => DRAW[0] + i).find((f) => drawn(f) >= TURN.at) ?? DRAW[1];

const rd = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function RouteScene({ layout, lang }: SceneProps) {
	const f = useCurrentFrame();
	const { fps } = useVideoConfig();
	const zone = spring({ frame: f, fps, config: { damping: 200 } });
	const draw = drawn(f);
	const arrive = spring({ frame: f - DRAW[1], fps, config: { damping: 12 } });
	const chip = spring({ frame: f - TURN_FRAME, fps, config: { damping: 200 } });
	const card = spring({ frame: f - 70, fps, config: { damping: 200 } });
	const cam = 1.35 - 0.35 * draw; // zoomed in on the start, easing out to the full view as the route completes
	const [tx, ty] = tipAt(draw);
	const min = Math.round(ROUTE_MIN + 6 - 6 * draw);
	const right = TURN.text.includes('right');
	return (
		<Stage layout={layout} caption={CAPTIONS.en.route}>
			<Phone layout={layout}>
				<PhoneHeader arc={C.warning} place={LABELS.en.place} />
				<div style={{ position: 'relative', height: 700 }}>
					<svg width={390} height={700} style={{ display: 'block', background: '#0f0f12' }}>
						<g transform={`translate(${START[0] * (1 - cam)} ${START[1] * (1 - cam)}) scale(${cam})`}>
							<path d={WATER} stroke="rgba(10,132,255,0.25)" strokeWidth={5} {...rd} />
							<path d={ROADS_MINOR} stroke="rgba(255,255,255,0.07)" strokeWidth={2} {...rd} />
							<path d={ROADS_MAJOR} stroke="rgba(255,255,255,0.16)" strokeWidth={4} {...rd} />
							<circle cx={ZONE.cx} cy={ZONE.cy} r={ZONE.r * zone} fill={`${C.warning}2e`} stroke={C.warning} strokeWidth={2} strokeDasharray="6 6" />
							<g opacity={zone}>
								<rect x={ZONE.cx - 46} y={ZONE.cy - 12} width={92} height={24} rx={12} fill={C.warning} />
								<text x={ZONE.cx} y={ZONE.cy + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#fff" fontFamily="Geist, Anuphan, sans-serif">{LABELS.en.zone}</text>
							</g>
							<path d={`M${START.join(' ')} L${SHELTER.join(' ')}`} stroke="rgba(255,255,255,0.3)" strokeWidth={2.5} strokeDasharray="2 7" strokeLinecap="round" fill="none" />
							<path d={ROUTE} stroke={C.info} strokeWidth={6} {...rd} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
							{draw > 0 && draw < 1 && <circle cx={tx} cy={ty} r={9} fill={C.info} opacity={0.9} style={{ filter: `drop-shadow(0 0 8px ${C.info})` }} />}
							<circle cx={START[0]} cy={START[1]} r={9} fill={C.info} stroke={C.text} strokeWidth={3} />
							<rect
								x={SHELTER[0] - 13} y={SHELTER[1] - 13} width={26} height={26} rx={7} fill={C.text}
								transform={`translate(${SHELTER[0]} ${SHELTER[1]}) scale(${0.6 + 0.4 * arrive}) translate(${-SHELTER[0]} ${-SHELTER[1]})`}
							/>
						</g>
					</svg>
					<div style={{
						position: 'absolute', left: 16, right: 16, top: 12, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16,
						background: 'rgba(20,20,24,0.92)', border: `1px solid ${C.line}`, fontSize: 15, fontWeight: 600, opacity: chip, transform: `translateY(${(1 - chip) * -16}px)`
					}}>
						<span style={{ fontSize: 20, lineHeight: 1, color: C.info }}>{right ? '→' : '←'}</span>
						{TURN.text}
					</div>
					<div style={{ position: 'absolute', left: 10, bottom: 178, fontSize: 9.5, color: C.muted, opacity: 0.8 }}>© OpenStreetMap contributors</div>
				</div>
				<div style={{ position: 'absolute', left: 16, right: 16, bottom: 92, padding: 18, borderRadius: 20, background: C.raised, border: `1px solid ${C.line}`, opacity: card, transform: `translateY(${(1 - card) * 20}px)` }}>
					<div style={{ fontSize: 17, fontWeight: 600 }}>{msg(lang, 'route_title', { name: LABELS.en.shelter })}</div>
					<div style={{ fontSize: 15, color: C.muted, marginTop: 6 }}>{msg(lang, 'route_summary', { km: ROUTE_KM, min })}</div>
				</div>
				<TabBar lang={lang} active="nav_shelters" />
			</Phone>
		</Stage>
	);
}
