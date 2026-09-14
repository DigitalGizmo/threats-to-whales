<script>
  import { cubicOut } from 'svelte/easing';
  import { popupGeometry } from './measure.js';

  let { threat, onClose } = $props();

  // Radius, text width and position are all measured or derived — see
  // measure.js. It resolves synchronously (and memoises per threat), so the
  // element is at its final size on the first frame and the transition below
  // has something stable to scale. Centring is flexbox, in popup.css.
  let geom = $derived(popupGeometry(threat));

  // Grow out of the hotspot, shrink back into it. A popup is often placed well
  // away from its own hotspot, so the origin is the hotspot's position
  // expressed relative to the popup's own box — not simply its centre.
  let originX = $derived(threat.hotspot.cx - (geom.cx - geom.r));
  let originY = $derived(threat.hotspot.cy - (geom.cy - geom.r));

  function grow() {
    return {
      duration: 260,
      easing: cubicOut,
      css: (t) =>
        `transform-origin: ${originX}px ${originY}px;` +
        `transform: scale(${t}); opacity: ${t};`,
    };
  }
</script>

<!-- The scrim is a sibling, not an ancestor, so a tap in here never reaches it
     and no stopPropagation is needed. -->
<div
  class="popup"
  style="left: {geom.cx - geom.r}px; top: {geom.cy - geom.r}px;
         width: {2 * geom.r}px; height: {2 * geom.r}px;"
  role="dialog"
  aria-modal="true"
  aria-label={threat.label}
  transition:grow
>
  <div class="popup-content" style="width: {geom.w}px;">
    <h2 class="popup-title">{threat.label}</h2>
    <p class="popup-body">{threat.body}</p>
    <p class="popup-close"><button onclick={onClose}>CLOSE</button></p>
  </div>
</div>
