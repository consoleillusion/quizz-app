<script lang="ts">
  // Choose n: checkboxes. Answer is [optionIndex, ...] in stored order.
  let {q, display, saved, onsubmit} = $props()
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

<form onsubmit={submit}>
  <fieldset disabled={!!saved}>
    <legend>Choose {q.number_of_selections}</legend>
    {#each order as i, k (i)}
      <label class="option {mark(i)}">
        <input type="checkbox" value={i} bind:group={chosen} disabled={full && !chosen.includes(i)} />
        <b>{String.fromCharCode(65 + k)}.</b> <span class="md">{@html q.html.options[i]}</span>
      </label>
    {/each}
  </fieldset>
  {#if !saved}<button disabled={chosen.length !== q.number_of_selections}>Check answer</button>{/if}
</form>
