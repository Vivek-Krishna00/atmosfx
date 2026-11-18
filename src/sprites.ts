import { depthOf, LAYERS, lerp } from './store';
import type { EffectDefinition } from './types';

export interface Sprite {
  img: HTMLCanvasElement;
  /** Half the sprite's side in device px; draw at (x - half, y - half). */
  half: number;
}

/**
 * Bake every (depth layer × color) sprite once at the current DPR, with the layer's
 * opacity baked in, so the frame loop never touches globalAlpha for static effects.
 * Index matches Particles.spr: layer * colors.length + colorIndex.
 * A plain <canvas> (not OffscreenCanvas) so older Safari works too.
 */
export function bakeSprites(
  def: EffectDefinition,
  colors: readonly string[],
  sizeMul: number,
  opacity: number,
  dpr: number,
): Sprite[] {
  const out: Sprite[] = [];
  for (let layer = 0; layer < LAYERS; layer++) {
    const depth = depthOf(layer);
    // Size grows on a curve so far layers stay tiny and only the nearest one gets big.
    const r = lerp(def.size, depth ** 1.5) * sizeMul;
    const alpha = lerp(def.opacity ?? [1, 1], depth) * opacity;
    const half = Math.ceil(r * dpr) + 1;
    for (const color of colors) {
      const img = document.createElement('canvas');
      img.width = img.height = half * 2;
      const g = img.getContext('2d');
      if (g) {
        g.translate(half, half);
        g.scale(dpr, dpr);
        g.fillStyle = g.strokeStyle = color;
        def.draw(g, r, color, depth);
        if (alpha < 1) {
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.globalCompositeOperation = 'destination-in';
          g.fillStyle = `rgba(0,0,0,${alpha})`;
          g.fillRect(0, 0, img.width, img.height);
        }
      }
      out.push({ img, half });
    }
  }
  return out;
}
