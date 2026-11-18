import type { EffectDefinition } from '../types';
import { CLEAR, mask } from './shared';

/** A floating dandelion seed: fine filaments fanning out over a short stem. */
function dandelion(g: CanvasRenderingContext2D, r: number, color: string): void {
  g.strokeStyle = color;
  g.lineCap = 'round';
  g.lineWidth = Math.max(0.5, r * 0.05);
  g.globalAlpha = 0.9;
  g.beginPath();
  g.moveTo(0, -r * 0.1);
  g.lineTo(0, r * 0.75); // stem
  for (let k = 0; k < 13; k++) {
    const a = Math.PI + (k / 12) * Math.PI; // upper half-fan
    g.moveTo(0, -r * 0.1);
    g.lineTo(Math.cos(a) * r * 0.85, -r * 0.1 + Math.sin(a) * r * 0.75);
  }
  g.stroke();
  g.globalAlpha = 1;
  g.beginPath();
  g.ellipse(0, r * 0.8, r * 0.09, r * 0.16, 0, 0, 6.2832); // seed
  g.fill();
}

/** Summer light: warm glowing motes and drifting dandelion seeds that rise slowly and twinkle, with a soft sun glow in the corner. */
export const summer: EffectDefinition = {
  draw(g, r, color, _depth, index) {
    if (index % 2 === 0 && r > 4) return dandelion(g, r, color);
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
  colors: ['#fffaf0', '#ffe08a', '#fff6d8', '#ffd166', '#ffffff'],
  size: [2.4, 12],
  speed: [-5, -22], // rise; near motes rise faster
  drift: [-6, 6],
  sway: 16,
  spin: 0.5,
  twinkle: 0.55,
  blend: 'lighter',
  opacity: [0.35, 0.85],
  density: 1.5,
  windForce: 40,
  gust: 0.3,
  backdrop: 'radial-gradient(circle at 88% 0%, rgba(255,210,120,0.22), rgba(255,210,120,0) 55%)',
};
