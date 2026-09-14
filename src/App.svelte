<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import threats from './lib/threats.json';
  import Stage from './lib/Stage.svelte';
  import Hotspot from './lib/Hotspot.svelte';
  import Popup from './lib/Popup.svelte';

  // Build config comes from the .env files. Run with:
  //   npm run dev | dev:review | dev:kiosk
  const ASSETS_BASE = import.meta.env.VITE_IMAGE_BASE;

  // There is no attract screen to return to, so the idle timer's only job is to
  // drop an open popup and leave a clean screen for the next visitor. Seconds,
  // from VITE_IDLE_TIMEOUT; 0 disables it (the default dev mode).
  const IDLE_TIMEOUT = Number(import.meta.env.VITE_IDLE_TIMEOUT ?? 0) * 1000;

  let activeThreatId = $state(/** @type {string | null} */ (null));

  let activeThreat = $derived(threats.find((t) => t.id === activeThreatId) ?? null);

  // The popup stays mounted for its shrink-back after activeThreatId goes null,
  // and reads its threat while it does. So it is handed the last threat opened,
  // which is never null once set, rather than activeThreat.
  let shownThreat = $state(/** @type {typeof threats[number] | null} */ (null));

  let timeoutId = /** @type {number | undefined} */ (undefined);

  function close() {
    activeThreatId = null;
  }

  function resetTimeout() {
    clearTimeout(timeoutId);
    // Only worth arming while something is open — there is nothing to reset to
    // on a screen that is already at rest.
    if (IDLE_TIMEOUT > 0 && activeThreatId) timeoutId = setTimeout(close, IDLE_TIMEOUT);
  }

  function select(id) {
    activeThreatId = id;
    shownThreat = threats.find((t) => t.id === id) ?? null;
    resetTimeout();
  }

  onMount(() => {
    if (IDLE_TIMEOUT <= 0) return;

    const bump = () => resetTimeout();
    window.addEventListener('click', bump);
    window.addEventListener('touchstart', bump);
    window.addEventListener('mousemove', bump);
    window.addEventListener('keydown', bump);

    return () => {
      window.removeEventListener('click', bump);
      window.removeEventListener('touchstart', bump);
      window.removeEventListener('mousemove', bump);
      window.removeEventListener('keydown', bump);
      clearTimeout(timeoutId);
    };
  });
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && close()} />

<Stage>
  <!-- Layer order, bottom to top: illustration, hotspots, scrim, popup. -->
  <img class="illustration" src="{ASSETS_BASE}/threats-bg.jpg" alt="" />
  <h1 class="screen-title">Threats to Whales</h1>

  {#each threats as threat (threat.id)}
    <Hotspot {threat} onSelect={select} />
  {/each}

  {#if activeThreat && shownThreat}
    <!-- A button, not a div: it is the main way to dismiss the popup, so it
         needs to be reachable without a pointer. -->
    <button class="scrim" aria-label="Close" onclick={close} transition:fade={{ duration: 200 }}
    ></button>
    <!-- Keyed so switching straight from one threat to another rebuilds the
         component. Today the scrim makes that impossible, but Popup measures
         its geometry once at init, and this is what keeps that correct if
         direct switching is ever turned on. -->
    {#key shownThreat.id}
      <Popup threat={shownThreat} onClose={close} />
    {/key}
  {/if}
</Stage>

<style>
  .illustration {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screen-title {
    position: absolute;
    left: 52px;
    top: 0;
    width: 862px;
    margin: 0;
    font-size: var(--title-size);
    font-weight: 700;
    font-stretch: 87.5%;
    line-height: normal;
    color: var(--title-color);
  }

  .scrim {
    position: absolute;
    inset: 0;
    padding: 0;
    border: 0;
    background: var(--scrim);
  }
</style>
