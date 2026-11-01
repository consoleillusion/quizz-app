import {describe, expect, test} from "bun:test"
import {answerExtent, answersInScope, autoBucket, bucketStarts, clampRange, questionInScope, scopeOptions, series, summary, type Meta} from "./stats.ts"

const meta: Meta = {
  questions: {
    q1: {type: "multichoice", objectives: ["300-435:2.3"], text: "a", quizzes: ["z1", "z2"]},
    q2: {type: "match", objectives: ["300-435:3.1"], text: "b", quizzes: ["z2"]},
    q3: {type: "order", objectives: ["350-401:2.3"], text: "c", quizzes: ["z3"]},
  },
  quizzes: {
    z1: {slug: "netconf", title: "NETCONF", exam: "300-435", tags: ["topic", "netconf"]},
    z2: {slug: "quiz-1", title: "Practice Quiz 1", exam: "300-435", tags: ["practice"]},
    z3: {slug: "other", title: "Other", exam: "350-401", tags: ["topic"]},
  },
}
const at = (iso: string, question_id: string, quiz_id: string, correct: boolean) =>
  ({quiz_id, question_type: "x", question_id, answer: [], points: correct ? 1 : 0, correct, answered_at: iso})

describe("scope", () => {
  test("objective, domain and exam scopes use the question's objectives", () => {
    expect(questionInScope("objective:300-435:2.3", meta)("q1")).toBe(true)
    expect(questionInScope("objective:300-435:2.3", meta)("q3")).toBe(false)
    expect(questionInScope("domain:300-435:3", meta)("q2")).toBe(true)
    expect(questionInScope("exam:350-401", meta)("q3")).toBe(true)
  })
  test("tag and quiz scopes use the quiz the answer was given in", () => {
    const answers = [at("2026-10-01T10:00:00Z", "q1", "z1", true), at("2026-10-01T11:00:00Z", "q1", "z2", false)]
    expect(answersInScope(answers, "tag:netconf", meta).length).toBe(1)
    expect(answersInScope(answers, "quiz:z2", meta).map(a => a.correct)).toEqual([false])
    expect(answersInScope(answers, "all", meta).length).toBe(2)
  })
  test("options list exams, domains, objectives, tags and quizzes", () => {
    const groups = Object.fromEntries(scopeOptions(meta).map(g => [g.label, g.options.map(o => o.value)]))
    expect(groups.Exams).toEqual(["exam:300-435", "exam:350-401"])
    expect(groups.Domains).toEqual(["domain:300-435:2", "domain:300-435:3", "domain:350-401:2"])
    expect(groups.Tags).toEqual(["tag:netconf", "tag:practice", "tag:topic"])
  })
})

describe("time", () => {
  const now = Date.parse("2026-10-10T12:00:00Z")
  test("auto bucket size follows the span", () => {
    expect(autoBucket({from: now - 86400000, to: now})).toBe("hour")
    expect(autoBucket({from: now - 30 * 86400000, to: now})).toBe("day")
    expect(autoBucket({from: now - 200 * 86400000, to: now})).toBe("week")
  })
  test("extent runs from the first answer to the last, at least an hour wide", () => {
    expect(answerExtent([])).toBe(null)
    const one = answerExtent([at("2026-10-01T10:00:00Z", "q1", "z1", true)])!
    expect(one.to - one.from).toBe(3600000)
    const two = answerExtent([at("2026-10-03T10:00:00Z", "q1", "z1", true), at("2026-10-01T10:00:00Z", "q2", "z2", false)])!
    expect([two.from, two.to]).toEqual([Date.parse("2026-10-01T10:00:00Z"), Date.parse("2026-10-03T10:00:00Z")])
  })
  test("a window is clamped to the extent, or reset when outside it", () => {
    expect(clampRange({from: 0, to: 50}, {from: 10, to: 100})).toEqual({from: 10, to: 50})
    expect(clampRange({from: 200, to: 300}, {from: 10, to: 100})).toEqual({from: 10, to: 100})
  })
  test("buckets cover the range with no gaps", () => {
    const starts = bucketStarts({from: now - 3 * 86400000, to: now}, "day")
    expect(starts.length).toBe(4)
    expect(new Set(starts.slice(1).map((s, i) => s - starts[i])).size).toBeLessThanOrEqual(2) // DST may vary one step
  })
  test("series counts answers, accuracy per bucket and running accuracy", () => {
    const answers = [at("2026-10-08T09:00:00", "q1", "z1", true), at("2026-10-08T10:00:00", "q2", "z2", false), at("2026-10-10T09:00:00", "q1", "z1", true)]
    const range = {from: new Date("2026-10-08T00:00:00").getTime(), to: new Date("2026-10-10T23:00:00").getTime()}
    const s = series(answers, range, "day")
    expect(s.answered).toEqual([2, 0, 1])
    expect(s.accuracy).toEqual([50, null, 100])
    expect(s.running).toEqual([50, 50, 66.7])
  })
})

test("summary reports coverage of the scope", () => {
  const answers = [at("2026-10-01T10:00:00Z", "q1", "z1", true), at("2026-10-02T10:00:00Z", "q1", "z1", false)]
  expect(summary(answers, ["q1", "q2"])).toEqual({answered: 2, correct: 1, percent: 50, distinct: 1, inScope: 2, coverage: 50})
})
