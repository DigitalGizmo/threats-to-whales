<script>
  // One hotspot: the ring and its label, both drawn here rather than baked into
  // the illustration. The Figma file keeps them as live nodes on top of a flat
  // JPEG, so there is nothing to bake — and drawing them keeps the label crisp
  // when the stage scales past 100%, which a 1x raster would not.
  let { threat, onSelect } = $props();

  const { cx, cy, r } = threat.hotspot;
</script>

<button
  class="hotspot"
  style="left: {cx - r}px; top: {cy - r}px; width: {2 * r}px; height: {2 * r}px;"
  aria-label={threat.label}
  onclick={() => onSelect(threat.id)}
></button>

<!-- The label is positioned from its own Figma text box, not derived from the
     circle: several sit off-centre, and Climate Change is wider than its ring.
     pointer-events:none so it never eats a tap meant for the button. -->
<span
  class="hotspot-label"
  style="left: {threat.labelBox.x}px; top: {threat.labelBox.y}px; width: {threat.labelBox.w}px;"
  aria-hidden="true">{threat.label}</span>

<style>
  .hotspot {
    position: absolute;
    padding: 0;
    border-radius: 50%;
    background: var(--hotspot-fill);
    border: 2px solid var(--hotspot-stroke);
  }

  .hotspot-label {
    position: absolute;
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    font-stretch: 87.5%;
    line-height: normal;
    text-align: center;
    color: var(--hotspot-label);
    pointer-events: none;
  }
</style>
