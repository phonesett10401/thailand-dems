import type { Country } from './index';

export const mm: Country = {
	code: 'MM',
	flag: '🇲🇲',
	timeZone: 'Asia/Yangon',
	view: { lat: 19.75, lon: 96.1, zoom: 5 },
	defaultPlace: { name: 'Yangon', lat: 16.8409, lon: 96.1735 },
	places: [
		{ name: 'Ayeyarwady Region', lat: 16.7792, lon: 94.7325 },
		{ name: 'Bago Region', lat: 17.3352, lon: 96.4813 },
		{ name: 'Chin State', lat: 22.6436, lon: 93.6053 },
		{ name: 'Kachin State', lat: 25.3833, lon: 97.3964 },
		{ name: 'Kayah State', lat: 19.674, lon: 97.2093 },
		{ name: 'Kayin State', lat: 16.8892, lon: 97.6339 },
		{ name: 'Magway Region', lat: 20.1497, lon: 94.9325 },
		{ name: 'Mandalay Region', lat: 21.9588, lon: 96.0891 },
		{ name: 'Mon State', lat: 16.4905, lon: 97.6283 },
		{ name: 'Naypyidaw Union Territory', lat: 19.7633, lon: 96.0785 },
		{ name: 'Rakhine State', lat: 20.1462, lon: 92.8983 },
		{ name: 'Sagaing Region', lat: 22.1083, lon: 95.1358 },
		{ name: 'Shan State', lat: 20.7892, lon: 97.0378 },
		{ name: 'Tanintharyi Region', lat: 14.0833, lon: 98.1944 },
		{ name: 'Yangon Region', lat: 16.8409, lon: 96.1735 }
	],
	sos: '199',
	numbers: [
		{ tel: '199', key: 'mm_199' },
		{ tel: '192', key: 'mm_192' },
		{ tel: '191', key: 'mm_191' }
	],
	guide: { medical: '192', fire: '191', police: '199', disaster: '199', officials: { en: 'the Department of Disaster Management and the Department of Meteorology and Hydrology', th: 'กรมการจัดการภัยพิบัติและกรมอุตุนิยมวิทยาและอุทกวิทยา', my: 'ဘေးအန္တရာယ်စီမံခန့်ခွဲမှုဦးစီးဌာနနှင့် မိုးလေဝသနှင့် ဇလဗေဒညွှန်ကြားမှုဦးစီးဌာန' } },
	air: 'who-it',
	weather: 'dems',
	shelters: 'in-development'
};
