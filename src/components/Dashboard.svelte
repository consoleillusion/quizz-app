<script lang="ts">
// Progress dashboard: reads the answer log from this browser, filters it by scope and time
// range, and plots it with uPlot. Filters are mirrored in the URL so views can be bookmarked.

import { Check, X } from "lucide"
import { MorphIcon } from "morphicons/svelte"
import { onMount } from "svelte"
import Slider from "wacss/components/Slider/Slider.svelte"
import Stat from "wacss/components/Stat/Stat.svelte"
import { type AnswerRecord, syncLog } from "../lib/progress.ts"
import {
  answerExtent,
  answersInRange,
  answersInScope,
  autoBucket,
  clampRange,
  questionInScope,
  scopeOptions,
  series,
  summary,
} from "../lib/stats.ts"
import { number } from "../lib/tags.ts"
import TimeChart from "./TimeChart.svelte"

const params = new URLSearchParams(location.search)
let { meta, loggedIn }: { meta; loggedIn: boolean } = $props()
let log: AnswerRecord[] = $state([])
let ready = $state(false)
let synced = $state(false)
let scope = $state(params.get("scope") ?? "all")
let lo = $state(Number(params.get("from")) || 0)
let hi = $state(Number(params.get("to")) || 0)

const groups = scopeOptions(meta)
const inScope = $derived(answersInScope(log, scope, meta))
const extent = $derived(answerExtent(inScope))
const span = $derived(extent ? clampRange({ from: lo, to: hi }, extent) : { from: 0, to: 0 })
const step = $derived(extent && extent.to - extent.from > 7 * 86_400_000 ? 3_600_000 : 60_000)
const bucket = $derived(autoBucket(span))
const shown = $derived(answersInRange(inScope, span))
const data = $derived(series(shown, span, bucket))
const scopeIds = $derived(
  Object.keys(meta.questions).filter(id => questionInScope(scope, meta)(id))
)
const stats = $derived(summary(shown, scopeIds))
const recent = $derived(shown.slice(-50).reverse())

let lastScope = scope
$effect(() => {
  // Purpose: when the scope changes (or the log first loads), widen the slider to the scope's whole span
  if (!extent) return
  if (scope !== lastScope || !lo || !hi) {
    lastScope = scope
    lo = extent.from
    hi = extent.to
    return
  }
  const clamped = clampRange({ from: lo, to: hi }, extent)
  if (clamped.from !== lo || clamped.to !== hi) {
    lo = clamped.from
    hi = clamped.to
  }
})

$effect(() => {
  // Purpose: keep the URL query in step with the filters
  const q = new URLSearchParams({ scope })
  if (lo && hi) {
    q.set("from", String(Math.round(lo)))
    q.set("to", String(Math.round(hi)))
  }
  history.replaceState(null, "", `${location.pathname}?${q}`)
})

function when(ms: number) {
  // Purpose: format a slider position as a short local date and time
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function quizOf(a: AnswerRecord) {
  // Purpose: the quiz an answer was given in, for the recent-answers table
  return meta.quizzes[a.quiz_id]
}

onMount(async () => {
  // Purpose: load the answer log, merged with the server's copy when logged in
  ;({ answers: log, synced } = await syncLog())
  ready = true
})
</script>

<div class="stack">
  <form onsubmit={e => e.preventDefault()}>
    <label class="cluster">Scope
      <select bind:value={scope}>
        {#each groups as group}
          <optgroup label={group.label}>
            {#each group.options as o}<option value={o.value}>{o.label}</option>{/each}
          </optgroup>
        {/each}
      </select>
    </label>
  </form>

  {#if ready}
    <small>{synced ? "Synced with your account: answers from all your devices." : loggedIn ? "Couldn't reach the server; showing answers from this browser only." : "Showing answers from this browser only."}
      {#if !loggedIn}<a href="/session?next=/dashboard">Log in</a> to see answers from all your devices.{/if}</small>
  {/if}
  {#if !ready}
    <p>Loading your answers…</p>
  {:else if !log.length}
    <p>No answers yet. <a href="/">Pick an exam</a> and your progress will show up here.</p>
  {:else}
    {#if extent}
      <Slider label="Time range: drag either end, anywhere from your first answer to your last"
        min={extent.from} max={extent.to} {step} bind:value={() => [lo, hi], ([a, b]) => { lo = a; hi = b }}
        text={`${when(span.from)} – ${when(span.to)}`} />
    {/if}
    <div class="cluster">
      <Stat value={stats.answered} label="answers" />
      <Stat value={stats.percent === null ? "–" : `${stats.percent}%`} label="correct" />
      <Stat value={`${stats.distinct}/${stats.inScope}`} label={`questions in scope answered (${stats.coverage ?? 0}%)`} />
    </div>
    {#if shown.length}
      <TimeChart {data} {bucket} />
    {:else}
      <p>No answers in this scope and time range.</p>
    {/if}

    {#if recent.length}
      <h2>Recent answers</h2>
      <div class="scroll"><table>
        <thead><tr><th>When</th><th>Quiz</th><th>Objective</th><th>Question</th><th>Result</th></tr></thead>
        <tbody>
          {#each recent as a}
            <tr class={a.correct ? "ok" : "bad"}>
              <td>{new Date(a.answered_at).toLocaleString()}</td>
              <td>{#if quizOf(a)}<a href={`/quiz/${quizOf(a).slug}`}>{quizOf(a).title}</a>{/if}</td>
              <td>{(meta.questions[a.question_id]?.tags ?? []).map(id => meta.tags[id]).filter(t => t?.type === "objective").map(number).join(", ")}</td>
              <td>{meta.questions[a.question_id]?.text ?? "(question no longer exists)"}</td>
              <td><MorphIcon icon={a.correct ? Check : X} size="1.25em" label={a.correct ? "Correct" : "Wrong"} /></td>
            </tr>
          {/each}
        </tbody>
      </table></div>
    {/if}
  {/if}
</div>
