<script lang="ts">
  // Sequencing: move items up and down. Answer is [itemIndex in chosen sequence].
  import {MorphIcon} from "morphicons/svelte"
  import {ArrowDown, ArrowUp} from "lucide"
  let {q, saved, onsubmit} = $props()
  let sequence: number[] = $state(saved ? [...saved.answer] : q.items.map((_: unknown, i: number) => i))

  function move(event: MouseEvent) {
    // Purpose: swap an item with its neighbour, using the button's data-at and data-by attributes
    const {at, by} = (event.currentTarget as HTMLElement).dataset
    const from = Number(at), to = from + Number(by)
    if (to < 0 || to >= sequence.length) return
    ;[sequence[from], sequence[to]] = [sequence[to], sequence[from]]
  }

  function submit(event: SubmitEvent) {
    // Purpose: send the chosen sequence to the quiz
    event.preventDefault()
    onsubmit([...sequence])
  }
</script>

<form onsubmit={submit}>
  <fieldset disabled={!!saved}>
    <legend>Put these in order (first at the top)</legend>
    <ol>
      {#each sequence as item, k (item)}
        <li class={saved ? (q.answer[k] === item ? "ok" : "bad") : ""}>
          <span class="md">{@html q.html.items[item]}</span>
          {#if !saved}
            <button type="button" class="outline secondary" data-at={k} data-by="-1" onclick={move} disabled={k === 0} aria-label="Move up"><MorphIcon icon={ArrowUp} size="1em" /></button>
            <button type="button" class="outline secondary" data-at={k} data-by="1" onclick={move} disabled={k === sequence.length - 1} aria-label="Move down"><MorphIcon icon={ArrowDown} size="1em" /></button>
          {/if}
        </li>
      {/each}
    </ol>
  </fieldset>
  {#if saved && !q.answer.every((x: number, k: number) => saved.answer[k] === x)}
    <p>Correct order:</p>
    <ol>{#each q.answer as item}<li class="md">{@html q.html.items[item]}</li>{/each}</ol>
  {/if}
  {#if !saved}<button>Check answer</button>{/if}
</form>

<style>
  /* Item text takes the free width so the move buttons stay on the same line on phones. */
  li { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
  li > span { flex: 1; }
  li > button { padding: 0.4em 0.6em; margin: 0; }
</style>
