// One-off: OpenStreetMap (© OpenStreetMap contributors, ODbL) via Overpass → src/bangkok.ts
// Real streets around Hua Lamphong → National Stadium, a walking route that detours around a danger zone.
import { writeFileSync, statSync } from 'node:fs';
import { geoMercator } from 'd3-geo';

const BBOX = [13.727, 100.508, 13.757, 100.544]; // S, W, N, E (padded so streets fill the whole map)
const HOSTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const START_LL = [13.7383, 100.5170]; // Hua Lamphong station
const SHELTER_LL = [13.7466, 100.5290]; // National Stadium
const ZONE_LL = [13.7435, 100.5230], ZONE_R = 500; // metres
const W = 390, H = 700, EPS = 1.5; // canvas px, simplification step
const MAJOR = new Set(['primary', 'trunk', 'secondary', 'primary_link', 'secondary_link']);

const bb = BBOX.join(',');
const query = `[out:json][timeout:60];(way["highway"~"^(primary|secondary|tertiary|trunk|residential|unclassified|primary_link|secondary_link|tertiary_link)$"](${bb});way["waterway"~"^(canal|river)$"](${bb}););out geom;`;

async function fetchOsm() {
	let err;
	for (const host of HOSTS) {
		try {
			const r = await fetch(host, {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', 'user-agent': 'dems-demo-video/1.0 (one-off map generator)' },
				body: 'data=' + encodeURIComponent(query)
			});
			if (!r.ok) throw new Error(`${host} -> HTTP ${r.status}`);
			return (await r.json()).elements;
		} catch (e) { err = e; console.error('Overpass failed:', e.message); }
	}
	throw new Error('BLOCKED: Overpass unreachable: ' + err.message);
}

const rad = (d) => (d * Math.PI) / 180;
const hav = ([la1, lo1], [la2, lo2]) => {
	const a = Math.sin(rad(la2 - la1) / 2) ** 2 + Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(rad(lo2 - lo1) / 2) ** 2;
	return 12742000 * Math.asin(Math.sqrt(a));
};
const bearing = ([la1, lo1], [la2, lo2]) => {
	const y = Math.sin(rad(lo2 - lo1)) * Math.cos(rad(la2));
	const x = Math.cos(rad(la1)) * Math.sin(rad(la2)) - Math.sin(rad(la1)) * Math.cos(rad(la2)) * Math.cos(rad(lo2 - lo1));
	return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};
const r6 = (n) => Math.round(n * 1e6) / 1e6;

const els = await fetchOsm();
const hw = els.filter((e) => e.type === 'way' && e.tags?.highway && e.geometry);
const ww = els.filter((e) => e.type === 'way' && e.tags?.waterway && e.geometry);
console.log(`ways: ${hw.length} highway, ${ww.length} waterway`);

// graph
const ids = new Map(), pts = [], adj = [];
const nid = (ll) => {
	const k = ll.join(',');
	if (!ids.has(k)) { ids.set(k, pts.length); pts.push(ll); adj.push([]); }
	return ids.get(k);
};
for (const w of hw) {
	// name:en preferred, then the Thai name; '' when the way has neither
	const name = w.tags['name:en'] || w.tags.name || '';
	const g = w.geometry.map((p) => [r6(p.lat), r6(p.lon)]);
	for (let i = 1; i < g.length; i++) {
		const a = nid(g[i - 1]), b = nid(g[i]);
		if (a === b) continue;
		const len = hav(g[i - 1], g[i]);
		adj[a].push({ to: b, len, name });
		adj[b].push({ to: a, len, name });
	}
}
// largest connected component, so start/shelter never snap to an island
const comp = new Int32Array(pts.length).fill(-1);
const sizes = [];
for (let s = 0; s < pts.length; s++) {
	if (comp[s] >= 0) continue;
	let n = 0; const st = [s]; comp[s] = sizes.length;
	while (st.length) { const u = st.pop(); n++; for (const e of adj[u]) if (comp[e.to] < 0) { comp[e.to] = sizes.length; st.push(e.to); } }
	sizes.push(n);
}
const main = sizes.indexOf(Math.max(...sizes));
const nearest = (ll) => {
	let best = -1, bd = Infinity;
	pts.forEach((p, i) => { if (comp[i] !== main) return; const d = hav(p, ll); if (d < bd) { bd = d; best = i; } });
	return best;
};
const inZone = (ll) => hav(ll, ZONE_LL) < ZONE_R;
const S = nearest(START_LL), T = nearest(SHELTER_LL);

function dijkstra(blocked) {
	const dist = new Float64Array(pts.length).fill(Infinity), prev = new Int32Array(pts.length).fill(-1), done = new Uint8Array(pts.length);
	dist[S] = 0;
	for (;;) { // ponytail: O(n²) scan, fine for ~10k nodes; use a heap if the bbox grows
		let u = -1, bd = Infinity;
		for (let i = 0; i < pts.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
		if (u < 0 || u === T) break;
		done[u] = 1;
		for (const e of adj[u]) {
			if (blocked(e.to)) continue;
			const nd = dist[u] + e.len;
			if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; }
		}
	}
	if (!isFinite(dist[T])) throw new Error('no path');
	const path = [];
	for (let v = T; v >= 0; v = prev[v]) path.unshift(v);
	return { path, len: dist[T] };
}
const free = dijkstra(() => false);
const route = dijkstra((v) => inZone(pts[v]));
const freeThrough = free.path.some((v) => inZone(pts[v]));
console.log(`unrestricted: ${(free.len / 1000).toFixed(2)} km, through zone: ${freeThrough}`);
console.log(`detour:       ${(route.len / 1000).toFixed(2)} km`);
if (!freeThrough) throw new Error('unrestricted path misses the zone; retune ZONE');
if (inZone(pts[S]) || inZone(pts[T])) throw new Error('start/shelter inside zone');

// the straight line start→shelter must cross the zone (sampled)
let straightHits = false;
for (let i = 0; i <= 200; i++) {
	const t = i / 200;
	if (inZone([START_LL[0] + (SHELTER_LL[0] - START_LL[0]) * t, START_LL[1] + (SHELTER_LL[1] - START_LL[1]) * t])) straightHits = true;
}
if (!straightHits) throw new Error('straight line misses the zone');

// turn: first street-name change with a >30° bearing change, measured over ~30 m either side
// trim hooks: start at the last vertex within 45 m of the start, end at the first within 45 m of the shelter
{
	const near = (v, ll) => hav(pts[v], ll) < 45;
	const a = route.path.findLastIndex((v, i) => i < route.path.length / 2 && near(v, START_LL));
	let path = route.path.slice(Math.max(a, 0));
	const b = path.findIndex((v) => hav(pts[v], pts[path.at(-1)]) < 45); // first approach within 45 m of the snapped shelter node
	if (b > 0) path = path.slice(0, b + 1);
	route.path = path;
}
const rp = route.path.map((v) => pts[v]);
const cum = [0];
for (let i = 1; i < rp.length; i++) cum.push(cum[i - 1] + hav(rp[i - 1], rp[i]));
route.len = cum.at(-1);
console.log(`trimmed:      ${(route.len / 1000).toFixed(2)} km`);
const edgeName = (a, b) => adj[route.path[a]].find((e) => e.to === route.path[b])?.name ?? '';
const along = (d) => { // point on the route at distance d
	let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
	const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
	return [rp[i - 1][0] + (rp[i][0] - rp[i - 1][0]) * t, rp[i - 1][1] + (rp[i][1] - rp[i - 1][1]) * t];
};
let TURN = null;
for (let i = 1; i < rp.length - 1 && !TURN; i++) {
	if (cum[i] < 80) continue; // not in the first few steps
	const n1 = edgeName(i, i + 1);
	if (edgeName(i - 1, i) === n1) continue;
	const b0 = bearing(along(Math.max(0, cum[i] - 30)), rp[i]), b1 = bearing(rp[i], along(Math.min(cum.at(-1), cum[i] + 30)));
	const d = ((b1 - b0 + 540) % 360) - 180;
	if (Math.abs(d) <= 30) continue;
	TURN = { text: `Turn ${d < 0 ? 'left' : 'right'}${n1 ? ' onto ' + n1 : ''}`, at: Math.round((cum[i] / cum.at(-1)) * 100) / 100 };
}
if (!TURN) throw new Error('no turn found');
console.log('turn:', JSON.stringify(TURN));

// projection fitted to the route + the zone circle, leaving the bottom free for the card
const circle = Array.from({ length: 36 }, (_, i) => {
	const a = (i / 36) * 2 * Math.PI;
	return [ZONE_LL[1] + (ZONE_R * Math.sin(a)) / (111320 * Math.cos(rad(ZONE_LL[0]))), ZONE_LL[0] + (ZONE_R * Math.cos(a)) / 110574];
});
const fitGeo = { type: 'MultiPoint', coordinates: [...rp.map(([la, lo]) => [lo, la]), ...circle] };
const proj = geoMercator().fitExtent([[34, 96], [W - 34, 500]], fitGeo);
const px = ([la, lo]) => proj([lo, la]);
const f1 = (n) => Math.round(n * 10) / 10;

const inView = ([x, y]) => x > -30 && x < W + 30 && y > -30 && y < H + 30;
function pathOf(ways, eps) {
	let d = '';
	for (const w of ways) {
		const p = w.geometry.map((q) => px([q.lat, q.lon]));
		let run = [], last = null;
		const flush = () => {
			if (run.length > 1) d += 'M' + run.map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L');
			run = []; last = null;
		};
		for (let i = 0; i < p.length; i++) {
			if (!inView(p[i]) && !(i > 0 && inView(p[i - 1]))) { flush(); continue; }
			const end = i === p.length - 1;
			if (last && !end && Math.hypot(p[i][0] - last[0], p[i][1] - last[1]) < eps) continue;
			run.push(p[i]); last = p[i];
		}
		flush();
	}
	return d;
}
const ROADS_MAJOR = pathOf(hw.filter((w) => MAJOR.has(w.tags.highway)), EPS);
const ROADS_MINOR = pathOf(hw.filter((w) => !MAJOR.has(w.tags.highway)), EPS);
const WATER = pathOf(ww, EPS);
// Douglas-Peucker, 6 px: removes sawtooth along residential sois
function dp(p, tol) {
	if (p.length < 3) return p;
	const [a, b] = [p[0], p.at(-1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
	let m = 0, k = 0;
	for (let i = 1; i < p.length - 1; i++) {
		const d = Math.abs((b[0] - a[0]) * (a[1] - p[i][1]) - (a[0] - p[i][0]) * (b[1] - a[1])) / L;
		if (d > m) { m = d; k = i; }
	}
	return m > tol ? [...dp(p.slice(0, k + 1), tol).slice(0, -1), ...dp(p.slice(k), tol)] : [a, b];
}
const ROUTE = 'M' + dp(rp.map((ll) => px(ll)), 6).map(([x, y]) => `${f1(x)} ${f1(y)}`).join('L');
const [zx, zy] = px(ZONE_LL);
const zr = f1(Math.abs(px([ZONE_LL[0], ZONE_LL[1] + ZONE_R / (111320 * Math.cos(rad(ZONE_LL[0])))])[0] - zx));
const START = px(rp[0]).map(f1), SHELTER = px(rp.at(-1)).map(f1);
const ROUTE_KM = Math.round(route.len / 100) / 10;
const ROUTE_MIN = Math.round((route.len / 1000 / 5) * 60);
const STRAIGHT_KM = Math.round(hav(START_LL, SHELTER_LL) / 100) / 10;

const out =
	`// Generated by scripts/make-bangkok.mjs from OpenStreetMap data (© OpenStreetMap contributors, ODbL) via Overpass. Do not edit.\n` +
	`export const ROADS_MAJOR = ${JSON.stringify(ROADS_MAJOR)};\n` +
	`export const ROADS_MINOR = ${JSON.stringify(ROADS_MINOR)};\n` +
	`export const WATER = ${JSON.stringify(WATER)};\n` +
	`export const ROUTE = ${JSON.stringify(ROUTE)};\n` +
	`export const ZONE = ${JSON.stringify({ cx: f1(zx), cy: f1(zy), r: zr })};\n` +
	`export const START: [number, number] = ${JSON.stringify(START)};\n` +
	`export const SHELTER: [number, number] = ${JSON.stringify(SHELTER)};\n` +
	`export const ROUTE_KM = ${ROUTE_KM};\n` +
	`export const ROUTE_MIN = ${ROUTE_MIN};\n` +
	`export const STRAIGHT_KM = ${STRAIGHT_KM};\n` +
	`export const TURN = ${JSON.stringify(TURN)};\n`;
const file = new URL('../src/bangkok.ts', import.meta.url);
writeFileSync(file, out);
console.log(`route ${ROUTE_KM} km / ${ROUTE_MIN} min walking, straight ${STRAIGHT_KM} km, zone r=${zr}px`);
console.log(`major ${ROADS_MAJOR.length}, minor ${ROADS_MINOR.length}, water ${WATER.length}, route ${ROUTE.length} chars`);
console.log(`wrote src/bangkok.ts ${(statSync(file).size / 1024).toFixed(1)} KB`);
