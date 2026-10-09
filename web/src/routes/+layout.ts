// ponytail: SPA mode. Every page needs browser APIs (map, geolocation) and the old app was
// client-only too. Turn SSR back on per route if first-paint speed on slow networks matters.
export const ssr = false;
