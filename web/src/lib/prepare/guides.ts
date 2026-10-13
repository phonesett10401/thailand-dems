import type { Hazard, HazardType, Lvl } from '../levels';
import type { Country } from '../countries';
import { currentCountry } from '../country.svelte';
import { getLocale } from '../paraglide/runtime.js';
import { guideForSmhi, smhiCode } from '../sources/smhi';

export type Text = { en: string; th: string; my: string };
export type Guide = { title: Text; summary: Text; before: Text[]; during: Text[]; after: Text[] };

const t = (en: string, th: string, my: string): Text => ({ en, th, my });
/** Fill {medical} {fire} {police} {disaster} {officials} from a country. */
export const gx = (x: Text, c: Country): string => {
	const loc = getLocale();
	return x[loc].replace(/\{(medical|fire|police|disaster|officials)\}/g, (_, k: keyof Country['guide']) => (k === 'officials' ? c.guide.officials[loc] : c.guide[k]));
};
export const tx = (x: Text): string => gx(x, currentCountry());

export const GUIDES = ['flood', 'flash-flood', 'storm', 'smoke', 'heat', 'earthquake', 'tsunami', 'landslide', 'drought', 'chemical', 'cold', 'snow'] as const;
export type GuideId = (typeof GUIDES)[number];

// Thai and Burmese text are drafts for native review (messages/TH_REVIEW.md, messages/MY_REVIEW.md).
export const GUIDE: Record<GuideId, Guide> = {
	flood: {
		title: t('Flood', 'น้ำท่วม', 'ရေကြီးခြင်း'),
		summary: t('Rivers and rain overflow into streets and homes.', 'น้ำจากแม่น้ำและน้ำฝนไหลล้นเข้าท่วมถนนและบ้านเรือน', 'မြစ်ရေနှင့် မိုးရေများ လမ်းများနှင့် နေအိမ်များထဲသို့ လျှံဝင်ခြင်း။'),
		before: [
			t('Know your nearest shelter and two ways to get there.', 'รู้ตำแหน่งที่พักพิงที่ใกล้ที่สุด และเส้นทางไปที่นั่น 2 เส้นทาง', 'အနီးဆုံး ခိုလှုံရာနေရာနှင့် ထိုနေရာသို့ သွားနိုင်သော လမ်းကြောင်း 2 ခုကို သိထားပါ။'),
			t('Move valuables, documents and medicine to a high shelf or upper floor.', 'ย้ายของมีค่า เอกสาร และยาไว้ที่สูงหรือชั้นบน', 'အဖိုးတန်ပစ္စည်းများ၊ စာရွက်စာတမ်းများနှင့် ဆေးဝါးများကို မြင့်သောစင်ပေါ် သို့မဟုတ် အပေါ်ထပ်သို့ ရွှေ့ထားပါ။'),
			t('Charge your phone and a power bank; keep a torch ready.', 'ชาร์จโทรศัพท์และพาวเวอร์แบงก์ เตรียมไฟฉายไว้', 'ဖုန်းနှင့် ပါဝါဘဏ်ကို အားသွင်းထားပြီး လက်နှိပ်ဓာတ်မီးကို အသင့်ထားပါ။'),
			t('Pack a go-bag with water, food and ID for three days.', 'เตรียมกระเป๋าฉุกเฉิน มีน้ำ อาหาร และบัตรประชาชน พอสำหรับ 3 วัน', 'ရေ၊ အစားအစာနှင့် မှတ်ပုံတင်ကတ် ပါဝင်သော အရေးပေါ်အိတ်ကို 3 ရက်စာ ပြင်ဆင်ထားပါ။')
		],
		during: [
			t('Move to higher ground or the nearest shelter now.', 'ไปยังที่สูงหรือที่พักพิงที่ใกล้ที่สุดทันที', 'မြင့်သောနေရာ သို့မဟုတ် အနီးဆုံး ခိုလှုံရာနေရာသို့ ယခုချက်ချင်း ရွှေ့ပါ။'),
			t('Turn off electricity at the main switch, but only if you are dry and not standing in water.', 'ตัดไฟที่สวิตช์หลัก แต่ทำได้เฉพาะเมื่อตัวคุณแห้งและไม่ได้ยืนอยู่ในน้ำ', 'သင့်ကိုယ်ခန္ဓာ ခြောက်သွေ့နေပြီး ရေထဲတွင် ရပ်နေခြင်း မရှိမှသာ မီးမိန်းခလုတ်ကို ပိတ်ပါ။'),
			t('Never walk or drive through moving water; 15 cm can knock you down.', 'ห้ามเดินหรือขับรถฝ่ากระแสน้ำ น้ำไหลสูงเพียง 15 ซม. ก็พัดคนล้มได้', 'စီးဆင်းနေသော ရေထဲကို ဖြတ်၍ လမ်းမလျှောက်ပါနှင့်၊ ကားမမောင်းပါနှင့်။ ရေ 15 စင်တီမီတာ ရှိရုံဖြင့် လူကို လဲကျစေနိုင်သည်။'),
			t('Take ID, medicine, phone, charger and drinking water.', 'นำบัตรประชาชน ยา โทรศัพท์ ที่ชาร์จ และน้ำดื่มติดตัวไป', 'မှတ်ပုံတင်ကတ်၊ ဆေးဝါး၊ ဖုန်း၊ အားသွင်းကြိုးနှင့် သောက်ရေကို ယူသွားပါ။')
		],
		after: [
			t('Return home only when officials say it is safe.', 'กลับบ้านเมื่อเจ้าหน้าที่แจ้งว่าปลอดภัยแล้วเท่านั้น', 'တာဝန်ရှိသူများက ဘေးကင်းပြီဟု ပြောမှသာ အိမ်သို့ ပြန်ပါ။'),
			t('Have an electrician check wiring before switching power on.', 'ให้ช่างไฟฟ้าตรวจสายไฟก่อนเปิดไฟ', 'မီးပြန်မဖွင့်မီ လျှပ်စစ်ပညာရှင်ဖြင့် ဝါယာကြိုးများကို စစ်ဆေးခိုင်းပါ။'),
			t('Throw away food and water that touched floodwater.', 'ทิ้งอาหารและน้ำที่สัมผัสน้ำท่วม', 'ရေကြီးရေနှင့် ထိတွေ့ခဲ့သော အစားအစာနှင့် ရေကို စွန့်ပစ်ပါ။'),
			t('Watch for snakes and sharp debris when cleaning up.', 'ระวังงูและเศษวัสดุมีคมขณะทำความสะอาด', 'သန့်ရှင်းရေးလုပ်စဉ် မြွေများနှင့် ချွန်ထက်သော အပျက်အစီးများကို သတိထားပါ။')
		]
	},
	'flash-flood': {
		title: t('Flash flood and heavy rain', 'น้ำป่าไหลหลากและฝนตกหนัก', 'ရုတ်တရက်ရေကြီးခြင်းနှင့် မိုးသည်းထန်ခြင်း'),
		summary: t('Water rises within minutes after heavy rain, often near hills.', 'น้ำขึ้นเร็วภายในไม่กี่นาทีหลังฝนตกหนัก มักเกิดใกล้ภูเขา', 'မိုးသည်းထန်စွာ ရွာပြီးနောက် မိနစ်ပိုင်းအတွင်း ရေတက်လာခြင်း၊ တောင်ကုန်းများအနီးတွင် အဖြစ်များသည်။'),
		before: [
			t('Check the rain forecast before hiking or camping near rivers.', 'ตรวจสอบพยากรณ์ฝนก่อนเดินป่าหรือตั้งแคมป์ใกล้ลำน้ำ', 'မြစ်ချောင်းများအနီး တောင်တက်ခြင်း သို့မဟုတ် စခန်းချခြင်း မပြုမီ မိုးလေဝသ ခန့်မှန်းချက်ကို စစ်ဆေးပါ။'),
			t('Learn the high ground near your home, school and work.', 'รู้จักจุดที่สูงใกล้บ้าน โรงเรียน และที่ทำงาน', 'အိမ်၊ ကျောင်းနှင့် အလုပ်နေရာ အနီးရှိ မြင့်သောနေရာများကို သိထားပါ။'),
			t('Clear drains and gutters around your house.', 'ลอกท่อระบายน้ำและรางน้ำรอบบ้าน', 'အိမ်ပတ်လည်ရှိ ရေမြောင်းများနှင့် အမိုးရေတံလျှောက်များကို ရှင်းလင်းထားပါ။'),
			t('Keep your phone charged and alerts switched on.', 'ชาร์จโทรศัพท์ให้เต็มและเปิดการแจ้งเตือนไว้', 'ဖုန်းကို အားပြည့်ထားပြီး သတိပေးချက်များကို ဖွင့်ထားပါ။')
		],
		during: [
			t('Leave river banks, streams and low roads immediately.', 'ออกจากริมแม่น้ำ ลำธาร และถนนที่ต่ำทันที', 'မြစ်ကမ်း၊ ချောင်းများနှင့် နိမ့်သောလမ်းများမှ ချက်ချင်း ထွက်ခွာပါ။'),
			t('Climb to higher ground; do not wait for the water to rise.', 'ขึ้นไปยังที่สูง อย่ารอให้น้ำขึ้น', 'မြင့်သောနေရာသို့ တက်ပါ။ ရေတက်လာသည်အထိ မစောင့်ပါနှင့်။'),
			t('Do not cross flooded roads or bridges, even in a car.', 'ห้ามข้ามถนนหรือสะพานที่น้ำท่วม แม้จะอยู่ในรถ', 'ရေလွှမ်းနေသော လမ်း သို့မဟုတ် တံတားကို ကားဖြင့်ပင်ဖြစ်စေ မဖြတ်ပါနှင့်။'),
			t('A roaring sound upstream means water is coming.', 'หากได้ยินเสียงดังกึกก้องมาจากต้นน้ำ แสดงว่าน้ำกำลังมา', 'မြစ်ညာဘက်မှ ဟိန်းသံ ကြားရလျှင် ရေလာနေပြီ ဖြစ်သည်။')
		],
		after: [
			t('Stay away from river banks; they can collapse.', 'อยู่ห่างจากตลิ่ง เพราะอาจพังทลายได้', 'မြစ်ကမ်းများ ပြိုကျနိုင်သဖြင့် ဝေးဝေးနေပါ။'),
			t('Report blocked roads and damaged bridges.', 'แจ้งถนนที่ถูกปิดกั้นและสะพานที่เสียหาย', 'ပိတ်ဆို့နေသော လမ်းများနှင့် ပျက်စီးနေသော တံတားများကို သတင်းပို့ပါ။'),
			t('Check on neighbours, especially older people.', 'ตรวจดูความปลอดภัยของเพื่อนบ้าน โดยเฉพาะผู้สูงอายุ', 'အိမ်နီးချင်းများ၊ အထူးသဖြင့် သက်ကြီးရွယ်အိုများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။'),
			t('Boil water until the supply is confirmed safe.', 'ต้มน้ำก่อนดื่ม จนกว่าจะมีการยืนยันว่าน้ำประปาปลอดภัย', 'ရေပေးဝေမှု ဘေးကင်းကြောင်း အတည်ပြုသည်အထိ ရေကို ကျိုချက်ပြီးမှ သောက်ပါ။')
		]
	},
	storm: {
		title: t('Storm', 'พายุ', 'မုန်တိုင်း'),
		summary: t('Tropical storms bring strong wind, heavy rain and storm surge.', 'พายุหมุนเขตร้อนนำลมแรง ฝนตกหนัก และคลื่นพายุซัดฝั่ง', 'အပူပိုင်းမုန်တိုင်းများသည် လေပြင်း၊ မိုးသည်းထန်မှုနှင့် မုန်တိုင်းဒီလှိုင်းကို ယူဆောင်လာသည်။'),
		before: [
			t('Tie down or bring in loose objects outside.', 'ผูกยึดหรือเก็บสิ่งของนอกบ้านที่อาจปลิว', 'အပြင်ရှိ လေတိုက်လျှင် လွင့်နိုင်သော ပစ္စည်းများကို ချည်နှောင်ထားပါ သို့မဟုတ် အိမ်ထဲ သိမ်းပါ။'),
			t('Trim branches that hang over your roof or power lines.', 'ตัดกิ่งไม้ที่ยื่นเหนือหลังคาหรือสายไฟ', 'အမိုး သို့မဟုတ် ဓာတ်ကြိုးများပေါ် တွဲလောင်းနေသော သစ်ကိုင်းများကို ခုတ်ပါ။'),
			t('Stock water, food, a torch and batteries for three days.', 'สำรองน้ำ อาหาร ไฟฉาย และถ่านไว้ใช้ 3 วัน', 'ရေ၊ အစားအစာ၊ ဓာတ်မီးနှင့် ဓာတ်ခဲများကို 3 ရက်စာ စုဆောင်းထားပါ။'),
			t('Know which room in your home is the strongest.', 'รู้ว่าห้องไหนในบ้านแข็งแรงที่สุด', 'အိမ်တွင် အခိုင်ခံ့ဆုံး အခန်းကို သိထားပါ။')
		],
		during: [
			t('If told to evacuate, leave early while roads are open.', 'หากได้รับแจ้งให้อพยพ ให้ออกเดินทางแต่เนิ่นๆ ขณะถนนยังใช้ได้', 'ဘေးလွတ်ရာသို့ ရွှေ့ပြောင်းရန် အကြောင်းကြားလျှင် လမ်းများ သွားလာ၍ရနေစဉ် စောစော ထွက်ခွာပါ။'),
			t('Stay indoors, away from windows and glass doors.', 'อยู่ในอาคาร ห่างจากหน้าต่างและประตูกระจก', 'အိမ်ထဲတွင်နေပြီး ပြတင်းပေါက်များနှင့် မှန်တံခါးများမှ ဝေးဝေးနေပါ။'),
			t('Unplug electrical devices if lightning is close.', 'ถอดปลั๊กเครื่องใช้ไฟฟ้าเมื่อมีฟ้าผ่าในบริเวณใกล้เคียง', 'မိုးကြိုးပစ်မှု နီးကပ်လာလျှင် လျှပ်စစ်ပစ္စည်းများ၏ ပလပ်ကို ဖြုတ်ပါ။'),
			t('Do not go out on boats or to the beach.', 'ห้ามออกเรือหรือไปชายหาด', 'လှေဖြင့် မထွက်ပါနှင့်၊ ကမ်းခြေသို့ မသွားပါနှင့်။')
		],
		after: [
			t('Stay away from fallen power lines and report them.', 'อยู่ห่างจากสายไฟที่ขาดหรือหล่นลงพื้น และแจ้งการไฟฟ้า', 'ပြတ်ကျနေသော ဓာတ်ကြိုးများမှ ဝေးဝေးနေပြီး သတင်းပို့ပါ။'),
			t('Watch for flooding after the storm passes.', 'ระวังน้ำท่วมหลังพายุผ่านไป', 'မုန်တိုင်းကျော်သွားပြီးနောက် ရေကြီးနိုင်သည်ကို သတိထားပါ။'),
			t('Photograph damage for insurance before cleaning.', 'ถ่ายภาพความเสียหายไว้ใช้เคลมประกันก่อนทำความสะอาด', 'မသန့်ရှင်းမီ အာမခံတောင်းဆိုရန်အတွက် ပျက်စီးမှုများကို ဓာတ်ပုံရိုက်ထားပါ။'),
			t('Use your phone only for urgent calls so lines stay free.', 'โทรเฉพาะเรื่องเร่งด่วน เพื่อไม่ให้คู่สายแน่น', 'ဖုန်းလိုင်းများ မပိတ်ဆို့စေရန် အရေးပေါ်ကိစ္စအတွက်သာ ဖုန်းခေါ်ပါ။')
		]
	},
	smoke: {
		title: t('Smoke and haze (PM2.5)', 'หมอกควันและฝุ่น PM2.5', 'မီးခိုးနှင့် မြူမှိုင်း (PM2.5)'),
		summary: t('Fine dust from fires and traffic that harms lungs and heart.', 'ฝุ่นละเอียดจากการเผาและการจราจร เป็นอันตรายต่อปอดและหัวใจ', 'မီးလောင်မှုနှင့် ယာဉ်အသွားအလာမှ ထွက်သော အမှုန်သေးများ၊ အဆုတ်နှင့် နှလုံးကို ထိခိုက်စေသည်။'),
		before: [
			t('Buy N95 masks for everyone at home; cloth masks do not filter PM2.5.', 'ซื้อหน้ากาก N95 ให้ทุกคนในบ้าน หน้ากากผ้ากรองฝุ่น PM2.5 ไม่ได้', 'အိမ်ရှိလူတိုင်းအတွက် N95 နှာခေါင်းစည်း ဝယ်ထားပါ။ အထည်နှာခေါင်းစည်းများက PM2.5 ကို မစစ်ထုတ်နိုင်ပါ။'),
			t('Pick one room to seal and run an air purifier in.', 'เลือกห้องหนึ่งห้อง ปิดให้มิดชิดและเปิดเครื่องฟอกอากาศ', 'အလုံပိတ်ပြီး လေသန့်စက် ဖွင့်ထားရန် အခန်းတစ်ခန်းကို ရွေးထားပါ။'),
			t('Keep asthma and heart medicine stocked.', 'สำรองยาโรคหอบหืดและโรคหัวใจให้พอ', 'ပန်းနာရင်ကျပ်ဆေးနှင့် နှလုံးရောဂါဆေးများကို လုံလောက်စွာ စုထားပါ။'),
			t('Check PM2.5 each morning before going out.', 'ตรวจค่าฝุ่น PM2.5 ทุกเช้าก่อนออกจากบ้าน', 'အပြင်မထွက်မီ မနက်တိုင်း PM2.5 ကို စစ်ဆေးပါ။')
		],
		during: [
			t('Stay indoors with doors and windows closed.', 'อยู่ในอาคาร ปิดประตูและหน้าต่าง', 'တံခါးများနှင့် ပြတင်းပေါက်များကို ပိတ်ပြီး အိမ်ထဲတွင် နေပါ။'),
			t('Wear an N95 mask whenever you go outside.', 'สวมหน้ากาก N95 ทุกครั้งที่ออกนอกอาคาร', 'အပြင်ထွက်တိုင်း N95 နှာခေါင်းစည်း တပ်ပါ။'),
			t('Avoid exercise outdoors, especially children and older people.', 'งดออกกำลังกายกลางแจ้ง โดยเฉพาะเด็กและผู้สูงอายุ', 'အပြင်တွင် လေ့ကျင့်ခန်း မလုပ်ပါနှင့်၊ အထူးသဖြင့် ကလေးများနှင့် သက်ကြီးရွယ်အိုများ။'),
			t('See a doctor if you have chest pain or trouble breathing.', 'พบแพทย์หากเจ็บหน้าอกหรือหายใจลำบาก', 'ရင်ဘတ်အောင့်ခြင်း သို့မဟုတ် အသက်ရှူခက်ခြင်း ရှိလျှင် ဆရာဝန်ပြပါ။')
		],
		after: [
			t('Air out your home once PM2.5 drops below 37.5 µg/m³.', 'เปิดบ้านระบายอากาศเมื่อค่าฝุ่น PM2.5 ต่ำกว่า 37.5 มคก./ลบ.ม.', 'PM2.5 သည် 37.5 µg/m³ အောက်သို့ ကျသွားမှ အိမ်ကို လေဝင်လေထွက် ဖွင့်ပေးပါ။'),
			t('Change or clean air purifier filters.', 'เปลี่ยนหรือทำความสะอาดแผ่นกรองเครื่องฟอกอากาศ', 'လေသန့်စက်၏ စစ်ထုတ်ကိရိယာ (filter) ကို လဲပါ သို့မဟုတ် သန့်ရှင်းပါ။'),
			t('Report burning you see to local authorities.', 'แจ้งการเผาที่พบเห็นต่อหน่วยงานท้องถิ่น', 'တွေ့ရသော မီးရှို့မှုများကို ဒေသအာဏာပိုင်များထံ သတင်းပို့ပါ။'),
			t('Keep spare masks for the next haze season.', 'เก็บหน้ากากสำรองไว้ใช้ในฤดูหมอกควันครั้งหน้า', 'နောက်မြူမှိုင်းရာသီအတွက် အပိုနှာခေါင်းစည်းများ သိမ်းထားပါ။')
		]
	},
	heat: {
		title: t('Extreme heat', 'อากาศร้อนจัด', 'အပူလွန်ကဲခြင်း'),
		summary: t('Heat that can cause heatstroke, mostly March to May.', 'อากาศร้อนจัดที่อาจทำให้เกิดโรคลมร้อน (ฮีทสโตรก) มักเกิดช่วงมีนาคมถึงพฤษภาคม', 'အပူလျှပ်ခြင်း (heatstroke) ဖြစ်စေနိုင်သော အပူဒဏ်၊ အများအားဖြင့် မတ်လမှ မေလအထိ။'),
		before: [
			t('Plan outdoor work for early morning or evening.', 'วางแผนทำงานกลางแจ้งช่วงเช้าตรู่หรือเย็น', 'အပြင်အလုပ်များကို မနက်စောစော သို့မဟုတ် ညနေပိုင်းတွင် လုပ်ရန် စီစဉ်ပါ။'),
			t('Find a cool place nearby: a mall, library or temple hall.', 'หาที่เย็นใกล้บ้าน เช่น ห้างสรรพสินค้า ห้องสมุด หรือศาลาวัด', 'အနီးရှိ အေးမြသောနေရာ (ဥပမာ ဈေးဝယ်စင်တာ၊ စာကြည့်တိုက် သို့မဟုတ် ဘုန်းကြီးကျောင်းဇရပ်) ကို ရှာထားပါ။'),
			t('Check that older relatives have a fan or air conditioning.', 'ตรวจดูว่าญาติผู้สูงอายุมีพัดลมหรือเครื่องปรับอากาศ', 'သက်ကြီးရွယ်အို ဆွေမျိုးများတွင် ပန်ကာ သို့မဟုတ် လေအေးပေးစက် ရှိမရှိ စစ်ဆေးပါ။'),
			t('Keep oral rehydration salts at home.', 'มีผงเกลือแร่ติดบ้านไว้', 'ဓာတ်ဆား (ORS) ကို အိမ်တွင် အသင့်ထားပါ။')
		],
		during: [
			t('Stay out of the sun between 11:00 and 15:00.', 'หลีกเลี่ยงแดดช่วง 11.00–15.00 น.', '11:00 မှ 15:00 အတွင်း နေပူထဲ မထွက်ပါနှင့်။'),
			t('Drink water every 20 minutes, even if you are not thirsty.', 'ดื่มน้ำทุก 20 นาที แม้ไม่รู้สึกกระหาย', 'ရေမငတ်သော်လည်း မိနစ် 20 တိုင်း ရေသောက်ပါ။'),
			t('Confusion, fainting or very hot skin (with or without sweat) means heatstroke: call {medical} and cool the person with water and shade.', 'สับสน เป็นลม หรือตัวร้อนจัด (มีหรือไม่มีเหงื่อก็ได้) คืออาการโรคลมร้อน ให้โทร {medical} และพาผู้ป่วยเข้าที่ร่ม ใช้น้ำช่วยลดอุณหภูมิร่างกาย', 'စိတ်ရှုပ်ထွေးခြင်း၊ သတိလစ်ခြင်း သို့မဟုတ် အရေပြား အလွန်ပူခြင်း (ချွေးထွက်သည်ဖြစ်စေ မထွက်သည်ဖြစ်စေ) သည် အပူလျှပ်ခြင်း ဖြစ်သည်။ {medical} ကို ဖုန်းခေါ်ပါ၊ လူနာကို အရိပ်ထဲ ခေါ်ပြီး ရေဖြင့် ကိုယ်ကို အေးအောင် လုပ်ပေးပါ။'),
			t('Never leave children or pets in a parked car.', 'ห้ามทิ้งเด็กหรือสัตว์เลี้ยงไว้ในรถที่จอดอยู่', 'ရပ်ထားသော ကားထဲတွင် ကလေးများ သို့မဟုတ် အိမ်မွေးတိရစ္ဆာန်များကို ဘယ်တော့မှ ချန်မထားပါနှင့်။')
		],
		after: [
			t('Keep drinking water for the rest of the day.', 'ดื่มน้ำต่อเนื่องไปจนหมดวัน', 'ကျန်သည့်နေ့တစ်လျှောက် ရေဆက်သောက်ပါ။'),
			t('Check on neighbours who live alone.', 'ตรวจดูความปลอดภัยของเพื่อนบ้านที่อยู่คนเดียว', 'တစ်ယောက်တည်း နေသော အိမ်နီးချင်းများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။'),
			t('Rest in the shade before going back to hard work.', 'พักในที่ร่มก่อนกลับไปทำงานหนัก', 'အလုပ်ကြမ်း ပြန်မလုပ်မီ အရိပ်တွင် အနားယူပါ။'),
			t('Watch for headaches or cramps the next day.', 'สังเกตอาการปวดศีรษะหรือตะคริวในวันถัดไป', 'နောက်နေ့တွင် ခေါင်းကိုက်ခြင်း သို့မဟုတ် ကြွက်တက်ခြင်း ရှိမရှိ သတိထားပါ။')
		]
	},
	earthquake: {
		title: t('Earthquake', 'แผ่นดินไหว', 'ငလျင်'),
		summary: t('Shaking from faults in the north and west, or from Myanmar.', 'การสั่นไหวจากรอยเลื่อนในภาคเหนือและภาคตะวันตก หรือจากเมียนมา', 'မြောက်ပိုင်းနှင့် အနောက်ပိုင်းရှိ ပြတ်ရွေ့များ သို့မဟုတ် မြန်မာနိုင်ငံမှ ဖြစ်ပေါ်သော လှုပ်ခတ်မှု။'),
		before: [
			t('Fix tall furniture and shelves to the wall.', 'ยึดเฟอร์นิเจอร์สูงและชั้นวางของไว้กับผนัง', 'အရပ်မြင့်သော ပရိဘောဂများနှင့် စင်များကို နံရံနှင့် ခိုင်မြဲစွာ တွဲတပ်ထားပါ။'),
			t('Practise Drop, Cover, Hold On with your family.', 'ฝึก “หมอบ ป้อง เกาะ” กับครอบครัว', 'မိသားစုနှင့်အတူ “ဝပ်၊ ကွယ်၊ ကိုင်” (Drop, Cover, Hold On) ကို လေ့ကျင့်ပါ။'),
			t('Know how to turn off gas and electricity.', 'รู้วิธีปิดแก๊สและตัดไฟ', 'ဂက်စ်နှင့် လျှပ်စစ်မီးကို ပိတ်နည်း သိထားပါ။'),
			t('Agree on a meeting point outside your building.', 'ตกลงจุดนัดพบนอกอาคาร', 'အဆောက်အအုံ အပြင်ဘက်တွင် တွေ့ဆုံရမည့် နေရာတစ်ခုကို မိသားစုနှင့် သဘောတူထားပါ။')
		],
		during: [
			t('Drop to the floor, cover your head, hold on to sturdy furniture.', 'หมอบลงกับพื้น ป้องศีรษะ เกาะเฟอร์นิเจอร์ที่แข็งแรงไว้', 'ကြမ်းပြင်ပေါ် ဝပ်ချပါ၊ ခေါင်းကို လက်ဖြင့် ကွယ်ကာထားပါ၊ ခိုင်ခံ့သော ပရိဘောဂကို ကိုင်ထားပါ။'),
			t('Stay away from windows and heavy objects that can fall.', 'อยู่ห่างจากหน้าต่างและของหนักที่อาจตกลงมา', 'ပြတင်းပေါက်များနှင့် ပြုတ်ကျနိုင်သော လေးလံသည့် ပစ္စည်းများမှ ဝေးဝေးနေပါ။'),
			t('Do not use lifts; do not run outside while it is shaking.', 'ห้ามใช้ลิฟต์ และอย่าวิ่งออกนอกอาคารขณะแผ่นดินยังสั่น', 'ဓာတ်လှေကား မစီးပါနှင့်။ လှုပ်နေစဉ် အပြင်သို့ ပြေးမထွက်ပါနှင့်။'),
			t('If outside, move away from buildings, trees and power lines.', 'หากอยู่ข้างนอก ให้ออกห่างจากอาคาร ต้นไม้ และสายไฟ', 'အပြင်တွင် ရှိနေလျှင် အဆောက်အအုံများ၊ သစ်ပင်များနှင့် ဓာတ်ကြိုးများမှ ဝေးရာသို့ ရွှေ့ပါ။')
		],
		after: [
			t('Expect aftershocks; leave damaged buildings.', 'ระวังแผ่นดินไหวตาม (อาฟเตอร์ช็อก) และออกจากอาคารที่เสียหาย', 'နောက်ဆက်တွဲ ငလျင်လှုပ်ခတ်မှုများ ရှိနိုင်သည်။ ပျက်စီးနေသော အဆောက်အအုံများမှ ထွက်ခွာပါ။'),
			t('Check for gas leaks; do not use flames.', 'ตรวจหาแก๊สรั่ว ห้ามจุดไฟ', 'ဂက်စ်ယိုစိမ့်မှု ရှိမရှိ စစ်ဆေးပါ။ မီးမညှိပါနှင့်။'),
			t('On the Andaman coast, move inland in case of a tsunami.', 'หากอยู่ชายฝั่งอันดามัน ให้ย้ายออกห่างจากชายฝั่ง เผื่อเกิดสึนามิ', 'အန္ဒမန်ကမ်းရိုးတန်းတွင် ရှိလျှင် ဆူနာမီ ဖြစ်နိုင်သဖြင့် ကုန်းတွင်းဘက်သို့ ရွှေ့ပါ။'),
			t('Send a text instead of calling so lines stay free.', 'ส่งข้อความแทนการโทร เพื่อไม่ให้คู่สายแน่น', 'ဖုန်းလိုင်းများ မပိတ်ဆို့စေရန် ဖုန်းခေါ်မည့်အစား စာတို ပို့ပါ။')
		]
	},
	tsunami: {
		title: t('Tsunami', 'สึนามิ', 'ဆူနာမီ'),
		summary: t('Giant waves on the Andaman coast after a large undersea quake.', 'คลื่นยักษ์ซัดชายฝั่งอันดามันหลังเกิดแผ่นดินไหวใต้ทะเลขนาดใหญ่', 'ပင်လယ်အောက် ငလျင်ကြီး လှုပ်ပြီးနောက် အန္ဒမန်ကမ်းရိုးတန်းသို့ ရိုက်ခတ်သော လှိုင်းကြီးများ။'),
		before: [
			t('Learn the tsunami evacuation signs near the beach.', 'จำป้ายเส้นทางอพยพสึนามิใกล้ชายหาด', 'ကမ်းခြေအနီးရှိ ဆူနာမီ ဘေးလွတ်ရာ ရွှေ့ပြောင်းရေး ဆိုင်းဘုတ်များကို မှတ်သားထားပါ။'),
			t('Know the nearest high ground or tall concrete building.', 'รู้จุดที่สูงหรืออาคารคอนกรีตสูงที่ใกล้ที่สุด', 'အနီးဆုံး မြင့်သောနေရာ သို့မဟုတ် အမြင့် ကွန်ကရစ် အဆောက်အအုံကို သိထားပါ။'),
			t('Keep a go-bag ready if you live on the coast.', 'เตรียมกระเป๋าฉุกเฉินไว้หากอยู่ชายฝั่ง', 'ကမ်းရိုးတန်းတွင် နေထိုင်လျှင် အရေးပေါ်အိတ်ကို အသင့်ထားပါ။'),
			t('Know the sound of the warning tower in your area.', 'จำเสียงสัญญาณจากหอเตือนภัยในพื้นที่', 'သင့်ဒေသရှိ သတိပေးမျှော်စင်၏ အချက်ပေးသံကို မှတ်မိအောင် လုပ်ထားပါ။')
		],
		during: [
			t('Strong shaking or the sea pulling back: run to high ground now.', 'หากแผ่นดินไหวรุนแรงหรือน้ำทะเลลดลงอย่างผิดปกติ ให้วิ่งขึ้นที่สูงทันที', 'ပြင်းထန်စွာ လှုပ်ခတ်လျှင် သို့မဟုတ် ပင်လယ်ရေ ရုတ်တရက် နောက်သို့ ဆုတ်သွားလျှင် မြင့်သောနေရာသို့ ချက်ချင်း ပြေးပါ။'),
			t('Go on foot; roads jam quickly.', 'อพยพด้วยการเดินเท้า เพราะรถจะติดอย่างรวดเร็ว', 'ခြေလျင် သွားပါ။ လမ်းများ မြန်မြန် ပိတ်ဆို့တတ်သည်။'),
			t('Go as high and as far inland as you can: at least 30 m up, 3 km inland, or the 3rd floor or higher of a strong concrete building.', 'ขึ้นที่สูงและไปให้ไกลจากชายฝั่งมากที่สุด อย่างน้อยสูง 30 ม. หรือห่างจากชายฝั่งเข้าไปในแผ่นดิน 3 กม. หรือขึ้นชั้น 3 ขึ้นไปของอาคารคอนกรีตที่แข็งแรง', 'တတ်နိုင်သမျှ မြင့်ရာနှင့် ကုန်းတွင်းဘက် ဝေးရာသို့ သွားပါ။ အနည်းဆုံး 30 မီတာ မြင့်သောနေရာ၊ ကမ်းခြေမှ ကုန်းတွင်းဘက် 3 ကီလိုမီတာ၊ သို့မဟုတ် ခိုင်ခံ့သော ကွန်ကရစ်အဆောက်အအုံ၏ 3 ထပ်နှင့်အထက်သို့ ရောက်အောင် သွားပါ။'),
			t('Do not go back for belongings.', 'อย่าย้อนกลับไปเอาของ', 'ပစ္စည်းများ ယူရန် ပြန်မသွားပါနှင့်။')
		],
		after: [
			t('Stay on high ground; more waves can follow for hours.', 'อยู่บนที่สูงต่อ อาจมีคลื่นตามมาอีกหลายชั่วโมง', 'နာရီပေါင်းများစွာ လှိုင်းများ ထပ်လာနိုင်သဖြင့် မြင့်သောနေရာတွင်သာ ဆက်နေပါ။'),
			t('Return only after an official all-clear.', 'กลับเมื่อทางการประกาศว่าปลอดภัยแล้วเท่านั้น', 'ဘေးကင်းပြီဟု တရားဝင် ကြေညာပြီးမှသာ ပြန်ပါ။'),
			t('Stay out of damaged buildings and floodwater.', 'อย่าเข้าไปในอาคารที่เสียหาย และอย่าลงไปในน้ำท่วมขัง', 'ပျက်စီးနေသော အဆောက်အအုံများနှင့် ရေကြီးရေထဲသို့ မဝင်ပါနှင့်။'),
			t('Help others only when you are safe yourself.', 'ช่วยเหลือผู้อื่นเมื่อตัวเองปลอดภัยแล้วเท่านั้น', 'ကိုယ်တိုင် ဘေးကင်းမှသာ အခြားသူများကို ကူညီပါ။')
		]
	},
	landslide: {
		title: t('Landslide', 'ดินถล่ม', 'မြေပြိုခြင်း'),
		summary: t('Slopes give way after days of heavy rain.', 'ดินบนลาดเขาพังทลายหลังฝนตกหนักติดต่อกันหลายวัน', 'ရက်ပေါင်းများစွာ မိုးသည်းထန်စွာ ရွာပြီးနောက် တောင်စောင်းများ ပြိုကျခြင်း။'),
		before: [
			t('Know if your home is on or below a steep slope.', 'รู้ว่าบ้านอยู่บนหรือใต้ลาดเขาชันหรือไม่', 'သင့်အိမ်သည် မတ်စောက်သော တောင်စောင်းပေါ် သို့မဟုတ် အောက်တွင် ရှိမရှိ သိထားပါ။'),
			t('Watch for new cracks in walls, ground or roads.', 'สังเกตรอยแตกใหม่ที่ผนัง พื้นดิน หรือถนน', 'နံရံ၊ မြေပြင် သို့မဟုတ် လမ်းများတွင် အက်ကြောင်းအသစ်များ ရှိမရှိ စောင့်ကြည့်ပါ။'),
			t('Plan a route away from slopes and valleys.', 'วางแผนเส้นทางที่ห่างจากลาดเขาและหุบเขา', 'တောင်စောင်းများနှင့် ချိုင့်ဝှမ်းများမှ ဝေးသော လမ်းကြောင်းကို စီစဉ်ထားပါ။'),
			t('Follow heavy rain warnings closely.', 'ติดตามประกาศเตือนฝนตกหนักอย่างใกล้ชิด', 'မိုးသည်းထန်မှု သတိပေးချက်များကို အနီးကပ် စောင့်ကြည့်ပါ။')
		],
		during: [
			t('Muddy stream water or falling rocks: leave the slope now.', 'หากน้ำในลำธารขุ่นเป็นสีโคลนหรือมีหินร่วงหล่น ให้ออกจากลาดเขาทันที', 'ချောင်းရေ ရွှံ့နောက်လာလျှင် သို့မဟုတ် ကျောက်တုံးများ ကျလာလျှင် တောင်စောင်းမှ ချက်ချင်း ထွက်ခွာပါ။'),
			t('Move sideways out of the path of a slide, not downhill.', 'หนีออกทางด้านข้างของแนวดินถล่ม อย่าวิ่งลงเขา', 'မြေပြိုလာသည့် လမ်းကြောင်းမှ ဘေးတိုက် လွတ်ရာသို့ ရွှေ့ပါ၊ တောင်အောက်ဘက်သို့ မပြေးပါနှင့်။'),
			t('Stay away from river valleys and low areas.', 'อยู่ห่างจากหุบเขาริมลำน้ำและที่ลุ่มต่ำ', 'မြစ်ချိုင့်ဝှမ်းများနှင့် နိမ့်သောနေရာများမှ ဝေးဝေးနေပါ။'),
			t('If you cannot escape, curl up and protect your head.', 'หากหนีไม่ทัน ให้ขดตัวและป้องศีรษะ', 'မလွတ်မြောက်နိုင်လျှင် ကိုယ်ကို ကွေးလိပ်ထားပြီး ခေါင်းကို ကာကွယ်ပါ။')
		],
		after: [
			t('Stay away from the slide area; more can fall.', 'อยู่ห่างจากพื้นที่ดินถล่ม อาจถล่มซ้ำ', 'ထပ်ပြိုနိုင်သဖြင့် မြေပြိုသည့်နေရာမှ ဝေးဝေးနေပါ။'),
			t('Report broken roads, power and water lines.', 'แจ้งถนน สายไฟ และท่อน้ำที่เสียหาย', 'ပျက်စီးနေသော လမ်းများ၊ ဓာတ်ကြိုးများနှင့် ရေပိုက်လိုင်းများကို သတင်းပို့ပါ။'),
			t('Watch for flooding below the slide.', 'ระวังน้ำท่วมบริเวณใต้จุดดินถล่ม', 'မြေပြိုသည့်နေရာ၏ အောက်ဘက်တွင် ရေကြီးနိုင်သည်ကို သတိထားပါ။'),
			t('Have the slope checked before going home.', 'ให้ผู้เชี่ยวชาญตรวจลาดดินก่อนกลับบ้าน', 'အိမ်မပြန်မီ တောင်စောင်းကို ကျွမ်းကျင်သူဖြင့် စစ်ဆေးခိုင်းပါ။')
		]
	},
	drought: {
		title: t('Drought', 'ภัยแล้ง', 'မိုးခေါင်ခြင်း'),
		summary: t('Long dry spells that cut water for homes and farms.', 'ช่วงแล้งยาวนานที่ทำให้ขาดน้ำใช้ในบ้านและการเกษตร', 'အိမ်သုံးရေနှင့် စိုက်ပျိုးရေးသုံးရေ ပြတ်လပ်စေသော ကြာရှည်ခြောက်သွေ့သည့်ကာလ။'),
		before: [
			t('Fix leaking taps and pipes.', 'ซ่อมก๊อกและท่อน้ำที่รั่ว', 'ယိုစိမ့်နေသော ရေပိုက်ခေါင်းများနှင့် ပိုက်များကို ပြင်ပါ။'),
			t('Store drinking water in clean, closed containers.', 'เก็บน้ำดื่มในภาชนะที่สะอาดและมีฝาปิด', 'သောက်ရေကို အဖုံးပါသော သန့်ရှင်းသည့် ရေခံပုံးများတွင် သိုလှောင်ပါ။'),
			t("Learn your area's water supply schedule.", 'รู้ตารางการจ่ายน้ำในพื้นที่', 'သင့်ဒေသ၏ ရေပေးဝေချိန် ဇယားကို သိထားပါ။'),
			t('Farmers: ask the local office about drought-tolerant crops.', 'เกษตรกร: สอบถามสำนักงานเกษตรอำเภอเรื่องพืชทนแล้ง', 'တောင်သူများ- မိုးခေါင်ဒဏ်ခံနိုင်သော သီးနှံများအကြောင်း ဒေသဆိုင်ရာ ရုံးတွင် မေးမြန်းပါ။')
		],
		during: [
			t('Use water for drinking and cooking first.', 'ใช้น้ำเพื่อดื่มและทำอาหารเป็นอันดับแรก', 'ရေကို သောက်ရန်နှင့် ချက်ပြုတ်ရန် ဦးစားပေး သုံးပါ။'),
			t('Reuse washing water for plants and toilets.', 'นำน้ำจากการซักล้างไปรดต้นไม้หรือราดส้วม', 'လျှော်ဖွပ်ဆေးကြောပြီးသော ရေကို အပင်ရေလောင်းရန်နှင့် အိမ်သာအတွက် ပြန်သုံးပါ။'),
			t('Do not burn fields; dry land catches fire fast.', 'ห้ามเผาไร่ เพราะพื้นที่แห้งติดไฟเร็ว', 'လယ်ကွင်းများကို မီးမရှို့ပါနှင့်။ ခြောက်သွေ့သော မြေတွင် မီးလျင်မြန်စွာ ကူးစက်လောင်ကျွမ်းတတ်သည်။'),
			t('Get water from official distribution points if the supply stops.', 'หากน้ำหยุดไหล ให้รับน้ำจากจุดแจกจ่ายของทางการ', 'ရေပြတ်သွားလျှင် တရားဝင် ရေဝေငှရာ နေရာများမှ ရေယူပါ။')
		],
		after: [
			t('Keep saving water until reservoirs recover.', 'ประหยัดน้ำต่อไปจนกว่าน้ำในอ่างเก็บน้ำจะกลับมาเป็นปกติ', 'ရေလှောင်ကန်များ ပုံမှန်ပြန်ဖြစ်သည်အထိ ရေကို ဆက်လက် ချွေတာပါ။'),
			t('Clean stored water containers.', 'ทำความสะอาดภาชนะเก็บน้ำ', 'ရေသိုလှောင်ထားသော ပုံးများကို သန့်ရှင်းပါ။'),
			t('Ask about government drought relief.', 'สอบถามความช่วยเหลือภัยแล้งจากภาครัฐ', 'အစိုးရ၏ မိုးခေါင်ရေရှား ကူညီထောက်ပံ့မှုအကြောင်း မေးမြန်းပါ။'),
			t('Plan rainwater collection for next season.', 'วางแผนเก็บน้ำฝนสำหรับฤดูถัดไป', 'နောက်ရာသီအတွက် မိုးရေစုဆောင်းရန် စီစဉ်ပါ။')
		]
	},
	chemical: {
		title: t('Chemical incident', 'อุบัติภัยสารเคมี', 'ဓာတုပစ္စည်း အန္တရာယ်'),
		summary: t('Leaks, fires or spills at factories and on roads.', 'สารเคมีรั่วไหล หกรด หรือเกิดเพลิงไหม้ ในโรงงานหรือบนถนน', 'စက်ရုံများနှင့် လမ်းများပေါ်တွင် ဓာတုပစ္စည်း ယိုစိမ့်ခြင်း၊ မီးလောင်ခြင်း သို့မဟုတ် ဖိတ်စင်ခြင်း။'),
		before: [
			t('Know if you live near factories or chemical storage.', 'รู้ว่าบ้านอยู่ใกล้โรงงานหรือคลังสารเคมีหรือไม่', 'စက်ရုံများ သို့မဟုတ် ဓာတုပစ္စည်း သိုလှောင်ရုံများ အနီးတွင် နေထိုင်ခြင်း ရှိမရှိ သိထားပါ။'),
			t('Keep tape and a plastic sheet to seal a room.', 'เตรียมเทปและแผ่นพลาสติกไว้ปิดผนึกห้อง', 'အခန်းကို အလုံပိတ်ရန် တိပ်နှင့် ပလတ်စတစ်စကို အသင့်ထားပါ။'),
			t('Know two ways out of your area.', 'รู้เส้นทางออกจากพื้นที่ 2 เส้นทาง', 'သင့်ဒေသမှ ထွက်နိုင်သော လမ်းကြောင်း 2 ခုကို သိထားပါ။'),
			t('Save {disaster} and {fire} in your phone.', 'บันทึกเบอร์ {disaster} และ {fire} ไว้ในโทรศัพท์', '{disaster} နှင့် {fire} ကို ဖုန်းထဲတွင် သိမ်းထားပါ။')
		],
		during: [
			t('Go indoors, close windows, turn off fans and air conditioning.', 'เข้าอาคาร ปิดหน้าต่าง ปิดพัดลมและเครื่องปรับอากาศ', 'အိမ်ထဲဝင်ပါ၊ ပြတင်းပေါက်များကို ပိတ်ပါ၊ ပန်ကာနှင့် လေအေးပေးစက်များကို ပိတ်ပါ။'),
			t('If told to evacuate, leave upwind and uphill.', 'หากได้รับแจ้งให้อพยพ ให้ไปทางเหนือลมและขึ้นที่สูง', 'ဘေးလွတ်ရာသို့ ရွှေ့ပြောင်းရန် အကြောင်းကြားလျှင် လေညာဘက် (လေတိုက်လာသည့်ဘက်) နှင့် မြင့်သောနေရာဘက်သို့ ထွက်ခွာပါ။'),
			t('If nothing better is at hand, cover your nose and mouth with a wet cloth.', 'หากไม่มีอุปกรณ์ที่ดีกว่า ให้ปิดจมูกและปากด้วยผ้าชุบน้ำ', 'ပိုကောင်းသော ပစ္စည်း မရှိလျှင် နှာခေါင်းနှင့် ပါးစပ်ကို ရေစိုအဝတ်ဖြင့် အုပ်ထားပါ။'),
			t('Do not touch spilled liquids or smoke residue.', 'ห้ามสัมผัสของเหลวที่หกหรือคราบควัน', 'ဖိတ်စင်နေသော အရည်များ သို့မဟုတ် မီးခိုးအကြွင်းအကျန်များကို မထိပါနှင့်။')
		],
		after: [
			t('Return only when officials say the air is safe.', 'กลับเมื่อทางการแจ้งว่าอากาศปลอดภัยแล้วเท่านั้น', 'လေထု ဘေးကင်းပြီဟု တာဝန်ရှိသူများက ပြောမှသာ ပြန်ပါ။'),
			t('Take off and bag exposed clothes; wash your skin with soap and water.', 'ถอดเสื้อผ้าที่สัมผัสสารเคมี ใส่ถุงแล้วปิดปากถุง และล้างผิวด้วยสบู่และน้ำ', 'ဓာတုပစ္စည်း ထိခဲ့သော အဝတ်များကို ချွတ်ပြီး အိတ်ထဲထည့်ပိတ်ပါ။ အရေပြားကို ဆပ်ပြာနှင့် ရေဖြင့် ဆေးပါ။'),
			t('See a doctor if your eyes, skin or breathing hurt.', 'พบแพทย์หากแสบตา ระคายเคืองผิว หรือเจ็บขณะหายใจ', 'မျက်လုံး၊ အရေပြား သို့မဟုတ် အသက်ရှူရာတွင် နာကျင်လျှင် ဆရာဝန်ပြပါ။'),
			t('Do not eat garden vegetables until they are checked.', 'อย่ากินผักที่ปลูกไว้จนกว่าจะได้รับการตรวจ', 'ခြံထွက် ဟင်းသီးဟင်းရွက်များကို စစ်ဆေးပြီးမှသာ စားပါ။')
		]
	},
	cold: {
		title: t('Extreme cold', 'อากาศหนาวจัด', 'အအေးလွန်ကဲခြင်း'),
		summary: t('Severe cold and wind chill that can cause frostbite and hypothermia.', 'อากาศหนาวจัดและลมหนาวที่อาจทำให้เกิดอาการหิมะกัด (ฟรอสต์ไบต์) และอุณหภูมิกายต่ำ (ไฮโปเทอร์เมีย)', 'အရေပြား အေးခဲပျက်စီးခြင်း (frostbite) နှင့် ကိုယ်အပူချိန် အလွန်ကျခြင်း (hypothermia) ကို ဖြစ်စေနိုင်သော ပြင်းထန်သည့် အအေးဓာတ်နှင့် လေအေး။'),
		before: [
			t('Dress in layers, with a hat, gloves and windproof outer layer.', 'สวมเสื้อผ้าหลายชั้น พร้อมหมวก ถุงมือ และเสื้อชั้นนอกกันลม', 'ဦးထုပ်၊ လက်အိတ်နှင့် လေလုံသော အပြင်အင်္ကျီ အပါအဝင် အဝတ်ကို အထပ်ထပ် ဝတ်ပါ။'),
			t('Keep a phone power bank charged.', 'ชาร์จพาวเวอร์แบงก์สำหรับโทรศัพท์ไว้ให้เต็ม', 'ဖုန်းအတွက် ပါဝါဘဏ်ကို အားပြည့်ထားပါ။'),
			t('Check on elderly neighbours.', 'ตรวจดูความปลอดภัยของเพื่อนบ้านผู้สูงอายุ', 'သက်ကြီးရွယ်အို အိမ်နီးချင်းများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။'),
			t('Keep some food and water at home in case of power cuts.', 'เก็บอาหารและน้ำไว้ที่บ้านเผื่อไฟฟ้าดับ', 'မီးပြတ်ခဲ့လျှင်အတွက် အစားအစာနှင့် ရေ အချို့ကို အိမ်တွင် ထားပါ။')
		],
		during: [
			t('Limit time outside; cover skin, because frostbite can start in minutes in strong wind.', 'จำกัดเวลาอยู่นอกอาคาร ปกปิดผิวหนังให้มิดชิด เพราะลมแรงอาจทำให้เกิดอาการหิมะกัดได้ภายในไม่กี่นาที', 'အပြင်တွင် နေချိန်ကို လျှော့ပါ။ လေပြင်းထဲတွင် မိနစ်ပိုင်းအတွင်း အရေပြား အေးခဲပျက်စီးခြင်း စတင်နိုင်သဖြင့် အရေပြားကို ဖုံးအုပ်ထားပါ။'),
			t('Watch for hypothermia (shivering, confusion, slurred speech): get the person warm and dry and call {medical}.', 'สังเกตอาการอุณหภูมิกายต่ำ (ตัวสั่น สับสน พูดไม่ชัด) พาผู้ป่วยเข้าที่อบอุ่นและทำให้ตัวแห้ง แล้วโทร {medical}', 'ကိုယ်အပူချိန် အလွန်ကျခြင်း (တုန်ခါခြင်း၊ စိတ်ရှုပ်ထွေးခြင်း၊ စကားဝဲခြင်း) လက္ခဏာများကို သတိထားပါ။ လူနာကို နွေးထွေးပြီး ခြောက်သွေ့အောင် လုပ်ပေးကာ {medical} ကို ဖုန်းခေါ်ပါ။'),
			t('Never use a grill, camping stove or generator indoors (carbon monoxide).', 'ห้ามใช้เตาย่าง เตาแคมป์ปิ้ง หรือเครื่องปั่นไฟในอาคาร (แก๊สคาร์บอนมอนอกไซด์)', 'အိမ်ထဲတွင် အသားကင်မီးဖို၊ စခန်းသုံးမီးဖို သို့မဟုတ် မီးစက်ကို ဘယ်တော့မှ မသုံးပါနှင့် (ကာဗွန်မိုနောက်ဆိုဒ် အဆိပ်သင့်နိုင်သည်)။'),
			t('Keep moving if you must be outside.', 'หากต้องอยู่นอกอาคาร ให้ขยับตัวอยู่เสมอ', 'အပြင်တွင် နေရမည်ဆိုလျှင် ကိုယ်ကို အမြဲ လှုပ်ရှားနေပါ။')
		],
		after: [
			t("Warm frostbitten skin slowly with lukewarm water, not hot, and don't rub it.", 'ค่อยๆ อุ่นผิวหนังที่ถูกหิมะกัดด้วยน้ำอุ่นพอประมาณ ไม่ใช่น้ำร้อน และห้ามถู', 'အေးခဲပျက်စီးသော အရေပြားကို ရေနွေးနွေး (ရေပူ မဟုတ်) ဖြင့် ဖြည်းဖြည်း နွေးပေးပါ။ မပွတ်ပါနှင့်။'),
			t('Check pipes and heating.', 'ตรวจท่อน้ำและระบบทำความร้อน', 'ရေပိုက်များနှင့် အပူပေးစနစ်ကို စစ်ဆေးပါ။'),
			t('Follow {officials} and local announcements.', 'ติดตามประกาศของ{officials}และหน่วยงานท้องถิ่น', '{officials} နှင့် ဒေသဆိုင်ရာ ကြေညာချက်များကို လိုက်နာပါ။')
		]
	},
	snow: {
		title: t('Heavy snow', 'หิมะตกหนัก', 'နှင်းထူထပ်စွာ ကျခြင်း'),
		summary: t('Heavy snowfall that blocks roads and cuts power.', 'หิมะตกหนักจนถนนถูกปิดกั้นและไฟฟ้าอาจดับ', 'လမ်းများကို ပိတ်ဆို့ပြီး မီးပြတ်စေသော နှင်းထူထပ်စွာ ကျခြင်း။'),
		before: [
			t('Keep a shovel, warm clothes and food at home.', 'เตรียมพลั่ว เสื้อผ้าอบอุ่น และอาหารไว้ที่บ้าน', 'ဂေါ်ပြား၊ နွေးထွေးသော အဝတ်များနှင့် အစားအစာကို အိမ်တွင် ထားပါ။'),
			t('In a car, carry a blanket, water, a torch and a charged phone.', 'หากมีรถ ให้เตรียมผ้าห่ม น้ำ ไฟฉาย และโทรศัพท์ที่ชาร์จเต็มไว้ในรถ', 'ကားထဲတွင် စောင်၊ ရေ၊ ဓာတ်မီးနှင့် အားပြည့်ဖုန်း ထည့်ထားပါ။'),
			t('Plan to stay home if {officials} warn.', 'วางแผนอยู่บ้านเมื่อ{officials}ออกคำเตือน', '{officials} က သတိပေးလျှင် အိမ်တွင်နေရန် စီစဉ်ပါ။')
		],
		during: [
			t('Avoid unnecessary travel.', 'หลีกเลี่ยงการเดินทางที่ไม่จำเป็น', 'မလိုအပ်သော ခရီးသွားခြင်းကို ရှောင်ပါ။'),
			t('If stuck in a car, stay in it, keep the exhaust pipe clear of snow and run the engine only briefly for heat.', 'หากติดอยู่ในรถ ให้อยู่ในรถ เคลียร์หิมะออกจากท่อไอเสีย และสตาร์ตเครื่องเพื่อให้ความอบอุ่นเพียงช่วงสั้นๆ', 'ကားထဲတွင် ပိတ်မိနေလျှင် ကားထဲမှာပဲ နေပါ။ အိတ်ဇောပိုက်ကို နှင်းမပိတ်အောင် ရှင်းထားပြီး အနွေးဓာတ်ရရန် အင်ဂျင်ကို ခဏသာ နှိုးပါ။'),
			t('Watch for snow sliding from roofs.', 'ระวังหิมะไหลลงมาจากหลังคา', 'အမိုးများပေါ်မှ နှင်းလျှောကျလာနိုင်သည်ကို သတိထားပါ။')
		],
		after: [
			t('Clear snow carefully and take breaks (heart strain).', 'ตักหิมะอย่างระมัดระวังและพักเป็นระยะ (หัวใจทำงานหนัก)', 'နှင်းကို ဂရုတစိုက် ကော်ပါ၊ ခဏခဏ နားပါ (နှလုံးကို ဝန်ပိစေသည်)။'),
			t('Check on neighbours.', 'ตรวจดูความปลอดภัยของเพื่อนบ้าน', 'အိမ်နီးချင်းများ အဆင်ပြေမပြေ စစ်ဆေးကြည့်ရှုပါ။'),
			t('Keep roofs and vents clear.', 'เคลียร์หิมะจากหลังคาและช่องระบายอากาศ', 'အမိုးများနှင့် လေဝင်ပေါက်များကို နှင်းကင်းအောင် ရှင်းထားပါ။')
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

/** The guide for a hazard; an official SMHI warning is resolved through its event code. */
export const guideOf = (h: Pick<Hazard, 'type' | 'id'>): GuideId | null =>
	h.type === 'official' ? guideForSmhi(smhiCode(h) ?? '') : (GUIDE_FOR[h.type] ?? null);

/** What to do now: the first three Before items at Watch, the first three During items at Warning. */
export function stepsFor(h: Pick<Hazard, 'type' | 'id'>, level: Lvl): Text[] {
	const id = guideOf(h);
	if (!id || level === 'safe') return [];
	return (level === 'warning' ? GUIDE[id].during : GUIDE[id].before).slice(0, 3);
}

export type BagItem = { id: string; text: Text };
export const KITS = ['flood', 'storm', 'smoke', 'heat', 'earthquake', 'tsunami', 'chemical', 'cold'] as const;
export type KitId = (typeof KITS)[number];

export const BASICS: BagItem[] = [
	{ id: 'water', text: t('Water: 2 litres per person in the bag, more stored at home', 'น้ำดื่ม 2 ลิตรต่อคนในกระเป๋า และสำรองเพิ่มไว้ที่บ้าน', 'သောက်ရေ- အိတ်ထဲတွင် တစ်ဦးလျှင် 2 လီတာ၊ အိမ်တွင် ထပ်ဆောင်း သိုလှောင်ထားရန်') },
	{ id: 'food', text: t('Ready-to-eat food for 3 days', 'อาหารพร้อมกินสำหรับ 3 วัน', 'ချက်ချင်းစားနိုင်သော အစားအစာ 3 ရက်စာ') },
	{ id: 'meds', text: t('Medicine for 7 days and copies of prescriptions', 'ยาประจำตัวสำหรับ 7 วัน และสำเนาใบสั่งยา', 'ဆေးဝါး 7 ရက်စာနှင့် ဆေးစာ မိတ္တူများ') },
	{ id: 'docs', text: t('Copies of ID card, passport and house registration in a waterproof bag', 'สำเนาบัตรประชาชน หนังสือเดินทาง และทะเบียนบ้าน ใส่ถุงกันน้ำ', 'မှတ်ပုံတင်ကတ်၊ နိုင်ငံကူးလက်မှတ်နှင့် အိမ်ထောင်စုစာရင်း မိတ္တူများ (ရေလုံအိတ်ထဲတွင်)') },
	{ id: 'phone', text: t('Phone, charger and a full power bank', 'โทรศัพท์ ที่ชาร์จ และพาวเวอร์แบงก์ที่ชาร์จเต็ม', 'ဖုန်း၊ အားသွင်းကြိုးနှင့် အားပြည့် ပါဝါဘဏ်') },
	{ id: 'torch', text: t('Torch and spare batteries', 'ไฟฉายและถ่านสำรอง', 'လက်နှိပ်ဓာတ်မီးနှင့် အပိုဓာတ်ခဲများ') },
	{ id: 'radio', text: t('Battery or wind-up radio', 'วิทยุแบบใส่ถ่านหรือแบบมือหมุน', 'ဓာတ်ခဲသုံး သို့မဟုတ် လက်လှည့် ရေဒီယို') },
	{ id: 'firstaid', text: t('First-aid kit', 'ชุดปฐมพยาบาล', 'ရှေးဦးသူနာပြုစုရေး ပစ္စည်းအိတ်') },
	{ id: 'cash', text: t('Cash in small notes', 'เงินสดเป็นธนบัตรย่อย', 'တန်ဖိုးနည်း ငွေစက္ကူဖြင့် လက်ငင်းငွေ') },
	{ id: 'clothes', text: t('Change of clothes and a rain jacket', 'เสื้อผ้าสำรองและเสื้อกันฝน', 'အပိုအဝတ်အစားနှင့် မိုးကာအင်္ကျီ') },
	{ id: 'hygiene', text: t('Soap, toothbrush and sanitary items', 'สบู่ แปรงสีฟัน และของใช้สุขอนามัย', 'ဆပ်ပြာ၊ သွားတိုက်တံနှင့် တစ်ကိုယ်ရေသန့်ရှင်းရေး ပစ္စည်းများ') },
	{ id: 'blanket', text: t('Blanket or sleeping mat', 'ผ้าห่มหรือเสื่อนอน', 'စောင် သို့မဟုတ် အိပ်ဖျာ') },
	{ id: 'contacts', text: t('Paper list of family phone numbers', 'รายชื่อเบอร์โทรครอบครัวที่เขียนบนกระดาษ', 'မိသားစု ဖုန်းနံပါတ်များကို စာရွက်ပေါ်တွင် ရေးထားသော စာရင်း') }
];

const I = {
	whistle: { id: 'whistle', text: t('Whistle to call for help', 'นกหวีดสำหรับขอความช่วยเหลือ', 'အကူအညီတောင်းရန် ခရာ (ဝီစီ)') },
	masks: { id: 'masks', text: t('N95 masks', 'หน้ากาก N95', 'N95 နှာခေါင်းစည်းများ') },
	drybags: { id: 'drybags', text: t('Waterproof bags for documents and phone', 'ถุงกันน้ำสำหรับเอกสารและโทรศัพท์', 'စာရွက်စာတမ်းနှင့် ဖုန်းအတွက် ရေလုံအိတ်များ') },
	sheet: { id: 'sheet', text: t('Plastic sheet and strong tape', 'แผ่นพลาสติกและเทปกาวแบบเหนียว', 'ပလတ်စတစ်စနှင့် ခိုင်ခံ့သော တိပ်') },
	shoes: { id: 'shoes', text: t('Sturdy closed shoes', 'รองเท้าหุ้มส้นที่แข็งแรง', 'ခိုင်ခံ့ပြီး ခြေချောင်းလုံသော ဖိနပ်') }
};

export const EXTRAS: Record<KitId, BagItem[]> = {
	flood: [I.drybags, { id: 'boots', text: t('Rubber boots', 'รองเท้าบู๊ตยาง', 'ရော်ဘာ ဘွတ်ဖိနပ်') }, { id: 'rope', text: t('Rope (10 m)', 'เชือก (10 ม.)', 'ကြိုး (10 မီတာ)') }, I.whistle],
	storm: [I.whistle, I.sheet, { id: 'batteries', text: t('Spare batteries', 'ถ่านสำรอง', 'အပိုဓာတ်ခဲများ') }],
	smoke: [I.masks, { id: 'eyedrops', text: t('Eye drops', 'ยาหยอดตา', 'မျက်စဉ်း') }, { id: 'filter', text: t('Spare air-purifier filter', 'แผ่นกรองเครื่องฟอกอากาศสำรอง', 'လေသန့်စက်အတွက် အပို စစ်ထုတ်ကိရိယာ (filter)') }],
	heat: [
		{ id: 'ors', text: t('Oral rehydration salts', 'ผงเกลือแร่', 'ဓာတ်ဆား (ORS)') },
		{ id: 'hat', text: t('Wide-brimmed hat', 'หมวกปีกกว้าง', 'အနားကျယ် ဦးထုပ်') },
		{ id: 'towel', text: t('Cooling towel', 'ผ้าเย็น', 'အအေးပေး လက်ကိုင်ပဝါ') },
		{ id: 'sunscreen', text: t('Sunscreen', 'ครีมกันแดด', 'နေလောင်ကာ ခရင်မ်') }
	],
	earthquake: [I.shoes, { id: 'gloves', text: t('Work gloves', 'ถุงมือทำงาน', 'အလုပ်သုံး လက်အိတ်') }, I.whistle, { id: 'dustmask', text: t('Dust masks', 'หน้ากากกันฝุ่น', 'ဖုန်မှုန့်ကာ နှာခေါင်းစည်းများ') }],
	tsunami: [I.shoes, I.whistle, I.drybags],
	cold: [
		{ id: 'warmlayers', text: t('Warm layers and a windproof jacket', 'เสื้อผ้าหนาอบอุ่นหลายชั้นและเสื้อแจ็คเก็ตกันลม', 'နွေးထွေးသော အထပ်ထပ်ဝတ် အဝတ်များနှင့် လေလုံ ဂျာကင်') },
		{ id: 'hatgloves', text: t('Hat, gloves and scarf', 'หมวก ถุงมือ และผ้าพันคอ', 'ဦးထုပ်၊ လက်အိတ်နှင့် လည်ပင်းပတ်ပုဝါ') },
		{ id: 'powerbank', text: t('Charged power bank', 'พาวเวอร์แบงก์ที่ชาร์จเต็ม', 'အားပြည့် ပါဝါဘဏ်') },
		{ id: 'handwarmers', text: t('Hand warmers', 'แผ่นให้ความร้อนสำหรับมือ', 'လက်နွေးကိရိယာ (hand warmer)') },
		{ id: 'thermos', text: t('Thermos for a hot drink', 'กระติกน้ำร้อนสำหรับเครื่องดื่มอุ่นๆ', 'ပူပူနွေးနွေး သောက်စရာအတွက် ဓာတ်ဘူး') }
	],
	chemical: [
		I.sheet,
		{ id: 'wipes', text: t('Wet wipes', 'ทิชชู่เปียก', 'စိုစွတ်သော တစ်ရှူး') },
		{ id: 'sealedclothes', text: t('Spare clothes in a sealed bag', 'เสื้อผ้าสำรองในถุงปิดสนิท', 'အလုံပိတ်အိတ်ထဲရှိ အပိုအဝတ်များ') }
	]
};

export const KIT_NOTE: Partial<Record<KitId, Text>> = {
	chemical: t(
		'Masks do not stop chemical gases. Stay indoors with windows and doors sealed, or leave upwind if told to evacuate.',
		'หน้ากากกันฝุ่นป้องกันแก๊สสารเคมีไม่ได้ ให้อยู่ในอาคารและปิดประตูหน้าต่างให้สนิท หรืออพยพไปทางเหนือลมเมื่อได้รับแจ้ง',
		'နှာခေါင်းစည်းများက ဓာတုဓာတ်ငွေ့ကို မကာကွယ်နိုင်ပါ။ ပြတင်းပေါက်နှင့် တံခါးများကို အလုံပိတ်ပြီး အိမ်ထဲတွင် နေပါ၊ သို့မဟုတ် ဘေးလွတ်ရာသို့ ရွှေ့ပြောင်းရန် အကြောင်းကြားလျှင် လေညာဘက် (လေတိုက်လာသည့်ဘက်) သို့ ထွက်ခွာပါ။'
	),
	tsunami: t(
		"Keep this bag by the door. If the warning comes, go on foot right away. Don't stop to pack.",
		'วางกระเป๋านี้ไว้ใกล้ประตู เมื่อมีประกาศเตือน ให้เดินเท้าออกทันที อย่าเสียเวลาเก็บของ',
		'ဤအိတ်ကို တံခါးအနီးတွင် ထားပါ။ သတိပေးချက် ထွက်လာလျှင် ခြေလျင် ချက်ချင်း ထွက်ပါ။ ပစ္စည်းထုပ်ပိုးရန် မရပ်ပါနှင့်။'
	)
};

/** Basics first, then the kit's extras; an id already in the basics is not repeated. */
export function bagFor(kit: KitId | null): BagItem[] {
	const seen = new Set<string>();
	return [...BASICS, ...(kit ? EXTRAS[kit] : [])].filter((i) => !seen.has(i.id) && seen.add(i.id));
}

const KIT_FOR_SMHI: Partial<Record<GuideId, KitId>> = { storm: 'storm', snow: 'cold', cold: 'cold', flood: 'flood', heat: 'heat' };
const kitOf = (h: Hazard): KitId | undefined => {
	const g = guideOf(h);
	return h.type === 'official' ? (g ? KIT_FOR_SMHI[g] : undefined) : KIT_FOR[h.type];
};
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
	let best: { h: Hazard; kit: KitId } | null = null;
	for (const h of hazards) {
		const kit = kitOf(h);
		if (h.sample || h.level === 'safe' || !kit) continue;
		if (!best || (h.level === 'warning' && best.h.level !== 'warning')) best = { h, kit };
	}
	return best?.kit ?? null;
}
export { guideForSmhi, smhiCode };
