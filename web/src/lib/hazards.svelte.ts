import { api } from './config';
import { assess, keepLast, type Assessment, type Feeds } from './levels';
import { here } from './location.svelte';
import { getGdacs } from './sources/gdacs';
import { getAir, getForecast, getRiver } from './sources/openmeteo';
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
	live.loading = true;
	const [air, forecast, river, gdacs, quakes, disasters, alerts] = await Promise.all([
		settle(getAir(at)),
		settle(getForecast(at)),
		settle(getRiver(at)),
		settle(getGdacs()),
		settle(getQuakes()),
		api.disasters(),
		api.alerts()
	]);
	if (t !== token) return; // the place changed while loading
	const feeds: Feeds = { air, forecast, river, gdacs, quakes, disasters: disasters.data, alerts: alerts.data };
	live.feeds = feeds;
	live.a = keepLast(live.a, assess(feeds, at, Date.now()));
	live.loading = false;
}
