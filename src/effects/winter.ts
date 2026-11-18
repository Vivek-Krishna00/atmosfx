import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

const ARM = Math.PI / 3;

/**
 * Winter blizzard: six-armed ice crystals that tumble, glint and blow sideways in
 * gusty wind, over a faint frosted vignette. Distinct from `snow` (soft, calm, round flakes).
 */
export const winter: EffectDefinition = {
  draw(g, r) {
    if (r < 3.2) {
      // Too small for a readable crystal: a crisp ice speck.
      g.beginPath();
      g.arc(0, 0, r, 0, 6.2832);
      g.fill();
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, r);
      grad.addColorStop(0, '#000');
      grad.addColorStop(0.45, '#000');
      grad.addColorStop(1, CLEAR);
      mask(g, grad, r);
      return;
    }
    const scale = g.getTransform ? g.getTransform().a : 1;
    g.shadowColor = g.strokeStyle as string;
    g.shadowBlur = r * 0.45 * scale; // shadowBlur is in device px, not affected by the transform
    g.lineCap = 'round';
    g.lineWidth = Math.max(0.7, r * 0.11);
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      g.rotate(ARM);
      g.moveTo(0, 0);
      g.lineTo(0, -r * 0.88);
      // two pairs of side branches per arm
      g.moveTo(0, -r * 0.42);
      g.lineTo(-r * 0.22, -r * 0.62);
      g.moveTo(0, -r * 0.42);
      g.lineTo(r * 0.22, -r * 0.62);
      g.moveTo(0, -r * 0.66);
      g.lineTo(-r * 0.14, -r * 0.8);
      g.moveTo(0, -r * 0.66);
      g.lineTo(r * 0.14, -r * 0.8);
    }
    g.stroke();
    g.beginPath();
    g.arc(0, 0, r * 0.14, 0, 6.2832);
    g.fill();
  },
  colors: ['#ffffff', '#e6f3ff', '#c9e3ff'],
  size: [1.2, 11],
  speed: [34, 150],
  drift: [15, 45],
  sway: 14,
  spin: 0.9,
  opacity: [0.5, 0.95],
  density: 3,
  windForce: 170,
  gust: 0.6,
  twinkle: 0.35,
  backdrop: 'radial-gradient(ellipse at center, rgba(200,225,255,0) 55%, rgba(200,225,255,0.16) 100%)',
};
