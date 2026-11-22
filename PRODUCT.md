# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JS, one page in `docs/`, served by GitHub Pages from github.com/Vivek-Krishna00/atmosfx. No build step; the page loads the published package from a CDN.

## Users

Primary: web developers adding ambient or seasonal atmosphere (snow, rain, petals, confetti) to a site or a single element. They evaluate by trying it live, checking the install line, the bundle size and the API.

Secondary: non-coders and "vibe coders" who build sites with AI agents. They need a ready-to-paste agent prompt that installs and wires up the effect correctly without understanding the API.

## Product Purpose

atmosfx (published as `@vivekkrishna30/atmosfx`) draws canvas particle effects over a whole page or inside one element, with zero dependencies, and is built to stay smooth on weak devices. Success: a visitor sees an effect running on the page itself, picks one, and copies either the code or the agent prompt.

## Positioning

Tiny and potato-safe: about 6 kB gzipped for the engine plus one effect, adaptive quality that steps down on slow devices, pauses when the tab is hidden, honors prefers-reduced-motion, SSR-safe no-op on the server. Effects are scoped to an element or the page, and winter builds a scene (snow bank, icicles, frost, snow caps on chosen elements).

## Capabilities and Constraints

- Effects: snow, winter, rain, thunderstorm, cherry-blossom, autumn, summer, confetti, stars, fog.
- API: `Effects.mount(target, effect, options)`, `Effects.auto()` (season by month and hemisphere), handle `update / pause / resume / switch / destroy / stats`, `registerEffect` for custom effects, `atmosfx/core` entry for the smallest bundle.
- Options: intensity, speed, wind, size, colors, opacity, zIndex, quality, fps, respectReducedMotion, pauseWhenHidden, interactive (cursor parts particles), ground, settleOn.
- Measured sizes (scripts/size.mjs): core engine 6137 B gz; core + snow 6743 B; core + winter about 11 kB; all 10 effects about 13.5 kB.
- Browser global for CDN use is `atmosfx`.

## Brand Commitments

Name "atmosfx"; npm name `@vivekkrishna30/atmosfx`. MIT licensed. Author handle Vivek-Krishna00 on GitHub.

## Evidence on Hand

The package itself (live effects are the proof), the size script output above, and bench results (60 fps under 6x CPU throttle for winter). No users, testimonials, download counts or stars exist yet: never invent them.

## Product Principles

1. Show, don't claim: every effect on the page runs live from the published package.
2. Respect the visitor's device: the site must itself be light and honor reduced motion.
3. Two doors, one page: a developer path (install, code, API) and a no-code path (agent prompt), neither hiding the other.

## Accessibility & Inclusion

Honor prefers-reduced-motion (the library already does; the site must not add motion that ignores it). Text must stay readable over running effects.
