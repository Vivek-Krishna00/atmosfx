import { validateEffect } from './options';
import type { EffectDefinition } from './types';

const registry = new Map<string, EffectDefinition>();
const checked = new WeakSet<EffectDefinition>();

/** Register a custom (or built-in) effect under a name. Throws if the definition is invalid. */
export function registerEffect(name: string, def: EffectDefinition): void {
  if (typeof name !== 'string' || !name) throw new TypeError('atmosfx: effect name must be a non-empty string');
  registry.set(name, validateEffect(name, def));
  checked.add(def);
}

export function resolveEffect(effect: string | EffectDefinition): EffectDefinition {
  if (typeof effect === 'string') {
    const def = registry.get(effect);
    if (!def) throw new Error(`atmosfx: unknown effect "${effect}". Registered: ${[...registry.keys()].join(', ') || 'none'}`);
    return def;
  }
  if (!checked.has(effect)) {
    validateEffect('(inline)', effect);
    checked.add(effect);
  }
  return effect;
}

export const listEffects = (): string[] => [...registry.keys()];
