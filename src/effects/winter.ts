import { bank } from '../ground';
import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

/**
 * A full winter scene: depth-of-field snowfall (tiny crisp far flakes, large out-of-focus
 * near ones), a snow bank that builds up at the bottom with glints, and a frosted vignette.
 * Far and mid flakes land in the bank; the nearest flakes fall in front of it.
 */
export const winter: EffectDefinition = {
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
  ground: bank({ colors: ['#f7faff', '#d3e0f2'], height: 46, grow: 25 }),
  backdrop: 'radial-gradient(ellipse at center, rgba(205,225,255,0) 50%, rgba(205,225,255,0.2) 100%)',
};
