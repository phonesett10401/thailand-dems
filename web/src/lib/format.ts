import { getLocale } from '$lib/paraglide/runtime.js';

type Loc = 'en' | 'th' | 'my';
const TZ = 'Asia/Bangkok';
const tag = (l: Loc) => ({ en: 'en-GB', th: 'th-TH-u-ca-buddhist', my: 'my-MM-u-nu-latn' })[l];
const fmt =
	(opts: Intl.DateTimeFormatOptions) =>
	(d: Date | string, l: Loc = getLocale()) =>
		new Intl.DateTimeFormat(tag(l), { timeZone: TZ, ...opts }).format(new Date(d));

export const fmtTime = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
export const fmtHour = fmt({ hour: '2-digit', hour12: false });
export const fmtDate = fmt({ day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDay = fmt({ weekday: 'short', day: 'numeric' });
export const fmtDateTime = fmt({ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
