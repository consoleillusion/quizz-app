<script lang="ts">
// Single choice: radio buttons. Answer is [optionIndex] in stored order.
import Button from "wacss/components/Button/Button.svelte"
import Fieldset from "wacss/components/Fieldset/Fieldset.svelte"

let { q, display, saved, onsubmit } = $props()
const order: number[] = display ?? q.options.map((_: unknown, i: number) => i)
let choice: number | null = $state(saved?.answer[0] ?? null)

function mark(i: number) {
  // Purpose: feedback class for an option once the question is answered
  if (!saved) return ""
  if (q.options[i].points > 0) return "ok"
  return saved.answer.includes(i) ? "bad" : ""
}

function submit(event: SubmitEvent) {
  // Purpose: send the chosen option to the quiz
  event.preventDefault()
  if (choice !== null) onsubmit([choice])
}
</script>

<form class="stack" onsubmit={submit}>
  <Fieldset legend="Choose one">
    {#each order as i, k (i)}
      <label class="cluster {mark(i)}">
        <input type="radio" name={q.id} value={i} bind:group={choice} disabled={!!saved} />
        <b>{String.fromCharCode(65 + k)}.</b> <span>{@html q.html.options[i]}</span>
      </label>
    {/each}
  </Fieldset>
  {#if !saved}<div class="cluster"><Button type="submit" variant="primary" label="Check answer" disabled={choice === null} /></div>{/if}
</form>
