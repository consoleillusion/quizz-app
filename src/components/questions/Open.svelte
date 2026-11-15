<script lang="ts">
// Free entry. Answer is [typed value].
let { q, saved, onsubmit } = $props()
let value: string = $state(saved?.answer[0] ?? "")
const numeric = q.answer_type === "number" || q.answer_type === "integer"

function submit(event: SubmitEvent) {
  // Purpose: send the typed answer to the quiz
  event.preventDefault()
  if (String(value).trim()) onsubmit([String(value).trim()])
}
</script>

<form onsubmit={submit}>
  <fieldset disabled={!!saved}>
    <label>Your answer
      <input type={numeric ? "number" : "text"} step={q.answer_type === "number" ? "any" : "1"} bind:value autocomplete="off" required />
    </label>
  </fieldset>
  {#if saved}<p>Accepted: {q.answers.join(", ")}</p>{:else}<button>Check answer</button>{/if}
</form>
