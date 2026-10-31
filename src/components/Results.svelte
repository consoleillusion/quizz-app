<script lang="ts">
  // End-of-set summary: score, breakdown by blueprint domain, and links to missed questions.
  import {domainLabel} from "../lib/exams.ts"
  let {questions, order, answers, onjump} = $props()

  const scored = $derived(order.map((qi: number, pos: number) => ({q: questions[qi], pos, record: answers[questions[qi].id]})))
  const correct = $derived(scored.filter((s: any) => s.record?.correct).length)
  const missed = $derived(scored.filter((s: any) => !s.record?.correct))
  const domains = $derived.by(() => {
    // Purpose: tally right and total answers per blueprint domain
    const rows = new Map<string, {right: number, total: number}>()
    for (const {q, record} of scored) {
      const label = domainLabel(q.objectives[0])
      const row = rows.get(label) ?? {right: 0, total: 0}
      row.total++
      if (record?.correct) row.right++
      rows.set(label, row)
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
  <table>
    <thead><tr><th>Domain</th><th>Score</th></tr></thead>
    <tbody>
      {#each domains as [label, row]}
        <tr class={row.right < row.total ? "bad" : "ok"}><td>{label}</td><td>{row.right}/{row.total}</td></tr>
      {/each}
    </tbody>
  </table>
  {#if missed.length}
    <h3>Missed</h3>
    <ul>
      {#each missed as {q, pos}}
        <li><button type="button" class="link" data-pos={pos} onclick={jump}>Q{pos + 1}</button> {q.objectives[0].split(":")[1]}: {q.text}</li>
      {/each}
    </ul>
  {/if}
</section>
