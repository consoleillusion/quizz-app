<script lang="ts">
// Single choice: radio buttons. Answer is [optionIndex] in stored order.
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

<form onsubmit={submit}>
  <fieldset disabled={!!saved}>
    <legend>Choose one</legend>
    {#each order as i, k (i)}
      <label class="option {mark(i)}">
        <input type="radio" name={q.id} value={i} bind:group={choice} />
        <b>{String.fromCharCode(65 + k)}.</b> <span class="md">{@html q.html.options[i]}</span>
      </label>
    {/each}
  </fieldset>
  {#if !saved}<button disabled={choice === null}>Check answer</button>{/if}
</form>
