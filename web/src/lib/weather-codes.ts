export type WeatherKey = 'clear' | 'mainly_clear' | 'overcast' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder';

/** WMO weather interpretation codes, as used by Open-Meteo. */
export function weatherKey(code: number): WeatherKey {
	if (code === 0) return 'clear';
	if (code === 1 || code === 2) return 'mainly_clear';
	if (code === 45 || code === 48) return 'fog';
	if (code >= 51 && code <= 57) return 'drizzle';
	if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
	if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
	if (code >= 95 && code <= 99) return 'thunder';
	return 'overcast';
}
