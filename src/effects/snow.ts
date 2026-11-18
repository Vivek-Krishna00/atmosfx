import type { EffectDefinition } from '../types';
import { CLEAR, inFocus, mask, sheen } from './shared';

const ARM = Math.PI / 3;

export function crystal(g: CanvasRenderingContext2D, r: number): void {
  const scale = g.getTransform ? g.getTransform().a : 1;
  g.shadowColor = g.fillStyle as string;
  g.shadowBlur = r * 0.35 * scale; // in device px, not affected by the transform
  g.strokeStyle = g.fillStyle;
  g.lineCap = 'round';
  g.lineWidth = Math.max(0.8, r * 0.12);
  g.beginPath();
  for (let k = 0; k < 6; k++) {
    g.rotate(ARM);
    g.moveTo(0, 0);
    g.lineTo(0, -r * 0.88);
    // two pairs of side branches per arm
    g.moveTo(0, -r * 0.42);
    g.lineTo(-r * 0.24, -r * 0.62);
    g.moveTo(0, -r * 0.42);
    g.lineTo(r * 0.24, -r * 0.62);
    g.moveTo(0, -r * 0.66);
    g.lineTo(-r * 0.15, -r * 0.8);
    g.moveTo(0, -r * 0.66);
    g.lineTo(r * 0.15, -r * 0.8);
  }
  g.stroke();
  g.beginPath(); // hexagonal center plate
  for (let k = 0; k < 6; k++) g.lineTo(Math.cos(k * ARM) * r * 0.2, Math.sin(k * ARM) * r * 0.2);
  g.fill();
}

/**
 * Snowfall of six-armed ice crystals that tumble, glint and blow sideways in gusty wind.
 * (`winter` is the softer full scene: bokeh flakes, a snow bank and frost.)
 */
export const snow: EffectDefinition = {
  draw(g, r, _color, depth) {
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
    inFocus(g, depth, r, () => crystal(g, r));
    sheen(g, r, 0.5, 0.15);
  },
  colors: ['#ffffff', '#e3f2ff', '#c7e2ff', '#e6e0ff', '#d4f6ff'],
  size: [2, 14],
  speed: [34, 150],
  drift: [15, 45],
  sway: 14,
  spin: 1.1,
  flutter: 1.1,
  opacity: [0.6, 1],
  density: 2.6,
  windForce: 170,
  gust: 0.6,
  twinkle: 0.35,
};
