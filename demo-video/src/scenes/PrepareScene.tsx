import { interpolate, useCurrentFrame } from 'remotion';
import { C } from '../brand';
import { CAPTIONS, LABELS } from '../captions';
import { msg, type Lang } from '../i18n';
import { PREP_CUES, scene } from '../timeline';
import { Phone, PhoneHeader, Stage, TabBar, type SceneProps } from '../ui';

// ponytail: 6 items copied from guides.ts (BASICS + flood EXTRAS); it's an illustration, not the live list.
const ITEMS: Record<Lang, string>[] = [
	{ en: 'Water: 2 litres per person in the bag, more stored at home', th: 'น้ำดื่ม 2 ลิตรต่อคนในกระเป๋า และสำรองเพิ่มไว้ที่บ้าน' },
	{ en: 'First-aid kit', th: 'ชุดปฐมพยาบาล' },
	{ en: 'Torch and spare batteries', th: 'ไฟฉายและถ่านสำรอง' },
	{ en: 'Copies of ID card, passport and house registration in a waterproof bag', th: 'สำเนาบัตรประชาชน หนังสือเดินทาง และทะเบียนบ้าน ใส่ถุงกันน้ำ' },
	{ en: 'Rubber boots', th: 'รองเท้าบู๊ตยาง' },
	{ en: 'Waterproof bags for documents and phone', th: 'ถุงกันน้ำสำหรับเอกสารและโทรศัพท์' }
];

export function PrepareScene({ layout }: SceneProps) {
	const f = useCurrentFrame();
	const start = scene('prepare').from;
	const lang: Lang = f < PREP_CUES.flip - start ? 'en' : 'th';
	const done = PREP_CUES.ticks.filter((t) => f >= t - start).length;
	const knob = interpolate(f, [PREP_CUES.flip - start - 6, PREP_CUES.flip - start], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
	const chips = [['prep_kit_basics', false], ['haz_flood', true], ['haz_smoke', false]] as const;
	return (
		<Stage layout={layout} caption={CAPTIONS.en.prepare}>
			<Phone layout={layout}>
				<PhoneHeader arc={C.warning} place={LABELS.en.place} />
				<div style={{ padding: '22px 20px' }}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<div style={{ fontSize: 26, fontWeight: 800 }}>{msg(lang, 'prep_bag')}</div>
						<div style={{ position: 'relative', display: 'flex', borderRadius: 999, border: `1px solid ${C.line}`, fontSize: 14, fontWeight: 600 }}>
							<div style={{ position: 'absolute', top: 2, bottom: 2, left: 2 + knob * 46, width: 44, borderRadius: 999, background: C.text }} />
							<span style={{ position: 'relative', width: 46, textAlign: 'center', padding: '6px 0', color: knob < 0.5 ? C.bg : C.muted }}>EN</span>
							<span style={{ position: 'relative', width: 46, textAlign: 'center', padding: '6px 0', color: knob >= 0.5 ? C.bg : C.muted }}>ไทย</span>
						</div>
					</div>
					<div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
						{chips.map(([k, on]) => (
							<span key={k} style={{ padding: '8px 14px', borderRadius: 999, fontSize: 14, border: `1px solid ${on ? C.text : C.line}`, background: on ? C.text : 'transparent', color: on ? C.bg : C.text }}>{msg(lang, k)}</span>
						))}
					</div>
					<div style={{ fontSize: 14, color: C.muted, marginTop: 16 }}>{msg(lang, 'prep_bag_count', { done, total: ITEMS.length })}</div>
					<div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
						{ITEMS.map((it, i) => {
							const on = i < done;
							return (
								<div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', borderRadius: 16, background: C.raised, border: `1px solid ${C.line}` }}>
									<span style={{ flex: 'none', width: 22, height: 22, borderRadius: 7, border: `2px solid ${on ? C.safe : C.muted}`, background: on ? C.safe : 'transparent', color: C.bg, fontSize: 15, lineHeight: '18px', textAlign: 'center', fontWeight: 900 }}>{on ? '✓' : ''}</span>
									<span style={{ fontSize: 15, color: on ? C.muted : C.text, textDecoration: on ? 'line-through' : 'none' }}>{it[lang]}</span>
								</div>
							);
						})}
					</div>
				</div>
				<TabBar lang={lang} active="nav_prepare" />
			</Phone>
		</Stage>
	);
}
