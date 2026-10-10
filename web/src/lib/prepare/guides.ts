import type { HazardType, Lvl } from '../levels';
import { getLocale } from '../paraglide/runtime.js';

export type Text = { en: string; th: string };
export type Guide = { title: Text; summary: Text; before: Text[]; during: Text[]; after: Text[] };

const t = (en: string, th: string): Text => ({ en, th });
export const tx = (x: Text): string => x[getLocale()];

export const GUIDES = ['flood', 'flash-flood', 'storm', 'smoke', 'heat', 'earthquake', 'tsunami', 'landslide', 'drought', 'chemical'] as const;
export type GuideId = (typeof GUIDES)[number];

// Thai text is a draft for native review (messages/TH_REVIEW.md).
export const GUIDE: Record<GuideId, Guide> = {
	flood: {
		title: t('Flood', 'น้ำท่วม'),
		summary: t('Rivers and rain overflow into streets and homes.', 'น้ำจากแม่น้ำและฝนล้นเข้าถนนและบ้านเรือน'),
		before: [
			t('Know your nearest shelter and two ways to get there.', 'รู้ตำแหน่งที่พักพิงใกล้บ้านและเส้นทางไปอย่างน้อยสองเส้นทาง'),
			t('Move valuables, documents and medicine to a high shelf or upper floor.', 'ย้ายของมีค่า เอกสาร และยาไว้ที่สูงหรือชั้นบน'),
			t('Charge your phone and a power bank; keep a torch ready.', 'ชาร์จโทรศัพท์และพาวเวอร์แบงก์ เตรียมไฟฉายไว้'),
			t('Pack a go-bag with water, food and ID for three days.', 'เตรียมกระเป๋าฉุกเฉิน มีน้ำ อาหาร และบัตรประชาชน พอสำหรับสามวัน')
		],
		during: [
			t('Move to higher ground or the nearest shelter now.', 'ไปยังที่สูงหรือที่พักพิงที่ใกล้ที่สุดทันที'),
			t('Turn off electricity at the main switch before water reaches sockets.', 'ตัดไฟที่เบรกเกอร์หลักก่อนน้ำถึงปลั๊กไฟ'),
			t('Never walk or drive through moving water; 15 cm can knock you down.', 'ห้ามเดินหรือขับรถผ่านน้ำไหลเชี่ยว น้ำสูงเพียง 15 ซม. ก็ทำให้ล้มได้'),
			t('Take ID, medicine, phone, charger and drinking water.', 'นำบัตรประชาชน ยา โทรศัพท์ ที่ชาร์จ และน้ำดื่มติดตัวไป')
		],
		after: [
			t('Return home only when officials say it is safe.', 'กลับบ้านเมื่อเจ้าหน้าที่แจ้งว่าปลอดภัยแล้วเท่านั้น'),
			t('Have an electrician check wiring before switching power on.', 'ให้ช่างไฟตรวจระบบไฟก่อนเปิดใช้งาน'),
			t('Throw away food and water that touched floodwater.', 'ทิ้งอาหารและน้ำที่สัมผัสน้ำท่วม'),
			t('Watch for snakes and sharp debris when cleaning up.', 'ระวังงูและเศษวัสดุมีคมขณะทำความสะอาด')
		]
	},
	'flash-flood': {
		title: t('Flash flood and heavy rain', 'น้ำป่าไหลหลากและฝนตกหนัก'),
		summary: t('Water rises within minutes after heavy rain, often near hills.', 'น้ำขึ้นเร็วภายในไม่กี่นาทีหลังฝนตกหนัก มักเกิดใกล้ภูเขา'),
		before: [
			t('Check the rain forecast before hiking or camping near rivers.', 'ตรวจพยากรณ์ฝนก่อนเดินป่าหรือตั้งแคมป์ใกล้ลำน้ำ'),
			t('Learn the high ground near your home, school and work.', 'รู้จักจุดที่สูงใกล้บ้าน โรงเรียน และที่ทำงาน'),
			t('Clear drains and gutters around your house.', 'ลอกท่อระบายน้ำและรางน้ำรอบบ้าน'),
			t('Keep your phone charged and alerts switched on.', 'ชาร์จโทรศัพท์ให้เต็มและเปิดการแจ้งเตือนไว้')
		],
		during: [
			t('Leave river banks, streams and low roads immediately.', 'ออกจากริมแม่น้ำ ลำธาร และถนนที่ต่ำทันที'),
			t('Climb to higher ground; do not wait for the water to rise.', 'ขึ้นที่สูงทันที อย่ารอให้น้ำขึ้น'),
			t('Do not cross flooded roads or bridges, even in a car.', 'ห้ามข้ามถนนหรือสะพานที่น้ำท่วม แม้จะอยู่ในรถ'),
			t('A roaring sound upstream means water is coming.', 'หากได้ยินเสียงน้ำดังมาจากต้นน้ำ แสดงว่าน้ำกำลังมา')
		],
		after: [
			t('Stay away from river banks; they can collapse.', 'อยู่ห่างจากตลิ่ง เพราะอาจพังได้'),
			t('Report blocked roads and damaged bridges.', 'แจ้งถนนที่ถูกปิดกั้นและสะพานที่เสียหาย'),
			t('Check on neighbours, especially older people.', 'ดูแลเพื่อนบ้าน โดยเฉพาะผู้สูงอายุ'),
			t('Boil water until the supply is confirmed safe.', 'ต้มน้ำก่อนดื่มจนกว่าจะยืนยันว่าน้ำประปาปลอดภัย')
		]
	},
	storm: {
		title: t('Storm', 'พายุ'),
		summary: t('Tropical storms bring strong wind, heavy rain and storm surge.', 'พายุโซนร้อนนำลมแรง ฝนตกหนัก และคลื่นพายุซัดฝั่ง'),
		before: [
			t('Tie down or bring in loose objects outside.', 'ผูกยึดหรือเก็บสิ่งของนอกบ้านที่อาจปลิว'),
			t('Trim branches that hang over your roof or power lines.', 'ตัดกิ่งไม้ที่ยื่นเหนือหลังคาหรือสายไฟ'),
			t('Stock water, food, a torch and batteries for three days.', 'สำรองน้ำ อาหาร ไฟฉาย และถ่านไว้สามวัน'),
			t('Know which room in your home is the strongest.', 'รู้ว่าห้องไหนในบ้านแข็งแรงที่สุด')
		],
		during: [
			t('Stay indoors, away from windows and glass doors.', 'อยู่ในอาคาร ห่างจากหน้าต่างและประตูกระจก'),
			t('Unplug electrical devices if lightning is close.', 'ถอดปลั๊กเครื่องใช้ไฟฟ้าเมื่อฟ้าผ่าใกล้'),
			t('Do not go out on boats or to the beach.', 'ห้ามออกเรือหรือลงชายหาด'),
			t('If told to evacuate, leave early while roads are open.', 'หากได้รับแจ้งให้อพยพ ให้ออกเดินทางแต่เนิ่นๆ ขณะถนนยังใช้ได้')
		],
		after: [
			t('Stay away from fallen power lines and report them.', 'อยู่ห่างจากสายไฟที่ขาดและแจ้งการไฟฟ้า'),
			t('Watch for flooding after the storm passes.', 'ระวังน้ำท่วมหลังพายุผ่านไป'),
			t('Photograph damage for insurance before cleaning.', 'ถ่ายภาพความเสียหายไว้เพื่อประกันก่อนทำความสะอาด'),
			t('Use your phone only for urgent calls so lines stay free.', 'ใช้โทรศัพท์เฉพาะเรื่องเร่งด่วน เพื่อให้สายว่าง')
		]
	},
	smoke: {
		title: t('Smoke and haze (PM2.5)', 'หมอกควันและฝุ่น PM2.5'),
		summary: t('Fine dust from fires and traffic that harms lungs and heart.', 'ฝุ่นละเอียดจากการเผาและการจราจรที่ทำร้ายปอดและหัวใจ'),
		before: [
			t('Buy N95 masks for everyone at home; cloth masks do not filter PM2.5.', 'ซื้อหน้ากาก N95 ให้ทุกคนในบ้าน หน้ากากผ้ากรอง PM2.5 ไม่ได้'),
			t('Pick one room to seal and run an air purifier in.', 'เลือกห้องหนึ่งห้อง ปิดให้มิดชิดและเปิดเครื่องฟอกอากาศ'),
			t('Keep asthma and heart medicine stocked.', 'สำรองยาโรคหอบหืดและโรคหัวใจให้พอ'),
			t('Check PM2.5 each morning before going out.', 'ตรวจค่า PM2.5 ทุกเช้าก่อนออกจากบ้าน')
		],
		during: [
			t('Stay indoors with doors and windows closed.', 'อยู่ในอาคาร ปิดประตูและหน้าต่าง'),
			t('Wear an N95 mask whenever you go outside.', 'สวมหน้ากาก N95 ทุกครั้งที่ออกนอกอาคาร'),
			t('Avoid exercise outdoors, especially children and older people.', 'งดออกกำลังกายกลางแจ้ง โดยเฉพาะเด็กและผู้สูงอายุ'),
			t('See a doctor if you have chest pain or trouble breathing.', 'พบแพทย์หากเจ็บหน้าอกหรือหายใจลำบาก')
		],
		after: [
			t('Air out your home once PM2.5 drops below 37.5.', 'เปิดระบายอากาศเมื่อค่า PM2.5 ลดต่ำกว่า 37.5'),
			t('Change or clean air purifier filters.', 'เปลี่ยนหรือทำความสะอาดแผ่นกรองเครื่องฟอกอากาศ'),
			t('Report burning you see to local authorities.', 'แจ้งการเผาที่พบเห็นต่อหน่วยงานท้องถิ่น'),
			t('Keep spare masks for the next haze season.', 'เก็บหน้ากากสำรองไว้ใช้ในฤดูหมอกควันครั้งหน้า')
		]
	},
	heat: {
		title: t('Extreme heat', 'อากาศร้อนจัด'),
		summary: t('Heat that can cause heatstroke, mostly March to May.', 'ความร้อนที่อาจทำให้เกิดฮีทสโตรก มักเกิดช่วงมีนาคมถึงพฤษภาคม'),
		before: [
			t('Plan outdoor work for early morning or evening.', 'วางแผนทำงานกลางแจ้งช่วงเช้าตรู่หรือเย็น'),
			t('Find a cool place nearby: a mall, library or temple hall.', 'หาที่เย็นใกล้บ้าน เช่น ห้างสรรพสินค้า ห้องสมุด หรือศาลาวัด'),
			t('Check that older relatives have a fan or air conditioning.', 'ตรวจดูว่าญาติผู้สูงอายุมีพัดลมหรือเครื่องปรับอากาศ'),
			t('Keep oral rehydration salts at home.', 'มีผงเกลือแร่ติดบ้านไว้')
		],
		during: [
			t('Stay out of the sun between 11:00 and 15:00.', 'หลีกเลี่ยงแดดช่วง 11:00 ถึง 15:00 น.'),
			t('Drink water every 20 minutes, even if you are not thirsty.', 'ดื่มน้ำทุก 20 นาที แม้ไม่รู้สึกกระหาย'),
			t('Never leave children or pets in a parked car.', 'ห้ามทิ้งเด็กหรือสัตว์เลี้ยงไว้ในรถที่จอดอยู่'),
			t('Dizziness, confusion or no sweating means heatstroke: call 1669.', 'เวียนหัว สับสน หรือเหงื่อไม่ออก คือสัญญาณฮีทสโตรก ให้โทร 1669')
		],
		after: [
			t('Keep drinking water for the rest of the day.', 'ดื่มน้ำต่อเนื่องตลอดวัน'),
			t('Check on neighbours who live alone.', 'ไปดูเพื่อนบ้านที่อยู่คนเดียว'),
			t('Rest in the shade before going back to hard work.', 'พักในที่ร่มก่อนกลับไปทำงานหนัก'),
			t('Watch for headaches or cramps the next day.', 'สังเกตอาการปวดหัวหรือตะคริวในวันถัดไป')
		]
	},
	earthquake: {
		title: t('Earthquake', 'แผ่นดินไหว'),
		summary: t('Shaking from faults in the north and west, or from Myanmar.', 'การสั่นไหวจากรอยเลื่อนทางเหนือและตะวันตก หรือจากเมียนมา'),
		before: [
			t('Fix tall furniture and shelves to the wall.', 'ยึดเฟอร์นิเจอร์สูงและชั้นวางของไว้กับผนัง'),
			t('Practise Drop, Cover, Hold On with your family.', 'ฝึก หมอบ ป้อง เกาะ กับครอบครัว'),
			t('Know how to turn off gas and electricity.', 'รู้วิธีปิดแก๊สและตัดไฟ'),
			t('Agree on a meeting point outside your building.', 'นัดจุดรวมพลนอกอาคาร')
		],
		during: [
			t('Drop to the floor, cover your head, hold on to sturdy furniture.', 'หมอบลงกับพื้น ป้องศีรษะ เกาะโต๊ะที่แข็งแรง'),
			t('Stay away from windows and heavy objects that can fall.', 'อยู่ห่างจากหน้าต่างและของหนักที่อาจตกลงมา'),
			t('Do not use lifts; do not run outside while it is shaking.', 'ห้ามใช้ลิฟต์ และอย่าวิ่งออกนอกอาคารขณะสั่น'),
			t('If outside, move away from buildings, trees and power lines.', 'หากอยู่ข้างนอก ให้ออกห่างจากอาคาร ต้นไม้ และสายไฟ')
		],
		after: [
			t('Expect aftershocks; leave damaged buildings.', 'ระวังอาฟเตอร์ช็อก และออกจากอาคารที่เสียหาย'),
			t('Check for gas leaks; do not use flames.', 'ตรวจหาแก๊สรั่ว ห้ามจุดไฟ'),
			t('On the Andaman coast, move inland in case of a tsunami.', 'หากอยู่ชายฝั่งอันดามัน ให้ไปยังพื้นที่ด้านใน เผื่อเกิดสึนามิ'),
			t('Send a text instead of calling so lines stay free.', 'ส่งข้อความแทนการโทร เพื่อให้สายว่าง')
		]
	},
	tsunami: {
		title: t('Tsunami', 'สึนามิ'),
		summary: t('Giant waves on the Andaman coast after a large undersea quake.', 'คลื่นยักษ์ชายฝั่งอันดามันหลังแผ่นดินไหวใต้ทะเลขนาดใหญ่'),
		before: [
			t('Learn the tsunami evacuation signs near the beach.', 'จำป้ายเส้นทางอพยพสึนามิใกล้ชายหาด'),
			t('Know the nearest high ground or tall concrete building.', 'รู้จุดที่สูงหรืออาคารคอนกรีตสูงที่ใกล้ที่สุด'),
			t('Keep a go-bag ready if you live on the coast.', 'เตรียมกระเป๋าฉุกเฉินไว้หากอยู่ชายฝั่ง'),
			t('Know the sound of the warning tower in your area.', 'รู้จักเสียงหอเตือนภัยในพื้นที่')
		],
		during: [
			t('Strong shaking or the sea pulling back: run to high ground now.', 'แผ่นดินไหวแรงหรือน้ำทะเลลดลงผิดปกติ ให้วิ่งขึ้นที่สูงทันที'),
			t('Go on foot; roads jam quickly.', 'เดินเท้า เพราะถนนจะติดอย่างรวดเร็ว'),
			t('Go at least 10 m above sea level or 2 km inland.', 'ขึ้นที่สูงอย่างน้อย 10 เมตรจากระดับน้ำทะเล หรือเข้าฝั่งอย่างน้อย 2 กม.'),
			t('Do not go back for belongings.', 'อย่าย้อนกลับไปเอาของ')
		],
		after: [
			t('Stay on high ground; more waves can follow for hours.', 'อยู่บนที่สูงต่อ อาจมีคลื่นตามมาอีกหลายชั่วโมง'),
			t('Return only after an official all-clear.', 'กลับเมื่อทางการประกาศว่าปลอดภัยแล้วเท่านั้น'),
			t('Stay out of damaged buildings and floodwater.', 'อย่าเข้าอาคารที่เสียหายหรือน้ำท่วมขัง'),
			t('Help others only when you are safe yourself.', 'ช่วยเหลือผู้อื่นเมื่อตัวเองปลอดภัยแล้วเท่านั้น')
		]
	},
	landslide: {
		title: t('Landslide', 'ดินถล่ม'),
		summary: t('Slopes give way after days of heavy rain.', 'ลาดดินพังทลายหลังฝนตกหนักหลายวัน'),
		before: [
			t('Know if your home is on or below a steep slope.', 'รู้ว่าบ้านอยู่บนหรือใต้ลาดชันหรือไม่'),
			t('Watch for new cracks in walls, ground or roads.', 'สังเกตรอยแตกใหม่ที่ผนัง พื้นดิน หรือถนน'),
			t('Plan a route away from slopes and valleys.', 'วางแผนเส้นทางที่ห่างจากลาดเขาและหุบเขา'),
			t('Follow heavy rain warnings closely.', 'ติดตามประกาศเตือนฝนตกหนักอย่างใกล้ชิด')
		],
		during: [
			t('Muddy stream water or falling rocks: leave the slope now.', 'น้ำในลำธารขุ่นหรือมีหินร่วง ให้ออกจากลาดเขาทันที'),
			t('Move sideways out of the path of a slide, not downhill.', 'หนีออกด้านข้าง ไม่ใช่ลงตามทางดินถล่ม'),
			t('Stay away from river valleys and low areas.', 'อยู่ห่างจากหุบน้ำและที่ลุ่มต่ำ'),
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
			t('Farmers: ask the local office about drought-tolerant crops.', 'เกษตรกร: สอบถามสำนักงานเกษตรเรื่องพืชทนแล้ง')
		],
		during: [
			t('Use water for drinking and cooking first.', 'ใช้น้ำเพื่อดื่มและทำอาหารเป็นอันดับแรก'),
			t('Reuse washing water for plants and toilets.', 'นำน้ำจากการซักล้างไปรดต้นไม้หรือราดห้องน้ำ'),
			t('Do not burn fields; dry land catches fire fast.', 'ห้ามเผาไร่ พื้นที่แห้งติดไฟได้ง่าย'),
			t('Get water from official distribution points if the supply stops.', 'หากน้ำหยุดไหล ให้รับน้ำจากจุดแจกจ่ายของทางการ')
		],
		after: [
			t('Keep saving water until reservoirs recover.', 'ประหยัดน้ำต่อไปจนกว่าแหล่งน้ำจะฟื้นตัว'),
			t('Clean stored water containers.', 'ทำความสะอาดภาชนะเก็บน้ำ'),
			t('Ask about government drought relief.', 'สอบถามความช่วยเหลือภัยแล้งจากภาครัฐ'),
			t('Plan rainwater collection for next season.', 'วางแผนเก็บน้ำฝนสำหรับฤดูถัดไป')
		]
	},
	chemical: {
		title: t('Chemical incident', 'อุบัติภัยสารเคมี'),
		summary: t('Leaks, fires or spills at factories and on roads.', 'การรั่วไหล ไฟไหม้ หรือสารเคมีหกในโรงงานและบนถนน'),
		before: [
			t('Know if you live near factories or chemical storage.', 'รู้ว่าบ้านอยู่ใกล้โรงงานหรือคลังสารเคมีหรือไม่'),
			t('Keep tape and a plastic sheet to seal a room.', 'เตรียมเทปและแผ่นพลาสติกไว้ปิดห้อง'),
			t('Know two ways out of your area.', 'รู้เส้นทางออกจากพื้นที่อย่างน้อยสองเส้นทาง'),
			t('Save 1784 and 199 in your phone.', 'บันทึกเบอร์ 1784 และ 199 ไว้ในโทรศัพท์')
		],
		during: [
			t('Go indoors, close windows, turn off fans and air conditioning.', 'เข้าอาคาร ปิดหน้าต่าง ปิดพัดลมและเครื่องปรับอากาศ'),
			t('If told to evacuate, leave upwind and uphill.', 'หากได้รับแจ้งให้อพยพ ให้ไปทางเหนือลมและที่สูง'),
			t('Cover your nose and mouth with a wet cloth.', 'ปิดจมูกและปากด้วยผ้าชุบน้ำ'),
			t('Do not touch spilled liquids or smoke residue.', 'ห้ามสัมผัสของเหลวที่หกหรือคราบควัน')
		],
		after: [
			t('Return only when officials say the air is safe.', 'กลับเมื่อทางการแจ้งว่าอากาศปลอดภัยแล้วเท่านั้น'),
			t('Wash skin and clothes that were exposed.', 'ล้างผิวหนังและเสื้อผ้าที่สัมผัสสารเคมี'),
			t('See a doctor if your eyes, skin or breathing hurt.', 'พบแพทย์หากแสบตา ระคายผิว หรือหายใจลำบาก'),
			t('Do not eat garden vegetables until they are checked.', 'อย่ากินผักในสวนจนกว่าจะได้รับการตรวจ')
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

export const GO_BAG: { id: string; text: Text }[] = [
	{ id: 'water', text: t('Water: 3 litres per person per day, for 3 days', 'น้ำดื่ม 3 ลิตรต่อคนต่อวัน สำหรับ 3 วัน') },
	{ id: 'food', text: t('Ready-to-eat food for 3 days', 'อาหารพร้อมกินสำหรับ 3 วัน') },
	{ id: 'meds', text: t('Medicine for 7 days and copies of prescriptions', 'ยาประจำตัว 7 วันและสำเนาใบสั่งยา') },
	{ id: 'docs', text: t('Copies of ID card, passport and house registration in a waterproof bag', 'สำเนาบัตรประชาชน พาสปอร์ต และทะเบียนบ้าน ใส่ถุงกันน้ำ') },
	{ id: 'phone', text: t('Phone, charger and a full power bank', 'โทรศัพท์ ที่ชาร์จ และพาวเวอร์แบงก์ที่ชาร์จเต็ม') },
	{ id: 'torch', text: t('Torch and spare batteries', 'ไฟฉายและถ่านสำรอง') },
	{ id: 'radio', text: t('Battery or wind-up radio', 'วิทยุใช้ถ่านหรือแบบหมุนมือ') },
	{ id: 'firstaid', text: t('First-aid kit', 'ชุดปฐมพยาบาล') },
	{ id: 'masks', text: t('N95 masks', 'หน้ากาก N95') },
	{ id: 'cash', text: t('Cash in small notes', 'เงินสดเป็นธนบัตรย่อย') },
	{ id: 'clothes', text: t('Change of clothes and a rain jacket', 'เสื้อผ้าสำรองและเสื้อกันฝน') },
	{ id: 'hygiene', text: t('Soap, toothbrush and sanitary items', 'สบู่ แปรงสีฟัน และของใช้ส่วนตัว') },
	{ id: 'whistle', text: t('Whistle to call for help', 'นกหวีดสำหรับขอความช่วยเหลือ') },
	{ id: 'blanket', text: t('Blanket or sleeping mat', 'ผ้าห่มหรือเสื่อนอน') },
	{ id: 'contacts', text: t('Paper list of family phone numbers', 'รายชื่อเบอร์โทรครอบครัวที่เขียนบนกระดาษ') }
];

export const NUMBERS: { tel: string; name: Text }[] = [
	{ tel: '1784', name: t('Disaster hotline (DDPM)', 'สายด่วนป้องกันและบรรเทาสาธารณภัย (ปภ.)') },
	{ tel: '1669', name: t('Medical emergency', 'การแพทย์ฉุกเฉิน') },
	{ tel: '191', name: t('Police', 'ตำรวจ') },
	{ tel: '199', name: t('Fire', 'ดับเพลิง') },
	{ tel: '1155', name: t('Tourist police', 'ตำรวจท่องเที่ยว') },
	{ tel: '1182', name: t('Weather (TMD)', 'กรมอุตุนิยมวิทยา') }
];
