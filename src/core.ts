import { Instance } from './instance';
import type { EffectDefinition, EffectHandle, Options, Stats } from './types';

export { registerEffect, listEffects } from './registry';
export { snow } from './effects/snow';
export { rain } from './effects/rain';
export { winter } from './effects/winter';
export { cherryBlossom } from './effects/cherry-blossom';
export { autumn } from './effects/autumn';
export { summer } from './effects/summer';
export { confetti } from './effects/confetti';
export { stars } from './effects/stars';
export { fog } from './effects/fog';
export { thunderstorm } from './effects/thunderstorm';
export { bank } from './ground';
export { schedulerState } from './scheduler';
export type { EffectDefinition, EffectHandle, GroundLayer, GroundSpec, Options, Quality, Range, Stats } from './types';

export type Target = 'page' | Element | string;

const NOOP_STATS: Stats = { fps: 0, particles: 0, quality: 'low', level: 0, dpr: 1, running: false };
const nothing = () => {};
/** Handle returned on the server (no DOM) or when Effects.auto() maps the month to no effect. */
const noop = (): EffectHandle => ({
  update: nothing,
  pause: nothing,
  resume: nothing,
  switch: nothing,
  destroy: nothing,
  stats: () => NOOP_STATS,
});

export interface AutoConfig {
  /** Effect per month (0 = January). Missing months fall back to the default season map. Use null for "no effect". */
  months?: Partial<Record<number, string | EffectDefinition | null>>;
  /** Flips the default seasons by six months. Default 'north'. */
  hemisphere?: 'north' | 'south';
  /** Override "now" (testing, previews). */
  date?: Date;
}

/** Default season per month, northern hemisphere. */
const SEASONS = ['winter', 'winter', 'cherry-blossom', 'cherry-blossom', 'cherry-blossom', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];

/** Effect for a month under the given config, or null for none. */
export function seasonFor(cfg: AutoConfig = {}): string | EffectDefinition | null {
  const m = (cfg.date ?? new Date()).getMonth();
  if (cfg.months && m in cfg.months) return cfg.months[m] ?? null;
  return SEASONS[cfg.hemisphere === 'south' ? (m + 6) % 12 : m];
}

export const Effects = {
  /**
   * Run an effect over the whole page (`'page'`) or inside an element (Element or CSS selector).
   * Safe to call on the server: returns a no-op handle when there is no DOM.
   */
  mount(target: Target, effect: string | EffectDefinition, options?: Options): EffectHandle {
    if (typeof document === 'undefined') return noop();
    const el = target === 'page' ? 'page' : typeof target === 'string' ? document.querySelector(target) : target;
    if (!el || (el !== 'page' && !(el instanceof HTMLElement))) {
      throw new TypeError(`atmosfx: mount target not found: ${String(target)}`);
    }
    return new Instance(el, effect, options);
  },

  /**
   * Mount the effect for the current month: winter (Dec-Feb), cherry-blossom (Mar-May),
   * summer (Jun-Aug), autumn (Sep-Nov). Override any month with `cfg.months`.
   * Returns a no-op handle when the month maps to null.
   */
  auto(target: Target = 'page', options?: Options, cfg?: AutoConfig): EffectHandle {
    const effect = seasonFor(cfg);
    return effect ? Effects.mount(target, effect, options) : noop();
  },
};
