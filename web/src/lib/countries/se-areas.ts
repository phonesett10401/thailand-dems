import { getLocale } from '$lib/paraglide/runtime.js';
import type { Names } from './index';

/** SMHI warning areas (metadata/area.json) by id: the 21 counties and the sea districts 41–58. */
export const SE_AREAS: Record<number, Names> = {
	1: { en: 'Stockholm County', th: 'เทศมณฑลสตอกโฮล์ม', my: 'စတော့ဟုမ်းခရိုင်' },
	3: { en: 'Uppsala County', th: 'เทศมณฑลอุปซอลา', my: 'ဥပ္ပဆာလာခရိုင်' },
	4: { en: 'Södermanland County', th: 'เทศมณฑลเซอเดอร์มันลันด์', my: 'ဆိုဒါမန်လန်ခရိုင်' },
	5: { en: 'Östergötland County', th: 'เทศมณฑลเอิสเตอร์เยิตลันด์', my: 'အိုစတာယော့တလန်ခရိုင်' },
	6: { en: 'Jönköping County', th: 'เทศมณฑลเยินเชอปิง', my: 'ယွန်ချော့ပင်ခရိုင်' },
	7: { en: 'Kronoberg County', th: 'เทศมณฑลโครโนแบร์ย', my: 'ခရိုနိုဘယ်ရီခရိုင်' },
	8: { en: 'Kalmar County', th: 'เทศมณฑลคาลมาร์', my: 'ကာလ်မာခရိုင်' },
	9: { en: 'Gotland County', th: 'เทศมณฑลกอตลันด์', my: 'ဂေါ့တလန်ခရိုင်' },
	10: { en: 'Blekinge County', th: 'เทศมณฑลเบลคิงเง', my: 'ဘလက်ကင်းဂျခရိုင်' },
	12: { en: 'Skåne County', th: 'เทศมณฑลสโกเน', my: 'စကိုးနဲခရိုင်' },
	13: { en: 'Halland County', th: 'เทศมณฑลฮัลลันด์', my: 'ဟာလန်ခရိုင်' },
	14: { en: 'Västra Götaland County', th: 'เทศมณฑลเวสตราเยอตาลันด์', my: 'ဗက်စတြာယော့တလန်ခရိုင်' },
	17: { en: 'Värmland County', th: 'เทศมณฑลแวร์มลันด์', my: 'ဗာမလန်ခရိုင်' },
	18: { en: 'Örebro County', th: 'เทศมณฑลเออเรบรู', my: 'အိုရီဘရိုခရိုင်' },
	19: { en: 'Västmanland County', th: 'เทศมณฑลเวสต์มันลันด์', my: 'ဗက်စမန်လန်ခရိုင်' },
	20: { en: 'Dalarna County', th: 'เทศมณฑลดาลาร์นา', my: 'ဒါလာနာခရိုင်' },
	21: { en: 'Gävleborg County', th: 'เทศมณฑลแยฟเลบอร์ย', my: 'ယက်ဗလဲဘော့ခရိုင်' },
	22: { en: 'Västernorrland County', th: 'เทศมณฑลเวสเตอร์นอร์ลันด์', my: 'ဗက်စတာနော့လန်ခရိုင်' },
	23: { en: 'Jämtland County', th: 'เทศมณฑลแยมต์ลันด์', my: 'ယမ့်တလန်ခရိုင်' },
	24: { en: 'Västerbotten County', th: 'เทศมณฑลเวสเตอร์บ็อตเทน', my: 'ဗက်စတာဘော့တန်ခရိုင်' },
	25: { en: 'Norrbotten County', th: 'เทศมณฑลนอร์บ็อตเทน', my: 'နော့ဘော့တန်ခရိုင်' },
	41: { en: 'Bay of Bothnia', th: 'อ่าวบอทเนีย', my: 'ဘော့သနီးယား ပင်လယ်အော်' },
	42: { en: 'The Quark', th: 'ช่องแคบควาร์เกน', my: 'ကွာ့ကင် ရေလက်ကြား' },
	43: { en: 'Northern Sea of Bothnia', th: 'ทะเลบอทเนียตอนเหนือ', my: 'ဘော့သနီးယားပင်လယ် မြောက်ပိုင်း' },
	44: { en: 'Southern Sea of Bothnia', th: 'ทะเลบอทเนียตอนใต้', my: 'ဘော့သနီးယားပင်လယ် တောင်ပိုင်း' },
	45: { en: 'Sea of Åland', th: 'ทะเลโอลันด์', my: 'အိုလန်ပင်လယ်' },
	46: { en: 'Archipelago Sea', th: 'ทะเลหมู่เกาะ', my: 'ကျွန်းစုပင်လယ်' },
	47: { en: 'Gulf of Finland', th: 'อ่าวฟินแลนด์', my: 'ဖင်လန် ပင်လယ်အော်' },
	48: { en: 'Northern Baltic', th: 'ทะเลบอลติกตอนเหนือ', my: 'ဘော်လတစ်ပင်လယ် မြောက်ပိုင်း' },
	49: { en: 'Central Baltic', th: 'ทะเลบอลติกตอนกลาง', my: 'ဘော်လတစ်ပင်လယ် အလယ်ပိုင်း' },
	50: { en: 'Gulf of Riga', th: 'อ่าวริกา', my: 'ရီဂါ ပင်လယ်အော်' },
	51: { en: 'Southeastern Baltic', th: 'ทะเลบอลติกตะวันออกเฉียงใต้', my: 'ဘော်လတစ်ပင်လယ် အရှေ့တောင်ပိုင်း' },
	52: { en: 'Southern Baltic', th: 'ทะเลบอลติกตอนใต้', my: 'ဘော်လတစ်ပင်လယ် တောင်ပိုင်း' },
	53: { en: 'Western Baltic', th: 'ทะเลบอลติกตะวันตก', my: 'ဘော်လတစ်ပင်လယ် အနောက်ပိုင်း' },
	54: { en: 'The Belts', th: 'ช่องแคบเบลต์', my: 'ဘဲလ့် ရေလက်ကြားများ' },
	55: { en: 'The Sound', th: 'ช่องแคบเออเรซุนด์', my: 'အိုရီဆွန်း ရေလက်ကြား' },
	56: { en: 'Kattegat', th: 'ช่องแคบคัตเตกัต', my: 'ကတ်တီဂတ် ရေလက်ကြား' },
	57: { en: 'Skagerrak', th: 'ช่องแคบสกาเกอร์รัก', my: 'စကာဂရက် ရေလက်ကြား' },
	58: { en: 'Lake Vänern', th: 'ทะเลสาบแวเนิร์น', my: 'ဗန်နန်ကန်' }
};

/** An SMHI area in the reader's language; SMHI's English name when the id is unknown. */
export const areaName = (id: number | undefined, en: string): string => (id === undefined ? undefined : SE_AREAS[id]?.[getLocale()]) ?? en;
