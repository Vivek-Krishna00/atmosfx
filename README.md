# atmosfx

Small canvas effects with no dependencies: snow, rain, cherry blossom, autumn leaves, confetti and more. Run one over the whole page or inside a single element. Built to run on a potato.

- About 6 kB gzipped for the core engine plus one effect. All 10 effects together are about 13.5 kB.
- Adapts quality to the device, pauses when the tab is hidden, and respects `prefers-reduced-motion`.
- Safe to import during server-side rendering: with no DOM it returns a handle that does nothing.

## Install

```sh
npm install @vivekkrishna30/atmosfx
```

Or from a CDN, which exposes a global `atmosfx`:

```html
<script src="https://unpkg.com/@vivekkrishna30/atmosfx"></script>
<script>atmosfx.Effects.mount('page', 'snow');</script>
```

## Usage

```js
import { Effects } from '@vivekkrishna30/atmosfx';

// Whole page
const fx = Effects.mount('page', 'snow', { intensity: 0.6, wind: 0.2 });

// Inside one element (an Element or a CSS selector)
Effects.mount('#hero', 'cherry-blossom');

// The effect for the current season
Effects.auto();

fx.update({ intensity: 1 });
fx.switch('rain');
fx.pause();
fx.resume();
fx.destroy();
```

Built-in effects: `snow`, `winter`, `rain`, `thunderstorm`, `cherry-blossom`, `autumn`, `summer`, `confetti`, `stars`, `fog`.

### Smallest bundle

`@vivekkrishna30/atmosfx/core` doesn't register any effects by name. Import only the effects you use and pass them in directly:

```js
import { Effects, snow } from '@vivekkrishna30/atmosfx/core';

Effects.mount('page', snow);
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `intensity` | `0.5` | 0..1, scales the particle count |
| `speed` | `1` | Speed multiplier |
| `wind` | `0` | -1..1 horizontal wind |
| `size` | `1` | Size multiplier |
| `colors` | effect's own | Replaces the effect's palette (up to 5 colors) |
| `opacity` | `1` | 0..1 overall opacity |
| `zIndex` | | z-index of the canvas |
| `quality` | `'auto'` | `'auto' \| 'low' \| 'medium' \| 'high'` |
| `fps` | `60` (30 on low) | Frame-rate cap |
| `respectReducedMotion` | `true` | Honor `prefers-reduced-motion` |
| `pauseWhenHidden` | `true` | Pause while the tab is hidden |
| `interactive` | `false` | Particles move aside around the cursor and get swept along by it |
| `ground` | `true` | Show the effect's ground layer (for example, winter's snow bank) |
| `settleOn` | | Elements (or a selector) that collect snow caps on their top edge |

## `Effects.auto(target?, options?, config?)`

Picks the effect by month: winter (Dec–Feb), cherry blossom (Mar–May), summer (Jun–Aug) and autumn (Sep–Nov).

```js
Effects.auto('page', {}, {
  hemisphere: 'south',          // shifts the seasons by six months
  months: { 11: 'snow', 6: null } // December: snow. July: no effect.
});
```

## Custom effects

An effect is plain data plus one `draw` function. `draw` renders a sprite once, ahead of time, never on every frame:

```js
import { Effects, registerEffect } from '@vivekkrishna30/atmosfx';

registerEffect('bubbles', {
  colors: ['#9cf', '#cef'],
  size: [2, 6],
  speed: [-20, -60], // a negative speed makes particles rise
  density: 0.5,
  draw(ctx, r) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  },
});

Effects.mount('page', 'bubbles');
```

All the fields are documented in the `EffectDefinition` type.

## License

MIT
