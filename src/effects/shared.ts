/** Fade an already-drawn sprite with an alpha mask (keeps the original color, no color fringing). */
export function mask(g: CanvasRenderingContext2D, grad: CanvasGradient, r: number): void {
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = grad;
  g.fillRect(-r - 1, -r - 1, 2 * r + 2, 2 * r + 2);
  g.globalCompositeOperation = 'source-over';
}

export const CLEAR = 'rgba(0,0,0,0)';

/**
 * Depth of field for the nearest layer: draws `shape` as a blurred shadow only (the shape itself
 * is pushed far off-canvas). Works in Safari, which has no ctx.filter. Runs at bake time only.
 */
export function inFocus(g: CanvasRenderingContext2D, depth: number, r: number, shape: () => void): void {
  if (depth < 0.9) return shape();
  const scale = g.getTransform ? g.getTransform().a : 1;
  g.save();
  g.shadowColor = g.fillStyle as string;
  g.shadowBlur = r * 0.3 * scale; // shadow values are in device px, unaffected by the transform
  g.shadowOffsetX = 1e4;
  g.translate(-1e4 / scale, 0);
  g.scale(0.78, 0.78); // leave room for the blur inside the sprite box
  shape();
  g.restore();
}

/** Light-to-dark sheen over whatever was just drawn (keeps the base color, adds form). */
export function sheen(g: CanvasRenderingContext2D, r: number, light = 0.4, dark = 0.18): void {
  const grad = g.createLinearGradient(-r * 0.4, -r, r * 0.4, r);
  grad.addColorStop(0, `rgba(255,255,255,${light})`);
  grad.addColorStop(0.55, 'rgba(255,255,255,0)');
  grad.addColorStop(1, `rgba(0,0,0,${dark})`);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = grad;
  g.fillRect(-r - 1, -r - 1, 2 * r + 2, 2 * r + 2);
  g.globalCompositeOperation = 'source-over';
}
