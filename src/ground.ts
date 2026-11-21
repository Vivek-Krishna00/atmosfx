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
const ICE_MID = 'rgba(214,234,255,0.6)';
const ICE_TIP = 'rgba(190,220,255,0.3)';
const RIM = 'rgba(248,251,255,0.95)';
const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * One icicle: root (x, y), pointing along angle `a`. `len` is its full length, `delay` (0..0.5) when it
 * starts forming and `ph`/`bend` give it its own ripples and curve, so no two look stamped out.
 */
interface Ice {
  x: number;
  y: number;
  a: number;
  hw: number;
  len: number;
  delay: number;
  ph: number;
  bend: number;
}

/** Current length: each icicle starts at its own time and eases in, so they don't grow in lockstep. */
const iceLen = (c: Ice, level: number) => c.len * smooth((level - c.delay) / (1 - c.delay));

/** An icicle rooted at (x, y) pointing along `a`, with seeded timing, ripples and curve. */
function makeIce(rand: () => number, x: number, y: number, a: number, hw: number, len: number): Ice {
  return { x, y, a, hw, len, delay: rand() * 0.45, ph: rand() * TAU, bend: (rand() - 0.5) * 0.16 };
}

const STEPS = 10;
/**
 * Organic icicle: a tapered body with slow ripples (refrozen meltwater), a slight curve and a
 * rounded tip, filled with its own gradient so short icicles fade at their tips too.
 */
function drawIce(g: CanvasRenderingContext2D, c: Ice, len: number): void {
  if (len < 0.8) return;
  const ux = Math.cos(c.a);
  const uy = Math.sin(c.a);
  // perpendicular
  const px = -uy;
  const py = ux;
  const hw = c.hw * (0.55 + 0.45 * Math.min(1, len / 6)); // young icicles are thin buds
  const L: number[] = [];
  const R: number[] = [];
  for (let s = 0; s <= STEPS; s++) {
    const t = s / STEPS;
    const off = c.bend * len * t * t;
    const cx = c.x + ux * len * t + px * off;
    const cy = c.y + uy * len * t + py * off;
    // Concave taper (thick root, long thin tip), a fillet where it joins the rim, and ripples.
    const root = 1 + 0.7 * Math.max(0, 1 - t / 0.14) ** 2;
    const body = hw * root * Math.pow(1 - t, 1.45) * (1 + 0.35 * Math.sin(t * 13 + c.ph) * t * (1 - t));
    const w = Math.max(body, 0.55 * (1 - t)); // keep thin tails visible instead of fading to nothing
    L.push(cx + px * w, cy + py * w);
    R.push(cx - px * w, cy - py * w);
  }
  const tipX = L[STEPS * 2];
  const tipY = L[STEPS * 2 + 1];
  const grad = g.createLinearGradient(c.x, c.y, tipX, tipY);
  grad.addColorStop(0, ICE_TOP);
  grad.addColorStop(0.55, ICE_MID);
  grad.addColorStop(1, ICE_TIP);
  g.beginPath();
  g.moveTo(L[0], L[1]);
  // Quadratic curves through segment midpoints: a smooth outline, no visible corners.
  for (let s = 1; s < STEPS; s++) {
    g.quadraticCurveTo(L[s * 2], L[s * 2 + 1], (L[s * 2] + L[s * 2 + 2]) / 2, (L[s * 2 + 1] + L[s * 2 + 3]) / 2);
  }
  g.quadraticCurveTo(tipX + ux * hw * 0.15, tipY + uy * hw * 0.15, R[STEPS * 2], R[STEPS * 2 + 1]);
  for (let s = STEPS - 1; s > 0; s--) {
    g.quadraticCurveTo(R[s * 2], R[s * 2 + 1], (R[s * 2] + R[s * 2 - 2]) / 2, (R[s * 2 + 1] + R[s * 2 - 1]) / 2);
  }
  g.lineTo(R[0], R[1]);
  g.closePath();
  g.fillStyle = grad;
  g.fill();
  if (len < 5) return;
  // Soft specular streak down one side, fading out before the tip.
  const k = 0.4;
  const hx = (i: number) => L[i * 2] * (1 - k) + (L[i * 2] + R[i * 2]) / 2 * k;
  const hy = (i: number) => L[i * 2 + 1] * (1 - k) + (L[i * 2 + 1] + R[i * 2 + 1]) / 2 * k;
  const hl = g.createLinearGradient(c.x, c.y, tipX, tipY);
  hl.addColorStop(0, 'rgba(255,255,255,0.75)');
  hl.addColorStop(0.6, 'rgba(255,255,255,0)');
  g.beginPath();
  g.moveTo(hx(1), hy(1));
  g.quadraticCurveTo(hx(3), hy(3), hx(6), hy(6));
  g.strokeStyle = hl;
  g.lineWidth = Math.max(0.6, hw * 0.3);
  g.lineCap = 'round';
  g.stroke();
}

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

/** Per-element snow cap, plus icicles hanging from the element's bottom edge. */
interface Cap {
  cv: HTMLCanvasElement;
  ice: HTMLCanvasElement;
  icicles: Ice[];
  w: number;
  radius: number;
}

/**
 * Winter scene for an effect: an accumulating snow bank, frost creeping in from the corners,
 * icicles along the top edge (with occasional drips) and slanting in from the side edges,
 * and snow caps with small icicles on chosen elements.
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

  // icicles: along the top edge (these drip) and slanting in from the side edges
  private ice: Ice[] = [];
  private side: Ice[] = [];
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
  private caps: Cap[] = [];
  private rects = new Float32Array(0); // x, y, w, h per element
  private capsDirty = true;
  private capsAge = 0;
  private capsH = -1;
  private capsL = -1; // level the caps and their icicles were last painted at
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
    // Repaint the static layer in ~200 steps over the build-up (a few per second, each well under a
    // pixel of growth) rather than every frame. Coarser steps made the ice visibly jump.
    if (this.painted >= 0 && this.level - this.painted < 0.005 && this.level < 1) return;
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
    if (this.spec.icicles) this.paintIcicles(g, l, this.level);
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
    const { w, h } = this;
    const maxLen = Math.min(56, h * 0.09);
    this.ice = [];
    for (let x = rand() * 10; x < w; ) {
      const hw = 2 + rand() * 3.5;
      // Clustered lengths: long ones bunch together like on a real eave.
      const cluster = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(x * 0.017 + this.phase[0]));
      const len = (0.15 + 0.85 * rand() ** 1.8) * cluster * maxLen;
      this.ice.push(makeIce(rand, x, 2.5, Math.PI / 2 + (rand() - 0.5) * 0.06, hw, len));
      x += hw * 2 * (0.7 + rand() * 1.8);
    }
    // Side edges: shorter, sparser icicles slanting down and inward, thinning out toward the bottom.
    this.side = [];
    const sideLen = Math.min(46, w * 0.07);
    for (const dir of [1, -1]) {
      for (let y = 10 + rand() * 20; y < h * 0.8; ) {
        const fade = 1 - y / (h * 0.8);
        const len = (0.3 + 0.7 * rand()) * (0.35 + 0.65 * fade) * sideLen;
        const tilt = 0.08 + rand() * 0.22; // hangs nearly straight down, leaning off the edge
        const a = Math.PI / 2 - dir * tilt;
        this.side.push(makeIce(rand, dir > 0 ? 1 : w - 1, y, a, 2 + rand() * 1.8, len));
        y += 14 + rand() * 34 + (1 - fade) * 30;
      }
    }
    this.drop = dot(this.dpr, 1.6, false);
  }

  private paintIcicles(g: CanvasRenderingContext2D, l: number, level: number): void {
    const { w, h } = this;
    const rim = 3 + 3 * l;
    // Snow rim along the top edge the icicles hang from.
    g.beginPath();
    g.moveTo(0, 0);
    for (let x = 0; x <= w + 6; x += 6) g.lineTo(x, rim * (0.7 + 0.3 * Math.sin(x * 0.05 + this.phase[1])));
    g.lineTo(w, 0);
    g.closePath();
    g.fillStyle = RIM;
    g.fill();
    // A thin glaze of ice down each side edge, thickest at the top.
    const glaze = 1 + 2.5 * l;
    g.fillStyle = 'rgba(225,240,255,0.55)';
    for (const side of [0, 1]) {
      g.beginPath();
      const ex = side ? w : 0;
      const s = side ? -1 : 1;
      g.moveTo(ex, 0);
      for (let y = 0; y <= h * 0.85; y += 8) {
        const t = 1 - y / (h * 0.85);
        g.lineTo(ex + s * glaze * t * (0.7 + 0.3 * Math.sin(y * 0.04 + this.phase[side + 1])), y);
      }
      g.lineTo(ex, h * 0.85);
      g.closePath();
      g.fill();
    }
    for (const c of this.side) drawIce(g, c, iceLen(c, level));
    for (const c of this.ice) drawIce(g, c, iceLen(c, level));
  }

  private tickDrips(dt: number): void {
    const n = this.ice.length;
    if (!n || this.level < 0.6) return;
    if ((this.dripIn -= dt) <= 0) {
      this.dripIn = 0.8 + Math.random() * 2.4;
      for (let d = 0; d < DRIPS; d++) {
        if (this.dl[d] > 0) continue;
        const c = this.ice[(Math.random() * n) | 0];
        const len = iceLen(c, this.level);
        if (len < 20) break; // only long icicles drip
        // Start at the (curved) tip.
        this.dx[d] = c.x + Math.cos(c.a) * len - Math.sin(c.a) * c.bend * len;
        this.dy[d] = c.y + Math.sin(c.a) * len + Math.cos(c.a) * c.bend * len;
        this.dv[d] = 0;
        this.dl[d] = 1.4;
        break;
      }
    }
    for (let d = 0; d < DRIPS; d++) {
      if (this.dl[d] <= 0) continue;
      this.dl[d] -= dt;
      if (this.dl[d] < 0.6) {
        // swell at the tip for a moment, then fall
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
    this.caps = els.map(() => ({ cv: newCanvas(), ice: newCanvas(), icicles: [], w: -1, radius: 0 }));
    this.rects = new Float32Array(els.length * 4);
    this.capsDirty = true;
    this.capsH = -1;
    this.capsL = -1;
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
    // Small steps while growing so caps and their icicles build up smoothly.
    const repaintAll = this.level - this.capsL >= 0.01 || (this.level === 1 && this.capsL < 1);
    if (repaintAll) {
      this.capsH = H;
      this.capsL = this.level;
    }
    for (let i = 0; i < this.els.length; i++) {
      const el = this.els[i];
      const r = el.getBoundingClientRect();
      const q = i * 4;
      this.rects[q] = r.left - o.left;
      this.rects[q + 1] = r.top - o.top;
      this.rects[q + 2] = el.isConnected ? r.width : 0;
      this.rects[q + 3] = r.height;
      const cap = this.caps[i];
      if (repaintAll || Math.abs(cap.w - r.width) >= 1) this.paintCap(cap, el, r.width, i);
    }
  }

  private paintCap(cap: Cap, el: HTMLElement, w: number, index: number): void {
    if (cap.w < 0) cap.radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
    if (Math.abs(cap.w - w) >= 1) cap.icicles = this.genCapIce(w, cap.radius, index);
    cap.w = w;
    this.paintCapIce(cap, w);
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

  /** Small icicles along an element's bottom edge, kept clear of its rounded corners. */
  private genCapIce(w: number, radius: number, index: number): Ice[] {
    const rand = rng(this.seed ^ Math.imul(index + 1, 0x85ebca6b));
    const maxLen = Math.min(18, w * 0.09);
    const out: Ice[] = [];
    const x1 = w + 2 - radius * 0.6 - 3;
    for (let x = 2 + radius * 0.6 + 3 + rand() * 6; x < x1; ) {
      const hw = 0.9 + rand() * 1.6;
      out.push(makeIce(rand, x, 0.5, Math.PI / 2 + (rand() - 0.5) * 0.08, hw, (0.2 + 0.8 * rand() ** 1.6) * maxLen));
      x += 6 + rand() * 22;
    }
    return out;
  }

  private paintCapIce(cap: Cap, w: number): void {
    const { dpr } = this;
    const cv = cap.ice;
    cv.width = Math.max(1, Math.ceil((w + 4) * dpr));
    cv.height = Math.max(1, Math.ceil(22 * dpr));
    const g = cv.getContext('2d');
    if (!g || !cap.icicles.length) return;
    g.scale(dpr, dpr);
    for (const c of cap.icicles) drawIce(g, c, iceLen(c, this.level));
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
        // A bead swells at the tip, then detaches at full size.
        const s = this.dl[d] > 0.6 ? 0.25 + 0.75 * smooth((1.4 - this.dl[d]) / 0.8) : 1;
        const sh = half * s;
        ctx.drawImage(this.drop, this.dx[d] * dpr - sh, this.dy[d] * dpr - sh * 0.3, sh * 2, sh * 2);
      }
    }
    ctx.globalAlpha = 1;
    if (!this.els.length) return;
    if (this.capsDirty) this.readRects();
    for (let i = 0; i < this.els.length; i++) {
      const q = i * 4;
      const w = this.rects[q + 2];
      const y = this.rects[q + 1];
      const bottom = y + this.rects[q + 3];
      if (!w || bottom < -24 || y > h + 20) continue;
      const x = Math.round((this.rects[q] - 2) * dpr);
      const cap = this.caps[i];
      if (y > -20) ctx.drawImage(cap.cv, x, Math.round((y - this.capsH - 4) * dpr));
      if (cap.icicles.length && bottom < h) ctx.drawImage(cap.ice, x, Math.round(bottom * dpr));
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
