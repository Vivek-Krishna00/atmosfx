import type { GroundLayer, GroundSpec, Options } from './types';

/** Floor columns are this many CSS px wide (particle landing lookup). */
export const FLOOR_COL = 8;
const SPARKLES = 14;
const DRIPS = 4;
const TAU = 6.283185307179586;

/** Small seeded PRNG so a resize regenerates the same frost / icicles instead of a new pattern. */
const rng = (seed: number) => () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const newCanvas = () => document.createElement('canvas');
/** Ease-out: builds quickly at first, then settles. */
const ease = (l: number) => 1 - (1 - l) * (1 - l);
const ICE_TOP = 'rgba(244,250,255,0.95)';
const ICE_TIP = 'rgba(190,220,255,0.25)';

/** Tiny soft sprite (glints, drips). */
function dot(dpr: number, r: number, star: boolean): HTMLCanvasElement {
  const c = newCanvas();
  const half = Math.ceil(r * dpr) + 2;
  c.width = c.height = half * 2;
  const g = c.getContext('2d');
  if (!g) return c;
  g.translate(half, half);
  g.scale(dpr, dpr);
  g.fillStyle = '#fff';
  g.shadowColor = star ? '#fff' : 'rgba(200,230,255,0.9)';
  g.shadowBlur = 3 * dpr;
  g.beginPath();
  if (star) {
    g.moveTo(0, -r);
    g.quadraticCurveTo(0, 0, r, 0);
    g.quadraticCurveTo(0, 0, 0, r);
    g.quadraticCurveTo(0, 0, -r, 0);
    g.quadraticCurveTo(0, 0, 0, -r);
  } else {
    g.ellipse(0, 0, r * 0.6, r, 0, 0, TAU);
  }
  g.fill();
  return c;
}

/**
 * Winter scene for an effect: an accumulating snow bank, frost creeping in from the corners,
 * icicles along the top edge with occasional drips, and snow caps on chosen elements.
 *
 * Bank, frost and icicles only change while growing, so they go to the instance's static
 * layer (repainted a few dozen times in total). Per frame we only draw glints, drips and caps.
 */
class Scene implements GroundLayer {
  floor = new Float32Array(0);
  private staticDirty = true;
  /** Static layer behind the particles: repainted only while growing, composited for free otherwise. */
  private bg: HTMLCanvasElement | null = null;
  private main: HTMLCanvasElement | null = null;

  private level = 0;
  private painted = -1;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private readonly seed = (Math.random() * 1e9) | 0;
  private readonly phase = [Math.random() * 9, Math.random() * 9, Math.random() * 9];

  // bank
  private bankH = 0;
  private readonly sx = new Float32Array(SPARKLES);
  private glint: HTMLCanvasElement | null = null;

  // icicles: per-icicle x, half-width, relative length
  private ix: number[] = [];
  private iw: number[] = [];
  private il: number[] = [];
  private iceH = 0;
  private drop: HTMLCanvasElement | null = null;
  private readonly dx = new Float32Array(DRIPS);
  private readonly dy = new Float32Array(DRIPS);
  private readonly dv = new Float32Array(DRIPS);
  private readonly dl = new Float32Array(DRIPS); // remaining life, 0 = inactive
  private dripIn = 1.5;

  // frost
  private frostR = 0;
  private frostFull: HTMLCanvasElement | null = null;
  private frostNow: HTMLCanvasElement | null = null;

  // caps
  private els: HTMLElement[] = [];
  private origin: HTMLElement | null = null;
  private caps: Array<{ cv: HTMLCanvasElement; w: number; radius: number }> = [];
  private rects = new Float32Array(0); // x, y, w per element
  private capsDirty = true;
  private capsAge = 0;
  private capsH = -1;
  private offScroll: (() => void) | null = null;

  constructor(private readonly spec: GroundSpec) {
    for (let i = 0; i < SPARKLES; i++) this.sx[i] = Math.random();
  }

  attach(canvas: HTMLCanvasElement): void {
    const bg = (this.bg = newCanvas());
    bg.setAttribute('aria-hidden', 'true');
    bg.style.cssText = canvas.style.cssText;
    bg.style.background = bg.style.opacity = bg.style.transition = '';
    canvas.before(bg); // earlier in the DOM with the same z-index = behind the particles
    this.main = canvas;
  }

  resize(w: number, h: number, dpr: number): void {
    if (this.bg && this.main) {
      this.bg.width = this.main.width;
      this.bg.height = this.main.height;
      this.bg.style.zIndex = this.main.style.zIndex;
    }
    this.w = w;
    this.h = h;
    this.dpr = dpr;
    this.bankH = Math.min(this.spec.height, h * 0.12);
    this.floor = new Float32Array(Math.ceil(w / FLOOR_COL) + 1);
    this.glint = this.spec.sparkle === false ? null : dot(dpr, 4, true);
    if (this.spec.icicles) this.genIcicles();
    if (this.spec.frost) this.genFrost();
    this.capsH = -1;
    this.capsDirty = true;
    this.painted = -1;
    this.grow(0);
    this.flush();
  }

  fill(): void {
    this.level = 1;
    this.grow(0);
    this.flush();
  }

  private flush(): void {
    const g = this.staticDirty && this.bg?.getContext('2d');
    if (g) this.paintStatic(g);
  }

  update(dt: number): void {
    if (this.level < 1) {
      this.grow(dt);
      this.flush();
    }
    if (this.spec.icicles) this.tickDrips(dt);
    if (this.els.length && (this.capsAge += dt) > 0.5) this.capsDirty = true; // catch layout shifts
  }

  private grow(dt: number): void {
    this.level = Math.min(1, this.level + dt / this.spec.grow);
    // Repaint the static layer in ~40 steps over the whole build-up, not every frame.
    if (this.painted >= 0 && this.level - this.painted < 0.025 && this.level < 1) return;
    if (this.painted === 1) return;
    this.painted = this.level;
    const H = this.bankH * ease(this.level);
    for (let i = 0; i < this.floor.length; i++) this.floor[i] = this.surface(i * FLOOR_COL, H);
    this.staticDirty = true;
  }

  private surface(x: number, H: number): number {
    const [a, b, c] = this.phase;
    return H * (0.74 + 0.14 * Math.sin(x * 0.009 + a) + 0.08 * Math.sin(x * 0.023 + b) + 0.04 * Math.sin(x * 0.061 + c));
  }

  // ---- static layer -----------------------------------------------------

  private paintStatic(g: CanvasRenderingContext2D): void {
    this.staticDirty = false;
    const { w, h, dpr } = this;
    const l = ease(this.level);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    if (this.frostR) this.paintFrost(g, l);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.spec.icicles) this.paintIcicles(g, l);
    const H = this.bankH * l;
    if (H < 0.5) return;
    g.beginPath();
    g.moveTo(0, h);
    for (let x = 0; x <= w + FLOOR_COL; x += FLOOR_COL) g.lineTo(x, h - this.surface(x, H));
    g.lineTo(w, h);
    g.closePath();
    const grad = g.createLinearGradient(0, h - H, 0, h);
    grad.addColorStop(0, this.spec.colors[0]);
    grad.addColorStop(1, this.spec.colors[1]);
    g.fillStyle = grad;
    g.shadowColor = 'rgba(120,150,200,0.45)';
    g.shadowBlur = 6 * dpr;
    g.shadowOffsetY = -dpr;
    g.fill();
    g.shadowColor = 'transparent';
    g.beginPath();
    for (let x = 0; x <= w + FLOOR_COL; x += FLOOR_COL) g.lineTo(x, h - this.surface(x, H) + 0.8);
    g.strokeStyle = 'rgba(255,255,255,0.9)';
    g.lineWidth = 1.4;
    g.stroke();
  }

  // ---- icicles ----------------------------------------------------------

  private genIcicles(): void {
    const rand = rng(this.seed);
    this.iceH = Math.min(56, this.h * 0.09);
    this.ix = [];
    this.iw = [];
    this.il = [];
    for (let x = rand() * 10; x < this.w; ) {
      const hw = 1.5 + rand() * 3.5;
      // Clustered lengths: long ones bunch together like on a real eave.
      const cluster = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(x * 0.017 + this.phase[0]));
      this.ix.push(x);
      this.iw.push(hw);
      this.il.push((0.15 + 0.85 * rand() ** 1.8) * cluster);
      x += hw * 2 * (0.7 + rand() * 1.8);
    }
    this.drop = dot(this.dpr, 1.6, false);
  }

  private paintIcicles(g: CanvasRenderingContext2D, l: number): void {
    const { w } = this;
    const rim = 3 + 3 * l;
    const L = this.iceH * l;
    // Snow rim along the top edge the icicles hang from.
    g.beginPath();
    g.moveTo(0, 0);
    for (let x = 0; x <= w + 6; x += 6) g.lineTo(x, rim * (0.7 + 0.3 * Math.sin(x * 0.05 + this.phase[1])));
    g.lineTo(w, 0);
    g.closePath();
    g.fillStyle = 'rgba(248,251,255,0.95)';
    g.fill();
    if (L < 1) return;
    const grad = g.createLinearGradient(0, 0, 0, rim + L);
    grad.addColorStop(0, ICE_TOP);
    grad.addColorStop(1, ICE_TIP);
    g.beginPath();
    for (let i = 0; i < this.ix.length; i++) {
      const x = this.ix[i];
      const hw = this.iw[i];
      const len = this.il[i] * L;
      if (len < 1) continue;
      const top = rim * 0.6;
      g.moveTo(x - hw, top);
      g.quadraticCurveTo(x - hw * 0.25, top + len * 0.55, x, top + len);
      g.quadraticCurveTo(x + hw * 0.3, top + len * 0.5, x + hw, top);
    }
    g.fillStyle = grad;
    g.fill();
    // Specular highlight down the left side of each icicle.
    g.beginPath();
    for (let i = 0; i < this.ix.length; i++) {
      const len = this.il[i] * L;
      if (len < 4) continue;
      const x = this.ix[i] - this.iw[i] * 0.35;
      g.moveTo(x, rim);
      g.lineTo(x + this.iw[i] * 0.2, rim + len * 0.55);
    }
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 0.8;
    g.stroke();
  }

  private tickDrips(dt: number): void {
    const n = this.ix.length;
    if (!n || this.level < 0.6) return;
    if ((this.dripIn -= dt) <= 0) {
      this.dripIn = 0.8 + Math.random() * 2.4;
      for (let d = 0; d < DRIPS; d++) {
        if (this.dl[d] > 0) continue;
        const i = (Math.random() * n) | 0;
        if (this.il[i] < 0.45) break; // only long icicles drip
        this.dx[d] = this.ix[i];
        this.dy[d] = 3 + 3 * ease(this.level) + this.il[i] * this.iceH * ease(this.level);
        this.dv[d] = 0;
        this.dl[d] = 0.9;
        break;
      }
    }
    for (let d = 0; d < DRIPS; d++) {
      if (this.dl[d] <= 0) continue;
      this.dl[d] -= dt;
      if (this.dl[d] < 0.65) {
        // hang briefly, then fall
        this.dv[d] += 1400 * dt;
        this.dy[d] += this.dv[d] * dt;
      }
    }
  }

  // ---- frost ------------------------------------------------------------

  private genFrost(): void {
    const R = Math.min(260, Math.min(this.w, this.h) * 0.33);
    this.frostR = R < 40 ? 0 : R;
    if (!this.frostR) return;
    const { dpr } = this;
    const size = Math.ceil(R * dpr);
    const full = (this.frostFull = newCanvas());
    this.frostNow = newCanvas();
    full.width = full.height = this.frostNow.width = this.frostNow.height = size;
    const g = full.getContext('2d');
    if (!g) return;
    g.scale(dpr, dpr);
    const haze = g.createRadialGradient(0, 0, 0, 0, 0, R);
    haze.addColorStop(0, 'rgba(235,245,255,0.32)');
    haze.addColorStop(1, 'rgba(235,245,255,0)');
    g.fillStyle = haze;
    g.fillRect(0, 0, R, R);
    g.strokeStyle = 'rgba(240,248,255,0.42)';
    g.lineCap = 'round';
    const rand = rng(this.seed ^ 0x9e3779b9);
    // Feathery ice "ferns": each segment may sprout a symmetric pair of side branches at ±60°
    // (hexagonal ice growth), shorter and thinner each generation.
    const branch = (x: number, y: number, a: number, len: number, depth: number, width: number): void => {
      const kids: number[] = [];
      const seg = len / 7;
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(x, y);
      for (let s = 0; s < 7; s++) {
        a += (rand() - 0.5) * 0.18;
        x += Math.cos(a) * seg;
        y += Math.sin(a) * seg;
        g.lineTo(x, y);
        if (depth > 0 && s > 0 && rand() < 0.6) kids.push(x, y, a + Math.PI / 3, x, y, a - Math.PI / 3);
      }
      g.stroke();
      for (let k = 0; k < kids.length; k += 3) {
        branch(kids[k], kids[k + 1], kids[k + 2], len * (0.22 + rand() * 0.16), depth - 1, width * 0.65);
      }
    };
    for (let k = 0; k < 11; k++) {
      branch(rand() * R * 0.05, rand() * R * 0.05, 0.08 + rand() * (Math.PI / 2 - 0.16), R * (0.4 + rand() * 0.6), 2, 1);
    }
  }

  private paintFrost(g: CanvasRenderingContext2D, l: number): void {
    const now = this.frostNow!;
    const n = now.getContext('2d');
    if (!n || l <= 0.01) return;
    // Reveal the pre-generated pattern with a soft radial mask that grows from the corner.
    const size = now.width;
    n.globalCompositeOperation = 'source-over';
    n.clearRect(0, 0, size, size);
    n.drawImage(this.frostFull!, 0, 0);
    n.globalCompositeOperation = 'destination-in';
    const m = n.createRadialGradient(0, 0, 0, 0, 0, size * l);
    m.addColorStop(0, '#000');
    m.addColorStop(0.6, '#000');
    m.addColorStop(1, 'rgba(0,0,0,0)');
    n.fillStyle = m;
    n.fillRect(0, 0, size, size);
    n.globalCompositeOperation = 'source-over';
    const W = g.canvas.width;
    const H = g.canvas.height;
    // Mirror into all four corners; bottom corners a little lighter.
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(now, 0, 0);
    g.setTransform(-1, 0, 0, 1, W, 0);
    g.drawImage(now, 0, 0);
    g.globalAlpha = 0.7;
    g.setTransform(1, 0, 0, -1, 0, H);
    g.drawImage(now, 0, 0);
    g.setTransform(-1, 0, 0, -1, W, H);
    g.drawImage(now, 0, 0);
    g.globalAlpha = 1;
  }

  // ---- caps on elements ---------------------------------------------------

  settle(target: Options['settleOn'], exclude: Element | null): void {
    const list = !target ? [] : typeof target === 'string' ? document.querySelectorAll(target) : target instanceof Element ? [target] : target;
    const els = Array.prototype.filter.call(list, (el: Element) => el instanceof HTMLElement && el !== exclude) as HTMLElement[];
    this.els = els;
    this.origin = this.main;
    this.caps = els.map(() => ({ cv: newCanvas(), w: -1, radius: 0 }));
    this.rects = new Float32Array(els.length * 3);
    this.capsDirty = true;
    this.capsH = -1;
    if (els.length && !this.offScroll) {
      const onScroll = () => (this.capsDirty = true);
      // capture: also catch scrolling inside nested scroll containers
      window.addEventListener('scroll', onScroll, { passive: true, capture: true });
      this.offScroll = () => window.removeEventListener('scroll', onScroll, { capture: true });
    } else if (!els.length && this.offScroll) {
      this.offScroll();
      this.offScroll = null;
    }
  }

  private readRects(): void {
    this.capsDirty = false;
    this.capsAge = 0;
    const o = this.origin!.getBoundingClientRect();
    const H = 12 * ease(this.level);
    const repaintAll = Math.abs(H - this.capsH) * this.dpr >= 1;
    if (repaintAll) this.capsH = H;
    for (let i = 0; i < this.els.length; i++) {
      const el = this.els[i];
      const r = el.getBoundingClientRect();
      this.rects[i * 3] = r.left - o.left;
      this.rects[i * 3 + 1] = r.top - o.top;
      this.rects[i * 3 + 2] = el.isConnected ? r.width : 0;
      const cap = this.caps[i];
      if (repaintAll || Math.abs(cap.w - r.width) >= 1) this.paintCap(cap, el, r.width);
    }
  }

  private paintCap(cap: { cv: HTMLCanvasElement; w: number; radius: number }, el: HTMLElement, w: number): void {
    if (cap.w < 0) cap.radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    cap.w = w;
    const { dpr } = this;
    const H = this.capsH;
    const cv = cap.cv;
    cv.width = Math.max(1, Math.ceil((w + 4) * dpr));
    cv.height = Math.max(1, Math.ceil((H + 8) * dpr));
    const g = cv.getContext('2d');
    if (!g || H < 1 || w < 8) return;
    g.scale(dpr, dpr);
    const base = H + 4; // overlaps the element's top border slightly
    const x0 = 2 + cap.radius * 0.45;
    const x1 = w + 2 - cap.radius * 0.45;
    g.beginPath();
    g.moveTo(x0, base + 1.5);
    for (let x = x0; x <= x1; x += 4) {
      // Lumpy top that tapers into rounded ends.
      const t = Math.min(1, (x - x0) / 14, (x1 - x) / 14);
      const taper = Math.sqrt(Math.max(0, t));
      g.lineTo(x, base - H * taper * (0.72 + 0.18 * Math.sin(x * 0.09 + this.phase[2]) + 0.1 * Math.sin(x * 0.23)));
    }
    g.lineTo(x1, base + 1.5);
    g.closePath();
    const grad = g.createLinearGradient(0, base - H, 0, base);
    grad.addColorStop(0, this.spec.colors[0]);
    grad.addColorStop(1, this.spec.colors[1]);
    g.fillStyle = grad;
    g.shadowColor = 'rgba(110,140,190,0.4)';
    g.shadowBlur = 3 * dpr;
    g.shadowOffsetY = dpr;
    g.fill();
  }

  // ---- per frame ----------------------------------------------------------

  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const { dpr, h } = this;
    const bank = this.bankH * ease(this.level);
    if (this.glint && bank >= 6) {
      const half = this.glint.width / 2;
      for (let i = 0; i < SPARKLES; i++) {
        // Brief, sharp glints: mostly invisible, flashing now and then.
        const s = Math.sin(t * (0.9 + (i % 4) * 0.23) + i * 2.4);
        if (s < 0.9) continue;
        const x = this.sx[i] * this.w;
        const y = h - this.surface(x, bank) * (0.55 + (0.35 * ((i * 7) % 5)) / 4);
        ctx.globalAlpha = (s - 0.9) * 10;
        ctx.drawImage(this.glint, x * dpr - half, y * dpr - half);
      }
    }
    if (this.drop) {
      const half = this.drop.width / 2;
      for (let d = 0; d < DRIPS; d++) {
        if (this.dl[d] <= 0) continue;
        ctx.globalAlpha = Math.min(1, this.dl[d] * 2) * 0.85;
        ctx.drawImage(this.drop, this.dx[d] * dpr - half, this.dy[d] * dpr - half);
      }
    }
    ctx.globalAlpha = 1;
    if (!this.els.length) return;
    if (this.capsDirty) this.readRects();
    for (let i = 0; i < this.els.length; i++) {
      const w = this.rects[i * 3 + 2];
      const y = this.rects[i * 3 + 1];
      if (!w || y < -20 || y > h + 20) continue;
      const cv = this.caps[i].cv;
      ctx.drawImage(cv, Math.round((this.rects[i * 3] - 2) * dpr), Math.round((y - this.capsH - 4) * dpr));
    }
  }

  destroy(): void {
    this.offScroll?.();
    this.offScroll = null;
    this.bg?.remove();
    this.bg = null;
  }
}

/**
 * A winter-style ground for an effect definition:
 * `ground: bank({ colors, height, grow, icicles?, frost? })`.
 */
export function bank(spec: GroundSpec): () => GroundLayer {
  if (!(Array.isArray(spec.colors) && spec.colors.length === 2 && spec.height > 0 && spec.grow > 0)) {
    throw new TypeError('atmosfx: bank() needs colors [top, bottom], height > 0 and grow > 0');
  }
  return () => new Scene(spec);
}
