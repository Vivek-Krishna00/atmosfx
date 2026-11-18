import type { GroundLayer, GroundSpec } from './types';

/** Floor columns are this many CSS px wide (particle landing lookup). */
export const FLOOR_COL = 8;
const SPARKLES = 14;

/**
 * An accumulating bank at the bottom of the area (e.g. snow). Its shape is painted to an
 * offscreen canvas only when its height changes by a device pixel, so a frame costs one
 * drawImage plus a few glints. Exposes `floor` (surface height per column) so falling
 * particles can land in it.
 */
class Ground implements GroundLayer {
  floor = new Float32Array(0);
  private readonly cv = document.createElement('canvas');
  private readonly glint = document.createElement('canvas');
  private readonly phase = [Math.random() * 9, Math.random() * 9, Math.random() * 9];
  private readonly sx = new Float32Array(SPARKLES);
  private level = 0;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private maxH = 0;
  private drawnH = -1;

  constructor(private readonly spec: GroundSpec) {
    for (let i = 0; i < SPARKLES; i++) this.sx[i] = Math.random();
  }

  resize(w: number, h: number, dpr: number): void {
    this.w = w;
    this.h = h;
    this.maxH = Math.min(this.spec.height, h * 0.12);
    this.floor = new Float32Array(Math.ceil(w / FLOOR_COL) + 1);
    this.cv.width = Math.max(1, Math.round(w * dpr));
    this.cv.height = Math.max(1, Math.ceil((this.maxH + 6) * dpr));
    if (dpr !== this.dpr || !this.glint.width) this.bakeGlint(dpr);
    this.dpr = dpr;
    this.drawnH = -1;
    this.paint();
  }

  /** Skip the build-up (reduced motion, or a static frame). */
  fill(): void {
    this.level = 1;
    this.paint();
  }

  update(dt: number): void {
    if (this.level >= 1) return;
    this.level = Math.min(1, this.level + dt / this.spec.grow);
    this.paint();
  }

  private surface(x: number, H: number): number {
    const [a, b, c] = this.phase;
    return H * (0.74 + 0.14 * Math.sin(x * 0.009 + a) + 0.08 * Math.sin(x * 0.023 + b) + 0.04 * Math.sin(x * 0.061 + c));
  }

  private paint(): void {
    // Ease-out so the bank grows quickly at first, then settles.
    const H = this.maxH * (1 - (1 - this.level) * (1 - this.level));
    if (Math.abs(H - this.drawnH) * this.dpr < 1) return;
    this.drawnH = H;
    for (let i = 0; i < this.floor.length; i++) this.floor[i] = this.surface(i * FLOOR_COL, H);
    const g = this.cv.getContext('2d');
    if (!g) return;
    const { w, dpr } = this;
    const ch = this.cv.height / dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, ch);
    if (H < 0.5) return;
    g.beginPath();
    g.moveTo(0, ch);
    for (let x = 0; x <= w + FLOOR_COL; x += FLOOR_COL) g.lineTo(x, ch - this.surface(x, H));
    g.lineTo(w, ch);
    g.closePath();
    const grad = g.createLinearGradient(0, ch - H, 0, ch);
    grad.addColorStop(0, this.spec.colors[0]);
    grad.addColorStop(1, this.spec.colors[1]);
    g.fillStyle = grad;
    g.shadowColor = 'rgba(120,150,200,0.45)';
    g.shadowBlur = 6 * dpr;
    g.shadowOffsetY = -1 * dpr;
    g.fill();
    // Bright rim along the top edge.
    g.shadowColor = 'transparent';
    g.beginPath();
    for (let x = 0; x <= w + FLOOR_COL; x += FLOOR_COL) g.lineTo(x, ch - this.surface(x, H) + 0.8);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 1.4;
    g.stroke();
  }

  private bakeGlint(dpr: number): void {
    const r = 4;
    const half = Math.ceil(r * dpr) + 1;
    const c = this.glint;
    c.width = c.height = half * 2;
    const g = c.getContext('2d');
    if (!g) return;
    g.translate(half, half);
    g.scale(dpr, dpr);
    g.fillStyle = '#fff';
    g.shadowColor = '#fff';
    g.shadowBlur = 3 * dpr;
    g.beginPath(); // four-point star
    g.moveTo(0, -r);
    g.quadraticCurveTo(0, 0, r, 0);
    g.quadraticCurveTo(0, 0, 0, r);
    g.quadraticCurveTo(0, 0, -r, 0);
    g.quadraticCurveTo(0, 0, 0, -r);
    g.fill();
  }

  /** Draw in device px. Caller has reset the transform. */
  draw(ctx: CanvasRenderingContext2D, t: number): void {
    if (this.drawnH < 0.5) return;
    const { dpr, cv, h } = this;
    const top = Math.round(h * dpr) - cv.height;
    ctx.globalAlpha = 1;
    ctx.drawImage(cv, 0, top);
    if (!(this.spec.sparkle ?? true) || this.drawnH < 6) return;
    const half = this.glint.width / 2;
    for (let i = 0; i < SPARKLES; i++) {
      // Brief, sharp glints: mostly invisible, flashing now and then.
      const s = Math.sin(t * (0.9 + (i % 4) * 0.23) + i * 2.4);
      if (s < 0.9) continue;
      const a = (s - 0.9) * 10;
      const x = this.sx[i] * this.w;
      const y = h - this.surface(x, this.drawnH) * (0.55 + 0.35 * ((i * 7) % 5) / 4);
      ctx.globalAlpha = a;
      ctx.drawImage(this.glint, x * dpr - half, y * dpr - half);
    }
    ctx.globalAlpha = 1;
  }
}

/** A snow-bank style ground for an effect definition: `ground: bank({ colors, height, grow })`. */
export function bank(spec: GroundSpec): () => GroundLayer {
  if (!(Array.isArray(spec.colors) && spec.colors.length === 2 && spec.height > 0 && spec.grow > 0)) {
    throw new TypeError('atmosfx: bank() needs colors [top, bottom], height > 0 and grow > 0');
  }
  return () => new Ground(spec);
}
