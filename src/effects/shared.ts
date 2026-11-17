/** Fade an already-drawn sprite with an alpha mask (keeps the original color, no color fringing). */
export function mask(g: CanvasRenderingContext2D, grad: CanvasGradient, r: number): void {
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = grad;
  g.fillRect(-r - 1, -r - 1, 2 * r + 2, 2 * r + 2);
  g.globalCompositeOperation = 'source-over';
}

export const CLEAR = 'rgba(0,0,0,0)';
