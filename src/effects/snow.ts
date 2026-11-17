import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

export const snow: EffectDefinition = {
  draw(g, r) {
    g.beginPath();
    g.arc(0, 0, r, 0, 6.2832);
    g.fill();
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.45, '#000');
    grad.addColorStop(1, CLEAR);
    mask(g, grad, r);
  },
  colors: ['#ffffff', '#eef5ff', '#d6e6ff'],
  size: [1.6, 4.6],
  speed: [28, 75],
  drift: [-8, 8],
  sway: 18,
  opacity: [0.55, 0.95],
  density: 1.6,
  windForce: 90,
};
