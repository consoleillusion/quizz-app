<script lang="ts">
// Choose n: checkboxes. Answer is [optionIndex, ...] in stored order.
import Button from "wacss/components/Button/Button.svelte"
import Fieldset from "wacss/components/Fieldset/Fieldset.svelte"

let { q, display, saved, onsubmit } = $props()
const order: number[] = display ?? q.options.map((_: unknown, i: number) => i)
let chosen: number[] = $state(saved ? [...saved.answer] : [])
const full = $derived(chosen.length >= q.number_of_selections)

function mark(i: number) {
  // Purpose: feedback class for an option once the question is answered
  if (!saved) return ""
  if (q.options[i].points > 0) return "ok"
  return saved.answer.includes(i) ? "bad" : ""
}

function submit(event: SubmitEvent) {
  // Purpose: send the selected options to the quiz
  event.preventDefault()
  if (chosen.length === q.number_of_selections) onsubmit([...chosen])
}
</script>

<form class="stack" onsubmit={submit}>
  <Fieldset legend={`Choose ${q.number_of_selections}`}>
    {#each order as i, k (i)}
      <label class="cluster {mark(i)}">
        <input type="checkbox" value={i} bind:group={chosen} disabled={!!saved || (full && !chosen.includes(i))} />
        <b>{String.fromCharCode(65 + k)}.</b> <span>{@html q.html.options[i]}</span>
      </label>
    {/each}
  </Fieldset>
  {#if !saved}<div class="cluster"><Button type="submit" variant="primary" label="Check answer" disabled={chosen.length !== q.number_of_selections} /></div>{/if}
</form>
