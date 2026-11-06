// Pure dashboard maths: which answers fall in a scope and time range, how they bucket
// over time, and the arrays uPlot plots. No DOM or storage access here.
//
// A scope is a string: all | tag:<tag id> | quiz:<quiz id>
import {
  ascend,
  filter,
  groupBy,
  isNil,
  map,
  pipe,
  sortWith,
  toPairs,
  uniq,
  values,
} from "ramda"
import type { AnswerRecord } from "./progress.ts"
import { label, type Tag, tagTypes } from "./tags.ts"

export type QuestionMeta = {
  type: string
  text: string
  tags: string[]
  quizzes: string[]
}
export type QuizMeta = { slug: string; title: string; tags: string[] }
export type Meta = {
  questions: Record<string, QuestionMeta>
  tags: Record<string, Tag>
  quizzes: Record<string, QuizMeta>
}
export type Bucket = "hour" | "day" | "week"

const HOUR = 3_600_000
const DAY = 24 * HOUR

export const questionInScope =
  (scope: string, meta: Meta) => (questionId: string, quizId?: string) => {
    // Purpose: true when a question (optionally as answered in a given quiz) belongs to the scope
    if (scope === "all") return true
    const [kind, id] = scope.split(":")
    const q = meta.questions[questionId]
    if (!q) return false
    if (kind === "tag") return q.tags.includes(id)
    return quizId && meta.quizzes[quizId]
      ? quizId === id
      : q.quizzes.includes(id)
  }

export const answersInScope = (
  answers: AnswerRecord[],
  scope: string,
  meta: Meta,
) =>
  // Purpose: the answers whose question, in the quiz it was answered in, belongs to the scope
  answers.filter((a) => questionInScope(scope, meta)(a.question_id, a.quiz_id))

export const answersInRange = (
  answers: AnswerRecord[],
  { from, to }: { from: number; to: number },
) =>
  // Purpose: the answers given between two times (ms), inclusive
  answers.filter((a) => {
    const t = Date.parse(a.answered_at)
    return t >= from && t <= to
  })

export const answerExtent = (answers: AnswerRecord[]) => {
  // Purpose: the time span from the first answer to the last (at least an hour wide), or null when there are none
  if (!answers.length) return null
  const times = answers.map((a) => Date.parse(a.answered_at))
  const to = Math.max(...times)
  return { from: Math.min(Math.min(...times), to - HOUR), to }
}

export const clampRange = (
  range: { from: number; to: number },
  extent: { from: number; to: number },
) => {
  // Purpose: keep a chosen window inside the extent, falling back to the whole extent when it doesn't overlap
  const from = Math.max(range.from, extent.from),
    to = Math.min(range.to, extent.to)
  return from < to ? { from, to } : { ...extent }
}

export const autoBucket = ({
  from,
  to,
}: {
  from: number
  to: number
}): Bucket =>
  // Purpose: pick hourly buckets for up to two days, daily up to four months, weekly beyond
  to - from <= 2 * DAY ? "hour" : to - from <= 120 * DAY ? "day" : "week"

export const bucketStart = (t: number, size: Bucket) => {
  // Purpose: the local start of the hour, day or week (Monday) containing time t
  const d = new Date(t)
  if (size === "hour") {
    d.setMinutes(0, 0, 0)
    return d.getTime()
  }
  d.setHours(0, 0, 0, 0)
  if (size === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export const bucketStarts = (
  { from, to }: { from: number; to: number },
  size: Bucket,
) => {
  // Purpose: every bucket start from the bucket containing `from` to the one containing `to`
  const starts: number[] = []
  for (let t = bucketStart(from, size); t <= to; ) {
    starts.push(t)
    const d = new Date(t)
    if (size === "hour") d.setHours(d.getHours() + 1)
    else d.setDate(d.getDate() + (size === "week" ? 7 : 1))
    t = d.getTime()
  }
  return starts
}

export const series = (
  answers: AnswerRecord[],
  range: { from: number; to: number },
  size: Bucket,
) => {
  // Purpose: per-bucket answered count, correct %, and running correct % since the start of the range, for uPlot
  const starts = bucketStarts(range, size)
  const index = new Map(starts.map((s, i) => [s, i]))
  const total = starts.map(() => 0),
    right = starts.map(() => 0)
  for (const a of answers) {
    const i = index.get(bucketStart(Date.parse(a.answered_at), size))
    if (i === undefined) continue
    total[i]++
    if (a.correct) right[i]++
  }
  let seen = 0,
    good = 0
  const running = total.map((n, i) => {
    seen += n
    good += right[i]
    return seen ? Math.round((good / seen) * 1000) / 10 : null
  })
  return {
    x: starts.map((s) => s / 1000),
    answered: total,
    accuracy: total.map((n, i) =>
      n ? Math.round((right[i] / n) * 1000) / 10 : null,
    ),
    running,
  }
}

export const summary = (
  answers: AnswerRecord[],
  scopeQuestionIds: string[],
) => {
  // Purpose: headline numbers: answers given, % correct, distinct questions answered and coverage of the scope
  const correct = answers.filter((a) => a.correct).length
  const distinct = new Set(answers.map((a) => a.question_id)).size
  return {
    answered: answers.length,
    correct,
    percent: answers.length
      ? Math.round((correct / answers.length) * 100)
      : null,
    distinct,
    inScope: scopeQuestionIds.length,
    coverage: scopeQuestionIds.length
      ? Math.round((distinct / scopeQuestionIds.length) * 100)
      : null,
  }
}

const tagOrder = (meta: Meta) =>
  // Purpose: sort tags by type, then naturally by name (so 2.3 < 2.10 < 3.1)
  sortWith<[string, Tag]>([
    ascend(([, t]) => tagTypes.indexOf(t.type as any)),
    ([, a], [, b]) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
  ])

const typeHeading: Record<string, string> = {
  exam: "Exams",
  domain: "Domains",
  objective: "Objectives",
  topic: "Topics",
  generic: "Other tags",
  vendor: "Vendors",
}

export const scopeOptions = (meta: Meta) => {
  // Purpose: the grouped choices for the scope selector: tags in use, grouped by type, then quizzes
  const used = new Set(
    uniq(values(meta.questions).flatMap((q: QuestionMeta) => q.tags)),
  )
  const tags = tagOrder(meta)(
    filter(([id]) => used.has(id), toPairs(meta.tags)) as [string, Tag][],
  )
  const byType = groupBy(([, t]: [string, Tag]) => t.type, tags)
  return [
    { label: "Everything", options: [{ value: "all", label: "All answers" }] },
    ...map(
      (type: string) => ({
        label: typeHeading[type],
        options: map(
          ([id, t]: [string, Tag]) => ({ value: `tag:${id}`, label: label(t) }),
          byType[type] ?? [],
        ),
      }),
      tagTypes as unknown as string[],
    ),
    {
      label: "Quizzes",
      options: pipe(
        toPairs,
        sortWith([ascend(([, q]: [string, QuizMeta]) => q.title)]),
        map(([id, q]: [string, QuizMeta]) => ({
          value: `quiz:${id}`,
          label: q.title,
        })),
      )(meta.quizzes),
    },
  ].filter((g) => g.options.length && !isNil(g.label))
}
