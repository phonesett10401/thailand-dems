import type { Hazard, HazardType, Lvl } from '../levels';
import type { Country } from '../countries';
import { currentCountry } from '../country.svelte';
import { getLocale } from '../paraglide/runtime.js';

export type Text = { en: string; th: string };
export type Guide = { title: Text; summary: Text; before: Text[]; during: Text[]; after: Text[] };

const t = (en: string, th: string): Text => ({ en, th });
/** Fill {medical} {fire} {police} {disaster} {officials} from a country. */
export const gx = (x: Text, c: Country): string => {
	const loc = getLocale();
	return x[loc].replace(/\{(medical|fire|police|disaster|officials)\}/g, (_, k: keyof Country['guide']) => (k === 'officials' ? c.guide.officials[loc] : c.guide[k]));
};
export const tx = (x: Text): string => gx(x, currentCountry());

export const GUIDES = ['flood', 'flash-flood', 'storm', 'smoke', 'heat', 'earthquake', 'tsunami', 'landslide', 'drought', 'chemical', 'cold', 'snow'] as const;
export type GuideId = (typeof GUIDES)[number];

// Thai text is a draft for native review (messages/TH_REVIEW.md).
export const GUIDE: Record<GuideId, Guide> = {
	flood: {
		title: t('Flood', 'น้ำท่วม'),
		summary: t('Rivers and rain overflow into streets and homes.', 'น้ำจากแม่น้ำและน้ำฝนไหลล้นเข้าท่วมถนนและบ้านเรือน'),
		before: [
			t('Know your nearest shelter and two ways to get there.', 'รู้ตำแหน่งที่พักพิงที่ใกล้ที่สุด และเส้นทางไปที่นั่น 2 เส้นทาง'),
			t('Move valuables, documents and medicine to a high shelf or upper floor.', 'ย้ายของมีค่า เอกสาร และยาไว้ที่สูงหรือชั้นบน'),
			t('Charge your phone and a power bank; keep a torch ready.', 'ชาร์จโทรศัพท์และพาวเวอร์แบงก์ เตรียมไฟฉายไว้'),
			t('Pack a go-bag with water, food and ID for three days.', 'เตรียมกระเป๋าฉุกเฉิน มีน้ำ อาหาร และบัตรประชาชน พอสำหรับ 3 วัน')
		],
		during: [
			t('Move to higher ground or the nearest shelter now.', 'ไปยังที่สูงหรือที่พักพิงที่ใกล้ที่สุดทันที'),
			t('Turn off electricity at the main switch, but only if you are dry and not standing in water.', 'ตัดไฟที่สวิตช์หลัก แต่ทำได้เฉพาะเมื่อตัวคุณแห้งและไม่ได้ยืนอยู่ในน้ำ'),
			t('Never walk or drive through moving water; 15 cm can knock you down.', 'ห้ามเดินหรือขับรถฝ่ากระแสน้ำ น้ำไหลสูงเพียง 15 ซม. ก็พัดคนล้มได้'),
			t('Take ID, medicine, phone, charger and drinking water.', 'นำบัตรประชาชน ยา โทรศัพท์ ที่ชาร์จ และน้ำดื่มติดตัวไป')
		],
		after: [
			t('Return home only when officials say it is safe.', 'กลับบ้านเมื่อเจ้าหน้าที่แจ้งว่าปลอดภัยแล้วเท่านั้น'),
			t('Have an electrician check wiring before switching power on.', 'ให้ช่างไฟฟ้าตรวจสายไฟก่อนเปิดไฟ'),
			t('Throw away food and water that touched floodwater.', 'ทิ้งอาหารและน้ำที่สัมผัสน้ำท่วม'),
			t('Watch for snakes and sharp debris when cleaning up.', 'ระวังงูและเศษวัสดุมีคมขณะทำความสะอาด')
		]
	},
	'flash-flood': {
		title: t('Flash flood and heavy rain', 'น้ำป่าไหลหลากและฝนตกหนัก'),
		summary: t('Water rises within minutes after heavy rain, often near hills.', 'น้ำขึ้นเร็วภายในไม่กี่นาทีหลังฝนตกหนัก มักเกิดใกล้ภูเขา'),
		before: [
			t('Check the rain forecast before hiking or camping near rivers.', 'ตรวจสอบพยากรณ์ฝนก่อนเดินป่าหรือตั้งแคมป์ใกล้ลำน้ำ'),
			t('Learn the high ground near your home, school and work.', 'รู้จักจุดที่สูงใกล้บ้าน โรงเรียน และที่ทำงาน'),
			t('Clear drains and gutters around your house.', 'ลอกท่อระบายน้ำและรางน้ำรอบบ้าน'),
			t('Keep your phone charged and alerts switched on.', 'ชาร์จโทรศัพท์ให้เต็มและเปิดการแจ้งเตือนไว้')
		],
		during: [
			t('Leave river banks, streams and low roads immediately.', 'ออกจากริมแม่น้ำ ลำธาร และถนนที่ต่ำทันที'),
			t('Climb to higher ground; do not wait for the water to rise.', 'ขึ้นไปยังที่สูง อย่ารอให้น้ำขึ้น'),
			t('Do not cross flooded roads or bridges, even in a car.', 'ห้ามข้ามถนนหรือสะพานที่น้ำท่วม แม้จะอยู่ในรถ'),
			t('A roaring sound upstream means water is coming.', 'หากได้ยินเสียงดังกึกก้องมาจากต้นน้ำ แสดงว่าน้ำกำลังมา')
		],
		after: [
			t('Stay away from river banks; they can collapse.', 'อยู่ห่างจากตลิ่ง เพราะอาจพังทลายได้'),
			t('Report blocked roads and damaged bridges.', 'แจ้งถนนที่ถูกปิดกั้นและสะพานที่เสียหาย'),
			t('Check on neighbours, especially older people.', 'ตรวจดูความปลอดภัยของเพื่อนบ้าน โดยเฉพาะผู้สูงอายุ'),
			t('Boil water until the supply is confirmed safe.', 'ต้มน้ำก่อนดื่ม จนกว่าจะมีการยืนยันว่าน้ำประปาปลอดภัย')
		]
	},
	storm: {
		title: t('Storm', 'พายุ'),
		summary: t('Tropical storms bring strong wind, heavy rain and storm surge.', 'พายุหมุนเขตร้อนนำลมแรง ฝนตกหนัก และคลื่นพายุซัดฝั่ง'),
		before: [
			t('Tie down or bring in loose objects outside.', 'ผูกยึดหรือเก็บสิ่งของนอกบ้านที่อาจปลิว'),
			t('Trim branches that hang over your roof or power lines.', 'ตัดกิ่งไม้ที่ยื่นเหนือหลังคาหรือสายไฟ'),
			t('Stock water, food, a torch and batteries for three days.', 'สำรองน้ำ อาหาร ไฟฉาย และถ่านไว้ใช้ 3 วัน'),
			t('Know which room in your home is the strongest.', 'รู้ว่าห้องไหนในบ้านแข็งแรงที่สุด')
		],
		during: [
			t('If told to evacuate, leave early while roads are open.', 'หากได้รับแจ้งให้อพยพ ให้ออกเดินทางแต่เนิ่นๆ ขณะถนนยังใช้ได้'),
			t('Stay indoors, away from windows and glass doors.', 'อยู่ในอาคาร ห่างจากหน้าต่างและประตูกระจก'),
			t('Unplug electrical devices if lightning is close.', 'ถอดปลั๊กเครื่องใช้ไฟฟ้าเมื่อมีฟ้าผ่าในบริเวณใกล้เคียง'),
			t('Do not go out on boats or to the beach.', 'ห้ามออกเรือหรือไปชายหาด')
		],
		after: [
			t('Stay away from fallen power lines and report them.', 'อยู่ห่างจากสายไฟที่ขาดหรือหล่นลงพื้น และแจ้งการไฟฟ้า'),
			t('Watch for flooding after the storm passes.', 'ระวังน้ำท่วมหลังพายุผ่านไป'),
			t('Photograph damage for insurance before cleaning.', 'ถ่ายภาพความเสียหายไว้ใช้เคลมประกันก่อนทำความสะอาด'),
			t('Use your phone only for urgent calls so lines stay free.', 'โทรเฉพาะเรื่องเร่งด่วน เพื่อไม่ให้คู่สายแน่น')
		]
	},
	smoke: {
		title: t('Smoke and haze (PM2.5)', 'หมอกควันและฝุ่น PM2.5'),
		summary: t('Fine dust from fires and traffic that harms lungs and heart.', 'ฝุ่นละเอียดจากการเผาและการจราจร เป็นอันตรายต่อปอดและหัวใจ'),
		before: [
			t('Buy N95 masks for everyone at home; cloth masks do not filter PM2.5.', 'ซื้อหน้ากาก N95 ให้ทุกคนในบ้าน หน้ากากผ้ากรองฝุ่น PM2.5 ไม่ได้'),
			t('Pick one room to seal and run an air purifier in.', 'เลือกห้องหนึ่งห้อง ปิดให้มิดชิดและเปิดเครื่องฟอกอากาศ'),
			t('Keep asthma and heart medicine stocked.', 'สำรองยาโรคหอบหืดและโรคหัวใจให้พอ'),
			t('Check PM2.5 each morning before going out.', 'ตรวจค่าฝุ่น PM2.5 ทุกเช้าก่อนออกจากบ้าน')
		],
		during: [
			t('Stay indoors with doors and windows closed.', 'อยู่ในอาคาร ปิดประตูและหน้าต่าง'),
			t('Wear an N95 mask whenever you go outside.', 'สวมหน้ากาก N95 ทุกครั้งที่ออกนอกอาคาร'),
			t('Avoid exercise outdoors, especially children and older people.', 'งดออกกำลังกายกลางแจ้ง โดยเฉพาะเด็กและผู้สูงอายุ'),
			t('See a doctor if you have chest pain or trouble breathing.', 'พบแพทย์หากเจ็บหน้าอกหรือหายใจลำบาก')
		],
		after: [
			t('Air out your home once PM2.5 drops below 37.5 µg/m³.', 'เปิดบ้านระบายอากาศเมื่อค่าฝุ่น PM2.5 ต่ำกว่า 37.5 มคก./ลบ.ม.'),
			t('Change or clean air purifier filters.', 'เปลี่ยนหรือทำความสะอาดแผ่นกรองเครื่องฟอกอากาศ'),
			t('Report burning you see to local authorities.', 'แจ้งการเผาที่พบเห็นต่อหน่วยงานท้องถิ่น'),
			t('Keep spare masks for the next haze season.', 'เก็บหน้ากากสำรองไว้ใช้ในฤดูหมอกควันครั้งหน้า')
		]
	},
	heat: {
		title: t('Extreme heat', 'อากาศร้อนจัด'),
		summary: t('Heat that can cause heatstroke, mostly March to May.', 'อากาศร้อนจัดที่อาจทำให้เกิดโรคลมร้อน (ฮีทสโตรก) มักเกิดช่วงมีนาคมถึงพฤษภาคม'),
		before: [
			t('Plan outdoor work for early morning or evening.', 'วางแผนทำงานกลางแจ้งช่วงเช้าตรู่หรือเย็น'),
			t('Find a cool place nearby: a mall, library or temple hall.', 'หาที่เย็นใกล้บ้าน เช่น ห้างสรรพสินค้า ห้องสมุด หรือศาลาวัด'),
			t('Check that older relatives have a fan or air conditioning.', 'ตรวจดูว่าญาติผู้สูงอายุมีพัดลมหรือเครื่องปรับอากาศ'),
			t('Keep oral rehydration salts at home.', 'มีผงเกลือแร่ติดบ้านไว้')
		],
		during: [
			t('Stay out of the sun between 11:00 and 15:00.', 'หลีกเลี่ยงแดดช่วง 11.00–15.00 น.'),
			t('Drink water every 20 minutes, even if you are not thirsty.', 'ดื่มน้ำทุก 20 นาที แม้ไม่รู้สึกกระหาย'),
			t('Confusion, fainting or very hot skin (with or without sweat) means heatstroke: call {medical} and cool the person with water and shade.', 'สับสน เป็นลม หรือตัวร้อนจัด (มีหรือไม่มีเหงื่อก็ได้) คืออาการโรคลมร้อน ให้โทร {medical} และพาผู้ป่วยเข้าที่ร่ม ใช้น้ำช่วยลดอุณหภูมิร่างกาย'),
			t('Never leave children or pets in a parked car.', 'ห้ามทิ้งเด็กหรือสัตว์เลี้ยงไว้ในรถที่จอดอยู่')
		],
		after: [
			t('Keep drinking water for the rest of the day.', 'ดื่มน้ำต่อเนื่องไปจนหมดวัน'),
			t('Check on neighbours who live alone.', 'ตรวจดูความปลอดภัยของเพื่อนบ้านที่อยู่คนเดียว'),
			t('Rest in the shade before going back to hard work.', 'พักในที่ร่มก่อนกลับไปทำงานหนัก'),
			t('Watch for headaches or cramps the next day.', 'สังเกตอาการปวดศีรษะหรือตะคริวในวันถัดไป')
		]
	},
	earthquake: {
		title: t('Earthquake', 'แผ่นดินไหว'),
		summary: t('Shaking from faults in the north and west, or from Myanmar.', 'การสั่นไหวจากรอยเลื่อนในภาคเหนือและภาคตะวันตก หรือจากเมียนมา'),
		before: [
			t('Fix tall furniture and shelves to the wall.', 'ยึดเฟอร์นิเจอร์สูงและชั้นวางของไว้กับผนัง'),
			t('Practise Drop, Cover, Hold On with your family.', 'ฝึก “หมอบ ป้อง เกาะ” กับครอบครัว'),
			t('Know how to turn off gas and electricity.', 'รู้วิธีปิดแก๊สและตัดไฟ'),
			t('Agree on a meeting point outside your building.', 'ตกลงจุดนัดพบนอกอาคาร')
		],
		during: [
			t('Drop to the floor, cover your head, hold on to sturdy furniture.', 'หมอบลงกับพื้น ป้องศีรษะ เกาะเฟอร์นิเจอร์ที่แข็งแรงไว้'),
			t('Stay away from windows and heavy objects that can fall.', 'อยู่ห่างจากหน้าต่างและของหนักที่อาจตกลงมา'),
			t('Do not use lifts; do not run outside while it is shaking.', 'ห้ามใช้ลิฟต์ และอย่าวิ่งออกนอกอาคารขณะแผ่นดินยังสั่น'),
			t('If outside, move away from buildings, trees and power lines.', 'หากอยู่ข้างนอก ให้ออกห่างจากอาคาร ต้นไม้ และสายไฟ')
		],
		after: [
			t('Expect aftershocks; leave damaged buildings.', 'ระวังแผ่นดินไหวตาม (อาฟเตอร์ช็อก) และออกจากอาคารที่เสียหาย'),
			t('Check for gas leaks; do not use flames.', 'ตรวจหาแก๊สรั่ว ห้ามจุดไฟ'),
			t('On the Andaman coast, move inland in case of a tsunami.', 'หากอยู่ชายฝั่งอันดามัน ให้ย้ายออกห่างจากชายฝั่ง เผื่อเกิดสึนามิ'),
			t('Send a text instead of calling so lines stay free.', 'ส่งข้อความแทนการโทร เพื่อไม่ให้คู่สายแน่น')
		]
	},
	tsunami: {
		title: t('Tsunami', 'สึนามิ'),
		summary: t('Giant waves on the Andaman coast after a large undersea quake.', 'คลื่นยักษ์ซัดชายฝั่งอันดามันหลังเกิดแผ่นดินไหวใต้ทะเลขนาดใหญ่'),
		before: [
			t('Learn the tsunami evacuation signs near the beach.', 'จำป้ายเส้นทางอพยพสึนามิใกล้ชายหาด'),
			t('Know the nearest high ground or tall concrete building.', 'รู้จุดที่สูงหรืออาคารคอนกรีตสูงที่ใกล้ที่สุด'),
			t('Keep a go-bag ready if you live on the coast.', 'เตรียมกระเป๋าฉุกเฉินไว้หากอยู่ชายฝั่ง'),
			t('Know the sound of the warning tower in your area.', 'จำเสียงสัญญาณจากหอเตือนภัยในพื้นที่')
		],
		during: [
			t('Strong shaking or the sea pulling back: run to high ground now.', 'หากแผ่นดินไหวรุนแรงหรือน้ำทะเลลดลงอย่างผิดปกติ ให้วิ่งขึ้นที่สูงทันที'),
			t('Go on foot; roads jam quickly.', 'อพยพด้วยการเดินเท้า เพราะรถจะติดอย่างรวดเร็ว'),
			t('Go as high and as far inland as you can: at least 30 m up, 3 km inland, or the 3rd floor or higher of a strong concrete building.', 'ขึ้นที่สูงและไปให้ไกลจากชายฝั่งมากที่สุด อย่างน้อยสูง 30 ม. หรือห่างจากชายฝั่งเข้าไปในแผ่นดิน 3 กม. หรือขึ้นชั้น 3 ขึ้นไปของอาคารคอนกรีตที่แข็งแรง'),
			t('Do not go back for belongings.', 'อย่าย้อนกลับไปเอาของ')
		],
		after: [
			t('Stay on high ground; more waves can follow for hours.', 'อยู่บนที่สูงต่อ อาจมีคลื่นตามมาอีกหลายชั่วโมง'),
			t('Return only after an official all-clear.', 'กลับเมื่อทางการประกาศว่าปลอดภัยแล้วเท่านั้น'),
			t('Stay out of damaged buildings and floodwater.', 'อย่าเข้าไปในอาคารที่เสียหาย และอย่าลงไปในน้ำท่วมขัง'),
			t('Help others only when you are safe yourself.', 'ช่วยเหลือผู้อื่นเมื่อตัวเองปลอดภัยแล้วเท่านั้น')
		]
	},
	landslide: {
		title: t('Landslide', 'ดินถล่ม'),
		summary: t('Slopes give way after days of heavy rain.', 'ดินบนลาดเขาพังทลายหลังฝนตกหนักติดต่อกันหลายวัน'),
		before: [
			t('Know if your home is on or below a steep slope.', 'รู้ว่าบ้านอยู่บนหรือใต้ลาดเขาชันหรือไม่'),
			t('Watch for new cracks in walls, ground or roads.', 'สังเกตรอยแตกใหม่ที่ผนัง พื้นดิน หรือถนน'),
			t('Plan a route away from slopes and valleys.', 'วางแผนเส้นทางที่ห่างจากลาดเขาและหุบเขา'),
			t('Follow heavy rain warnings closely.', 'ติดตามประกาศเตือนฝนตกหนักอย่างใกล้ชิด')
		],
		during: [
			t('Muddy stream water or falling rocks: leave the slope now.', 'หากน้ำในลำธารขุ่นเป็นสีโคลนหรือมีหินร่วงหล่น ให้ออกจากลาดเขาทันที'),
			t('Move sideways out of the path of a slide, not downhill.', 'หนีออกทางด้านข้างของแนวดินถล่ม อย่าวิ่งลงเขา'),
			t('Stay away from river valleys and low areas.', 'อยู่ห่างจากหุบเขาริมลำน้ำและที่ลุ่มต่ำ'),
			t('If you cannot escape, curl up and protect your head.', 'หากหนีไม่ทัน ให้ขดตัวและป้องศีรษะ')
		],
		after: [
			t('Stay away from the slide area; more can fall.', 'อยู่ห่างจากพื้นที่ดินถล่ม อาจถล่มซ้ำ'),
			t('Report broken roads, power and water lines.', 'แจ้งถนน สายไฟ และท่อน้ำที่เสียหาย'),
			t('Watch for flooding below the slide.', 'ระวังน้ำท่วมบริเวณใต้จุดดินถล่ม'),
			t('Have the slope checked before going home.', 'ให้ผู้เชี่ยวชาญตรวจลาดดินก่อนกลับบ้าน')
		]
	},
	drought: {
		title: t('Drought', 'ภัยแล้ง'),
		summary: t('Long dry spells that cut water for homes and farms.', 'ช่วงแล้งยาวนานที่ทำให้ขาดน้ำใช้ในบ้านและการเกษตร'),
		before: [
			t('Fix leaking taps and pipes.', 'ซ่อมก๊อกและท่อน้ำที่รั่ว'),
			t('Store drinking water in clean, closed containers.', 'เก็บน้ำดื่มในภาชนะที่สะอาดและมีฝาปิด'),
			t("Learn your area's water supply schedule.", 'รู้ตารางการจ่ายน้ำในพื้นที่'),
			t('Farmers: ask the local office about drought-tolerant crops.', 'เกษตรกร: สอบถามสำนักงานเกษตรอำเภอเรื่องพืชทนแล้ง')
		],
		during: [
			t('Use water for drinking and cooking first.', 'ใช้น้ำเพื่อดื่มและทำอาหารเป็นอันดับแรก'),
			t('Reuse washing water for plants and toilets.', 'นำน้ำจากการซักล้างไปรดต้นไม้หรือราดส้วม'),
			t('Do not burn fields; dry land catches fire fast.', 'ห้ามเผาไร่ เพราะพื้นที่แห้งติดไฟเร็ว'),
			t('Get water from official distribution points if the supply stops.', 'หากน้ำหยุดไหล ให้รับน้ำจากจุดแจกจ่ายของทางการ')
		],
		after: [
			t('Keep saving water until reservoirs recover.', 'ประหยัดน้ำต่อไปจนกว่าน้ำในอ่างเก็บน้ำจะกลับมาเป็นปกติ'),
			t('Clean stored water containers.', 'ทำความสะอาดภาชนะเก็บน้ำ'),
			t('Ask about government drought relief.', 'สอบถามความช่วยเหลือภัยแล้งจากภาครัฐ'),
			t('Plan rainwater collection for next season.', 'วางแผนเก็บน้ำฝนสำหรับฤดูถัดไป')
		]
	},
	chemical: {
		title: t('Chemical incident', 'อุบัติภัยสารเคมี'),
		summary: t('Leaks, fires or spills at factories and on roads.', 'สารเคมีรั่วไหล หกรด หรือเกิดเพลิงไหม้ ในโรงงานหรือบนถนน'),
		before: [
			t('Know if you live near factories or chemical storage.', 'รู้ว่าบ้านอยู่ใกล้โรงงานหรือคลังสารเคมีหรือไม่'),
			t('Keep tape and a plastic sheet to seal a room.', 'เตรียมเทปและแผ่นพลาสติกไว้ปิดผนึกห้อง'),
			t('Know two ways out of your area.', 'รู้เส้นทางออกจากพื้นที่ 2 เส้นทาง'),
			t('Save {disaster} and {fire} in your phone.', 'บันทึกเบอร์ {disaster} และ {fire} ไว้ในโทรศัพท์')
		],
		during: [
			t('Go indoors, close windows, turn off fans and air conditioning.', 'เข้าอาคาร ปิดหน้าต่าง ปิดพัดลมและเครื่องปรับอากาศ'),
			t('If told to evacuate, leave upwind and uphill.', 'หากได้รับแจ้งให้อพยพ ให้ไปทางเหนือลมและขึ้นที่สูง'),
			t('If nothing better is at hand, cover your nose and mouth with a wet cloth.', 'หากไม่มีอุปกรณ์ที่ดีกว่า ให้ปิดจมูกและปากด้วยผ้าชุบน้ำ'),
			t('Do not touch spilled liquids or smoke residue.', 'ห้ามสัมผัสของเหลวที่หกหรือคราบควัน')
		],
		after: [
			t('Return only when officials say the air is safe.', 'กลับเมื่อทางการแจ้งว่าอากาศปลอดภัยแล้วเท่านั้น'),
			t('Take off and bag exposed clothes; wash your skin with soap and water.', 'ถอดเสื้อผ้าที่สัมผัสสารเคมี ใส่ถุงแล้วปิดปากถุง และล้างผิวด้วยสบู่และน้ำ'),
			t('See a doctor if your eyes, skin or breathing hurt.', 'พบแพทย์หากแสบตา ระคายเคืองผิว หรือเจ็บขณะหายใจ'),
			t('Do not eat garden vegetables until they are checked.', 'อย่ากินผักที่ปลูกไว้จนกว่าจะได้รับการตรวจ')
		]
	},
	cold: {
		title: t('Extreme cold', 'อากาศหนาวจัด'),
		summary: t('Severe cold and wind chill that can cause frostbite and hypothermia.', 'อากาศหนาวจัดและลมหนาวที่อาจทำให้เกิดอาการหิมะกัด (ฟรอสต์ไบต์) และอุณหภูมิกายต่ำ (ไฮโปเทอร์เมีย)'),
		before: [
			t('Dress in layers, with a hat, gloves and windproof outer layer.', 'สวมเสื้อผ้าหลายชั้น พร้อมหมวก ถุงมือ และเสื้อชั้นนอกกันลม'),
			t('Keep a phone power bank charged.', 'ชาร์จพาวเวอร์แบงก์สำหรับโทรศัพท์ไว้ให้เต็ม'),
			t('Check on elderly neighbours.', 'ตรวจดูความปลอดภัยของเพื่อนบ้านผู้สูงอายุ'),
			t('Keep some food and water at home in case of power cuts.', 'เก็บอาหารและน้ำไว้ที่บ้านเผื่อไฟฟ้าดับ')
		],
		during: [
			t('Limit time outside; cover skin, because frostbite can start in minutes in strong wind.', 'จำกัดเวลาอยู่นอกอาคาร ปกปิดผิวหนังให้มิดชิด เพราะลมแรงอาจทำให้เกิดอาการหิมะกัดได้ภายในไม่กี่นาที'),
			t('Watch for hypothermia (shivering, confusion, slurred speech): get the person warm and dry and call {medical}.', 'สังเกตอาการอุณหภูมิกายต่ำ (ตัวสั่น สับสน พูดไม่ชัด) พาผู้ป่วยเข้าที่อบอุ่นและทำให้ตัวแห้ง แล้วโทร {medical}'),
			t('Never use a grill, camping stove or generator indoors (carbon monoxide).', 'ห้ามใช้เตาย่าง เตาแคมป์ปิ้ง หรือเครื่องปั่นไฟในอาคาร (แก๊สคาร์บอนมอนอกไซด์)'),
			t('Keep moving if you must be outside.', 'หากต้องอยู่นอกอาคาร ให้ขยับตัวอยู่เสมอ')
		],
		after: [
			t("Warm frostbitten skin slowly with lukewarm water, not hot, and don't rub it.", 'ค่อยๆ อุ่นผิวหนังที่ถูกหิมะกัดด้วยน้ำอุ่นพอประมาณ ไม่ใช่น้ำร้อน และห้ามถู'),
			t('Check pipes and heating.', 'ตรวจท่อน้ำและระบบทำความร้อน'),
			t('Follow {officials} and local announcements.', 'ติดตามประกาศของ{officials}และหน่วยงานท้องถิ่น')
		]
	},
	snow: {
		title: t('Heavy snow', 'หิมะตกหนัก'),
		summary: t('Heavy snowfall that blocks roads and cuts power.', 'หิมะตกหนักจนถนนถูกปิดกั้นและไฟฟ้าอาจดับ'),
		before: [
			t('Keep a shovel, warm clothes and food at home.', 'เตรียมพลั่ว เสื้อผ้าอบอุ่น และอาหารไว้ที่บ้าน'),
			t('In a car, carry a blanket, water, a torch and a charged phone.', 'หากมีรถ ให้เตรียมผ้าห่ม น้ำ ไฟฉาย และโทรศัพท์ที่ชาร์จเต็มไว้ในรถ'),
			t('Plan to stay home if {officials} warn.', 'วางแผนอยู่บ้านเมื่อ{officials}ออกคำเตือน')
		],
		during: [
			t('Avoid unnecessary travel.', 'หลีกเลี่ยงการเดินทางที่ไม่จำเป็น'),
			t('If stuck in a car, stay in it, keep the exhaust pipe clear of snow and run the engine only briefly for heat.', 'หากติดอยู่ในรถ ให้อยู่ในรถ เคลียร์หิมะออกจากท่อไอเสีย และสตาร์ตเครื่องเพื่อให้ความอบอุ่นเพียงช่วงสั้นๆ'),
			t('Watch for snow sliding from roofs.', 'ระวังหิมะไหลลงมาจากหลังคา')
		],
		after: [
			t('Clear snow carefully and take breaks (heart strain).', 'ตักหิมะอย่างระมัดระวังและพักเป็นระยะ (หัวใจทำงานหนัก)'),
			t('Check on neighbours.', 'ตรวจดูความปลอดภัยของเพื่อนบ้าน'),
			t('Keep roofs and vents clear.', 'เคลียร์หิมะจากหลังคาและช่องระบายอากาศ')
		]
	}
};

export const GUIDE_FOR: Partial<Record<HazardType, GuideId>> = {
	flood: 'flood',
	rain: 'flash-flood',
	storm: 'storm',
	smoke: 'smoke',
	wildfire: 'smoke',
	heat: 'heat',
	earthquake: 'earthquake',
	tsunami: 'tsunami',
	landslide: 'landslide',
	drought: 'drought',
	chemical: 'chemical'
};

/** What to do now: the first three Before items at Watch, the first three During items at Warning. */
export function stepsFor(type: HazardType, level: Lvl): Text[] {
	const id = GUIDE_FOR[type];
	if (!id || level === 'safe') return [];
	return (level === 'warning' ? GUIDE[id].during : GUIDE[id].before).slice(0, 3);
}

export type BagItem = { id: string; text: Text };
export const KITS = ['flood', 'storm', 'smoke', 'heat', 'earthquake', 'tsunami', 'chemical', 'cold'] as const;
export type KitId = (typeof KITS)[number];

export const BASICS: BagItem[] = [
	{ id: 'water', text: t('Water: 2 litres per person in the bag, more stored at home', 'น้ำดื่ม 2 ลิตรต่อคนในกระเป๋า และสำรองเพิ่มไว้ที่บ้าน') },
	{ id: 'food', text: t('Ready-to-eat food for 3 days', 'อาหารพร้อมกินสำหรับ 3 วัน') },
	{ id: 'meds', text: t('Medicine for 7 days and copies of prescriptions', 'ยาประจำตัวสำหรับ 7 วัน และสำเนาใบสั่งยา') },
	{ id: 'docs', text: t('Copies of ID card, passport and house registration in a waterproof bag', 'สำเนาบัตรประชาชน หนังสือเดินทาง และทะเบียนบ้าน ใส่ถุงกันน้ำ') },
	{ id: 'phone', text: t('Phone, charger and a full power bank', 'โทรศัพท์ ที่ชาร์จ และพาวเวอร์แบงก์ที่ชาร์จเต็ม') },
	{ id: 'torch', text: t('Torch and spare batteries', 'ไฟฉายและถ่านสำรอง') },
	{ id: 'radio', text: t('Battery or wind-up radio', 'วิทยุแบบใส่ถ่านหรือแบบมือหมุน') },
	{ id: 'firstaid', text: t('First-aid kit', 'ชุดปฐมพยาบาล') },
	{ id: 'cash', text: t('Cash in small notes', 'เงินสดเป็นธนบัตรย่อย') },
	{ id: 'clothes', text: t('Change of clothes and a rain jacket', 'เสื้อผ้าสำรองและเสื้อกันฝน') },
	{ id: 'hygiene', text: t('Soap, toothbrush and sanitary items', 'สบู่ แปรงสีฟัน และของใช้สุขอนามัย') },
	{ id: 'blanket', text: t('Blanket or sleeping mat', 'ผ้าห่มหรือเสื่อนอน') },
	{ id: 'contacts', text: t('Paper list of family phone numbers', 'รายชื่อเบอร์โทรครอบครัวที่เขียนบนกระดาษ') }
];

const I = {
	whistle: { id: 'whistle', text: t('Whistle to call for help', 'นกหวีดสำหรับขอความช่วยเหลือ') },
	masks: { id: 'masks', text: t('N95 masks', 'หน้ากาก N95') },
	drybags: { id: 'drybags', text: t('Waterproof bags for documents and phone', 'ถุงกันน้ำสำหรับเอกสารและโทรศัพท์') },
	sheet: { id: 'sheet', text: t('Plastic sheet and strong tape', 'แผ่นพลาสติกและเทปกาวแบบเหนียว') },
	shoes: { id: 'shoes', text: t('Sturdy closed shoes', 'รองเท้าหุ้มส้นที่แข็งแรง') }
};

export const EXTRAS: Record<KitId, BagItem[]> = {
	flood: [I.drybags, { id: 'boots', text: t('Rubber boots', 'รองเท้าบู๊ตยาง') }, { id: 'rope', text: t('Rope (10 m)', 'เชือก (10 ม.)') }, I.whistle],
	storm: [I.whistle, I.sheet, { id: 'batteries', text: t('Spare batteries', 'ถ่านสำรอง') }],
	smoke: [I.masks, { id: 'eyedrops', text: t('Eye drops', 'ยาหยอดตา') }, { id: 'filter', text: t('Spare air-purifier filter', 'แผ่นกรองเครื่องฟอกอากาศสำรอง') }],
	heat: [
		{ id: 'ors', text: t('Oral rehydration salts', 'ผงเกลือแร่') },
		{ id: 'hat', text: t('Wide-brimmed hat', 'หมวกปีกกว้าง') },
		{ id: 'towel', text: t('Cooling towel', 'ผ้าเย็น') },
		{ id: 'sunscreen', text: t('Sunscreen', 'ครีมกันแดด') }
	],
	earthquake: [I.shoes, { id: 'gloves', text: t('Work gloves', 'ถุงมือทำงาน') }, I.whistle, { id: 'dustmask', text: t('Dust masks', 'หน้ากากกันฝุ่น') }],
	tsunami: [I.shoes, I.whistle, I.drybags],
	cold: [
		{ id: 'warmlayers', text: t('Warm layers and a windproof jacket', 'เสื้อผ้าหนาอบอุ่นหลายชั้นและเสื้อแจ็คเก็ตกันลม') },
		{ id: 'hatgloves', text: t('Hat, gloves and scarf', 'หมวก ถุงมือ และผ้าพันคอ') },
		{ id: 'powerbank', text: t('Charged power bank', 'พาวเวอร์แบงก์ที่ชาร์จเต็ม') },
		{ id: 'handwarmers', text: t('Hand warmers', 'แผ่นให้ความร้อนสำหรับมือ') },
		{ id: 'thermos', text: t('Thermos for a hot drink', 'กระติกน้ำร้อนสำหรับเครื่องดื่มอุ่นๆ') }
	],
	chemical: [
		I.sheet,
		{ id: 'wipes', text: t('Wet wipes', 'ทิชชู่เปียก') },
		{ id: 'sealedclothes', text: t('Spare clothes in a sealed bag', 'เสื้อผ้าสำรองในถุงปิดสนิท') }
	]
};

export const KIT_NOTE: Partial<Record<KitId, Text>> = {
	chemical: t(
		'Masks do not stop chemical gases. Stay indoors with windows and doors sealed, or leave upwind if told to evacuate.',
		'หน้ากากกันฝุ่นป้องกันแก๊สสารเคมีไม่ได้ ให้อยู่ในอาคารและปิดประตูหน้าต่างให้สนิท หรืออพยพไปทางเหนือลมเมื่อได้รับแจ้ง'
	),
	tsunami: t(
		"Keep this bag by the door. If the warning comes, go on foot right away. Don't stop to pack.",
		'วางกระเป๋านี้ไว้ใกล้ประตู เมื่อมีประกาศเตือน ให้เดินเท้าออกทันที อย่าเสียเวลาเก็บของ'
	)
};

/** Basics first, then the kit's extras; an id already in the basics is not repeated. */
export function bagFor(kit: KitId | null): BagItem[] {
	const seen = new Set<string>();
	return [...BASICS, ...(kit ? EXTRAS[kit] : [])].filter((i) => !seen.has(i.id) && seen.add(i.id));
}

export const KIT_FOR: Partial<Record<HazardType, KitId>> = {
	flood: 'flood',
	rain: 'flood',
	landslide: 'flood',
	storm: 'storm',
	smoke: 'smoke',
	wildfire: 'smoke',
	heat: 'heat',
	earthquake: 'earthquake',
	tsunami: 'tsunami',
	chemical: 'chemical'
};

/** The kit of the worst live, non-safe hazard that has one; ties go to list order. */
export function defaultKit(hazards: Hazard[]): KitId | null {
	let best: Hazard | null = null;
	for (const h of hazards) {
		if (h.sample || h.level === 'safe' || !KIT_FOR[h.type]) continue;
		if (!best || (h.level === 'warning' && best.level !== 'warning')) best = h;
	}
	return best ? KIT_FOR[best.type]! : null;
}
export { guideForSmhi, smhiCode } from '../sources/smhi';
