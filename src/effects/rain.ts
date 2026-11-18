import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

/**
 * Motion-blurred rain: far drops are short faint hairlines, near drops are long
 * streaks with a soft halo. Streaks fade from tail to head and slant with the wind.
 */
export const rain: EffectDefinition = {
  draw(g, r, _color, depth) {
    const w = 0.55 + depth * 1.1;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0, -r);
    g.lineTo(0, r);
    g.globalAlpha = 0.22;
    g.lineWidth = w * 2.6; // motion-blur halo
    g.stroke();
    g.globalAlpha = 1;
    g.lineWidth = w;
    g.stroke();
    const grad = g.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, CLEAR);
    grad.addColorStop(0.75, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, '#000');
    mask(g, grad, r);
  },
  colors: ['#b8c8e0', '#d4e0f0'],
  size: [5, 24],
  speed: [420, 1250],
  align: true,
  box: [0.2, 1],
  opacity: [0.15, 0.5],
  density: 3.4,
  windForce: 380,
  gust: 0.15,
};
