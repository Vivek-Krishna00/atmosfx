---
name: atmosfx
description: A station departures board where every effect is a destination row running its own live weather.
colors:
  yellow: "#f4c430"
  yellow-hi: "#ffd659"
  yellow-ink: "#141414"
  green: "#3fbf6f"
  housing: "#0b0c0e"
  board: "#111214"
  tile-hi: "#27292e"
  tile-lo: "#17181b"
  glyph: "#f2f0ea"
  ink: "#f2f0ea"
  ink-dim: "#a9adb5"
  line: "#2c2e33"
  paper: "#efece4"
  paper-ink: "#17171a"
  code: "#0a0b0d"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.8rem, 6vw, 5.2rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0em"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.6rem, 5.5vw, 4.2rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 700
    lineHeight: 1
  flap:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "1.45rem"
    fontWeight: 700
    lineHeight: 1
  body:
    fontFamily: "Atkinson Hyperlegible Next, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.12em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.86em"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  thumb: "2px"
  tile: "3px"
  control: "4px"
  ticket: "6px"
  housing: "8px"
spacing:
  tile-gap: "3px"
  row-gap: "4px"
  gutter: "clamp(1rem, 4vw, 3rem)"
  board-pad: "clamp(0.9rem, 2vw, 1.5rem)"
  section: "clamp(4rem, 9vw, 7rem)"
components:
  flap-tile:
    backgroundColor: "{colors.tile-lo}"
    textColor: "{colors.glyph}"
    typography: "{typography.flap}"
    rounded: "{rounded.tile}"
    width: "1.55rem"
    height: "2.2rem"
  flap-tile-selected:
    textColor: "{colors.yellow}"
  board-housing:
    backgroundColor: "{colors.housing}"
    rounded: "{rounded.housing}"
    padding: "clamp(0.9rem, 2vw, 1.5rem)"
  board-row:
    rounded: "{rounded.tile}"
    padding: "0.4rem 1rem"
    height: "3.5rem"
  station-sign:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.yellow-ink}"
    padding: "0.7rem clamp(1rem, 4vw, 3rem)"
  boarding-pass:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.ticket}"
    padding: "0.85rem 1rem 0.95rem"
  boarding-pass-stub:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.yellow-ink}"
    width: "3.4rem"
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.yellow-ink}"
    rounded: "{rounded.control}"
    padding: "0.8rem 1.25rem"
  button-primary-hover:
    backgroundColor: "{colors.yellow-hi}"
  button-copy:
    backgroundColor: "{colors.paper-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 0.9rem"
  button-copy-done:
    backgroundColor: "{colors.green}"
  code-panel:
    backgroundColor: "{colors.code}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ticket}"
    padding: "1.1rem 1.2rem 1.3rem"
  prompt-ticket:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    rounded: "{rounded.ticket}"
  fader:
    height: "1.9rem"
    rounded: "{rounded.tile}"
  fader-readout:
    backgroundColor: "{colors.tile-lo}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.tile}"
---

# Design System: atmosfx

## Overview

**Creative North Star: "The Departures Board"**

The whole page is a station board at night. A near-black housing owns the ground; names and measured numbers sit on split-flap tiles; every effect is a destination row, a full-width strip running its own live weather, and boarding one pours that weather over the page. The board is the product demo: nothing on it is a picture of an effect.

Density is the board's: edge-to-edge rows separated by 4px seams, no card gutters, condensed capitals for anything a board would print. Prose drops out of the board voice into a hyperlegible humanist sans, and code sits on a darker panel or on a printed paper ticket. Colour is almost entirely absent; one station yellow carries every "this is the one" signal, and one signal green says something is live.

Motion belongs to the weather. The interface itself moves only as a flap flip when the board's text changes, and both stop under reduced motion.

**Key Characteristics:**
- Black board housing, split-flap tiles, condensed board capitals.
- Full-width live-weather rows, not thumbnails.
- One station yellow for selection, primary action, links, focus and the sign strip.
- Paper tickets (boarding pass, agent prompt) for the things you take away.
- Weather is the motion; the UI only flips.

## Colors

A monochrome board-black system with one station yellow and one signal green.

### Primary
- **Station Yellow** (`yellow`): the sign strip across the top, the selected row's frame and flaps, the clock, the boarding-pass stub, primary buttons, links, focus rings, slider thumbs, string literals in code, and text selection.
- **Lamp-Hot Yellow** (`yellow-hi`): hover state of yellow buttons only.
- **Sign Ink** (`yellow-ink`): text and marks set on yellow.

### Secondary
- **Signal Green** (`green`): status only: the live dot beside the board footer and the "Copied" confirmation on copy buttons.

### Neutral
- **Board Housing** (`housing`): the board frame, footer band, and the perforation holes in the stub.
- **Board Black** (`board`): page ground.
- **Tile Highlight / Tile Shadow** (`tile-hi`, `tile-lo`): the two halves of a flap tile's gradient; `tile-lo` also fills fader readouts, timetable rows and option rows.
- **Flap Glyph / Ink** (`glyph`, `ink`): warm off-white for flap characters, headings and strong prose.
- **Dim Ink** (`ink-dim`): body prose, column headings, idle status flaps, labels.
- **Seam** (`line`): 1px rules, tab underlines, fader track.
- **Ticket Paper / Paper Ink** (`paper`, `paper-ink`): boarding pass and agent-prompt ticket.
- **Code Black** (`code`): code panels.

### Named Rules
**The Station Yellow Rule.** Yellow means selected, primary, link, focus or the station sign. It never decorates; if an element is yellow, it is the chosen one or the one to press.

**The Signal Green Rule.** Green reports status (live, copied). It is never a brand colour, a button fill at rest, or a highlight.

**The Sky Tint Rule.** Each row's ground is a dark per-effect sky tint set inline (navy, slate, plum, rust; fog is #151c27) under its running weather; these tints live with the effect data, not in the palette.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow)
**Body Font:** Atkinson Hyperlegible Next (with system-ui)
**Label/Mono Font:** JetBrains Mono (with ui-monospace)

**Character:** Barlow Condensed is the board printing everything a board would print: flaps, column heads, the nav, headings, field labels. Atkinson keeps the explanations easy to read over moving weather; JetBrains Mono carries anything you would paste.

### Hierarchy
- **Display** (700, clamp(2.8rem, 6vw, 5.2rem), 0.95): the one h1 on the board's message line; 2.7rem on phones.
- **Headline** (700, clamp(2.6rem, 5.5vw, 4.2rem), 0.95): section h2s, balanced wrap.
- **Title** (700, 1.9rem, 1): h3s and timetable terms.
- **Flap** (700, 1.45rem in a 1.55 x 2.2rem tile): sized per context through tile variables, from 2rem header tiles down to 0.98rem on phone rows.
- **Body** (400, 17px / 1.6; 16px on phones): prose, intros held to 36 to 46rem.
- **Label** (500, 0.82 to 1.2rem, 0.04 to 0.14em tracking, uppercase): column heads, nav, control names, readout names, tabs, row plates, field labels (700 on paper).
- **Code** (JetBrains Mono, 0.82 to 0.88rem, 1.65): snippets, fader readouts, option names.

### Named Rules
**The Flap Content Rule.** Flap tiles carry names and measured numbers only: the DEPARTURES header, the clock, effect names, row status, the boarding effect, timetable figures (6.7 KB, 60 FPS) and live FPS / particle / quality readouts. Sentences never go on flaps.

**The Board Capitals Rule.** Anything the board itself prints is condensed, uppercase and tracked; anything that explains is sentence-case Atkinson.

## Layout

The page is a single column of sections under a full-width sign strip, padded by a fluid gutter (`spacing.gutter`) and capped at 1320px. The first section is the board: header flaps and clock, a two-column message line (hook and sub left, boarding pass right, 34rem max), five-column column heads, then ten rows. Rows use a fixed grid (season 6.5rem, effect 14.2rem, open weather strip, remarks 15rem, status 14rem) and are separated by 4px seams, never by gutters or cards.

Below the board, sections open with `spacing.section` of top padding and a large h2; content pairs in an equal two-column split that collapses at 900px. The Tune console, the facts timetable and the API options all sit in board housings; the timetable and options are stacked tile-black board rows with a 4px gap.

Responsive: at 1100px rows drop the remarks column; at 900px the message line and splits stack; at 640px the board tightens to 0.5rem side padding, column heads hide, rows keep the effect flaps (unpadded, no blank tiles) plus one meta plate holding season above status, and secondary nav links hide.

## Elevation & Depth

Depth is physical and quiet: the board reads as a housing because of an inset 1px edge plus a long soft drop; tiles read as hardware because of an inset black edge and a split hairline. Paper tickets lift off the board with one soft shadow. There are no hover lifts.

### Shadow Vocabulary
- **Housing** (`box-shadow: inset 0 0 0 1px #24262b, 0 24px 50px -24px rgba(0,0,0,0.9)`): board frames.
- **Tile** (`box-shadow: inset 0 0 0 1px rgba(0,0,0,0.65), 0 2px 3px -1px rgba(0,0,0,0.6)`): every flap tile.
- **Ticket** (`box-shadow: 0 16px 28px -14px rgba(0,0,0,0.9)`): boarding pass and prompt ticket.
- **Row frame** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05)`): rows at rest; 0.25 alpha on hover, 2px yellow inset when boarded, 3px yellow inset on focus.

### Named Rules
**The Inset State Rule.** Row state is shown by an inset frame and flap colour, never by lifting, scaling or moving the row.

## Shapes

Small, hardware corners stepped by object size: 2px fader thumbs, 3px tiles, rows and plates, 4px buttons and code fields, 6px tickets and code panels, 8px board housing (6px on phones). The one silhouette is the boarding pass: a paper body joined to a yellow stub whose left edge is perforated with a column of housing-coloured half-holes (4px radius radial gradient in 10 x 14px tiles, positioned `0 3px`), and whose label runs vertically. There is no dashed tear line on the pass.

## Components

### Split-Flap Tile
Hardware, not typography.
- **Shape:** 3px corners, a two-tone gradient split at 50% with a 1px black hairline across the middle.
- **Content:** one uppercase Barlow 700 character per tile; on desktop names and status are padded to 8 tiles so columns align; phone rows drop the blank padding tiles.
- **States:** off-white at rest, dim-ink for idle status, yellow when selected (selected row, clock, NOW BOARDING).
- **Motion:** changed characters flip in from 88deg over 0.34s on the expo-out ease, staggered 28ms per tile; first paint and reduced motion do not flip.

### Board Housing
The black frame that holds the board, the tuning console, the timetable and the options table. Housing black, 8px corners, fluid padding, Housing shadow.

### Board Row
- **Shape:** full-width button, min 3.5rem tall, 3px corners, sky-tint ground with a live effect canvas behind everything.
- **Content:** season and remarks sit on dark plates (`rgba(11,12,14,0.82)`, 3px corners) so they stay legible over weather; effect and status are flaps.
- **Phone (640px and below):** season and status columns collapse into one right-aligned meta plate: season above status, Barlow 500 0.82rem uppercase, dim ink with the status in ink on the same 0.82 dark plate.
- **Hover / Boarded / Focus:** inset frame brightens / turns 2px yellow with yellow flaps and season, status flips ON TIME to BOARDING (on phones the meta plate's status turns yellow) / 3px yellow inset.

### Station Sign Strip
Full-width yellow band at the top: sign-ink mark (two-tile SVG) on the left, uppercase Barlow 700 nav on the right; focus rings switch to sign ink on yellow. It sits above the page weather.

### Boarding Pass
Paper body with tracked uppercase field labels and code fields on a darker paper well, each with a Copy button fixed at 2.35rem tall and top-aligned to its well; wells wrap long lines with `overflow-wrap: break-word`. The yellow perforated stub on the right shows the current effect name vertically. Stacks under the hook below 900px.

### Buttons
- **Primary:** yellow fill, sign ink, Atkinson 700, 4px corners, `0.8rem 1.25rem`; hover to yellow-hi over 0.2s.
- **Copy:** paper-ink fill with paper text on tickets (hover pure black); yellow when sitting in a code panel tab bar. States: green "Copied", salmon "Press Ctrl+C" fallback, reverting after 1.8s.

### Detented Fader
- **Track:** a custom-styled range input, 1.9rem tall, 4px seam centre line with 1px tick marks top and bottom; the tick count is set per input with `--ticks` (10, 8, 7, 10) to show its detents.
- **Thumb (fader cap):** rectangular 0.85 x 1.9rem yellow cap, 2px corners, with a 2px sign-ink centre line and a small drop shadow.
- **Readout:** mono value in a tile-black well, tabular numerals. Focus: 2px yellow outline.

### Code Panel
Code-black, 1px seam border, 6px corners. Tab bar of uppercase Barlow tabs; the selected tab gets ink text and a 2px yellow underline. Syntax: keywords salmon, strings yellow, numbers and calls sky blue, comments grey.

### Paper Prompt Ticket
The agent prompt on a paper ticket: Ticket shadow, a 2px dashed tear line under its label, wrapped mono text, scroll after 26rem.

## Do's and Don'ts

### Do:
- **Do** put effect names and measured numbers on flap tiles, padded to a fixed width.
- **Do** keep station yellow for selected, primary, links, focus and the sign strip.
- **Do** use green only to report status (live, copied).
- **Do** run real weather in every row and strip; the row ground is its sky tint.
- **Do** separate board rows with 4px seams and show state with inset frames.
- **Do** put anything you take away (install, code, prompt) on a paper ticket or code panel with a Copy button.
- **Do** stop flap flips and smooth scrolling under prefers-reduced-motion.

### Don't:
- **Don't** add UI motion besides the flap flip; weather is the motion.
- **Don't** set sentences or marketing copy on flaps.
- **Don't** use yellow or green as decoration or background fill outside their roles.
- **Don't** shrink effects into thumbnail tiles or put card gutters between rows.
- **Don't** lift, scale or translate rows or buttons on hover.
