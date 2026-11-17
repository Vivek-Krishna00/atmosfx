import { SIZE_BUCKETS } from './store';
import type { EffectDefinition } from './types';

export interface Sprite {
  img: HTMLCanvasElement;
  /** Half the sprite's side in device px; draw at (x - half, y - half). */
  half: number;
}

/**
 * Bake every (size bucket × color) sprite once at the current DPR.
 * Index matches Particles.spr: sizeBucket * colors.length + colorIndex.
 * A plain <canvas> (not OffscreenCanvas) so older Safari works too.
 */
export function bakeSprites(def: EffectDefinition, colors: readonly string[], sizeMul: number, dpr: number): Sprite[] {
  const out: Sprite[] = [];
  const [lo, hi] = def.size;
  for (let s = 0; s < SIZE_BUCKETS; s++) {
    const r = (lo + ((hi - lo) * s) / (SIZE_BUCKETS - 1)) * sizeMul;
    const half = Math.ceil(r * dpr) + 1;
    for (const color of colors) {
      const img = document.createElement('canvas');
      img.width = img.height = half * 2;
      const g = img.getContext('2d');
      if (g) {
        g.translate(half, half);
        g.scale(dpr, dpr);
        g.fillStyle = g.strokeStyle = color;
        def.draw(g, r, color);
      }
      out.push({ img, half });
    }
  }
  return out;
}
