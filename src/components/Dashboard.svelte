<script lang="ts">
  // Progress dashboard: reads the answer log from this browser, filters it by scope and time
  // range, and plots it with uPlot. Filters are mirrored in the URL so views can be bookmarked.
  import {onMount} from "svelte"
  import {loadLog, type AnswerRecord} from "../lib/progress.ts"
  import {answerExtent, answersInRange, answersInScope, autoBucket, clampRange, questionInScope, scopeOptions, series, summary, type Bucket, type Meta} from "../lib/stats.ts"
  import TimeChart from "./TimeChart.svelte"
  import RangeSlider from "./RangeSlider.svelte"

  let {meta}: {meta: Meta} = $props()

  const params = new URLSearchParams(location.search)
  let log: AnswerRecord[] = $state([])
  let ready = $state(false)
  let scope = $state(params.get("scope") ?? "all")
  let lo = $state(Number(params.get("from")) || 0)
  let hi = $state(Number(params.get("to")) || 0)
  let bucketChoice = $state(params.get("bucket") ?? "auto")

  const groups = scopeOptions(meta)
  const inScope = $derived(answersInScope(log, scope, meta))
  const extent = $derived(answerExtent(inScope))
  const span = $derived(extent ? clampRange({from: lo, to: hi}, extent) : {from: 0, to: 0})
  const step = $derived(extent && extent.to - extent.from > 7 * 86_400_000 ? 3_600_000 : 60_000)
  const bucket: Bucket = $derived(bucketChoice === "auto" ? autoBucket(span) : (bucketChoice as Bucket))
  const shown = $derived(answersInRange(inScope, span))
  const data = $derived(series(shown, span, bucket))
  const scopeIds = $derived(Object.keys(meta.questions).filter(id => questionInScope(scope, meta)(id)))
  const stats = $derived(summary(shown, scopeIds))
  const recent = $derived(shown.slice(-50).reverse())

  let lastScope = scope
  $effect(() => {
    // Purpose: when the scope changes (or the log first loads), widen the slider to the scope's whole span
    if (!extent) return
    if (scope !== lastScope || !lo || !hi) { lastScope = scope; lo = extent.from; hi = extent.to; return }
    const clamped = clampRange({from: lo, to: hi}, extent)
    if (clamped.from !== lo || clamped.to !== hi) { lo = clamped.from; hi = clamped.to }
  })

  $effect(() => {
    // Purpose: keep the URL query in step with the filters
    const q = new URLSearchParams({scope, bucket: bucketChoice})
    if (lo && hi) { q.set("from", String(Math.round(lo))); q.set("to", String(Math.round(hi))) }
    history.replaceState(null, "", `${location.pathname}?${q}`)
  })

  function when(ms: number) {
    // Purpose: format a slider position as a short local date and time
    return new Date(ms).toLocaleString(undefined, {dateStyle: "medium", timeStyle: "short"})
  }

  function quizOf(a: AnswerRecord) {
    // Purpose: the quiz an answer was given in, for the recent-answers table
    return meta.quizzes[a.quiz_id]
  }

  onMount(async () => {
    // Purpose: load the answer log from IndexedDB once the page is in the browser
    log = await loadLog()
    ready = true
  })
</script>

<form class="bar filters" onsubmit={e => e.preventDefault()}>
  <label>Scope
    <select bind:value={scope}>
      {#each groups as group}
        <optgroup label={group.label}>
          {#each group.options as o}<option value={o.value}>{o.label}</option>{/each}
        </optgroup>
      {/each}
    </select>
  </label>
  <label>Group by
    <select bind:value={bucketChoice}>
      <option value="auto">Auto ({autoBucket(span)})</option>
      <option value="hour">Hour</option>
      <option value="day">Day</option>
      <option value="week">Week</option>
    </select>
  </label>
</form>

{#if !ready}
  <p>Loading your answers…</p>
{:else if !log.length}
  <p>No answers yet. <a href="/quiz">Pick a quiz</a> and your progress will show up here.</p>
{:else}
  {#if extent}
    <fieldset class="timeline">
      <legend>Time range: drag either end, anywhere from your first answer to your last</legend>
      <RangeSlider min={extent.from} max={extent.to} {step} gap={step} bind:lo bind:hi format={when} />
    </fieldset>
  {/if}
  <p class="stats">
    <strong>{stats.answered}</strong> answers ·
    <strong>{stats.percent ?? "–"}{stats.percent === null ? "" : "%"}</strong> correct ·
    <strong>{stats.distinct}</strong> of {stats.inScope} questions in scope answered ({stats.coverage ?? 0}%)
  </p>
  {#if shown.length}
    <TimeChart {data} {bucket} />
  {:else}
    <p>No answers in this scope and time range.</p>
  {/if}

  {#if recent.length}
    <h2>Recent answers</h2>
    <table>
      <thead><tr><th>When</th><th>Quiz</th><th>Objective</th><th>Question</th><th>Result</th></tr></thead>
      <tbody>
        {#each recent as a}
          <tr class={a.correct ? "ok" : "bad"}>
            <td>{new Date(a.answered_at).toLocaleString()}</td>
            <td>{#if quizOf(a)}<a href={`/quiz/${quizOf(a).slug}`}>{quizOf(a).title}</a>{/if}</td>
            <td>{meta.questions[a.question_id]?.objectives.map(o => o.split(":")[1]).join(", ")}</td>
            <td>{meta.questions[a.question_id]?.text ?? "(question no longer exists)"}</td>
            <td>{a.correct ? "✓" : "✗"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}
