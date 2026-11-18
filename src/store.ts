import { FLOOR_COL } from './ground';
import type { EffectDefinition, Range } from './types';

/** Depth layers, far (0) to near (LAYERS-1). Each layer gets its own baked sprites. */
export const LAYERS = 4;
/** Particle i lives in layer LAYER_OF[i % GROUPS]: 40% far, 30%, 20%, 10% near. Deterministic, so drawing far→near needs no sort. */
export const GROUPS = 10;
export const LAYER_OF = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3] as const;
/** Residue groups per layer, for the draw loop. */
export const GROUPS_OF_LAYER: readonly (readonly number[])[] = [[0, 1, 2, 3], [4, 5, 6], [7, 8], [9]];
export const depthOf = (layer: number) => layer / (LAYERS - 1);
/** Parallax: how strongly sway and wind move a layer on screen. */
export const PARALLAX = [0.35, 0.57, 0.78, 1] as const;

const TAU = 6.283185307179586;
/** Cursor influence radius (CSS px). */
const CURSOR_R = 150;
/** Outward push around the cursor, px/s² at the center. */
const PUSH = 900;
/** How much of the cursor's velocity is passed on as wake, per second at the center. */
const DRAG = 6;
/** Cap on kick speed so a flick can't fling particles off at absurd speed. */
const KICK_MAX = 700;

export const lerp = (r: Range, t: number) => r[0] + (r[1] - r[0]) * t;

/**
 * Structure-of-arrays particle store. Allocated once at the tier's hard max;
 * `n` is the live count. Nothing in `step` allocates.
 */
export class Particles {
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  readonly rot: Float32Array;
  readonly spin: Float32Array;
  readonly phase: Float32Array;
  /** Momentum from the cursor (px/s), decays back to 0 so particles resume their normal motion. */
  readonly kx: Float32Array;
  readonly ky: Float32Array;
  /** Sprite index = layer * nColors + colorIndex. */
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
  /** Wind in px/s for the nearest layer (includes gusts; set every frame by the instance). */
  windPx = 0;
  /** Ground surface height per FLOOR_COL column; far/mid falling particles land in it. */
  floor: Float32Array | null = null;

  constructor(readonly max: number) {
    this.x = new Float32Array(max);
    this.y = new Float32Array(max);
    this.vx = new Float32Array(max);
    this.vy = new Float32Array(max);
    this.rot = new Float32Array(max);
    this.spin = new Float32Array(max);
    this.phase = new Float32Array(max);
    this.kx = new Float32Array(max);
    this.ky = new Float32Array(max);
    this.spr = new Uint8Array(max);
  }

  configure(def: EffectDefinition, nColors: number, sizeMul: number, speedMul: number): void {
    this.speed = def.speed;
    this.drift = def.drift;
    this.sway = def.sway ?? 0;
    this.spinMax = def.spin ?? 0;
    this.nColors = nColors;
    this.pad = Math.max(def.size[0], def.size[1]) * sizeMul + 4;
    this.speedMul = speedMul;
  }

  /** Reset particle i. `anywhere` scatters it over the area (initial fill); otherwise it enters from the edge it falls/rises from. */
  spawn(i: number, anywhere: boolean): void {
    const layer = LAYER_OF[i % GROUPS];
    this.spr[i] = layer * this.nColors + ((Math.random() * this.nColors) | 0);
    // Speed follows depth (parallax) with a little jitter so a layer doesn't move in lockstep.
    const d = Math.min(1, Math.max(0, depthOf(layer) + (Math.random() - 0.5) * 0.3));
    const vy = lerp(this.speed, d);
    const vx = this.drift ? lerp(this.drift, Math.random()) : 0;
    this.vy[i] = vy;
    this.vx[i] = vx;
    this.phase[i] = Math.random() * TAU;
    this.kx[i] = this.ky[i] = 0;
    this.rot[i] = Math.random() * TAU;
    this.spin[i] = (Math.random() * 2 - 1) * this.spinMax;
    const { w, h, pad } = this;
    if (anywhere || vy === 0) {
      this.x[i] = Math.random() * w;
      this.y[i] = Math.random() * h;
    } else {
      // Pick x so the particle's slanted path actually crosses the area.
      const hx = vx + this.windPx * PARALLAX[layer];
      const across = (hx * (h + 2 * pad)) / (Math.abs(vy) * this.speedMul || 1);
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

  /**
   * Advance all particles. `mx`/`my` is the cursor (NaN when there is none) and `pvx`/`pvy` its
   * velocity in px/s. Near the cursor particles get pushed out and dragged along its motion; that
   * momentum decays, so they swirl and then settle back into their normal motion.
   */
  step(dt: number, mx: number, my: number, pvx = 0, pvy = 0): void {
    const { x, y, vx, vy, kx, ky, rot, spin, phase, n, w, h, pad, sway, speedMul, windPx, floor } = this;
    const cols = floor ? floor.length : 0;
    const spinning = this.spinMax > 0;
    const cursor = mx === mx;
    const R2 = CURSOR_R * CURSOR_R;
    const decay = Math.exp(-dt * 1.6);
    const sweep = Math.sqrt(pvx * pvx + pvy * pvy);
    for (let i = 0; i < n; i++) {
      const layer = LAYER_OF[i % GROUPS];
      const k = PARALLAX[layer];
      const ph = (phase[i] += dt * (0.5 + (i & 3) * 0.22));
      const hx = vx[i] + windPx * k;
      // Two detuned sines read as organic flutter rather than a metronome.
      const px = (x[i] += (hx + (Math.sin(ph) + 0.35 * Math.sin(ph * 2.3 + 1)) * sway * k + kx[i]) * dt);
      const py = (y[i] += (vy[i] * speedMul + ky[i]) * dt);
      kx[i] *= decay;
      ky[i] *= decay;
      if (spinning) rot[i] += spin[i] * dt;
      if (cursor) {
        const dx = px - mx;
        const dy = py - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const t = 1 - d / CURSOR_R;
          const f = t * t * k * dt; // smooth falloff; near layers react more (parallax)
          let ax = kx[i] + (pvx * DRAG + (dx / d) * PUSH) * f;
          let ay = ky[i] + (pvy * DRAG + (dy / d) * PUSH) * f;
          const s2 = ax * ax + ay * ay;
          if (s2 > KICK_MAX * KICK_MAX) {
            const sc = KICK_MAX / Math.sqrt(s2);
            ax *= sc;
            ay *= sc;
          }
          kx[i] = ax;
          ky[i] = ay;
          // A sweep spins petals/leaves/confetti faster and speeds up their flip.
          const twirl = sweep * t * k * dt * 0.012;
          if (spinning) rot[i] += twirl * (spin[i] < 0 ? -1 : 1);
          phase[i] += twirl;
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
      } else if (cols && vy[i] > 0 && layer < LAYERS - 1) {
        // Land in the ground bank (the nearest layer is in front of it and falls past).
        const c = (px / FLOOR_COL) | 0;
        if (c >= 0 && c < cols && py > h - floor![c]) this.spawn(i, false);
      }
    }
  }
}
