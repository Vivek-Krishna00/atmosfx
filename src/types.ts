export type Range = readonly [min: number, max: number];
export type Quality = 'auto' | 'low' | 'medium' | 'high';

/**
 * An effect is plain data plus one sprite-drawing function.
 * `draw` runs once per (size, color) bucket onto an offscreen canvas, never per frame.
 */
export interface EffectDefinition {
  /** Draw the particle centered at (0,0) within a box of radius `r`. fillStyle/strokeStyle are preset to `color`. */
  draw(ctx: CanvasRenderingContext2D, r: number, color: string): void;
  /** Up to 5 colors; each becomes a sprite bucket. */
  colors: readonly string[];
  /** Sprite radius in CSS px. */
  size: Range;
  /** Vertical speed in px/s. Positive falls, negative rises, 0 floats. */
  speed: Range;
  /** Base horizontal speed in px/s. */
  drift?: Range;
  /** Side-to-side sway amplitude in px/s. */
  sway?: number;
  /** Max spin in rad/s; enables per-particle rotation when > 0. */
  spin?: number;
  /** Rotate every sprite to point along its fall direction (rain streaks). */
  align?: boolean;
  /** Opacity range, quantized into 3 buckets. */
  opacity?: Range;
  /** Particles per 10,000 px² at intensity 1. */
  density: number;
  /** How strongly the `wind` option pushes this effect, in px/s at wind = 1. Default 120. */
  windForce?: number;
  /** Twinkle: alpha buckets pulse at this rate (Hz). 0 = off. */
  twinkle?: number;
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
  /** Particles gently avoid the cursor. Default false. */
  interactive?: boolean;
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
