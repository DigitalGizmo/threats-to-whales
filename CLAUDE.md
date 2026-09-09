# Threats to Whales — Interactive Spec

## Goal
A single-screen Svelte kiosk piece: one full-bleed vector illustration at
1920x1080 with nine labeled hotspot circles. Touching a hotspot dims the
illustration and opens a popup — a circle of text sitting roughly where the
hotspot is — explaining that threat. No game logic, no scoring, no sequence.
Read the picture, tap a circle, read the text, close it.

## Source of Truth
- **Figma file:** `Threats`, page `Page 1` (`0:1`)
- **Frame:** `threats-to-whales` (`2:2`), at canvas origin 0,0 — so Figma
  coordinates are already stage coordinates, no offset conversion needed
- **Popups:** nine separate frames parked *below* the artboard (`8:39` plastic,
  `8:44` prey depletion, `8:48` noise, `8:52` climate, `8:57` hunting,
  `55:14` human, `55:15` entanglement, `55:16` shipstrikes, `55:17` pollution)
- Illustration, hotspot geometry, popup copy and type all come from Figma via
  the Figma MCP server — pull real assets and real copy, don't transcribe from
  screenshots or invent placeholder text.

## The Nine Threats
Ids in load order; exact label wording comes from the Figma layers.

`plastic`, `prey-depletion`, `noise`, `climate`, `hunting`, `human`,
`entanglement`, `ship-strikes`, `pollution`

## Platform
Same platform and structure as **fluke-proto** (`/Users/don/Sites/fluke/fluke-proto`).
Follow its conventions rather than generic scaffolding:

- Svelte 5 (runes), **no SvelteKit**, Vite, plain `mount()` in `src/main.js`
- `Stage.svelte` — copy it as-is. The comp is a fixed 1920x1080 with
  absolutely-positioned layers, so everything inside the stage is authored at
  the comp's real pixel values and the whole stage is scaled to fit the viewport.
- Components in `src/lib/`, content in a JSON file in `src/lib/`
- Colors and fonts as CSS custom properties in `src/app.css`, read from the
  Figma layer fills
- Build config via `.env.<mode>` files + `import.meta.env`

## Build Modes
Two delivery modes. **No web mode, no attract mode** — this piece is not going
online and has no idle loop to return to.

| mode | command | base | images | idle |
|---|---|---|---|---|
| dev (default) | `npm run dev` | `/` | `/images` (local) | off |
| review | `npm run dev:review` / `build:review` | `/threats/` | `/images` for now → CDN later | on |
| kiosk | `npm run dev:kiosk` / `build:kiosk` | `./` | `./images` (local) | on |

`VITE_IMAGE_BASE` stays as the indirection point. Review starts pointed at
`public/images/` and flips to `https://assets.digitalgizmo.com/threats` by
changing that one line once the assets are uploaded — same pattern as
`.env.review` in fluke.

Kiosk uses `VITE_BASE_URL=./` so it works loaded from disk, and bundles
`public/` (`publicDir` in `vite.config.js` is conditional on the mode, per fluke).

### Idle reset
There is no attract screen to return to, so the idle timer's only job is to
close an open popup and leave the clean base screen for the next visitor.
`VITE_IDLE_TIMEOUT` in seconds; `0` disables. Kiosk shorter than review
(fluke uses 120 / 180).

## Interaction
- **Input:** primarily touch; plain `onclick` handlers cover both touch and
  desktop mouse, so review-in-a-browser works with no separate code path.
- **One popup at a time.** State is a single `activeThreatId: string | null`.
- **Opening:** tap a hotspot → the illustration dims and that threat's popup
  grows out of the hotspot.
- **While a popup is open the whole background is dimmed and inactive.** The
  scrim is a visible dim covering the full 1920x1080, and it sits *above* the
  hotspot layer, so the other eight hotspots cannot be reached. There is no
  shortcut from one popup to another — close, then tap.
- **Closing**, three ways, all landing on `activeThreatId = null`:
  - the popup's **Close** link
  - tapping the dimmed background
  - the idle timer
- The scrim is **black at 80% opacity** (`rgba(0, 0, 0, 0.8)`), covering the
  full 1920x1080. Expect this to come down somewhat — the designer flagged it
  may end up lighter — so keep it a single CSS custom property.
- Layer order, bottom to top: illustration → hotspots → dimming scrim → popup.
- **No press/touch-down state.** The popup appearing is the only feedback.

### Transition
The popup grows out of its hotspot on open and shrinks back into it on close —
a CSS `transform: scale()` with `transform-origin` at the hotspot's centre.

Because a popup may be nudged away from its hotspot (see the data model), the
origin has to be expressed relative to the popup's own box rather than assumed
to be its centre:

```
origin-x = hotspot.cx - (popup.cx - popup.r)
origin-y = hotspot.cy - (popup.cy - popup.r)
```

Use a Svelte `transition:` (not a plain CSS class) so the shrink-back actually
plays — Svelte keeps the node mounted for the duration of an out transition.

## Structure of the Art
**Corrected after the Figma pull — the earlier description was wrong on two
counts, and this section reflects what the file actually contains.**

The illustration is a **raster JPEG**, not vector: node `2:3` "threats 1" is a
rectangle with an image fill, 1920x1081, ~431KB, at 1x only. Staged at
`public/images/threats-bg.jpg`. Since the kiosk runs at native 1920x1080 this is
fine, but there is no higher-resolution source in the Figma file — ask the
designer if one exists before assuming the piece can scale up.

The hotspot circles and their labels are **not baked into that image**. They are
eighteen live Figma nodes sitting on top of it — nine ellipses and nine text
layers — so Svelte draws them from `threats.json`, and the JPEG carries only the
underwater scene.

That reverses the earlier "all in the static background" decision, which was
based on the designer's description rather than the file. Drawing them is also
the better outcome: at 1x, label text baked into the JPEG would soften as soon
as the stage scaled above 100%, whereas live text stays crisp at any scale and
is readable to assistive tech. The alternative — asking her to export the whole
frame flattened — would give up both of those for no gain.

### Hotspot styling, from the Figma layers
- Circle: `fill: #569BD0` at `8%` opacity, `2px` solid `#C1D7FF` stroke
- Label: Noto Sans, `font-stretch: 87.5%`, bold, `24px`, white, centred
- The label sits inside its circle, but its offset varies per hotspot, so the
  label's own position is data rather than a shared rule

There is still no visited state and no press state — nothing about a hotspot
changes appearance — so drawing them costs nothing in complexity.

### The screen title
The frame also carries a title, `8:21` "Threats to Whales" at x=52 y=0,
862x122. It is a plain text layer like the labels, not part of the JPEG, so it
gets drawn too.

## The Popup
Contents, top to bottom, inset 1em from the content box (see the sizing note):

1. **Title** — the hotspot's own label, repeated. The label is painted into the
   background art too, but the scrim dims it and the popup covers it, so the
   popup restates it.
2. **Body** — a single paragraph that wraps. Not a list of pre-broken lines.
3. **Close link** — on its own line as the last item in the copy, centred.
   It stays in the wrapped flow, so it sits directly under the body rather than
   being pinned to the circle's lowest point. (Pinning was tried and rejected —
   it left an obvious gap under short copy.)

### Popup styling, from the Figma layers
- Circle: `fill: #E4EFFF`, `1px` solid `#7580B9`, `drop-shadow(0 4px 2px rgba(0,0,0,0.25))`
- Title and body: Noto Sans, `font-stretch: 87.5%`, `32px`, `#002545`, centred.
  Title is **bold at the same 32px as the body** — it is not set larger.
- Close: the word **CLOSE**, uppercase, `32px`, weight 500, `font-stretch: 100%`
  (not condensed like the body), `#0140a7`, underlined, `letter-spacing: 0.64px`

### Sizing — the radius is computed, not authored
The popup's radius is **derived at runtime from its copy**, so each circle comes
out as full as its text allows and editing a `body` string in the JSON resizes
its circle automatically. There is no `popup.r` in the data.

Binary-search the smallest radius whose wrapped copy still occupies no more than
`FILL` of the circle's height (`FILL = 0.82`). The predicate is monotonic —
shrinking the radius narrows every chord, so the content only ever gets taller —
which makes the search safe. About 20 iterations converges to the pixel.

`FILL` is a loose knob, not a precise one, because the same feedback that makes
the search safe also damps it: a smaller circle makes taller text which resists
shrinking further.

**Calibrated in the running app** against her real copy at her real type, the
value is **`FILL = 0.74`** with **`shape-margin: 1.5em`**.

0.74 is the largest value at which no title wraps to two lines. Above it the
centred block reaches into the narrow top cap where the chord is too short for
the longer titles — "Commercial Hunting" (302px) and "Human Interference"
(299px) break first, at 0.76. Every title fitting on one line is what the design
shows, so it is the binding constraint.

This deliberately gives up radius parity with the **Figma popup frames** — 0.74
runs ~37px larger than those. Two reasons that is right:

- Those frames are not what shipped. Measured off the live presentation, the
  Commercial Hunting circle is about r=375 against the frame's r=300. The live
  version is already bigger than Figma, and the no-wrap constraint lands in the
  same place.
- Matching the frames exactly is not achievable anyway: her text sits in a
  *rectangle* inside each circle, ours wraps to the *curve*, so ours needs more
  height for the same words. Chasing her numbers produced visibly worse
  layout — at `FILL = 0.92` the radii matched to a mean of 5px and the titles
  wrapped.

Resulting radii, against the Figma frames for reference:

| threat | Figma frame r | computed r |
|---|---|---|
| plastic | 313 | 359 |
| prey-depletion | 275.5 | 301 |
| noise | 320 | 376 |
| climate | 300 | 337 |
| hunting | 300 | 334 |
| human | 340.5 | 382 |
| entanglement | 300 | 338 |
| ship-strikes | 321.5 | 357 |
| pollution | 340 | 363 |

Largest is 382, so 764px across — comfortably inside the 1080 height.

### Text layout: wrapped to the circle
The copy wraps to the **curve of the circle**, not to a rectangle inscribed in
it. The designer faked that shape by hand in Figma with manual line breaks;
since the copy lives in JSON and has to stay editable, the shape has to be
produced by the browser instead.

**Verified working** — see `tools/shape-test.html`, which renders three radii
with a dashed overlay on the true circle edge. Open it in a browser.

#### The technique
Two floats, each half the circle's width and its full height, carrying a
`shape-outside` polygon that describes the part of that half-box lying *outside*
the circle. Every line box is then clipped to the circle's chord at its own
height. Generate the polygons with `tools/circle-shape.py`:

    python3 tools/circle-shape.py > src/lib/circle-shape.css

The values are percentages of each float's own box, so they are **scale-free** —
the same two rules serve every popup radius, and nothing needs regenerating when
a radius changes. Markup order matters: both floats come before the content.

#### Three things that will bite
1. **`display: flow-root` on the popup is required.** Without it the content
   block's top margin collapses out of the circle and moves the whole popup down
   the page instead of moving the text down inside it. This looks like the
   centring silently failing.
2. **Vertical centring needs JavaScript.** Floats fill from the top, so text
   stacks in the narrow upper cap and leaves the bottom empty. Measure the
   content height and set its `margin-top` to `(H - h) / 2` — but *iterate*:
   moving the text changes which chords it wraps against, which changes its
   height. It settles in two or three passes.
3. **`shape-margin` is what gives the inset**, and it is a true perpendicular
   inset from the curve — better than padding, which would only inset a
   rectangle. Set it to **1.5em**, which is what the design actually measures,
   not the 1em the notes claimed.
4. **The circle's 1px stroke must not be a `border`.** A border shrinks the
   content box to `2r - 2`, so the two exclusion floats become 50% of *that* —
   describing a circle 1px smaller than the element containing them. The shape
   and the circle disagree. Because line-wrapping is discrete the error does not
   stay small: at one radius it measured content 27% taller and threw the
   calibration out completely. Paint it with `box-shadow: inset 0 0 0 1px`,
   which has no layout effect. Same applies to any future padding on `.popup`.
5. **Popup CSS cannot live in the component.** `measure.js` builds an offscreen
   copy of the popup markup outside Svelte to size it; Svelte's scoped styles
   would not apply to that copy and every measurement would be wrong. Hence
   `src/lib/popup.css` and `src/lib/circle-shape.css` as plain global
   stylesheets imported from `main.js`.

#### Consequence for the copy
Our wrapping will not reproduce the designer's hand-broken lines exactly, and
the auto-sizer will not land on her exact radii either. Both are expected. Use
her radii to calibrate `FILL` once, then let the computed value win — that keeps
the circles honest when the copy is edited later, which hand-set radii would
not.

## Data Model
`src/lib/threats.json` — one entry per threat, geometry in stage pixels
(1920x1080 origin top-left), read from the Figma layers:

```json
[
  {
    "id": "ship-strikes",
    "label": "Ship Strikes",
    "hotspot": { "cx": 1213, "cy": 640, "r": 125 },
    "body": "Major shipping lanes tend to overlap with important whale…"
  }
]
```

Written, with all nine threats, at `src/lib/threats.json`.

Notes:
- `label` does triple duty: the hit target's `aria-label`, the label painted on
  the illustration, and the popup's title.
- **There is no `popup` object at all.** The radius is computed from the copy
  (see Sizing), and the position is derived — see below. Both were going to be
  Figma data; neither turned out to exist in the file.
- `body` is a single string, not an array of lines — the copy is one wrapping
  paragraph. (This is the one place the model diverges from fluke's
  `challenges.json`, which pre-breaks its lines.)

### Where a popup sits — hand-authored per threat
The nine popup frames are parked below the artboard in Figma, so the Figma file
says nothing about placement. Screenshots of the live presentation show the
answer: **placements are authored by eye, one per threat.** They are not
centred on their hotspots and no rule reproduces them.

Measured off two of those screenshots, each popup sits down and to the right of
its own hotspot, by different amounts:

| threat | hotspot | popup centre (approx) | offset |
|---|---|---|---|
| hunting | 914, 368 | ~1159, 465 | +245, +98 |
| prey-depletion | 257, 553 | ~398, 687 | +141, +125 |

`prey-depletion` could be explained as centre-then-clamp — centred it would
overhang the left edge by 83px. `hunting` cannot: centred it fits on screen with
room to spare, and was still moved 245px right. So the offsets are compositional
— keeping the circle over open water and off neighbouring hotspots — not
mechanical.

Therefore placement is **data**: an optional `popup: { cx, cy }` per threat.
Where it is absent the popup falls back to centred-on-hotspot, clamped to the
stage with a margin, which is a reasonable default but not a substitute for her
placements.

Two consequences already handled: popups cover their own hotspots (confirmed in
both screenshots), which is why the popup repeats the label as its title; and
the grow-out transition takes an arbitrary hotspot-to-popup offset via the
transform-origin formula, so a popup placed 245px away still animates out of the
right spot.

**Needed from the designer: the nine placements**, or confirmation that the
centred-and-clamped default is acceptable. The two above are approximations off
screenshots, not measurements — good enough to build against, not to ship.

## Component Breakdown
- `App.svelte` — holds `activeThreatId`, the idle timer, and the mode config
- `Stage.svelte` — copied from fluke, unchanged
- `Hotspot.svelte` — props: `threat`; transparent button, calls `onSelect(id)`
- `Popup.svelte` — props: `threat`, `onClose`; renders the two exclusion floats,
  title, body and the Close link, runs the radius search then the vertical-
  centring pass, and stops click propagation so taps inside it don't reach the
  scrim
- The illustration is a bare `<img>` in `App.svelte` unless it needs inlining

## Figma MCP Pull Checklist

Server: Figma Dev Mode MCP, `http://127.0.0.1:3845/mcp`, registered at user
scope as `figma`. It reads the **Figma desktop app's current selection**, so
open the `Threats` file and select the `threats-to-whales` frame before pulling
(or pass an explicit node id).

Tools it offers: `get_design_context` (reference code + screenshot + metadata —
the primary one), `get_metadata` (node tree as XML, with positions and sizes),
`get_variable_defs`, `get_screenshot`, plus `get_motion_context` and
`get_figjam`, which this project has no use for.

- [x] `get_metadata` on the frame — the node tree, and the source for every
      coordinate below. **Positions come back in Figma canvas space**, so
      subtract the frame's own origin to get the 1920x1080 stage coordinates the
      data model uses.
- [x] Read the nine hotspot centres, radii and label text
- [x] Popup radii read and used to calibrate `FILL`/`shape-margin` (see the
      table under Sizing). **Popup centres do not exist** — the popup frames are
      not placed on the artboard. Position is derived instead.
- [x] Read the nine body paragraphs as single strings
- [x] Read the popup title's type treatment (size, weight, colour) — it differs
      from the body
- [x] Read the Close link's copy and styling
- [x] Scrim: black at 80% opacity, from the designer. Not in the Figma file —
      there is no dimmed-state frame anywhere on the page. May be lightened.
- [x] `get_variable_defs` for colour tokens (fluke's Figma file defined none —
      it returned `{}` — so expect to read the layer fills instead)
- [x] Typography: **Noto Sans**, SIL Open Font License, self-hosted as in fluke.
      One 39KB woff2 (latin subset) at `src/assets/fonts/noto-sans/NotoSans.woff2`
      covers every weight. **Caveat:** Google Fonts serves it already instanced
      at 87.5% width, so it has no `wdth` axis and `font-stretch` is a no-op —
      the condensed face is baked in. The `font-stretch: 100%` on the CLOSE link
      therefore does nothing yet. If that difference matters, fetch the full
      variable font rather than the instanced one.
- [x] Illustration pulled — it is a **JPEG, not vector** (see Structure of the
      Art), 1920x1081, staged at `public/images/threats-bg.jpg`. The MCP served
      it from its local asset server, so no manual export was needed.

## Settled
- Illustration is pure vector; circles and labels baked into it
- Popup radius is computed from the copy at runtime (`FILL = 0.82`), not read
  from Figma; 1em inset all round, applied as `shape-margin` off the curve
- Popup body is one wrapping paragraph, wrapped to the circle by the browser —
  the designer's hand-faked line breaks are not reproduced or needed
- Popup repeats the hotspot's label as its title
- Close link on its own line as the last item in the flow, centred — not pinned
  to the circle's bottom
- No visited state and no press state; hotspots never change appearance
- Background dims when a popup opens, and other hotspots go inactive — no
  shortcut from one popup to the next
- Popup grows out of its hotspot on open, shrinks back on close
- Two build modes, kiosk + review; no web, no attract; idle timer only closes
  an open popup
- Review images start in `public/`, move to assets.digitalgizmo.com later

## Overlap
Popups **do** overlap their hotspots — which is why the popup repeats the
label as its title, since the painted one is covered.

Near the edges of the frame a popup is nudged inward to stay on screen, so it
may cover its hotspot only partially. Two consequences, both already handled:

- Part of the painted circle and label can peek out from under the popup. It
  shows through dimmed by the scrim, which is the correct appearance — no
  special-casing.
- The grow-out-of-the-hotspot transition already takes an arbitrary offset
  between hotspot and popup centres (see the transform-origin formula), so a
  partly-offset popup animates correctly with no extra work.

## Open Questions
Raised by the Figma pull; all three need the designer.

1. **The nine popup placements.** Confirmed hand-authored, not derivable — see
   "Where a popup sits". Two are approximated off screenshots; seven are
   unknown. Either her actual values, or a decision that centred-and-clamped is
   good enough.
2. **Is there a higher-resolution illustration?** The file has a 1x JPEG only.
   Fine at native 1920x1080, but it will soften on anything larger, and the
   answer given earlier was "pure vector" — so a vector or 2x source may exist
   outside this file.

Also worth telling her: two ellipses are both named `human intrusion` (`6:9` and
`287:8`). `287:8` is the Plastic Pollution hotspot, going by its position under
that label. Harmless to us — we key off our own ids — but confusing in Figma.

## Running it
```
npm install
npm run dev          # localhost, local images, no idle reset
npm run dev:review   # as review will run
npm run dev:kiosk    # as the kiosk will run
npm run build:kiosk  # -> dist/, loadable from disk
```

Layout is verified by driving the real app in a browser rather than by eye —
that is how the border bug and the title wrapping were both caught. The scratch
harness in `tools/shape-test.html` is still useful for isolating the
shape-outside behaviour on its own.
