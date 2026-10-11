import { expect, it } from 'vitest';
import { msg } from './i18n';

it('reads app messages and fills params', () => {
	expect(msg('en', 'lvl_warning')).toBe('Warning');
	expect(msg('en', 'line_pm25', { value: 41.2 })).toBe('PM2.5 41.2 µg/m³');
	expect(msg('th', 'lvl_safe')).toBe('ปลอดภัย');
});
it('throws on an unknown key so typos fail loudly', () => {
	expect(() => msg('en', 'no_such_key')).toThrow(/no_such_key/);
});
