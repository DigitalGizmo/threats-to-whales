<script>
  // The Figma comp is a fixed 1920x1080 with absolutely-positioned layers.
  // Rather than re-derive a fluid layout the designer hasn't drawn, author at
  // the comp's real pixel values and scale the whole stage to fit the viewport.
  // Pixel-faithful for review, and a single place to rip out when the responsive
  // web pass happens.
  let { children } = $props();

  const W = 1920;
  const H = 1080;

  let vw = $state(W);
  let vh = $state(H);

  let scale = $derived(Math.min(vw / W, vh / H));
</script>

<svelte:window bind:innerWidth={vw} bind:innerHeight={vh} />

<div class="viewport">
  <div class="stage" style="width:{W}px; height:{H}px; transform:translate(-50%, -50%) scale({scale});">
    {@render children()}
  </div>
</div>

<style>
  .viewport {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #000;
  }

  .stage {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-origin: center center;
    background: #000;
  }
</style>
