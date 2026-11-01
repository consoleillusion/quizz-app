<script lang="ts">
  // Two-handle range slider built from two native range inputs on one track.
  // The handles can't cross; each keeps at least `gap` between them. Values are numbers (here: ms).
  let {min, max, step = 1, gap = step, lo = $bindable(), hi = $bindable(), format = (v: number) => String(v)} = $props()

  const pct = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0)

  function moveLo(event: Event) {
    // Purpose: set the start handle, keeping it at least `gap` before the end handle
    lo = Math.min(Number((event.currentTarget as HTMLInputElement).value), hi - gap)
    ;(event.currentTarget as HTMLInputElement).value = String(lo)
  }

  function moveHi(event: Event) {
    // Purpose: set the end handle, keeping it at least `gap` after the start handle
    hi = Math.max(Number((event.currentTarget as HTMLInputElement).value), lo + gap)
    ;(event.currentTarget as HTMLInputElement).value = String(hi)
  }
</script>

<div class="range">
  <div class="track"><div class="fill" style:left={`${pct(lo)}%`} style:right={`${100 - pct(hi)}%`}></div></div>
  <input type="range" {min} {max} {step} value={lo} oninput={moveLo} aria-label="Start" aria-valuetext={format(lo)} />
  <input type="range" {min} {max} {step} value={hi} oninput={moveHi} aria-label="End" aria-valuetext={format(hi)} />
</div>
<p class="readout"><span>{format(lo)}</span><span>→</span><span>{format(hi)}</span></p>

<style>
  .range { position: relative; height: 2rem; }
  .track { position: absolute; top: 50%; left: 0; right: 0; height: 4px; margin-top: -2px; background: rgba(255, 255, 255, 0.15); border-radius: 2px; }
  .fill { position: absolute; top: 0; bottom: 0; background: #8aa8ff; border-radius: 2px; }
  input[type="range"] { position: absolute; inset: 0; width: 100%; margin: 0; padding: 0; background: none; border: 0; pointer-events: none; appearance: none; -webkit-appearance: none; }
  input[type="range"]::-webkit-slider-thumb { pointer-events: auto; appearance: none; -webkit-appearance: none; width: 1.1rem; height: 1.1rem; border-radius: 50%; background: #c9c9c9; border: 2px solid #8aa8ff; cursor: grab; }
  input[type="range"]::-moz-range-thumb { pointer-events: auto; width: 1rem; height: 1rem; border-radius: 50%; background: #c9c9c9; border: 2px solid #8aa8ff; cursor: grab; }
  input[type="range"]::-webkit-slider-runnable-track, input[type="range"]::-moz-range-track { background: none; }
  input[type="range"]:focus-visible::-webkit-slider-thumb { outline: 2px solid #8aa8ff; outline-offset: 2px; }
  .readout { display: flex; justify-content: space-between; gap: 1em; margin: 0.2em 0 1em; font-size: 0.9em; }
</style>
