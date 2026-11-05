<script lang="ts">
  // End-of-set summary: score, breakdown by blueprint domain, and links to missed questions.
  import {label, number, ofType} from "../lib/tags.ts"
  let {questions, order, answers, onjump} = $props()

  const scored = $derived(order.map((qi: number, pos: number) => ({q: questions[qi], pos, record: answers[questions[qi].id]})))
  const correct = $derived(scored.filter((s: any) => s.record?.correct).length)
  const missed = $derived(scored.filter((s: any) => !s.record?.correct))
  const domains = $derived.by(() => {
    // Purpose: tally right and total answers per blueprint domain
    const rows = new Map<string, {right: number, total: number}>()
    for (const {q, record} of scored) {
      const domain = ofType("domain")(q.tags)
      const key = domain ? label(domain) : "Untagged"
      const row = rows.get(key) ?? {right: 0, total: 0}
      row.total++
      if (record?.correct) row.right++
      rows.set(key, row)
    }
    return [...rows].sort(([a], [b]) => a.localeCompare(b))
  })

  function jump(event: MouseEvent) {
    // Purpose: go to the question whose position is in the button's data-pos attribute
    onjump(Number((event.currentTarget as HTMLElement).dataset.pos))
  }
</script>

<section aria-labelledby="results-title">
  <h2 id="results-title">Results: {correct}/{questions.length} ({Math.round((correct / questions.length) * 100)}%)</h2>
  <div class="overflow-auto"><table>
    <thead><tr><th>Domain</th><th>Score</th></tr></thead>
    <tbody>
      {#each domains as [label, row]}
        <tr class={row.right < row.total ? "bad" : "ok"}><td>{label}</td><td>{row.right}/{row.total}</td></tr>
      {/each}
    </tbody>
  </table></div>
  {#if missed.length}
    <h3>Missed</h3>
    <ul>
      {#each missed as {q, pos}}
        <li><button type="button" class="outline secondary" data-pos={pos} onclick={jump}>Q{pos + 1}</button> {number(ofType("objective")(q.tags))}: {@html q.html.text}</li>
      {/each}
    </ul>
  {/if}
</section>
