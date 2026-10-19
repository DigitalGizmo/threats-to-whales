<script>
  import { untrack } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { popupGeometry } from './measure.js';

  let { threat, onClose } = $props();

  // Radius, text width and position are all measured or derived — see
  // measure.js. It resolves synchronously (and memoises per threat), so the
  // element is at its final size on the first frame and the transition below
  // has something stable to scale. Centring is flexbox, in popup.css.
  //
  // Plain values, not $derived: App.svelte keys each Popup on its threat id, so
  // a popup never changes threat while mounted. And the shrink-back runs after
  // the component is destroyed — reading a $derived then trips Svelte's
  // derived_inert warning. untrack() says the one-time read is intended.
  const mounted = untrack(() => threat);
  const geom = popupGeometry(mounted);

  // Grow out of the hotspot, shrink back into it. A popup is often placed well
  // away from its own hotspot, so the origin is the hotspot's position
  // expressed relative to the popup's own box — not simply its centre.
  const originX = mounted.hotspot.cx - (geom.cx - geom.r);
  const originY = mounted.hotspot.cy - (geom.cy - geom.r);

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
