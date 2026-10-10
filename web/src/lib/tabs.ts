import { BookOpenCheck, Ellipsis, Map as MapIcon, Radio, Tent } from '@lucide/svelte';
import { m } from './paraglide/messages.js';
import type { IconComponent } from './types';

export const TABS: { path: string; label: () => string; icon: IconComponent }[] = [
	{ path: '/', label: m.nav_now, icon: Radio },
	{ path: '/map', label: m.nav_map, icon: MapIcon },
	{ path: '/shelters', label: m.nav_shelters, icon: Tent },
	{ path: '/prepare', label: m.nav_prepare, icon: BookOpenCheck },
	{ path: '/more', label: m.nav_more, icon: Ellipsis }
];

export const activeTab = (current: string, path: string) => (path === '/' ? current === '/' : current.startsWith(path));
