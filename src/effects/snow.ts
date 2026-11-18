import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

/**
 * Depth-of-field snow: far flakes are tiny crisp specks, near flakes are large
 * out-of-focus discs. Most flakes live in the far layers, which sells the depth.
 */
export const snow: EffectDefinition = {
  draw(g, r, _color, depth) {
    g.beginPath();
    g.arc(0, 0, r, 0, 6.2832);
    g.fill();
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    if (depth > 0.9) {
      // Nearest layer: an out-of-focus bokeh disc, flat body with a soft edge.
      grad.addColorStop(0, 'rgba(0,0,0,0.55)');
      grad.addColorStop(0.62, 'rgba(0,0,0,0.42)');
      grad.addColorStop(1, CLEAR);
    } else {
      const soft = depth * depth * 1.3;
      grad.addColorStop(0, '#000');
      grad.addColorStop(Math.max(0.12, 0.55 - 0.45 * soft), `rgba(0,0,0,${1 - 0.4 * soft})`);
      grad.addColorStop(1, CLEAR);
    }
    mask(g, grad, r);
  },
  colors: ['#ffffff', '#f1f6ff', '#dce8ff'],
  size: [1, 12],
  speed: [14, 105],
  drift: [-6, 6],
  sway: 22,
  opacity: [0.45, 1],
  density: 3.4,
  windForce: 80,
  gust: 0.35,
};
