export type Range = readonly [min: number, max: number];
export type Quality = 'auto' | 'low' | 'medium' | 'high';

/**
 * An effect is plain data plus one sprite-drawing function.
 * `draw` runs once per (size, color) bucket onto an offscreen canvas, never per frame.
 */
/** A bank that builds up at the bottom of the area (e.g. snow). */
export interface GroundSpec {
  /** [top, bottom] fill colors. */
  colors: readonly [string, string];
  /** Max height in CSS px (also capped at 12% of the area height). */
  height: number;
  /** Seconds to reach full height. */
  grow: number;
  /** Occasional glints on the surface. Default true. */
  sparkle?: boolean;
  /** Icicles (with occasional drips) along the top edge. Default false. */
  icicles?: boolean;
  /** Frost creeping in from the corners. Default false. */
  frost?: boolean;
}

/** Per-instance ground state. Implemented by `bank()`; custom grounds can implement it too. */
export interface GroundLayer {
  /** Surface height (CSS px) per 8px column. */
  floor: Float32Array;
  resize(w: number, h: number, dpr: number): void;
  /** Jump to full height (reduced motion). */
  fill(): void;
  update(dt: number): void;
  /** Draw the moving parts, in device px with an identity transform. Runs every frame. */
  draw(ctx: CanvasRenderingContext2D, t: number): void;
  /** Called once with the effect's canvas (e.g. to add a static layer behind it). */
  attach?(canvas: HTMLCanvasElement): void;
  /** Elements (or selector) to put caps on; `exclude` is the effect's own host element. */
  settle?(target: Options['settleOn'], exclude: Element | null): void;
  /** Remove anything attach/settle added. */
  destroy?(): void;
}

export interface EffectDefinition {
  /**
   * Draw the particle centered at (0,0) within a box of radius `r`. fillStyle/strokeStyle are preset to `color`.
   * `depth` runs 0 (far) to 1 (near): use it for depth-of-field (blur near particles) or detail.
   * `index` is the color's position in the palette; use it to vary the shape (e.g. maple vs oval leaves).
   * Runs once per (depth layer × color) when sprites are baked, never per frame.
   */
  draw(ctx: CanvasRenderingContext2D, r: number, color: string, depth: number, index: number): void;
  /** Up to 5 colors; each becomes a sprite bucket. */
  colors: readonly string[];
  /** Sprite radius in CSS px, [far, near]. */
  size: Range;
  /** Vertical speed in px/s, [far, near] (either order). Positive falls, negative rises, 0 floats. */
  speed: Range;
  /** Base horizontal speed in px/s. */
  drift?: Range;
  /** Side-to-side sway amplitude in px/s. */
  sway?: number;
  /** Max spin in rad/s; enables per-particle rotation when > 0. */
  spin?: number;
  /**
   * Sprite box as [width, height] multiples of the radius. Default [1, 1]. Narrow boxes for
   * streaks (rain [0.2, 1]) or wide ones for banks (fog [1, 0.4]) skip drawing empty pixels.
   */
  box?: Range;
  /** 3D flip rate: sprites squash and flip like petals or leaves turning over. 0 = off. */
  flutter?: number;
  /** Canvas blend mode for the particles, e.g. 'lighter' for glowing light motes. */
  blend?: GlobalCompositeOperation;
  /** Frame-rate ceiling for slow effects (e.g. fog at 30). The user's `fps` option still wins. */
  fps?: number;
  /** Rotate every sprite to point along its fall direction (rain streaks). */
  align?: boolean;
  /** Opacity [far, near], baked into sprites. Either end may be larger (e.g. dim out-of-focus near particles). */
  opacity?: Range;
  /** Particles per 10,000 px² at intensity 1. */
  density: number;
  /** How strongly the `wind` option pushes this effect, in px/s at wind = 1. Default 120. */
  windForce?: number;
  /** Random gusts layered on `wind`, as a fraction of windForce. Default 0.2; 0 = steady. */
  gust?: number;
  /** Twinkle: particle groups pulse at about this rate (Hz). 0 = off. */
  twinkle?: number;
  /** Static CSS background for the effect's canvas (e.g. a frost vignette). Composited by the browser, zero per-frame cost. */
  backdrop?: string;
  /**
   * Accumulating bank at the bottom, e.g. `ground: bank({...})`. Far/mid particles land in it,
   * the nearest layer passes in front. A factory so the ground code is only bundled when used.
   */
  ground?: () => GroundLayer;
  /** Optional full-canvas overlay drawn after particles (e.g. lightning). Must not allocate. */
  overlay?(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number): void;
}

export interface Options {
  /** 0..1, scales particle count. Default 0.5. */
  intensity?: number;
  /** Speed multiplier. Default 1. */
  speed?: number;
  /** -1..1 horizontal wind. Default 0. */
  wind?: number;
  /** Override the effect's palette (max 5). */
  colors?: string[];
  /** Size multiplier. Default 1. */
  size?: number;
  zIndex?: number;
  /** 0..1 global opacity. Default 1. */
  opacity?: number;
  quality?: Quality;
  /** FPS cap. Default 60 (30 on low). */
  fps?: number;
  respectReducedMotion?: boolean;
  pauseWhenHidden?: boolean;
  /**
   * Particles react to the cursor (or a finger): they part around it and get swept along when it
   * moves, then settle back. Default false; the pointer listener is only attached while on.
   */
  interactive?: boolean;
  /** Show the effect's ground layer (e.g. winter's snow bank) if it has one. Default true. */
  ground?: boolean;
  /** Elements (or a CSS selector) that collect snow caps on their top edge, for effects with a ground. */
  settleOn?: string | Element | ArrayLike<Element>;
}

export interface Stats {
  fps: number;
  particles: number;
  quality: Exclude<Quality, 'auto'>;
  /** 0 = full, higher = adaptive quality has stepped down. */
  level: number;
  dpr: number;
  running: boolean;
}

export interface EffectHandle {
  update(opts: Options): void;
  pause(): void;
  resume(): void;
  switch(effect: string | EffectDefinition): void;
  destroy(): void;
  stats(): Stats;
}
