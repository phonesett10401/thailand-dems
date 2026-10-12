import provinces from '$lib/sample/provinces.json';
import type { Country } from './index';

export const th: Country = {
	code: 'TH',
	flag: '🇹🇭',
	view: { lat: 13.7563, lon: 100.5018, zoom: 6 },
	defaultPlace: { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
	places: (provinces as { Province: string; Latitude: string; Longitude: string }[]).map((p) => ({
		name: p.Province,
		lat: Number(p.Latitude),
		lon: Number(p.Longitude)
	})),
	sos: '1784',
	numbers: [
		{ tel: '1784', key: '1784' },
		{ tel: '1669', key: '1669' },
		{ tel: '191', key: '191' },
		{ tel: '199', key: '199' },
		{ tel: '1155', key: '1155' },
		{ tel: '1182', key: '1182' }
	],
	guide: { medical: '1669', fire: '199', police: '191', disaster: '1784', officials: { en: 'TMD and DDPM', th: 'กรมอุตุนิยมวิทยาและ ปภ.', my: 'ထိုင်းမိုးလေဝသဌာန (TMD) နှင့် ထိုင်း ဘေးအန္တရာယ်ကာကွယ်ရေးဌာန (DDPM)' } },
	air: 'thai-pcd',
	weather: 'dems',
	shelters: 'sample'
};
