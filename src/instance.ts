import { guessTier, resolveOptions, TIERS, type Resolved, type Tier, type TierSpec } from './options';
import { resolveEffect } from './registry';
import { schedule, unschedule, type Tickable } from './scheduler';
import { bakeSprites, type Sprite } from './sprites';
import { depthOf, GROUPS, GROUPS_OF_LAYER, LAYERS, lerp, PARALLAX, Particles } from './store';
import type { EffectDefinition, EffectHandle, GroundLayer, Options, Stats } from './types';

/** Adaptive quality steps: particle-count scale per level. Level >= 2 also forces DPR 1. */
const COUNT_SCALE = [1, 0.75, 0.55, 0.4, 0.3];
const TAU = 6.283185307179586;

export class Instance implements Tickable, EffectHandle {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly host: HTMLElement | null;
  private readonly cleanups: Array<() => void> = [];
  private restorePosition = false;

  private def: EffectDefinition;
  private opts: Resolved;
  private tier: Tier = 'high';
  private spec: TierSpec = TIERS.high;
  private p: Particles = new Particles(0);
  private sprites: Sprite[] = [];
  private ground: GroundLayer | null = null;
  private groundSpec: unknown = undefined;

  private w = 0;
  private h = 0;
  private dpr = 0;
  private nColors = 0;
  private level = 0;
  private t = 0;

  private paused = false;
  private hidden = false;
  private onscreen = true;
  private reduced = false;
  private running = false;
  private destroyed = false;

  private acc = 0;
  private ema = 1 / 60;
  private over = 0;
  private under = 0;
  private upWait = 3;

  private mx = NaN;
  private my = NaN;
  private pointerOff: (() => void) | null = null;

  constructor(target: 'page' | HTMLElement, effect: string | EffectDefinition, options: Options = {}) {
    this.def = resolveEffect(effect);
    this.opts = resolveOptions(options);
    this.host = target === 'page' ? null : target;

    const c = (this.canvas = document.createElement('canvas'));
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `position:${this.host ? 'absolute' : 'fixed'};inset:0;top:0;left:0;width:100%;height:100%;pointer-events:none;display:block;border:0;margin:0;padding:0;border-radius:inherit`;
    this.ctx = c.getContext('2d', { alpha: true });

    if (this.host) {
      if (getComputedStyle(this.host).position === 'static') {
        this.host.style.position = 'relative';
        this.restorePosition = true;
      }
      this.host.appendChild(c);
      if (typeof ResizeObserver !== 'undefined') {
        const ro = new ResizeObserver(() => this.layout());
        ro.observe(this.host);
        this.cleanups.push(() => ro.disconnect());
      }
      if (typeof IntersectionObserver !== 'undefined') {
        const io = new IntersectionObserver((e) => {
          this.onscreen = e[e.length - 1].isIntersecting;
          this.sync();
        });
        io.observe(this.host);
        this.cleanups.push(() => io.disconnect());
      }
    } else {
      document.body.appendChild(c);
      this.listen(window, 'resize', () => this.layout());
    }

    this.listen(document, 'visibilitychange', () => {
      this.hidden = document.hidden;
      this.sync();
    });
    this.hidden = document.hidden;

    if (typeof matchMedia !== 'undefined') {
      const mql = matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = () => {
        this.reduced = this.opts.respectReducedMotion && mql.matches;
        this.layout();
      };
      // Safari < 14 only has addListener.
      if (mql.addEventListener) {
        mql.addEventListener('change', onChange);
        this.cleanups.push(() => mql.removeEventListener('change', onChange));
      } else {
        mql.addListener(onChange);
        this.cleanups.push(() => mql.removeListener(onChange));
      }
      this.reduced = this.opts.respectReducedMotion && mql.matches;
    }

    this.applyOptions(true);
    this.fadeIn();
  }

  // ---- public API -------------------------------------------------------

  update(options: Options): void {
    if (this.destroyed) return;
    const prev = this.opts;
    this.opts = resolveOptions(options, prev);
    this.reduced =
      this.opts.respectReducedMotion &&
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    const o = this.opts;
    this.applyOptions(
      o.quality !== prev.quality,
      o.colors !== prev.colors || o.size !== prev.size || o.opacity !== prev.opacity || o.ground !== prev.ground,
    );
  }

  pause(): void {
    this.paused = true;
    this.sync();
  }

  resume(): void {
    this.paused = false;
    this.sync();
  }

  switch(effect: string | EffectDefinition): void {
    if (this.destroyed) return;
    this.def = resolveEffect(effect);
    this.t = 0;
    this.layout(true, true);
    this.fadeIn();
  }

  /** Soft entrance; compositor-only (CSS opacity), skipped for reduced motion. */
  private fadeIn(): void {
    const s = this.canvas.style;
    if (this.reduced) return;
    s.transition = 'none';
    s.opacity = '0';
    void this.canvas.offsetWidth; // commit opacity 0 so the transition runs
    s.transition = 'opacity .9s ease-out';
    s.opacity = '';
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.running = false;
    unschedule(this);
    this.setPointer(false);
    for (const off of this.cleanups) off();
    this.cleanups.length = 0;
    this.canvas.remove();
    if (this.restorePosition && this.host) this.host.style.position = '';
    this.sprites = [];
    this.ground = null;
  }

  stats(): Stats {
    return {
      fps: Math.round(1 / this.ema),
      particles: this.p.n,
      quality: this.tier,
      level: this.level,
      dpr: this.dpr,
      running: this.running,
    };
  }

  // ---- frame ------------------------------------------------------------

  tick(dt: number): void {
    if (!this.canvas.isConnected) return this.destroy();
    const fps = this.opts.fps || this.spec.fps;
    this.acc += dt;
    if (this.acc < 1 / fps - 0.002) return;
    const frame = this.acc;
    this.acc = 0;
    this.adapt(frame, fps);
    const step = frame > 0.05 ? 0.05 : frame; // clamp so tab switches don't jump
    const t = (this.t += step);
    // Gusts: slow, detuned sines layered on the user's wind so motion never looks mechanical.
    const gust = (this.def.gust ?? 0.2) * (Math.sin(t * 0.31) * 0.6 + Math.sin(t * 0.87 + 1.3) * 0.4);
    this.p.windPx = (this.opts.wind + gust) * (this.def.windForce ?? 120);
    this.ground?.update(step);
    this.p.step(step, this.mx, this.my);
    this.draw(step);
  }

  private draw(dt: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const { canvas, p, dpr, sprites, def, t } = this;
    const W = canvas.width;
    const H = canvas.height;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);

    const { x, y, rot, spr, n } = p;
    const spinning = (def.spin ?? 0) > 0;
    const rotated = spinning || !!def.align;
    const tw = def.twinkle ?? 0;
    const driftMid = def.drift ? (def.drift[0] + def.drift[1]) / 2 : 0;
    let ac = 1;
    let as = 0;

    // Far layers first so near particles paint over them. Opacity is baked into sprites,
    // so globalAlpha only changes for twinkling effects (once per group, not per particle).
    for (let L = 0; L < LAYERS; L++) {
      if (def.align) {
        // Streaks point along their layer's actual motion (near layers slant more under wind).
        const vy = lerp(def.speed, depthOf(L)) * p.speedMul || 1;
        const a = -Math.atan2(driftMid + p.windPx * PARALLAX[L], vy);
        ac = Math.cos(a);
        as = Math.sin(a);
      }
      const groups = GROUPS_OF_LAYER[L];
      for (let g = 0; g < groups.length; g++) {
        const r = groups[g];
        if (tw) ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * tw * TAU + r * 1.9);
        for (let i = r; i < n; i += GROUPS) {
          const s = sprites[spr[i]];
          const hf = s.half;
          const X = x[i] * dpr;
          const Y = y[i] * dpr;
          if (X < -hf || Y < -hf || X > W + hf || Y > H + hf) continue;
          if (rotated) {
            if (spinning) {
              ac = Math.cos(rot[i]);
              as = Math.sin(rot[i]);
            }
            ctx.setTransform(ac, as, -as, ac, X, Y);
            ctx.drawImage(s.img, -hf, -hf);
          } else {
            ctx.drawImage(s.img, X - hf, Y - hf);
          }
        }
      }
      if (L === LAYERS - 2 && this.ground) {
        // Ground sits between the mid layers and the nearest one.
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ground.draw(ctx, t);
      }
    }
    if (def.overlay) {
      ctx.globalAlpha = 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      def.overlay(ctx, this.w, this.h, t, dt);
    }
  }

  /** Rolling frame-time average; step quality down after ~1s over budget, back up after a longer stretch with headroom. */
  private adapt(frame: number, fps: number): void {
    if (frame > 0.25) return; // tab switch / breakpoint, not a real frame
    this.ema += (frame - this.ema) * 0.1;
    if (this.opts.quality !== 'auto') return;
    const budget = 1 / fps;
    if (this.ema > budget * 1.35) {
      this.under = 0;
      if ((this.over += frame) > 1 && this.level < COUNT_SCALE.length - 1) {
        this.level++;
        this.over = 0;
        this.upWait = Math.min(this.upWait * 2, 60); // back off so we don't oscillate
        this.layout();
      }
    } else if (this.ema < budget * 1.1) {
      this.over = 0;
      if ((this.under += frame) > this.upWait && this.level > 0) {
        this.level--;
        this.under = 0;
        this.layout();
      }
    } else {
      this.over = this.under = 0;
    }
  }

  // ---- layout / state ---------------------------------------------------

  private applyOptions(tierChanged: boolean, rebake = false): void {
    const o = this.opts;
    if (tierChanged) {
      this.tier = o.quality === 'auto' ? guessTier() : o.quality;
      this.spec = TIERS[this.tier];
      this.level = 0;
      if (this.p.max !== this.spec.maxParticles) this.p = new Particles(this.spec.maxParticles);
    }
    const z = o.zIndex ?? (this.host ? undefined : 9999);
    this.canvas.style.zIndex = z === undefined ? '' : String(z);
    this.setPointer(o.interactive);
    this.layout(rebake || tierChanged, tierChanged);
  }

  private layout(rebake = false, respawn = false): void {
    if (this.destroyed) return;
    const host = this.host;
    if (host && !host.isConnected) return this.destroy();
    const w = host ? host.clientWidth : window.innerWidth;
    const h = host ? host.clientHeight : window.innerHeight;
    const maxDpr = this.level >= 2 ? 1 : this.spec.maxDpr;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const { canvas, p, def, opts } = this;

    let resized = false;
    if (rebake) {
      const want = !!def.ground && opts.ground;
      if (!want) this.ground = null;
      else if (!this.ground || this.groundSpec !== def.ground) {
        this.ground = def.ground!();
        resized = true;
      }
      this.groundSpec = def.ground;
    }
    if (w !== this.w || h !== this.h || dpr !== this.dpr) {
      resized = true;
      // Only touch canvas size when it changes: assigning it clears and reallocates the backing store.
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (dpr !== this.dpr) rebake = true;
      this.w = p.w = w;
      this.h = p.h = h;
      this.dpr = dpr;
    }

    const colors = opts.colors ?? def.colors;
    if (rebake) {
      this.sprites = bakeSprites(def, colors, opts.size, opts.opacity, dpr);
      canvas.style.background = def.backdrop ?? '';
    }
    if (this.ground && resized && w > 0 && h > 0) this.ground.resize(w, h, dpr);
    if (this.ground && this.reduced) this.ground.fill();
    p.floor = this.ground ? this.ground.floor : null;
    p.configure(def, colors.length, opts.size, opts.speed);
    p.windPx = opts.wind * (def.windForce ?? 120);

    // Sprite indices depend on the color count; if it changed, existing particles point at the wrong sprites.
    if (colors.length !== this.nColors) respawn = true;
    this.nColors = colors.length;
    const fill = respawn || p.n === 0;
    if (respawn) p.n = 0;
    // Particle budget scales with area, capped by tier and adaptive level.
    const want = Math.round(((opts.intensity * w * h) / 10000) * def.density);
    p.setCount(Math.round(Math.min(want, this.spec.maxParticles) * COUNT_SCALE[this.level]), fill);

    this.sync();
    if (this.reduced) this.draw(0); // one static frame, no animation
  }

  private sync(): void {
    const should =
      !this.destroyed &&
      !this.paused &&
      !(this.hidden && this.opts.pauseWhenHidden) &&
      this.onscreen &&
      !this.reduced &&
      this.w > 0 &&
      this.h > 0 &&
      !!this.ctx;
    if (should === this.running) return;
    this.running = should;
    if (should) {
      this.acc = 0;
      schedule(this);
    } else {
      unschedule(this);
    }
    if (this.host && !this.host.isConnected) this.destroy();
  }

  private setPointer(on: boolean): void {
    if (on && !this.pointerOff) {
      const move = (e: PointerEvent) => {
        const r = this.canvas.getBoundingClientRect();
        this.mx = e.clientX - r.left;
        this.my = e.clientY - r.top;
      };
      const leave = () => (this.mx = this.my = NaN);
      window.addEventListener('pointermove', move, { passive: true });
      document.documentElement.addEventListener('pointerleave', leave);
      this.pointerOff = () => {
        window.removeEventListener('pointermove', move);
        document.documentElement.removeEventListener('pointerleave', leave);
      };
    } else if (!on && this.pointerOff) {
      this.pointerOff();
      this.pointerOff = null;
      this.mx = this.my = NaN;
    }
  }

  private listen(t: EventTarget, type: string, fn: EventListener): void {
    t.addEventListener(type, fn);
    this.cleanups.push(() => t.removeEventListener(type, fn));
  }
}
