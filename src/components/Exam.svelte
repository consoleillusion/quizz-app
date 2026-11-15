<script lang="ts">
// An exam: its questions arrive from the server 10 at a time. Which 10 is decided here from this
// learner's answer history, domain by domain (see lib/exam.ts). Client-only, because the history
// lives in this browser (and is merged with the server's when signed in).

import { onMount } from "svelte"
import {
  BATCH,
  domainShares,
  domainTallies,
  drawQuestions,
  type History,
  type IndexedQuestion,
  tallyAnswers,
} from "../lib/exam.ts"
import { type AnswerRecord, loadLog, syncLog } from "../lib/progress.ts"
import { label } from "../lib/tags.ts"
import Quiz from "./Quiz.svelte"

let { exam } = $props()

// Answers carry the exam's tag id as their quiz_id; the server keeps no such quiz and drops it.
const player = { id: exam.id, randomize_question_order: false, randomize_option_order: true }

let index: IndexedQuestion[] = $state([])
let history: History = $state({})
let batch: any[] = $state([])
let batchNo = $state(0)
let answeredInBatch = $state(0)
let loading = $state(true)
let failure = $state("")
const served: string[] = []

const rows = $derived.by(() => {
  // Purpose: one row per domain: answers given, % right, and its share of the next draw
  const tallies = domainTallies(index, history, exam.domains.length)
  const shares = domainShares(
    tallies,
    exam.domains.map((d: any) => d.question_count > 0)
  )
  return exam.domains.map((d: any, i: number) => ({
    title: label(d),
    asked: tallies[i].asked,
    percent: tallies[i].asked ? Math.round((tallies[i].correct / tallies[i].asked) * 100) : null,
    share: Math.round(shares[i] * 100),
  }))
})

async function get(path: string) {
  // Purpose: fetch JSON from this exam's question endpoint, throwing a readable error when it fails
  const r = await fetch(`/exam/${exam.name}/questions${path}`, { headers: { accept: "application/json" } })
  if (!r.ok) throw new Error(`The server answered ${r.status}`)
  return r.json()
}

async function nextBatch() {
  // Purpose: draw the next 10 questions from the answers so far and fetch them
  failure = ""
  try {
    const ids = drawQuestions({
      index,
      history: $state.snapshot(history),
      domainCount: exam.domains.length,
      exclude: served,
    })
    if (!ids.length) return
    const { items } = await get(`?filter[id]=${ids.join(",")}`)
    served.push(...ids)
    batch = items
    answeredInBatch = 0
    batchNo++
  } catch (e) {
    failure = `Couldn't load the next questions. ${(e as Error).message}`
  }
}

function onanswer(record: AnswerRecord) {
  // Purpose: count the answer toward this exam's domain results straight away, so the next draw sees it
  const t = (history[record.question_id] ??= { asked: 0, correct: 0 })
  t.asked++
  if (record.correct) t.correct++
  answeredInBatch++
}

onMount(async () => {
  // Purpose: load the question index and this learner's history, then serve the first batch
  try {
    const [{ questions }, log] = await Promise.all([
      get(""),
      syncLog()
        .then(r => r.answers)
        .catch(() => loadLog()),
    ])
    index = questions.map(([id, domain]: [string, number]) => ({ id, domain }))
    const inExam = new Set(index.map(q => q.id))
    history = tallyAnswers(log.filter(a => inExam.has(a.question_id)))
    await nextBatch()
  } catch (e) {
    failure = `Couldn't load the exam. ${(e as Error).message}`
  }
  loading = false
})
</script>

{#if loading}
  <p>Loading exam…</p>
{:else}
  {#if failure}<p class="bad">{failure}</p>{/if}
  {#if batch.length}
    <details>
      <summary>Your results by domain</summary>
      <table>
        <thead><tr><th>Domain</th><th>Answers</th><th>Right</th><th>Next draw</th></tr></thead>
        <tbody>
          {#each rows as r}
            <tr><td>{r.title}</td><td>{r.asked}</td><td>{r.percent === null ? "–" : `${r.percent}%`}</td><td>{r.share}%</td></tr>
          {/each}
        </tbody>
      </table>
      <small>The next 10 questions are drawn in these proportions: domains you get wrong more, or have been asked less, come up more often.</small>
    </details>
    <p><small>Set {batchNo}</small></p>
    {#key batchNo}
      <Quiz quiz={player} questions={batch} resume={false} {onanswer} />
    {/key}
    {#if answeredInBatch === batch.length}
      <button type="button" onclick={nextBatch}>Next {BATCH} questions</button>
    {/if}
  {:else if failure}
    <button type="button" onclick={nextBatch}>Try again</button>
  {:else}
    <p>This exam has no questions yet.</p>
  {/if}
{/if}
