/** Anything the shared loop drives. `dt` is the raw frame interval in seconds (unclamped). */
export interface Tickable {
  tick(dt: number, now: number): void;
}

const active = new Set<Tickable>();
let raf = 0;
let last = 0;
let frameDt = 0;
let frameNow = 0;

const run = (t: Tickable) => t.tick(frameDt, frameNow);

function loop(now: number) {
  frameDt = (now - last) / 1000;
  frameNow = now;
  last = now;
  active.forEach(run);
  raf = active.size ? requestAnimationFrame(loop) : 0;
}

export function schedule(t: Tickable): void {
  active.add(t);
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
}

export function unschedule(t: Tickable): void {
  active.delete(t);
  if (!active.size && raf) {
    cancelAnimationFrame(raf);
    raf = 0;
  }
}

/** For tests and the bench page. */
export const schedulerState = () => ({ running: raf !== 0, size: active.size });
