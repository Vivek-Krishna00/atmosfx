import type { EffectDefinition } from '../types';
import { inFocus, sheen } from './shared';

/** Sakura petals: notched, pink-gradient petals that drift, spin and flip over in the breeze. */
export const cherryBlossom: EffectDefinition = {
  draw(g, r, color, depth) {
    inFocus(g, depth, r, () => {
      g.beginPath();
      g.moveTo(0, r * 0.95); // base
      g.bezierCurveTo(r * 0.95, r * 0.35, r * 0.8, -r * 0.75, r * 0.2, -r * 0.92);
      g.quadraticCurveTo(0, -r * 0.6, -r * 0.2, -r * 0.92); // the notch
      g.bezierCurveTo(-r * 0.8, -r * 0.75, -r * 0.95, r * 0.35, 0, r * 0.95);
      g.fillStyle = color;
      g.fill();
    });
    sheen(g, r, 0.5, 0.12);
    if (depth < 0.9 && r > 4) {
      // faint center crease
      g.beginPath();
      g.moveTo(0, r * 0.85);
      g.quadraticCurveTo(r * 0.05, r * 0.2, 0, -r * 0.35);
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = Math.max(0.5, r * 0.06);
      g.stroke();
    }
  },
  colors: ['#ffd6e2', '#ffc2d4', '#f9a8c3', '#ffe4ec', '#f48fb1'],
  size: [4, 13],
  speed: [20, 68],
  drift: [12, 38],
  sway: 32,
  spin: 1.4,
  flutter: 1.7,
  opacity: [0.6, 0.95],
  density: 2.2,
  windForce: 110,
  gust: 0.45,
};
