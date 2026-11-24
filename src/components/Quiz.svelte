<script lang="ts">
// The quiz for one quiz: navigation, shuffling, saving answers and feedback.
// Runs client-only (client:only) because shuffles and IndexedDB are browser-side.

import { CircleCheck, CircleX } from "lucide"
import { MorphIcon } from "morphicons/svelte"
import { onMount } from "svelte"
import Button from "wacss/components/Button/Button.svelte"
import Notice from "wacss/components/Notice/Notice.svelte"
import Progress from "wacss/components/Progress/Progress.svelte"
import Select from "wacss/components/Select/Select.svelte"
import { grade } from "../lib/grade.ts"
import { type AnswerRecord, clearAnswers, loadAnswers, saveAnswer } from "../lib/progress.ts"
import { number, ofType } from "../lib/tags.ts"
import Match from "./questions/Match.svelte"
import Multichoice from "./questions/Multichoice.svelte"
import Multiselect from "./questions/Multiselect.svelte"
import Open from "./questions/Open.svelte"
import Order from "./questions/Order.svelte"
import Slotfill from "./questions/Slotfill.svelte"
import Results from "./Results.svelte"

let { quiz, questions, resume = true, onanswer } = $props()
// resume: restore this quiz's saved answers and offer Restart. onanswer: called with each answer record.

const components: Record<string, any> = {
  multichoice: Multichoice,
  multiselect: Multiselect,
  match: Match,
  order: Order,
  slotfill: Slotfill,
  open: Open,
}
const typeLabels: Record<string, string> = {
  multichoice: "Single choice",
  multiselect: "Multiple choice",
  match: "Matching",
  order: "Ordering",
  slotfill: "Fill the gaps",
  open: "Short answer",
}

let order: number[] = $state([])
let displays: Record<string, number[] | undefined> = $state({})
let answers: Record<string, AnswerRecord> = $state({})
let pos = $state(0)
let ready = $state(false)

const q = $derived(questions[order[pos]])
const answered = $derived(Object.keys(answers).length)
const correct = $derived(Object.values(answers).filter(a => a.correct).length)
const saved = $derived(q ? answers[q.id] : undefined)

function shuffled(xs: number[]) {
  // Purpose: return a Fisher-Yates shuffled copy of an index list
  const a = [...xs]
  for (let k = a.length - 1; k > 0; k--) {
    const r = Math.floor(Math.random() * (k + 1))
    ;[a[k], a[r]] = [a[r], a[k]]
  }
  return a
}

function indexes(n: number) {
  // Purpose: the list 0..n-1
  return Array.from({ length: n }, (_, i) => i)
}

function arrange() {
  // Purpose: set question order and per-question option order, shuffling where the quiz asks for it
  order = quiz.randomize_question_order
    ? shuffled(indexes(questions.length))
    : indexes(questions.length)
  displays = Object.fromEntries(
    questions.map((x: any) => {
      const list = x.options ?? x.responses
      return [
        x.id,
        list && quiz.randomize_option_order ? shuffled(indexes(list.length)) : undefined,
      ]
    })
  )
}

async function submit(answer: any[]) {
  // Purpose: grade the current question's answer, then keep and persist it
  const { correct, points } = grade(q, answer)
  const record = {
    quiz_id: quiz.id,
    question_type: q.type,
    question_id: q.id,
    answer,
    points,
    correct,
    answered_at: new Date().toISOString(),
  }
  answers[q.id] = record
  onanswer?.(record)
  await saveAnswer($state.snapshot(record))
}

function go(to: number) {
  // Purpose: move to a question position, clamped to the quiz
  pos = Math.max(0, Math.min(order.length - 1, to))
  document.getElementById("question")?.scrollIntoView({ block: "nearest" })
}

async function restart() {
  // Purpose: clear saved answers for this quiz and start again with a fresh shuffle
  if (!confirm("Clear your answers for this quiz and start again?")) return
  await clearAnswers(quiz.id)
  answers = {}
  arrange()
  go(0)
}

function onkey(event: KeyboardEvent) {
  // Purpose: arrow keys move between questions unless focus is in a form control
  if ((event.target as HTMLElement).closest("input, select, textarea")) return
  if (event.key === "ArrowRight") go(pos + 1)
  if (event.key === "ArrowLeft") go(pos - 1)
}

function marker(i: number) {
  // Purpose: status prefix for a question in the jump list
  const a = answers[questions[order[i]].id]
  return a ? (a.correct ? "✓" : "✗") : " "
}

onMount(async () => {
  // Purpose: arrange the quiz and restore saved answers, then resume at the first unanswered question
  arrange()
  const ids = new Set(questions.map((x: any) => x.id))
  if (resume)
    answers = Object.fromEntries(
      (await loadAnswers(quiz.id)).filter(r => ids.has(r.question_id)).map(r => [r.question_id, r])
    )
  const firstOpen = order.findIndex(i => !answers[questions[i].id])
  pos = firstOpen === -1 ? 0 : firstOpen
  ready = true
})
</script>

<svelte:window onkeydown={onkey} />

{#if !ready}
  <p>Loading quiz…</p>
{:else}
  <div class="stack">
    <Progress label="Progress" value={answered} max={questions.length} text={`${correct} correct of ${answered} answered (${questions.length} total)`} />

    <div class="cluster" role="group" aria-label="Question navigation">
      <Button label="← Previous" onclick={() => go(pos - 1)} disabled={pos === 0} />
      <Select label="Jump to question" value={String(pos)} onchange={v => go(Number(v))}
        options={order.map((_, i) => ({ value: String(i), label: `${marker(i)} Q${i + 1}` }))} />
      <Button label="Next →" onclick={() => go(pos + 1)} disabled={pos === order.length - 1} />
      {#if resume}<Button variant="tertiary" label="Restart" onclick={restart} />{/if}
    </div>

    <article id="question" class="stack" aria-live="polite">
        <small>Question {pos + 1} of {questions.length} · {typeLabels[q.type]} · Objective {number(ofType("objective")(q.tags))}</small>
        <div>{@html q.html.text}</div>
        {#if q.exhibit && q.type !== "slotfill"}<pre>{q.exhibit}</pre>{/if}
        {#key q.id}
          {@const Component = components[q.type]}
          <Component {q} display={displays[q.id]} {saved} onsubmit={submit} />
        {/key}
        {#if saved}
          <Notice variant={saved.correct ? "positive" : "danger"}>
            <strong><MorphIcon icon={saved.correct ? CircleCheck : CircleX} size="1.25em" /> {saved.correct ? "Correct." : "Not quite."}</strong>
            {#if q.html.explanation}{@html q.html.explanation}{/if}
          </Notice>
          {#if pos < order.length - 1}<div class="cluster"><Button variant="primary" label="Next question →" onclick={() => go(pos + 1)} /></div>{/if}
        {/if}
    </article>

    {#if answered === questions.length}
      <Results {questions} {order} {answers} onjump={go} />
    {/if}
  </div>
{/if}
