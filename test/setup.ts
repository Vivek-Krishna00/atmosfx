// jsdom has no canvas, observers, matchMedia or a real rAF. Minimal, countable stubs.
import { vi } from 'vitest';

const ctx = new Proxy({} as Record<string | symbol, unknown>, {
  get: (t, k) => (k in t ? t[k] : () => ({ addColorStop() {} })),
  set: (t, k, v) => ((t[k] = v), true),
});
HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as never;

export const observers = { live: 0 };
class FakeObserver {
  static all: FakeObserver[] = [];
  cb: (e: unknown[]) => void;
  targets = new Set<Element>();
  constructor(cb: (e: unknown[]) => void) {
    this.cb = cb;
    FakeObserver.all.push(this);
  }
  observe(el: Element) {
    if (!this.targets.size) observers.live++;
    this.targets.add(el);
  }
  disconnect() {
    if (this.targets.size) observers.live--;
    this.targets.clear();
  }
  unobserve(el: Element) {
    this.targets.delete(el);
  }
}
(globalThis as Record<string, unknown>).ResizeObserver = FakeObserver;
(globalThis as Record<string, unknown>).IntersectionObserver = FakeObserver;

export const media = { reduce: false, listeners: 0 };
window.matchMedia = ((q: string) => ({
  media: q,
  get matches() {
    return media.reduce;
  },
  addEventListener: () => media.listeners++,
  removeEventListener: () => media.listeners--,
})) as never;

// Manual rAF so tests can step frames deterministically.
export const frames = new Map<number, FrameRequestCallback>();
let id = 0;
window.requestAnimationFrame = (cb) => (frames.set(++id, cb), id);
window.cancelAnimationFrame = (h) => void frames.delete(h);
export function flushFrame(now: number) {
  const cbs = [...frames.values()];
  frames.clear();
  cbs.forEach((cb) => cb(now));
}

// Sized hosts: jsdom has no layout.
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get() { return Number(this.dataset.w ?? 0); } });
Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return Number(this.dataset.h ?? 0); } });
