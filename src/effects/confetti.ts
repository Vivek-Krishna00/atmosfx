import type { EffectDefinition } from '../types';
import { inFocus, sheen } from './shared';

/** Confetti: bright paper rectangles and streamers that spin and flip as they fall. */
export const confetti: EffectDefinition = {
  draw(g, r, color, depth, index) {
    inFocus(g, depth, r, () => {
      g.fillStyle = color;
      if (index % 3 === 2) {
        // curly streamer
        g.beginPath();
        g.moveTo(-r * 0.15, -r);
        g.bezierCurveTo(r * 0.7, -r * 0.5, -r * 0.7, r * 0.3, r * 0.15, r);
        g.lineTo(-r * 0.12, r);
        g.bezierCurveTo(-r * 0.95, r * 0.3, r * 0.45, -r * 0.5, -r * 0.42, -r);
        g.fill();
      } else {
        g.fillRect(-r * 0.45, -r * 0.8, r * 0.9, r * 1.6);
      }
    });
    sheen(g, r, 0.35, 0.2);
  },
  colors: ['#ff4d6d', '#ffd23f', '#3ec1d3', '#7b5cff', '#4cd97b'],
  size: [4, 10],
  speed: [55, 160],
  drift: [-12, 12],
  sway: 38,
  spin: 3.5,
  flutter: 3,
  opacity: [0.85, 1],
  density: 1.8,
  windForce: 90,
  gust: 0.25,
};
