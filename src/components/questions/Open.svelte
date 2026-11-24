<script lang="ts">
// Free entry. Answer is [typed value].
import Button from "wacss/components/Button/Button.svelte"
import NumberInput from "wacss/components/NumberInput/NumberInput.svelte"
import TextInput from "wacss/components/TextInput/TextInput.svelte"

let { q, saved, onsubmit } = $props()
let value: string = $state(saved?.answer[0] ?? "")
const numeric = q.answer_type === "number" || q.answer_type === "integer"

function submit(event: SubmitEvent) {
  // Purpose: send the typed answer to the quiz
  event.preventDefault()
  if (String(value).trim()) onsubmit([String(value).trim()])
}
</script>

<form class="stack" onsubmit={submit}>
  {#if numeric}
    <NumberInput label="Your answer" step={q.answer_type === "number" ? "any" : "1"} bind:value autocomplete="off" required disabled={!!saved} />
  {:else}
    <TextInput label="Your answer" bind:value autocomplete="off" required disabled={!!saved} />
  {/if}
  {#if saved}<p>Accepted: {q.answers.join(", ")}</p>{:else}<div class="cluster"><Button type="submit" variant="primary" label="Check answer" /></div>{/if}
</form>
