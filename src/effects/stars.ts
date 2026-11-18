import type { EffectDefinition } from '../types';
import { CLEAR, mask, sheen } from './shared';

const PERIOD = 6.5;
/** Deterministic 0..1 hash so the shooting star needs no per-instance state. */
const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Night sky: pinpoint far stars and glowing, slowly turning star shapes up close, twinkling with a slow drift and an occasional shooting star. */
export const stars: EffectDefinition = {
  draw(g, r, color, depth, index) {
    if (depth < 0.3 || r < 2.5) {
      // far stars stay as soft pinpoints
      g.beginPath();
      g.arc(0, 0, r * 0.5, 0, 6.2832);
      g.fill();
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.5);
      grad.addColorStop(0, '#000');
      grad.addColorStop(0.45, '#000');
      grad.addColorStop(1, CLEAR);
      mask(g, grad, r);
      return;
    }
    // 5-point stars and 4-point sparkles, with a glow
    const spikes = index % 2 ? 4 : 5;
    const inner = spikes === 4 ? 0.3 : 0.46;
    const scale = g.getTransform ? g.getTransform().a : 1;
    g.shadowColor = color;
    g.shadowBlur = r * 0.45 * scale;
    g.beginPath();
    for (let k = 0; k < spikes * 2; k++) {
      const a = (k * Math.PI) / spikes - Math.PI / 2;
      const rr = r * 0.78 * (k % 2 ? inner : 1);
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
    g.shadowBlur = 0;
    sheen(g, r, 0.55, 0.12);
  },
  colors: ['#ffffff', '#ffe58a', '#ffd6f0', '#cfe3ff', '#fff1b8'],
  size: [1.4, 7.5],
  speed: [0, 0],
  drift: [-2.2, -0.8],
  twinkle: 0.7,
  spin: 0.25,
  opacity: [0.55, 1],
  density: 4,
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
