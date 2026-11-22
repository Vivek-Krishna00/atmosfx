---
name: atmosfx
description: A night street facade where every lit window holds a different live weather.
colors:
  lamp: "#ffc861"
  lamp-deep: "#e9a63a"
  lamp-ink: "#241503"
  brick: "#7a3324"
  brick-deep: "#5a2418"
  mortar: "#4a1d14"
  enamel: "#0f2f52"
  night: "#0d1726"
  street: "#0a111c"
  stone: "#d8d2c6"
  stone-ink: "#2b2520"
  frame: "#e9e4da"
  ink: "#eef2f8"
  ink-dim: "#b4c1d4"
  line: "#2a3c57"
  code-ground: "#070c14"
typography:
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(3.6rem, 9vw, 6rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.01em"
  headline:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(2.3rem, 5vw, 3.6rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 800
    lineHeight: 1.05
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.06em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.86em"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sill: "2px"
  pane: "3px"
  plaque: "8px"
  panel: "10px"
  pill: "99px"
spacing:
  gutter: "clamp(1rem, 4vw, 3rem)"
  section: "clamp(3.5rem, 8vw, 6rem)"
  column-gap: "clamp(1.5rem, 4vw, 3rem)"
  block: "2.25rem"
  container: "1240px"
components:
  enamel-sign:
    backgroundColor: "{colors.enamel}"
    textColor: "#f6f3ec"
    typography: "{typography.display}"
    rounded: "{rounded.panel}"
    padding: "0.6rem 1.6rem 0.75rem"
  door-plaque:
    backgroundColor: "#1a1208"
    textColor: "{colors.lamp}"
    typography: "{typography.code}"
    rounded: "{rounded.plaque}"
    padding: "0.7rem 0.9rem"
  copy-button:
    backgroundColor: "{colors.lamp}"
    textColor: "{colors.lamp-ink}"
    padding: "0 1rem"
  copy-button-hover:
    backgroundColor: "#ffd885"
  copy-button-copied:
    backgroundColor: "#9be3a8"
  copy-button-failed:
    backgroundColor: "#ffb3a3"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.lamp}"
    rounded: "{rounded.plaque}"
    padding: "0.7rem 1.2rem"
  button-outline-hover:
    backgroundColor: "{colors.lamp}"
    textColor: "{colors.lamp-ink}"
  window-sill:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.stone-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sill}"
    padding: "0.5rem 0.4rem 0.45rem"
  window-sill-lit:
    backgroundColor: "{colors.lamp}"
    textColor: "{colors.stone-ink}"
  code-panel:
    backgroundColor: "{colors.code-ground}"
    textColor: "#d7e0ee"
    typography: "{typography.code}"
    rounded: "{rounded.panel}"
    padding: "1.1rem 1.2rem 1.3rem"
  roofline-nav:
    backgroundColor: "{colors.night}"
    textColor: "{colors.ink-dim}"
    padding: "0.9rem clamp(1rem, 4vw, 3rem)"
---

# Design System: atmosfx

## Overview

**Creative North Star: "The Night Street Facade"**

The page is a brick building on a night street. Its upper storey is the product: a facade of lit windows, each one a real element running a different live weather, labelled on a stone sill. Below the facade the visitor steps down to street level, a dark night-blue ground where the reading happens: tuning, code, the directory of facts, the agent prompt, the API. Every component is a piece of street architecture (roofline, cornice, enamel sign, door plaque, window, sill) rather than a generic card or button.

Warm window light is the only accent. It marks the lit thing (the selected window), the primary action (the copy plaque) and links. Everything else is brick, stone, night and cool white text. The UI itself stays still; the weather is the motion. The only UI change on interaction is a window lighting up.

Density is medium: a generous facade up top, then single-column reading sections that split into two columns on wide screens.

**Key Characteristics:**
- Brick facade with drawn mortar courses and a warm street-lamp glow rising from below.
- Ten windows with painted frames, glazing bars drawn over the weather, and stone sills carrying condensed uppercase labels.
- Lamp amber reserved for lit / active / primary.
- Condensed street-signage display face, hyperlegible humanist body, mono only for code.
- Depth comes from physical objects casting soft drop shadows onto brick, never from floating cards.

## Colors

A warm-on-cool night palette: brick and lamp light against night blue, with cool white text.

### Primary
- **Street Lamp Amber** (lamp): the lit window's frame and sill, the copy button fill, link color, focus outline, range and checkbox accent, selection highlight, code strings. The single accent.
- **Lamp Brass** (lamp-deep): the brass border on the enamel sign and the door plaque; the darker edge of lamp light.
- **Lamp Soot** (lamp-ink): text set on Street Lamp Amber.

### Secondary
- **Facade Brick** (brick): the facade ground behind the sign and windows, tiled with mortar courses.
- **Shadowed Brick** (brick-deep): the facade's top band, the 4px reveal ring around every window pane, the footer's top band.
- **Mortar** (mortar): the brick course lines (drawn as an inline SVG pattern).

### Tertiary
- **Enamel Blue** (enamel): the enamel name sign and its 6px outer rim.

### Neutral
- **Night** (night): roofline nav and footer ground.
- **Street** (street): the page body ground below the facade.
- **Sill Stone** (stone) / **Stone Ink** (stone-ink): window sills and their labels.
- **Frame Paint** (frame): window frames and glazing bars.
- **Moonlit Ink** (ink): primary text, headings, active tab.
- **Dusk Ink** (ink-dim): secondary text, nav links, intros, table descriptions, readouts.
- **Gutter Line** (line): hairline dividers, code panel and tab borders.
- **Code Ground** (code-ground): code panel background, darker than the street.

### Named Rules
**The Lamp Light Rule.** Amber means lit, selected or primary. A window gets the amber frame and sill only when it is the active weather; nothing decorative is amber.

**The Window Sky Rule.** Each window pane carries its own dark sky tint (set per effect through the `--sky` custom property, e.g. snow #13264a, autumn #2e1c14, stars #070b1c) so the weather inside reads; panes are never light.

## Typography

**Display Font:** Big Shoulders Display (with Arial Narrow, sans-serif)
**Body Font:** Atkinson Hyperlegible Next (with system-ui, sans-serif)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, monospace)

All three are self-hosted variable woff2 files in `docs/fonts/` with `font-display: swap`; the display face is preloaded.

**Character:** Condensed, heavy street signage for names and headings against a calm, hyperlegible body; mono appears only where the visitor would type or read code.

### Hierarchy
- **Display** (900, clamp(3.6rem, 9vw, 6rem), 1): the product name on the enamel sign only. 3rem on phones.
- **Lede** (800, clamp(1.9rem, 3.6vw, 2.9rem), 1.02): the one-line hook beside the sign.
- **Headline** (800, clamp(2.3rem, 5vw, 3.6rem), 1, -0.01em): section headings, balanced wrap.
- **Title** (800, 1.6rem, 1.05): directory terms, API sub-heads, footer mark; "Over the page" status at 1.7rem.
- **Body** (400, 17px / 16px on phones, 1.6): running text; intros at 1.05rem capped near 38rem.
- **Sill Label** (800, 1.05rem, 0.06em, uppercase, display face): window sill labels only. 0.82rem on phones.
- **Code** (mono, 0.86em, 1.65): code panels, install line, option names, readouts with tabular numerals. Small captions under directory terms are mono at 0.78rem.

### Named Rules
**The Signage Rule.** The display face is for signs and headings; it never sets paragraphs. Uppercase is used only on sills.

**The Mono Means Code Rule.** Mono appears only for code, option names, measured numbers and readouts.

## Layout

A full-bleed facade on top, then street-level sections in a centered container (1240px max) with a fluid side gutter (clamp(1rem, 4vw, 3rem)). Sections are separated by fluid top padding (clamp(3.5rem, 8vw, 6rem)); content blocks within a section start 2.25rem below the intro.

- **Facade:** the sign band is a two-column grid (sign | hook) that stacks under 980px. Windows sit in a 5 x 2 grid on desktop, 3 columns at 980px and below.
- **Street sections:** Tune, Winter, Agent and API use two-column grids (ratios 0.85/1.15, 1/1, 0.8/1.2, 1/1) with a fluid column gap, collapsing to one column under 980px.
- **Directory:** a definition list with a term column (min 8rem, 0.32fr) and description column, stacking under 600px.
- **Breakpoints:** 980px (stack grids, 3-column windows) and 600px (smaller body, tighter windows and sills, full-width plaque, hide secondary nav links).

## Elevation & Depth

Depth is architectural. Physical objects fixed to the facade (sign, plaque, sills, cornice) cast soft, downward drop shadows onto the brick. Street-level content is flat: code panels and the directory use hairline borders, no shadow. A radial lamp glow rises from the bottom of the facade.

### Shadow Vocabulary
- **Sign cast** (`box-shadow: 0 14px 30px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.15)`): enamel sign, with an enamel sheen on the top edge.
- **Plaque cast** (`box-shadow: 0 10px 22px -10px rgba(0,0,0,0.8)`): the door plaque.
- **Sill cast** (`box-shadow: 0 8px 14px -6px rgba(0,0,0,0.65)`): every window sill.
- **Cornice cast** (`box-shadow: 0 6px 14px -6px rgba(0,0,0,0.6)`): the cornice strip at the top of the facade.
- **Window reveal** (`box-shadow: inset 0 0 0 2px rgba(0,0,0,0.35), 0 0 0 4px var(--brick-deep)`): the recessed pane set into the brick.

### Named Rules
**The Fixed To The Wall Rule.** Only objects mounted on the facade cast shadows, and always downward. Street-level panels stay flat with hairline borders.

## Shapes

Mostly square, slightly softened corners, like painted joinery and enamel. Sills 2px, panes 3px (top corners only), plaques and outline buttons 8px, the enamel sign and code panels 10px, and a single pill (99px) reserved for small badges. Window frames are thick painted borders (7px, 9px at the bottom; 5px/6px on phones), with glazing bars drawn as a cross over the weather (vertical at 50%, horizontal at 42%) plus a faint diagonal glass sheen. Sills overhang the frame by 10px on each side (6px on phones). Dividers are 1px hairlines; the directory opens with a 2px ink rule; the facade and footer carry heavy brick bands (10px and 8px).

## Components

### Roofline Nav
- **Style:** night ground, full width, product mark left in the display face (800, 1.35rem), links right in Dusk Ink at 0.95rem without underline.
- **States:** hover lifts links to Moonlit Ink. Under 600px, "For AI agents" and "Docs" hide.

### Brick Facade
- **Style:** Facade Brick tiled with a 56 x 28 mortar-course SVG, a radial amber glow rising from below, a 10px Shadowed Brick top band and an 18px gradient cornice (#a2523e to #6b2b1e) with its cast shadow. Holds the sign band, the windows and a one-line hint in warm off-white (#f3e6e0).

### Enamel Sign
- **Style:** Enamel Blue plate, 3px Lamp Brass border, 6px enamel outline rim, 10px radius, sign cast shadow; the product name in Display at #f6f3ec. Used once, for the product name.

### Door Plaque (install with copy)
- **Style:** a dark brass-backed plate (#1a1208) with a 2px Lamp Brass border and 8px radius, clipping its children. The install command sits inside in amber mono; the copy button is a full-height amber block on the right.
- **Copy states:** hover #ffd885; success turns green (#9be3a8) and reads "Copied"; failure turns salmon (#ffb3a3), selects the text and reads "Press ⌘C"; it reverts after 1.8s. The same copy button closes the tab row of every code panel.
- **Phones:** full width, command flexes and scrolls horizontally.

### Window (effect picker)
- **Structure:** a native button containing a pane (4:4.4 aspect, its own sky tint, a live scoped effect mount) and a stone sill label below.
- **Pane:** Frame Paint border, window-reveal ring of Shadowed Brick, glazing bars drawn above the weather.
- **Hover:** frame brightens to #fff7e3.
- **Lit (aria-pressed="true"):** frame and sill turn Street Lamp Amber. Exactly one window is lit: the weather currently over the page.
- **Focus:** 3px amber outline offset 4px around the pane.
- **Winter:** the page effect uses the sills as `settleOn` targets, so snow caps and icicles form on them.

### Code Panels with Tabs
- **Style:** Code Ground panel, 1px Gutter Line border, 10px radius. A tab row with a hairline bottom border; tabs are body bold 0.9rem in Dusk Ink, the selected tab Moonlit Ink with a 2px amber underline. Copy button pinned right.
- **Code:** #d7e0ee base, keywords #ff9e7a, strings amber, names #8fd3ff, comments #7486a0. Long prompts wrap and scroll within 26rem.

### Outline Button
- **Style:** transparent with a 2px amber border, 8px radius, amber body bold text. Hover fills amber with Lamp Soot text. Used for secondary in-section actions ("Let it snow on the sills").

### Controls
- Range sliders and checkboxes use native inputs with amber accent-color; each slider row is a three-column grid (label, track, mono tabular value). A mono readout row (fps, particles, quality) sits under a hairline.

### Directory List
- **Style:** a definition list opened by a 2px Moonlit Ink rule; each row a two-column grid split by hairlines. Terms in Title display; measured numbers carry a small mono caption beneath. Descriptions in Dusk Ink with Moonlit Ink strong text, capped at 44rem.

### Options Table
- **Style:** full-width collapsed table at 0.93rem, hairline row dividers. Option names in amber mono, no-wrap; descriptions in Dusk Ink.

### Footer
- **Style:** Night ground under an 8px Shadowed Brick band; product mark in display 1.6rem left, license and links in Dusk Ink right, wrapping on narrow screens.

## Do's and Don'ts

### Do:
- **Do** build new surfaces from street architecture: signs, plaques, windows, sills, brick bands.
- **Do** keep amber (lamp) for the lit/selected state, the primary action, links and focus.
- **Do** give every live effect container its own dark sky tint and draw any glazing or framing above the weather.
- **Do** cast shadows only from objects mounted on the facade, always downward and soft.
- **Do** set code, option names and measured numbers in JetBrains Mono with tabular numerals where values change.
- **Do** keep the UI still; the weather is the motion, and reduced motion must be honored.

### Don't:
- **Don't** use amber decoratively or on more than one window at a time.
- **Don't** set paragraphs in Big Shoulders Display or uppercase anything but sill labels.
- **Don't** float generic cards with shadows at street level; use hairline borders on the code ground.
- **Don't** put light backgrounds inside panes; the effects need a dark sky to read.
- **Don't** invent stats, testimonials or download counts on any surface; the directory carries only measured numbers.
