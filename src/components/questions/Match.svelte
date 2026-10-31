<script lang="ts">
  // One-to-one matching: a select per prompt. Answer is [responseIndex per prompt].
  let {q, display, saved, onsubmit} = $props()
  const order: number[] = display ?? q.responses.map((_: unknown, i: number) => i)
  let picks: (number | null)[] = $state(saved ? [...saved.answer] : q.prompts.map(() => null))
  const complete = $derived(picks.every(p => p !== null))

  function submit(event: SubmitEvent) {
    // Purpose: send the chosen pairings to the quiz
    event.preventDefault()
    if (complete) onsubmit([...picks])
  }
</script>

<form onsubmit={submit}>
  <fieldset disabled={!!saved}>
    <legend>Match each item on the left with one on the right</legend>
    <table>
      <tbody>
        {#each q.prompts as prompt, p}
          <tr class={saved ? (saved.answer[p] === q.answer[p] ? "ok" : "bad") : ""}>
            <th scope="row" class="pre">{prompt}</th>
            <td>
              <select bind:value={picks[p]} aria-label={`Match for ${prompt}`}>
                <option value={null} disabled>Choose…</option>
                {#each order as r (r)}
                  <option value={r} disabled={!saved && picks.includes(r) && picks[p] !== r}>{q.responses[r]}</option>
                {/each}
              </select>
              {#if saved && saved.answer[p] !== q.answer[p]}
                <div class="pre">Correct: {q.responses[q.answer[p]]}</div>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </fieldset>
  {#if !saved}<button disabled={!complete}>Check answer</button>{/if}
</form>
