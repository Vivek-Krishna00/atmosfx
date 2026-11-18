import type { EffectDefinition } from '../types';
import { rain } from './rain';

const PERIOD = 5;
const hash = (n: number) => {
  const s = Math.sin(n * 91.7 + 47.3) * 43758.5453;
  return s - Math.floor(s);
};

/** Heavy wind-driven rain with lightning: a double flash and a jagged bolt every few seconds. */
export const thunderstorm: EffectDefinition = {
  ...rain,
  density: 4,
  speed: [520, 1450],
  opacity: [0.18, 0.55],
  windForce: 480,
  gust: 0.35,
  backdrop: 'linear-gradient(rgba(8,12,24,0.35), rgba(8,12,24,0.08))',
  overlay(ctx, w, h, t) {
    const k = Math.floor(t / PERIOD);
    if (hash(k) < 0.3) return; // some periods stay dark
    const local = t - k * PERIOD - hash(k + 9) * 2; // strike at a random moment in the period
    if (local < 0 || local > 0.55) return;
    // Two quick flickers then a fade.
    const flash = local < 0.08 ? 1 : local < 0.14 ? 0.25 : local < 0.22 ? 0.8 : Math.max(0, 1 - (local - 0.22) / 0.33);
    ctx.globalAlpha = flash * 0.28;
    ctx.fillStyle = '#dfe8ff';
    ctx.fillRect(0, 0, w, h);
    if (local > 0.3) return;
    // Jagged bolt with one side branch, generated from the hash each frame (no stored state,
    // no allocation). Drawn twice: a wide soft glow, then a bright core.
    const x0 = (0.15 + hash(k + 1) * 0.7) * w;
    const end = h * (0.45 + hash(k + 2) * 0.35);
    const bolt = () => {
      let x = x0;
      let y = 0;
      let bx = 0;
      let by = 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 1; y < end; s++) {
        x += (hash(k * 31 + s) - 0.5) * 60;
        y += 18 + hash(k * 17 + s) * 26;
        ctx.lineTo(x, y);
        if (s === 4) {
          bx = x;
          by = y;
        }
      }
      ctx.moveTo(bx, by);
      for (let s = 1; s < 6; s++) ctx.lineTo(bx + s * (14 + hash(k + s) * 10), by + s * 22);
      ctx.stroke();
    };
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = '#cfdcff';
    ctx.globalAlpha = flash * 0.35;
    ctx.lineWidth = 7;
    bolt();
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = flash;
    ctx.lineWidth = 2.2;
    bolt();
    ctx.globalAlpha = 1;
  },
};
