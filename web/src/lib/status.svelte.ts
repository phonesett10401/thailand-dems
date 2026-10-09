/** Set once any backend call falls back to sample data; drives the page-wide offline banner. */
export const status = $state({ offline: false });

export function markOffline(): void {
	status.offline = true;
}
