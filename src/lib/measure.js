// Popup geometry. Both the radius and the vertical centring offset have to be
// measured from rendered text — there is no closed form for how a paragraph
// wraps inside a circle — so this builds an offscreen copy of the popup, sizes
// it, and hands back the numbers. Doing it here rather than inside Popup.svelte
// means the component renders at its final size on the first frame, which is
// what lets the grow-out transition work normally.

const STAGE_W = 1920;
const STAGE_H = 1080;

// Share of the circle's height the wrapped copy should occupy. Calibrated in
// the running app against the designer's own radii, using her copy at her type
// — see the table in CLAUDE.md. Only meaningful alongside the 1.5em
// shape-margin in circle-shape.css; change one and the other needs redoing.
//
// 0.74 is the largest value at which no title wraps to two lines. Above it the
// centred block reaches into the narrow top cap, where the chord is too short
// for the longer titles — "Commercial Hunting" (302px) and "Human Interference"
// (299px) break first, at 0.76.
//
// That costs radius parity with the Figma popup frames: 0.74 runs ~37px larger
// than those. It is still the right value, because the frames are not what
// shipped — measured off the live presentation, her Commercial Hunting circle
// is about r=375 against the frame's 300. The live version is already bigger
// than Figma, and the no-wrap constraint lands in the same place.
const FILL = 0.74;

// The search is unbounded but the screen is not.
const R_MIN = 120;
const R_MAX = 420;

// Keeps the popup clear of the stage edge when a placement has to be clamped.
const EDGE_MARGIN = 24;

const cache = new Map();

// Measurements taken before the webfont lands would be wrong. font-display is
// block so this is belt-and-braces, but it costs nothing.
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.ready.then(() => cache.clear());
}

/** @param {{id: string, label: string, body: string}} threat */
function measure(threat) {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute; left:-99999px; top:0; visibility:hidden;';

  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML =
    '<div class="popup-exclude-left"></div><div class="popup-exclude-right"></div>' +
    '<div class="popup-content"><h2 class="popup-title"></h2>' +
    '<p class="popup-body"></p><p class="popup-close">CLOSE</p></div>';

  // textContent, not innerHTML — the copy is content, and it contains
  // apostrophes and parentheses that have no business being parsed as markup.
  popup.querySelector('.popup-title').textContent = threat.label;
  popup.querySelector('.popup-body').textContent = threat.body;

  host.appendChild(popup);
  document.body.appendChild(host);

  const content = popup.querySelector('.popup-content');

  const setRadius = (r) => {
    popup.style.width = popup.style.height = `${2 * r}px`;
  };
  const heightAt = (r) => {
    setRadius(r);
    content.style.marginTop = '0px';
    return content.getBoundingClientRect().height;
  };

  // Smallest radius whose copy still fits within FILL of the height. Shrinking
  // the radius narrows every chord, so the content only ever gets taller — the
  // predicate is monotonic, which is what makes a binary search valid here.
  let lo = R_MIN;
  let hi = R_MAX;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (heightAt(mid) <= FILL * 2 * mid) hi = mid;
    else lo = mid;
  }
  const r = Math.ceil(hi);

  // Floats fill from the top, so the copy stacks in the narrow upper cap and
  // leaves the bottom empty. Offset it down by half the slack — and iterate,
  // because moving the text changes which chords it wraps against, which
  // changes its height. Settles in two or three passes.
  setRadius(r);
  let offset = 0;
  for (let i = 0; i < 8; i++) {
    content.style.marginTop = `${offset}px`;
    const h = content.getBoundingClientRect().height;
    const next = Math.max(0, Math.round((2 * r - h) / 2));
    if (next === offset) break;
    offset = next;
  }

  host.remove();
  return { r, offset };
}

/** Clamps `v` into [lo, hi], falling back to the midpoint if the range inverts
 *  (which happens only if a popup is too big to fit the stage at all). */
function clamp(v, lo, hi) {
  if (hi < lo) return (lo + hi) / 2;
  return Math.min(Math.max(v, lo), hi);
}

/**
 * Radius, centring offset and on-stage position for one threat's popup.
 * Position comes from the authored `popup.cx/cy` where the designer has given
 * one; otherwise it falls back to centring on the hotspot. Either way it is
 * clamped to keep the circle on screen.
 */
export function popupGeometry(threat) {
  if (!cache.has(threat.id)) cache.set(threat.id, measure(threat));
  const { r, offset } = cache.get(threat.id);

  const cx = clamp(threat.popup?.cx ?? threat.hotspot.cx, r + EDGE_MARGIN, STAGE_W - r - EDGE_MARGIN);
  const cy = clamp(threat.popup?.cy ?? threat.hotspot.cy, r + EDGE_MARGIN, STAGE_H - r - EDGE_MARGIN);

  return { r, offset, cx, cy };
}
