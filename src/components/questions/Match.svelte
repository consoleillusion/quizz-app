<script lang="ts">
// One-to-one matching: a select per prompt. Answer is [responseIndex per prompt].
import Button from "wacss/components/Button/Button.svelte"
import Fieldset from "wacss/components/Fieldset/Fieldset.svelte"

let { q, display, saved, onsubmit } = $props()
const order: number[] = display ?? q.responses.map((_: unknown, i: number) => i)
let picks: (number | null)[] = $state(saved ? [...saved.answer] : q.prompts.map(() => null))
const complete = $derived(picks.every(p => p !== null))

function submit(event: SubmitEvent) {
  // Purpose: send the chosen pairings to the quiz
  event.preventDefault()
  if (complete) onsubmit([...picks])
}
</script>

<form class="stack" onsubmit={submit}>
  <Fieldset legend="Match each item on the left with one on the right">
    <div class="scroll"><table>
      <tbody>
        {#each q.prompts as _, p}
          <tr class={saved ? (saved.answer[p] === q.answer[p] ? "ok" : "bad") : ""}>
            <th scope="row">{@html q.html.prompts[p]}</th>
            <td>
              <select bind:value={picks[p]} disabled={!!saved} aria-label={`Match for item ${p + 1}`}>
                <option value={null} disabled>Choose…</option>
                {#each order as r (r)}
                  <option value={r} disabled={!saved && picks.includes(r) && picks[p] !== r}>{q.plain.responses[r]}</option>
                {/each}
              </select>
              {#if saved && saved.answer[p] !== q.answer[p]}
                <div>Correct: {@html q.html.responses[q.answer[p]]}</div>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table></div>
  </Fieldset>
  {#if !saved}<div class="cluster"><Button type="submit" variant="primary" label="Check answer" disabled={!complete} /></div>{/if}
</form>
