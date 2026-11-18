import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

/** Summer light: warm, glowing motes that rise slowly and twinkle, with a soft sun glow in the corner. */
export const summer: EffectDefinition = {
  draw(g, r) {
    g.beginPath();
    g.arc(0, 0, r, 0, 6.2832);
    g.fill();
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.18, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.45, 'rgba(0,0,0,0.25)');
    grad.addColorStop(1, CLEAR);
    mask(g, grad, r);
  },
  colors: ['#fff3c4', '#ffe08a', '#ffd166', '#fff8e1'],
  size: [2.4, 12],
  speed: [-5, -22], // rise; near motes rise faster
  drift: [-6, 6],
  sway: 16,
  twinkle: 0.55,
  blend: 'lighter',
  opacity: [0.35, 0.85],
  density: 1.5,
  windForce: 40,
  gust: 0.3,
  backdrop: 'radial-gradient(circle at 88% 0%, rgba(255,210,120,0.22), rgba(255,210,120,0) 55%)',
};
