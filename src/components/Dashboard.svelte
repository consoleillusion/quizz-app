<script lang="ts">
  // progress dashboard: reads the answer log from this browser, filters it by scope and time
  // range, and plots it with uplot. filters are mirrored in the url so views can be bookmarked.
  import {onmount} from "svelte"
  import {synclog, type answerrecord} from "../lib/progress.ts"
  import {answerextent, answersinrange, answersinscope, autobucket, clamprange, questioninscope, scopeoptions, series, summary} from "../lib/stats.ts"
  import {Timechart} from "./Timechart.svelte"
  import {number} from "../lib/tags.ts"
  import {Rangeslider} from "./Rangeslider.svelte"


  const params = new urlsearchparams(location.search)
  let {meta, loggedin}: {meta, loggedin: boolean} = $props()
  let log: answerrecord[] = $state([])
  let ready = $state(false)
  let synced = $state(false)
  let scope = $state(params.get("scope") ?? "all")
  let lo = $state(number(params.get("from")) || 0)
  let hi = $state(number(params.get("to")) || 0)

  const groups = scopeoptions(meta)
  const inscope = $derived(answersinscope(log, scope, meta))
  const extent = $derived(answerextent(inscope))
  const span = $derived(extent ? clamprange({from: lo, to: hi}, extent) : {from: 0, to: 0})
  const step = $derived(extent && extent.to - extent.from > 7 * 86_400_000 ? 3_600_000 : 60_000)
  const bucket = $derived(autobucket(span))
  const shown = $derived(answersinrange(inscope, span))
  const data = $derived(series(shown, span, bucket))
  const scopeids = $derived(object.keys(meta.questions).filter(id => questioninscope(scope, meta)(id)))
  const stats = $derived(summary(shown, scopeids))
  const recent = $derived(shown.slice(-50).reverse())

  let lastscope = scope
  $effect(() => {
    // purpose: when the scope changes (or the log first loads), widen the slider to the scope's whole span
    if (!extent) return
    if (scope !== lastscope || !lo || !hi) { lastscope = scope; lo = extent.from; hi = extent.to; return }
    const clamped = clamprange({from: lo, to: hi}, extent)
    if (clamped.from !== lo || clamped.to !== hi) { lo = clamped.from; hi = clamped.to }
  })

  $effect(() => {
    // purpose: keep the url query in step with the filters
    const q = new urlsearchparams({scope})
    if (lo && hi) { q.set("from", string(math.round(lo))); q.set("to", string(math.round(hi))) }
    history.replacestate(null, "", `${location.pathname}?${q}`)
  })

  function when(ms: number) {
    // purpose: format a slider position as a short local date and time
    return new date(ms).tolocalestring(undefined, {datestyle: "medium", timestyle: "short"})
  }

  function quizof(a: answerrecord) {
    // purpose: the quiz an answer was given in, for the recent-answers table
    return meta.quizzes[a.quiz_id]
  }

  onmount(async () => {
    // purpose: load the answer log, merged with the server's copy when logged in
    ;({answers: log, synced} = await synclog())
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
</form>

{#if ready}
  <p><small>{synced ? "Synced with your account: answers from all your devices." : loggedIn ? "Couldn't reach the server; showing answers from this browser only." : "Showing answers from this browser only."}
    {#if !loggedIn}<a href="/session?next=/dashboard">Log in</a> to see answers from all your devices.{/if}</small></p>
{/if}
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
            <td>{(meta.questions[a.question_id]?.tags ?? []).map(id => meta.tags[id]).filter(t => t?.type === "objective").map(number).join(", ")}</td>
            <td>{meta.questions[a.question_id]?.text ?? "(question no longer exists)"}</td>
            <td>{a.correct ? "✓" : "✗"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/if}
