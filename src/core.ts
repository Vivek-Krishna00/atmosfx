import { Instance } from './instance';
import type { EffectDefinition, EffectHandle, Options, Stats } from './types';

export { registerEffect, listEffects } from './registry';
export { snow } from './effects/snow';
export { rain } from './effects/rain';
export { winter } from './effects/winter';
export { schedulerState } from './scheduler';
export type { EffectDefinition, EffectHandle, Options, Quality, Range, Stats } from './types';

export type Target = 'page' | Element | string;

const NOOP_STATS: Stats = { fps: 0, particles: 0, quality: 'low', level: 0, dpr: 1, running: false };
const noop = (): EffectHandle => ({
  update() {},
  pause() {},
  resume() {},
  switch() {},
  destroy() {},
  stats: () => NOOP_STATS,
});

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
};
