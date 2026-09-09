### Design questions
To review with the designer Monday. Ordered by how much each one changes the build.
Answered -- each answer is prepended with "answer: "

**1. Are the hotspot circles and labels part of the background art?**
This is the one that matters. Current plan: the exported illustration contains
everything visible at rest — the nine circles *and* their text labels — baked
into one vector file. Nothing is drawn on top except the popup.
- Will the export include the circles and labels? If she'd rather deliver the
  illustration without them, so circles and type stay editable in code, that's
  fine — but it's a different build and I need to know before starting.
- **Does a hotspot change appearance while its popup is open?** (dim, highlight,
  hide — anything). Baked-in art can't change. Any state change means the
  circles come out of the background and get drawn in code.
- **Does the popup circle cover its own hotspot, or sit beside it?** If it
  covers it, the baked label disappears under the popup while open. If beside,
  the label stays visible. Also affects the open animation, since the popup
  grows out of the hotspot.
- answer: all in the static background

**2. Tapping a second hotspot while a popup is open**
Switch straight to the new popup, or close the current one and require a second
tap? Close-only is acceptable and is what's specced. Real difference on touch:
switching is one gesture, closing is two. Cheap to change either way — a
z-index and one handler.
- answer: no shortcut to other hotspot -- background is dimmed and therefore inactive

**3. The Close link**
Inside the circle or on its edge? Constant position relative to the circle, or
per popup? Circles are all different sizes, so "constant" needs defining — same
offset from centre, or from the edge?
- answer: always centered on its own line at the bottom, with 1em bottom margin

**4. Press feedback**
Does anything happen on finger-down, before the popup appears? Same constraint
as #1 — any press state means the circles leave the background art.
- answer: no

**5. Quick technical ask**
Is the illustration pure vector, or does it contain placed photos/bitmaps? I can
find this out once the Figma connection is set up, but she can answer in five
seconds and it affects how assets get staged.
- answer: pure vector

6. New: hotspot label is displayed at the top of the popup, as title

**Also confirm:** the exact frame name — `Slide 16:9 - 1`, unsure how much of
that is the name proper.
- answer: Frame is now relabeled to threats-to-whales

### Settled
- Popup circles size to their copy — no shared radius
	- answer: Note: 1em margin on all sides -- single paragraph that wraps
- No visited state; hotspots look identical all session - answer: correct
- No label reappears when a popup opens — the art's label stays visible behind it - 
	- answer: see above, we're going to repeat label of hotspot in the opened popup
- Each popup has a Close link (in the design) - 
	- answer: correct
- Popup grows out of its hotspot on open, shrinks back on close - 
	- answer: correct
- Two build modes, kiosk + review, no web and no attract; idle timer only closes
  an open popup - 
	- answer: correct
- Review images start in `public/`, move to assets.digitalgizmo.com later

Full draft spec: `CLAUDE.md` (same directory)
Everything else is settled — once #1 is answered the build is unblocked.