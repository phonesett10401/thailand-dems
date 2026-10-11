import { T } from './levels';
import { m } from './paraglide/messages.js';

/** Human-readable threshold lines, shared by About and Demo. */
export const thresholdRows = () => [
	m.about_row_pm25({ w: T.pm25[0], x: T.pm25[1] }),
	m.about_row_heat({ w: T.heat[0], x: T.heat[1] }),
	m.about_row_rain({ w: T.rain[0], x: T.rain[1] }),
	m.about_row_quake({ km: T.quakeKm, w: T.quake[0], x: T.quake[1] }),
	m.about_row_gdacs({ km: T.gdacsKm, ckm: T.cycloneKm }),
	m.about_row_river(),
	m.about_row_sample()
];
