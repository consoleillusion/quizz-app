<script lang="ts">
import { ArrowDown, ArrowUp } from "lucide"
import { MorphIcon } from "morphicons/svelte"
import { flip } from "svelte/animate"
import { dndzone } from "svelte-dnd-action"

const flipDurationMs = 300

let { q, saved, onsubmit } = $props()

type SortableItem = { id: number }

let items = $state<SortableItem[]>(
  (saved ? [...saved.answer] : q.items.map((_: unknown, i: number) => i)).map(id => ({ id }))
)

let sequence = $derived(items.map(item => item.id))
let isSaved = $derived(!!saved)

function handleDndConsider(e: CustomEvent<{ items: SortableItem[] }>) {
  items = e.detail.items
}

function handleDndFinalize(e: CustomEvent<{ items: SortableItem[] }>) {
  items = e.detail.items
}

function move(at: number, by: number) {
  const to = at + by
  if (to < 0 || to >= items.length) return

  const next = [...items]
  ;[next[at], next[to]] = [next[to], next[at]]
  items = next
}

function submit(event: SubmitEvent) {
  event.preventDefault()
  onsubmit(sequence)
}
</script>

<form onsubmit={submit}>
  <fieldset disabled={isSaved}>
    <legend>Put these in order (first at the top)</legend>

    <ol use:dndzone={{ items, flipDurationMs }} onconsider={handleDndConsider} onfinalize={handleDndFinalize}>
      {#each items as item, k (item.id)}
        <li class={isSaved ? (q.answer[k] === item.id ? "ok" : "bad") : ""} animate:flip={{ duration: flipDurationMs }}>
          <span class="md">{@html q.html.items[item.id]}</span>

          {#if !isSaved}
            <button type="button" class="outline secondary" onclick={() => move(k, -1)} disabled={k === 0} aria-label="Move up">
              <MorphIcon icon={ArrowUp} size="1em" />
            </button>
            <button type="button" class="outline secondary" onclick={() => move(k, 1)} disabled={k === items.length - 1} aria-label="Move down">
              <MorphIcon icon={ArrowDown} size="1em" />
            </button>
          {/if}
        </li>
      {/each}
    </ol>
  </fieldset>

  {#if isSaved && !q.answer.every((x: number, k: number) => saved.answer[k] === x)}
    <p>Correct order:</p>
    <ol>
      {#each q.answer as item}
        <li class="md">{@html q.html.items[item]}</li>
      {/each}
    </ol>
  {/if}

  {#if !isSaved}
    <button>Check answer</button>
  {/if}
</form>
<style>
  /* Item text takes the free width so the move buttons stay on the same line on phones. */
  li { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; background: rgba(0,0,0,.1); padding: 1rem 1.5rem;border-radius: .5rem;}
  li > span { flex: 1; }
  li > button { padding: 0.4em 0.6em; margin: 0; }
</style>
