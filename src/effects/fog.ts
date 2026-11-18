import type { EffectDefinition } from '../types';
import { CLEAR } from './shared';

/** Fog: large, very soft banks drifting slowly sideways in layers. Capped at 30 fps; it moves slowly. */
export const fog: EffectDefinition = {
  draw(g, r) {
    // Solid bank squashed wide, then a plateau mask: flat body, long soft edges, no hotspot.
    g.scale(1, 0.4);
    g.fillRect(-r, -r, 2 * r, 2 * r);
    const fall = g.createRadialGradient(0, 0, 0, 0, 0, r);
    fall.addColorStop(0, 'rgba(0,0,0,0.85)');
    fall.addColorStop(0.45, 'rgba(0,0,0,0.7)');
    fall.addColorStop(0.75, 'rgba(0,0,0,0.25)');
    fall.addColorStop(1, CLEAR);
    g.globalCompositeOperation = 'destination-in';
    g.fillStyle = fall;
    g.fillRect(-r, -r, 2 * r, 2 * r);
  },
  colors: ['#ffffff', '#e6edf5'],
  size: [180, 380],
  speed: [0, 0],
  drift: [6, 22],
  sway: 4,
  opacity: [0.12, 0.2],
  density: 0.2,
  windForce: 30,
  gust: 0.3,
  box: [1, 0.42],
  fps: 30,
};
