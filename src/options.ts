import type { EffectDefinition, Options, Quality, Range } from './types';

export type Tier = Exclude<Quality, 'auto'>;

export interface TierSpec {
  maxParticles: number;
  maxDpr: number;
  fps: number;
}

export const TIERS: Record<Tier, TierSpec> = {
  low: { maxParticles: 80, maxDpr: 1, fps: 30 },
  medium: { maxParticles: 160, maxDpr: 1.25, fps: 60 },
  high: { maxParticles: 250, maxDpr: 1.5, fps: 60 },
};

export type Resolved = Required<Omit<Options, 'colors' | 'zIndex' | 'settleOn'>> & {
  colors?: string[];
  zIndex?: number;
  settleOn?: Options['settleOn'];
};

const num = (v: unknown, d: number, lo: number, hi: number): number =>
  typeof v === 'number' && v === v ? Math.min(hi, Math.max(lo, v)) : d;

const QUALITIES: readonly Quality[] = ['auto', 'low', 'medium', 'high'];

export function resolveOptions(o: Options = {}, prev?: Resolved): Resolved {
  const p = prev ?? DEFAULTS;
  if (o.quality !== undefined && !QUALITIES.includes(o.quality)) {
    throw new TypeError(`atmosfx: quality must be one of ${QUALITIES.join(', ')}`);
  }
  if (o.colors !== undefined && (!Array.isArray(o.colors) || o.colors.some((c) => typeof c !== 'string'))) {
    throw new TypeError('atmosfx: colors must be an array of strings');
  }
  return {
    intensity: num(o.intensity, p.intensity, 0, 1),
    speed: num(o.speed, p.speed, 0, 5),
    wind: num(o.wind, p.wind, -1, 1),
    size: num(o.size, p.size, 0.1, 5),
    opacity: num(o.opacity, p.opacity, 0, 1),
    fps: num(o.fps, p.fps, 0, 240),
    quality: o.quality ?? p.quality,
    respectReducedMotion: o.respectReducedMotion ?? p.respectReducedMotion,
    pauseWhenHidden: o.pauseWhenHidden ?? p.pauseWhenHidden,
    interactive: o.interactive ?? p.interactive,
    ground: o.ground ?? p.ground,
    colors: o.colors?.length ? o.colors.slice(0, 5) : p.colors,
    zIndex: o.zIndex ?? p.zIndex,
    settleOn: 'settleOn' in o ? o.settleOn : p.settleOn,
  };
}

const DEFAULTS: Resolved = {
  intensity: 0.5,
  speed: 1,
  wind: 0,
  size: 1,
  opacity: 1,
  fps: 0, // 0 = use the tier default
  quality: 'auto',
  respectReducedMotion: true,
  pauseWhenHidden: true,
  interactive: false,
  ground: true,
};

/** Initial guess for `quality: 'auto'`. Adaptive quality refines it at runtime. */
export function guessTier(): Tier {
  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
  const cores = nav?.hardwareConcurrency ?? 4;
  const mem = nav?.deviceMemory ?? 4;
  if (cores <= 2 || mem <= 2) return 'low';
  if (cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

const isRange = (r: unknown, allowNeg = false, ordered = true): r is Range =>
  Array.isArray(r) &&
  r.length === 2 &&
  r.every((v) => typeof v === 'number' && isFinite(v) && (allowNeg || v >= 0)) &&
  (!ordered || r[0] <= r[1]);

type Check = (v: any) => boolean; // eslint-disable-line @typescript-eslint/no-explicit-any
const isFn: Check = (v) => typeof v === 'function';
const nonNeg: Check = (v) => typeof v === 'number' && v >= 0 && isFinite(v);

/** Every known field and its check; `true` = required. Table-driven to keep the core small. */
const RULES: Record<string, [Check, boolean?]> = {
  draw: [isFn, true],
  colors: [(c) => Array.isArray(c) && c.length > 0 && c.length <= 5 && c.every((x) => typeof x === 'string'), true],
  size: [(r) => isRange(r) && r[0] > 0, true],
  speed: [(r) => isRange(r, true, false), true],
  density: [(v) => nonNeg(v) && v > 0, true],
  drift: [(r) => isRange(r, true)],
  opacity: [(r) => isRange(r, false, false) && Math.max(r[0], r[1]) <= 1],
  sway: [nonNeg],
  spin: [nonNeg],
  gust: [nonNeg],
  twinkle: [nonNeg],
  flutter: [nonNeg],
  box: [(r) => isRange(r, false, false) && r[0] > 0 && r[1] > 0],
  fps: [nonNeg],
  blend: [(v) => typeof v === 'string'],
  windForce: [(v) => typeof v === 'number' && isFinite(v)],
  ground: [isFn],
  overlay: [isFn],
  backdrop: [(v) => typeof v === 'string'],
};

/** Throws a TypeError naming the first invalid field. See EffectDefinition for each field's shape. */
export function validateEffect(name: string, d: EffectDefinition): EffectDefinition {
  if (!d || typeof d !== 'object') throw new TypeError(`atmosfx: effect "${name}" must be an object`);
  for (const k in RULES) {
    const [ok, required] = RULES[k];
    const v = (d as unknown as Record<string, unknown>)[k];
    if ((required || v !== undefined) && !ok(v)) throw new TypeError(`atmosfx: effect "${name}" has invalid "${k}"`);
  }
  return d;
}
