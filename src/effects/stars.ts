import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

const PERIOD = 6.5;
/** Deterministic 0..1 hash so the shooting star needs no per-instance state. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Night sky: twinkling stars with a slow drift and an occasional shooting star. */
export const stars: EffectDefinition = {
  draw(g, r, _color, depth) {
    g.beginPath();
    g.arc(0, 0, r * 0.45, 0, 6.2832);
    g.fill();
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.45);
    grad.addColorStop(0, '#000');
    grad.addColorStop(0.4, '#000');
    grad.addColorStop(1, CLEAR);
    mask(g, grad, r);
    if (depth > 0.6) {
      // diffraction spikes on the brightest stars
      g.globalAlpha = 0.55;
      g.fillRect(-r, -r * 0.05, 2 * r, r * 0.1);
      g.fillRect(-r * 0.05, -r, r * 0.1, 2 * r);
      g.globalAlpha = 1;
    }
  },
  colors: ['#ffffff', '#fff2d6', '#d8e6ff'],
  size: [1.4, 6],
  speed: [0, 0],
  drift: [-2.2, -0.8],
  twinkle: 0.7,
  opacity: [0.55, 1],
  density: 6,
  windForce: 0,
  gust: 0,
  overlay(ctx, w, h, t) {
    const k = Math.floor(t / PERIOD);
    const local = t - k * PERIOD;
    if (local > 0.9 || hash(k) < 0.35) return; // not every period has one
    const p = local / 0.9;
    const x0 = (0.2 + hash(k + 1) * 0.7) * w;
    const y0 = hash(k + 2) * h * 0.4;
    const len = 90 + hash(k + 3) * 120;
    const x = x0 - p * len * 2.2;
    const y = y0 + p * len * 1.1;
    ctx.lineCap = 'round';
    // Three tapered strokes instead of a gradient: no allocation in the frame loop.
    for (let s = 0; s < 3; s++) {
      ctx.globalAlpha = (1 - p) * (0.9 - s * 0.28);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6 - s * 0.45;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * (0.35 + s * 0.3), y - len * (0.175 + s * 0.15));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },
};
