<script lang="ts">
  // Fill ⟦n⟧ slots in the exhibit from the token bank. Answer is [token per gap].
  let {q, saved, onsubmit} = $props()
  let fills: (string | null)[] = $state(saved ? [...saved.answer] : q.gaps.map(() => null))
  const complete = $derived(fills.every(f => f !== null))

  const parts = (q.exhibit ?? "").split(/(⟦\d+⟧)/).map((part: string) => {
    const slot = part.match(/^⟦(\d+)⟧$/)
    return slot ? {slot: Number(slot[1]) - 1} : {text: part}
  })

  function mark(g: number) {
    // Purpose: feedback class for a slot once the question is answered
    return saved ? (q.gaps[g].accepted_tokens.includes(saved.answer[g]) ? "ok" : "bad") : ""
  }

  function takenElsewhere(token: string, g: number) {
    // Purpose: when tokens can't be reused, true if another slot already holds this token
    return !q.reuse_tokens && fills.some((f, i) => i !== g && f === token)
  }

  function submit(event: SubmitEvent) {
    // Purpose: send the slot fills to the quiz
    event.preventDefault()
    if (complete) onsubmit([...fills])
  }
</script>

<form onsubmit={submit}>
  <fieldset disabled={!!saved}>
    <legend>Fill each gap from the list</legend>
    <pre>{#each parts as part}{#if part.text !== undefined}{part.text}{:else}<select class="slot {mark(part.slot)}" bind:value={fills[part.slot]} aria-label={`Gap ${part.slot + 1}`}><option value={null} disabled>⟦{part.slot + 1}⟧</option>{#each q.tokens as token}<option value={token} disabled={takenElsewhere(token, part.slot)}>{token}</option>{/each}</select>{/if}{/each}</pre>
  </fieldset>
  {#if saved}
    <ul>
      {#each q.gaps as gap, g}
        {#if mark(g) === "bad"}<li>Gap {g + 1}: <code>{gap.accepted_tokens.join(" or ")}</code></li>{/if}
      {/each}
    </ul>
  {:else}
    <button disabled={!complete}>Check answer</button>
  {/if}
</form>
