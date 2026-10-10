import type { Pt } from './types';
import type { Zone } from './zones';

export type Mode = 'foot' | 'car' | 'bike';
export type RouteReq = { from: Pt; to: Pt; mode: Mode; avoid: Zone[] };
/** `type` is the OpenRouteService instruction code (0 = left … 13 = keep right); `at` indexes `line`. */
export type Step = { type: number; name: string; distance: number; duration: number; at: number };
export type RouteRes = { line: [number, number][]; distance: number; duration: number; steps: Step[]; avoided: boolean };
