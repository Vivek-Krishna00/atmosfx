import type { EffectDefinition, Range } from './types';

export const SIZE_BUCKETS = 3;
export const ALPHA_BUCKETS = 3;
const TAU = 6.283185307179586;
const REPEL_RADIUS = 90;
const REPEL_FORCE = 260;

const lerp = (r: Range, t: number) => r[0] + (r[1] - r[0]) * t;

/**
 * Structure-of-arrays particle store. Allocated once at the tier's hard max;
 * `n` is the live count. Nothing in `step` allocates.
 * Particle i always uses alpha bucket i % ALPHA_BUCKETS, so drawing can batch by
 * alpha without sorting.
 */
export class Particles {
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly rot: Float32Array;
  readonly spin: Float32Array;
  readonly phase: Float32Array;
  /** Sprite index = sizeBucket * nColors + colorBucket. */
  readonly spr: Uint8Array;
  n = 0;
  w = 0;
  h = 0;

  private speed: Range = [0, 0];
  private drift: Range | undefined;
  private sway = 0;
  private spinMax = 0;
  private nColors = 1;
  /** Off-screen margin in CSS px (≈ largest sprite radius). */
  pad = 20;
  speedMul = 1;
  windPx = 0;

  constructor(readonly max: number) {
    this.x = new Float32Array(max);
    this.y = new Float32Array(max);
    this.vx = new Float32Array(max);
    this.vy = new Float32Array(max);
    this.rot = new Float32Array(max);
    this.spin = new Float32Array(max);
    this.phase = new Float32Array(max);
    this.spr = new Uint8Array(max);
  }

  configure(def: EffectDefinition, nColors: number, sizeMul: number, speedMul: number, wind: number): void {
    this.speed = def.speed;
    this.drift = def.drift;
    this.sway = def.sway ?? 0;
    this.spinMax = def.spin ?? 0;
    this.nColors = nColors;
    this.pad = def.size[1] * sizeMul + 4;
    this.speedMul = speedMul;
    this.windPx = wind * (def.windForce ?? 120);
  }

  /** Reset particle i. `anywhere` scatters it over the area (initial fill); otherwise it enters from the edge it falls/rises from. */
  spawn(i: number, anywhere: boolean): void {
    const sb = (Math.random() * SIZE_BUCKETS) | 0;
    this.spr[i] = sb * this.nColors + ((Math.random() * this.nColors) | 0);
    // Bigger buckets move faster: cheap parallax.
    const vy = lerp(this.speed, (sb + Math.random()) / SIZE_BUCKETS);
    const vx = this.drift ? lerp(this.drift, Math.random()) : 0;
    this.vy[i] = vy;
    this.vx[i] = vx;
    this.phase[i] = Math.random() * TAU;
    this.rot[i] = Math.random() * TAU;
    this.spin[i] = (Math.random() * 2 - 1) * this.spinMax;
    const { w, h, pad } = this;
    if (anywhere || vy === 0) {
      this.x[i] = Math.random() * w;
      this.y[i] = Math.random() * h;
    } else {
      // Pick x so the particle's slanted path actually crosses the area.
      const across = ((vx + this.windPx) * (h + 2 * pad)) / (Math.abs(vy) * this.speedMul || 1);
      this.x[i] = Math.random() * (w + Math.abs(across)) - Math.max(across, 0);
      this.y[i] = vy > 0 ? -pad : h + pad;
    }
  }

  /** Grow/shrink the live count. New particles enter from the edge unless `anywhere`. */
  setCount(target: number, anywhere = false): void {
    target = Math.max(0, Math.min(this.max, target | 0));
    for (let i = this.n; i < target; i++) this.spawn(i, anywhere);
    this.n = target;
  }

  /** Advance all particles. `mx` is NaN when there is no pointer to avoid. */
  step(dt: number, mx: number, my: number): void {
    const { x, y, vx, vy, rot, spin, phase, n, w, h, pad, sway, speedMul, windPx } = this;
    const spinning = this.spinMax > 0;
    const repel = mx === mx;
    const R2 = REPEL_RADIUS * REPEL_RADIUS;
    for (let i = 0; i < n; i++) {
      const ph = (phase[i] += dt * (0.6 + (i & 3) * 0.25));
      const hx = vx[i] + windPx;
      let px = (x[i] += (hx + Math.sin(ph) * sway) * dt);
      let py = (y[i] += vy[i] * speedMul * dt);
      if (spinning) rot[i] += spin[i] * dt;
      if (repel) {
        const dx = px - mx;
        const dy = py - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = ((1 - d / REPEL_RADIUS) * REPEL_FORCE * dt) / d;
          px = x[i] += dx * f;
          py = y[i] += dy * f;
        }
      }
      if (vy[i] === 0) {
        // Floating effects wrap around instead of respawning.
        if (px < -pad) x[i] += w + 2 * pad;
        else if (px > w + pad) x[i] -= w + 2 * pad;
        if (py < -pad) y[i] += h + 2 * pad;
        else if (py > h + pad) y[i] -= h + 2 * pad;
      } else if (
        py > h + pad ||
        py < -pad - (vy[i] > 0 ? pad : 0) ||
        (px < -pad && hx <= 0) ||
        (px > w + pad && hx >= 0)
      ) {
        this.spawn(i, false);
      }
    }
  }
}
