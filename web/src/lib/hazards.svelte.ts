import { api } from './config';
import { assess, keepLast, shown, type Assessment, type Feeds, type Overall } from './levels';
import { country, currentCountry } from './country.svelte';
import { smhiAreaFor } from './countries/se';
import { here } from './location.svelte';
import { getGdacs } from './sources/gdacs';
import { getAir, getForecast, getRiver } from './sources/openmeteo';
import { getSmhi } from './sources/smhi';
import { getQuakes } from './sources/usgs';

/** One shared view of the hazards around `here.place`, used by the shell (logo, favicon) and the screens. */
export const live = $state<{ a: Assessment | null; feeds: Feeds | null; loading: boolean }>({
	a: null,
	feeds: null,
	loading: false
});

const settle = <T>(p: Promise<T>): Promise<T | undefined> => p.then((v) => v, () => undefined);
let token = 0;

export async function refresh(): Promise<void> {
	const t = ++token;
	const at = { lat: here.place.lat, lon: here.place.lon };
	const c = currentCountry(); // read before the first await, so the effect tracks the country too
	const sweden = country.code === 'SE';
	live.loading = true;
	const [air, forecast, river, gdacs, quakes, smhi, disasters, alerts] = await Promise.all([
		settle(getAir(at)),
		settle(getForecast(at)),
		settle(getRiver(at)),
		settle(getGdacs()),
		settle(getQuakes()),
		settle(sweden ? getSmhi() : Promise.resolve(undefined)),
		api.disasters(),
		api.alerts()
	]);
	if (t !== token) return; // the place changed while loading
	const feeds: Feeds = { air, forecast, river, gdacs, quakes, smhi, disasters: disasters.data, alerts: alerts.data };
	live.feeds = feeds;
	live.a = keepLast(live.a, assess(feeds, at, Date.now(), c, sweden ? smhiAreaFor(at) : undefined));
	live.loading = false;
}

/** Ticks once a minute (Shell drives it) so stale data turns Unknown without a reload. */
export const clock = $state({ now: Date.now() });
export const currentLevel = (): Overall => (live.a ? shown(live.a, clock.now) : 'unknown');
