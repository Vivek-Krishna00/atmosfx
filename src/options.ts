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

export type Resolved = Required<Omit<Options, 'colors' | 'zIndex'>> & {
  colors?: string[];
  zIndex?: number;
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
    colors: o.colors?.length ? o.colors.slice(0, 5) : p.colors,
    zIndex: o.zIndex ?? p.zIndex,
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

export function validateEffect(name: string, d: EffectDefinition): EffectDefinition {
  const fail = (msg: string): never => {
    throw new TypeError(`atmosfx: effect "${name}" ${msg}`);
  };
  if (!d || typeof d !== 'object') fail('must be an object');
  if (typeof d.draw !== 'function') fail('needs a draw(ctx, r, color) function');
  if (!Array.isArray(d.colors) || !d.colors.length || d.colors.length > 5 || d.colors.some((c) => typeof c !== 'string'))
    fail('needs 1-5 colors');
  if (!isRange(d.size) || d.size[0] <= 0) fail('size must be [min, max] with min > 0');
  if (!isRange(d.speed, true)) fail('speed must be [min, max]');
  if (d.drift !== undefined && !isRange(d.drift, true)) fail('drift must be [min, max]');
  if (d.opacity !== undefined && (!isRange(d.opacity, false, false) || Math.max(...d.opacity) > 1))
    fail('opacity must be [far, near] within 0..1');
  if (!(typeof d.density === 'number' && d.density > 0 && isFinite(d.density))) fail('density must be a positive number');
  if (d.gust !== undefined && !(typeof d.gust === 'number' && d.gust >= 0)) fail('gust must be >= 0');
  if (d.overlay !== undefined && typeof d.overlay !== 'function') fail('overlay must be a function');
  return d;
}
