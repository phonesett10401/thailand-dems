const reduced =
	typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Animation duration in ms, or 0 when the user asked for reduced motion. */
export const ms = (n: number): number => (reduced ? 0 : n);
