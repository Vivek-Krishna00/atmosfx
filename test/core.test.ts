import { afterEach, describe, expect, it, vi } from 'vitest';
import { Effects, registerEffect, rain, schedulerState, snow } from '../src/index';
import { resolveOptions, validateEffect } from '../src/options';
import { schedule, unschedule } from '../src/scheduler';
import { Particles } from '../src/store';
import { flushFrame, frames, media, observers } from './setup';

const box = (w = 400, h = 300) => {
  const el = document.createElement('div');
  el.dataset.w = String(w);
  el.dataset.h = String(h);
  document.body.appendChild(el);
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
  media.reduce = false;
});

describe('particle recycler', () => {
  it('keeps every particle near the area and the count constant over many frames', () => {
    const p = new Particles(100);
    p.w = 300;
    p.h = 200;
    p.configure(snow, 3, 1, 1);
    p.windPx = 70;
    p.setCount(100, true);
    for (let f = 0; f < 2000; f++) p.step(0.05, NaN, NaN);
    expect(p.n).toBe(100);
    const far = 300 * 3; // spawn may start upwind, but never unboundedly far
    for (let i = 0; i < p.n; i++) {
      expect(p.y[i]).toBeGreaterThanOrEqual(-2 * p.pad - 1);
      expect(p.y[i]).toBeLessThanOrEqual(p.h + p.pad + 1);
      expect(Math.abs(p.x[i])).toBeLessThan(far);
    }
  });

  it('never allocates past its max', () => {
    const p = new Particles(10);
    p.setCount(500);
    expect(p.n).toBe(10);
    p.setCount(-3);
    expect(p.n).toBe(0);
  });
});

describe('options', () => {
  it('clamps numbers and keeps defaults', () => {
    const o = resolveOptions({ intensity: 7, wind: -9, speed: NaN });
    expect(o.intensity).toBe(1);
    expect(o.wind).toBe(-1);
    expect(o.speed).toBe(1);
    expect(o.respectReducedMotion).toBe(true);
    expect(o.pauseWhenHidden).toBe(true);
    expect(o.interactive).toBe(false);
  });
  it('rejects bad quality and colors', () => {
    expect(() => resolveOptions({ quality: 'ultra' as never })).toThrow(/quality/);
    expect(() => resolveOptions({ colors: 'red' as never })).toThrow(/colors/);
  });
  it('validates effect definitions', () => {
    expect(() => validateEffect('x', { ...snow, size: [5, 1] })).toThrow(/size/);
    expect(() => validateEffect('x', { ...snow, colors: [] })).toThrow(/colors/);
    expect(() => validateEffect('x', { ...snow, density: 0 })).toThrow(/density/);
    expect(() => registerEffect('bad', { ...snow, draw: 1 as never })).toThrow(/draw/);
    expect(() => validateEffect('x', rain)).not.toThrow();
  });
});

describe('scheduler', () => {
  it('runs one loop for many instances and stops when empty', () => {
    const a = { tick: vi.fn() };
    const b = { tick: vi.fn() };
    schedule(a);
    schedule(b);
    expect(frames.size).toBe(1);
    flushFrame(16);
    expect(a.tick).toHaveBeenCalledTimes(1);
    expect(b.tick).toHaveBeenCalledTimes(1);
    unschedule(a);
    expect(schedulerState().running).toBe(true);
    unschedule(b);
    expect(schedulerState()).toEqual({ running: false, size: 0 });
    expect(frames.size).toBe(0);
  });
});

describe('mount / destroy', () => {
  it('scopes a canvas inside an element and cleans up completely', () => {
    const el = box();
    const add = vi.spyOn(window, 'addEventListener');
    const rem = vi.spyOn(window, 'removeEventListener');
    const dadd = vi.spyOn(document, 'addEventListener');
    const drem = vi.spyOn(document, 'removeEventListener');

    const fx = Effects.mount(el, 'snow', { interactive: true });
    const canvas = el.querySelector('canvas')!;
    expect(canvas.getAttribute('aria-hidden')).toBe('true');
    expect(canvas.style.pointerEvents).toBe('none');
    expect(canvas.style.position).toBe('absolute');
    expect(el.style.position).toBe('relative');
    expect(fx.stats().running).toBe(true);
    expect(fx.stats().particles).toBeGreaterThan(0);
    flushFrame(16);
    flushFrame(33);

    fx.destroy();
    expect(el.querySelector('canvas')).toBeNull();
    expect(el.style.position).toBe('');
    expect(add.mock.calls.length).toBe(rem.mock.calls.length);
    expect(dadd.mock.calls.length).toBe(drem.mock.calls.length);
    expect(observers.live).toBe(0);
    expect(media.listeners).toBe(0);
    expect(schedulerState().size).toBe(0);
    fx.destroy(); // idempotent
    vi.restoreAllMocks();
  });

  it('runs page + element instances together on one loop', () => {
    const page = Effects.mount('page', 'snow');
    const card = Effects.mount(box(), rain);
    expect(schedulerState().size).toBe(2);
    expect(frames.size).toBe(1);
    page.destroy();
    card.destroy();
    expect(schedulerState().running).toBe(false);
  });

  it('survives rapid mount/destroy, zero-size hosts and element removal', () => {
    const el = box();
    for (let i = 0; i < 50; i++) Effects.mount(el, 'rain').destroy();
    expect(el.querySelectorAll('canvas').length).toBe(0);

    const empty = Effects.mount(box(0, 0), 'snow');
    expect(empty.stats().running).toBe(false);
    empty.destroy();

    const fx = Effects.mount(el, 'snow');
    el.remove();
    flushFrame(16);
    expect(fx.stats().running).toBe(false);
    expect(schedulerState().size).toBe(0);
    expect(observers.live).toBe(0);
  });

  it('pause/resume/switch/update', () => {
    const fx = Effects.mount(box(), 'snow', { quality: 'low' });
    fx.pause();
    expect(fx.stats().running).toBe(false);
    fx.resume();
    expect(fx.stats().running).toBe(true);
    fx.switch('rain');
    fx.update({ intensity: 1, wind: 0.5 });
    expect(fx.stats().particles).toBeLessThanOrEqual(80);
    expect(fx.stats().dpr).toBe(1);
    fx.destroy();
  });

  it('honors prefers-reduced-motion with a static frame and no loop', () => {
    media.reduce = true;
    const fx = Effects.mount(box(), 'snow');
    expect(fx.stats().running).toBe(false);
    expect(fx.stats().particles).toBeGreaterThan(0);
    fx.destroy();
  });

  it('throws on unknown effects and missing targets', () => {
    expect(() => Effects.mount(box(), 'nope')).toThrow(/unknown effect/);
    expect(() => Effects.mount('#missing', 'snow')).toThrow(/not found/);
  });
});

describe('adaptive quality', () => {
  it('steps down after ~1s of slow frames and back up after sustained headroom', () => {
    const fx = Effects.mount(box(1200, 800), 'snow', { quality: 'high', intensity: 1 });
    fx.update({ quality: 'auto' });
    const tick = (dt: number, secs: number) => {
      for (let t = 0; t < secs; t += dt) (fx as unknown as { tick(d: number): void }).tick(dt);
    };
    const before = fx.stats().particles;
    tick(0.045, 2); // ~22 fps against a 60 fps budget
    expect(fx.stats().level).toBeGreaterThan(0);
    expect(fx.stats().particles).toBeLessThan(before);
    tick(1 / 60, 30);
    expect(fx.stats().level).toBe(0);
    fx.destroy();
  });
});

describe('speed option', () => {
  it('scales fall speed live via update()', () => {
    const fx = Effects.mount(box(400, 4000), 'snow', { speed: 1 });
    const p = (fx as unknown as { p: Particles }).p;
    const fall = () => {
      const y0 = Float32Array.from(p.y);
      p.step(0.016, NaN, NaN);
      let s = 0;
      for (let i = 0; i < p.n; i++) s += p.y[i] - y0[i];
      return s;
    };
    const base = fall();
    fx.update({ speed: 2.5 });
    expect(fall() / base).toBeCloseTo(2.5, 1);
    fx.destroy();
  });
});

describe('winter ground', () => {
  it('builds up a snow bank, lands far flakes in it, and can be turned off', () => {
    const fx = Effects.mount(box(800, 600), 'winter', { intensity: 1 });
    const inst = fx as unknown as { p: Particles; ground: unknown; tick(d: number): void };
    for (let i = 0; i < 60 * 30; i++) inst.tick(1 / 60);
    const floor = inst.p.floor!;
    expect(floor.length).toBeGreaterThan(0);
    expect(Math.max(...floor)).toBeGreaterThan(30);
    expect(Math.max(...floor)).toBeLessThanOrEqual(46);
    fx.update({ ground: false });
    expect(inst.ground).toBeNull();
    expect(inst.p.floor).toBeNull();
    fx.destroy();
  });
});

describe('winter scene', () => {
  it('adds a static layer + cap scroll listener and removes everything on destroy', () => {
    const card = box(300, 200);
    card.className = 'card';
    const add = vi.spyOn(window, 'addEventListener');
    const rem = vi.spyOn(window, 'removeEventListener');
    const fx = Effects.mount('page', 'winter', { settleOn: '.card' });
    expect(document.querySelectorAll('canvas').length).toBe(2); // particles + static scene layer
    for (let i = 0; i < 120; i++) (fx as unknown as { tick(d: number): void }).tick(1 / 60);
    fx.update({ settleOn: undefined });
    expect(document.querySelectorAll('canvas').length).toBe(2); // static layer survives losing cap targets
    fx.update({ settleOn: card });
    fx.destroy();
    expect(document.querySelectorAll('canvas').length).toBe(0);
    expect(add.mock.calls.length).toBe(rem.mock.calls.length);
    vi.restoreAllMocks();
  });
});
