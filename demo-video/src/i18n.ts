import en from '../../web/messages/en.json';
import th from '../../web/messages/th.json';

export type Lang = 'en' | 'th';
const ALL: Record<Lang, Record<string, string>> = { en, th };

/** The app's own strings, so the phone screens in the video match the real app. */
export function msg(lang: Lang, key: string, p: Record<string, string | number> = {}) {
	const s = ALL[lang][key];
	if (s === undefined) throw new Error(`missing message ${lang}:${key}`);
	return s.replace(/\{(\w+)\}/g, (_, k: string) => String(p[k] ?? `{${k}}`));
}
