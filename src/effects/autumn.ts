import type { EffectDefinition } from '../types';
import { inFocus, sheen } from './shared';

// Half a maple leaf (right side), normalized to radius 1; mirrored for the left.
const MAPLE = [
  0, -1, 0.14, -0.6, 0.4, -0.78, 0.34, -0.4, 0.8, -0.52, 0.64, -0.2, 0.98, 0.02, 0.56, 0.14, 0.64, 0.42, 0.22, 0.3, 0.06, 0.58,
];

function maple(g: CanvasRenderingContext2D, r: number): void {
  g.beginPath();
  g.moveTo(0, -r);
  for (let i = 2; i < MAPLE.length; i += 2) g.lineTo(MAPLE[i] * r, MAPLE[i + 1] * r);
  for (let i = MAPLE.length - 2; i >= 2; i -= 2) g.lineTo(-MAPLE[i] * r, MAPLE[i + 1] * r);
  g.closePath();
  g.fill();
}

function oval(g: CanvasRenderingContext2D, r: number): void {
  g.beginPath();
  g.moveTo(0, -r);
  g.quadraticCurveTo(r * 0.8, -r * 0.1, 0, r * 0.75);
  g.quadraticCurveTo(-r * 0.8, -r * 0.1, 0, -r);
  g.fill();
}

/** Autumn leaves: a mix of maple and oval leaves in warm tones that tumble and flip as they fall. */
export const autumn: EffectDefinition = {
  draw(g, r, _color, depth, index) {
    const isMaple = index % 2 === 0;
    inFocus(g, depth, r, () => (isMaple ? maple(g, r) : oval(g, r)));
    sheen(g, r, 0.3, 0.25);
    if (depth >= 0.9 || r < 4) return;
    // veins + stem
    g.strokeStyle = 'rgba(70,30,10,0.35)';
    g.lineWidth = Math.max(0.5, r * 0.05);
    g.beginPath();
    g.moveTo(0, r * 0.95);
    g.lineTo(0, -r * 0.7);
    if (isMaple) {
      for (const [x, y] of [[0.62, -0.42], [-0.62, -0.42], [0.75, 0.05], [-0.75, 0.05]]) {
        g.moveTo(0, r * 0.3);
        g.lineTo(x * r, y * r);
      }
    } else {
      for (let k = -1; k <= 1; k += 0.6) {
        g.moveTo(0, k * r * 0.5);
        g.lineTo(r * 0.38, k * r * 0.5 - r * 0.25);
        g.moveTo(0, k * r * 0.5);
        g.lineTo(-r * 0.38, k * r * 0.5 - r * 0.25);
      }
    }
    g.stroke();
  },
  colors: ['#d9531e', '#e8892c', '#b8321f', '#f0b13a', '#8f4a1c'],
  size: [6, 17],
  speed: [28, 88],
  drift: [8, 34],
  sway: 46,
  spin: 1.8,
  flutter: 1.15,
  opacity: [0.7, 1],
  density: 1.4,
  windForce: 140,
  gust: 0.5,
};
