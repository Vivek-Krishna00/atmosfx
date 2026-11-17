import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

export const rain: EffectDefinition = {
  draw(g, r) {
    g.lineWidth = Math.max(0.9, r * 0.085);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(0, -r);
    g.lineTo(0, r);
    g.stroke();
    const grad = g.createLinearGradient(0, -r, 0, r);
    grad.addColorStop(0, CLEAR);
    grad.addColorStop(1, '#000');
    mask(g, grad, r);
  },
  colors: ['#aec2e0', '#c8d6ec'],
  size: [9, 17],
  speed: [700, 1050],
  align: true,
  opacity: [0.22, 0.5],
  density: 1.3,
  windForce: 420,
};
