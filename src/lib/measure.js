// Popup geometry. The copy sits in a rectangle centred in the circle by flexbox
// (see popup.css); what has to be measured is how wide that rectangle should be
// and how big a circle it needs. There is no closed form for how a paragraph
// wraps, so this lays the copy out offscreen and hands back the numbers. Doing
// it here rather than inside Popup.svelte means the component renders at its
// final size on the first frame, which is what lets the grow-out transition
// work normally.
//
// The previous approach — text wrapped to the curve with shape-outside, radius
// from a fill ratio — is kept at git tag `shape-outside`.

const STAGE_W = 1920;
const STAGE_H = 1080;

// Clear space between the text and the circle's edge, in ems of the popup type.
const INSET_EM = 1.5;

// Widest text block tried. Beyond this the circle would not fit the stage.
const W_MAX = 1000;

// Keeps the popup clear of the stage edge when a placement has to be clamped.
const EDGE_MARGIN = 24;

const cache = new Map();

// Measurements taken before the webfont lands would be wrong. font-display is
// block so this is belt-and-braces, but it costs nothing.
if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.ready.then(() => cache.clear());
}

// Per-line boxes of the rendered copy, taken from the text itself so that ragged
// centred lines count at their real width rather than the block's.
function lineRects(content) {
  const rects = [];
  for (const el of content.children) {
    const range = document.createRange();
    range.selectNodeContents(el);
    for (const rect of range.getClientRects()) if (rect.width > 0) rects.push(rect);
  }
  return rects;
}

/** @param {{id: string, label: string, body: string}} threat */
function measure(threat) {
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute; left:-99999px; top:0; visibility:hidden;';

  // Same markup and classes as Popup.svelte, so the global popup styles apply.
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML =
    '<div class="popup-content"><h2 class="popup-title"></h2>' +
    '<p class="popup-body"></p><p class="popup-close"><button>CLOSE</button></p></div>';

  // textContent, not innerHTML — the copy is content, and it contains
  // apostrophes and parentheses that have no business being parsed as markup.
  popup.querySelector('.popup-title').textContent = threat.label;
  popup.querySelector('.popup-body').textContent = threat.body;

  host.appendChild(popup);
  document.body.appendChild(host);

  const content = popup.querySelector('.popup-content');
  const inset = INSET_EM * parseFloat(getComputedStyle(popup).fontSize);

  // Never narrower than the title, so the title always sits on one line.
  const titleRange = document.createRange();
  titleRange.selectNodeContents(popup.querySelector('.popup-title'));
  const wMin = Math.ceil(titleRange.getBoundingClientRect().width);

  // Try every width. At each, the circle needed is the one that reaches the
  // farthest line-box corner from the block's centre, plus the inset. Keep the
  // width that needs the smallest circle.
  let best = { r: Infinity, w: wMin };
  for (let w = wMin; w <= W_MAX; w += 2) {
    content.style.width = `${w}px`;
    const box = content.getBoundingClientRect();
    const cx = box.left + w / 2;
    const cy = box.top + box.height / 2;
    let reach = 0;
    for (const q of lineRects(content))
      for (const x of [q.left, q.right])
        for (const y of [q.top, q.bottom]) reach = Math.max(reach, Math.hypot(x - cx, y - cy));
    if (reach + inset < best.r) best = { r: reach + inset, w };
  }

  host.remove();
  return { r: Math.ceil(best.r), w: best.w };
}

/** Clamps `v` into [lo, hi], falling back to the midpoint if the range inverts
 *  (which happens only if a popup is too big to fit the stage at all). */
function clamp(v, lo, hi) {
  if (hi < lo) return (lo + hi) / 2;
  return Math.min(Math.max(v, lo), hi);
}

/**
 * Radius, text width and on-stage position for one threat's popup.
 * Position comes from the authored `popup.cx/cy` where the designer has given
 * one; otherwise it falls back to centring on the hotspot. Either way it is
 * clamped to keep the circle on screen.
 */
export function popupGeometry(threat) {
  if (!cache.has(threat.id)) cache.set(threat.id, measure(threat));
  const { r, w } = cache.get(threat.id);

  const cx = clamp(threat.popup?.cx ?? threat.hotspot.cx, r + EDGE_MARGIN, STAGE_W - r - EDGE_MARGIN);
  const cy = clamp(threat.popup?.cy ?? threat.hotspot.cy, r + EDGE_MARGIN, STAGE_H - r - EDGE_MARGIN);

  return { r, w, cx, cy };
}
