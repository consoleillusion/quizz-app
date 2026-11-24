<script lang="ts">
// Put items in sequence with a wacss SortableList. Answer is the item indexes in order.
import Button from "wacss/components/Button/Button.svelte"
import Fieldset from "wacss/components/Fieldset/Fieldset.svelte"
import SortableList from "wacss/components/SortableList/SortableList.svelte"

let { q, saved, onsubmit } = $props()

let items = $state(
  (saved ? [...saved.answer] : q.items.map((_: unknown, i: number) => i)).map((i: number) => ({ id: String(i), label: q.plain.items[i] }))
)

function submit(event: SubmitEvent) {
  // Purpose: send the items' present order to the quiz
  event.preventDefault()
  onsubmit(items.map((item: { id: string }) => Number(item.id)))
}
</script>

<form class="stack" onsubmit={submit}>
  <Fieldset legend="Put these in order (first at the top)">
    <SortableList bind:items label="Order" disabled={!!saved} />
  </Fieldset>

  {#if saved && !q.answer.every((x: number, k: number) => saved.answer[k] === x)}
    <p>Correct order:</p>
    <ol>
      {#each q.answer as item}
        <li>{@html q.html.items[item]}</li>
      {/each}
    </ol>
  {/if}

  {#if !saved}<div class="cluster"><Button type="submit" variant="primary" label="Check answer" /></div>{/if}
</form>
