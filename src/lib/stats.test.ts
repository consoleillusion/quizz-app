import { describe, expect, test } from "bun:test"
import {
  answerExtent,
  answersInScope,
  autoBucket,
  bucketStarts,
  clampRange,
  type Meta,
  questionInScope,
  scopeOptions,
  series,
  summary,
} from "./stats.ts"

const meta: Meta = {
  tags: {
    e1: { type: "exam", name: "cisco:300-435", description: "ENAUTO" },
    d2: {
      type: "domain",
      name: "cisco:300-435:2.0",
      description: "Device-Level",
    },
    o23: {
      type: "objective",
      name: "cisco:300-435:2.3",
      description: "RESTCONF",
    },
    o210: { type: "objective", name: "cisco:300-435:2.10", description: "Ten" },
    t1: { type: "topic", name: "netconf" },
    unused: { type: "topic", name: "nothing" },
  },
  questions: {
    q1: {
      type: "multichoice",
      text: "a",
      tags: ["e1", "d2", "o23", "t1"],
      quizzes: ["z1", "z2"],
    },
    q2: {
      type: "match",
      text: "b",
      tags: ["e1", "d2", "o210"],
      quizzes: ["z2"],
    },
  },
  quizzes: {
    z1: { slug: "netconf", title: "NETCONF", tags: [] },
    z2: { slug: "quiz-1", title: "Practice Quiz 1", tags: [] },
  },
}
const at = (
  iso: string,
  question_id: string,
  quiz_id: string,
  correct: boolean,
) => ({
  user_id: "u",
  quiz_id,
  question_type: "x",
  question_id,
  answer: [],
  points: correct ? 1 : 0,
  correct,
  answered_at: iso,
})

describe("scope", () => {
  test("tag scopes use the question's own tags", () => {
    expect(questionInScope("tag:o23", meta)("q1")).toBe(true)
    expect(questionInScope("tag:o23", meta)("q2")).toBe(false)
    expect(questionInScope("tag:e1", meta)("q2")).toBe(true)
  })
  test("quiz scopes use the quiz the answer was given in, falling back to membership for unknown quizzes", () => {
    const answers = [
      at("2026-10-01T10:00:00Z", "q1", "z1", true),
      at("2026-10-01T11:00:00Z", "q1", "z2", false),
      at("2026-10-01T12:00:00Z", "q1", "old-quiz", true),
    ]
    expect(
      answersInScope(answers, "quiz:z2", meta).map((a) => a.correct),
    ).toEqual([false, true])
    expect(answersInScope(answers, "all", meta).length).toBe(3)
  })
  test("options group used tags by type, in natural order, then quizzes", () => {
    const groups = Object.fromEntries(
      scopeOptions(meta).map((g) => [g.label, g.options.map((o) => o.label)]),
    )
    expect(groups.Exams).toEqual(["ENAUTO"])
    expect(groups.Objectives).toEqual(["2.3 RESTCONF", "2.10 Ten"])
    expect(groups.Topics).toEqual(["netconf"])
    expect(groups.Quizzes).toEqual(["NETCONF", "Practice Quiz 1"])
  })
})

describe("time", () => {
  const now = Date.parse("2026-10-10T12:00:00Z")
  test("auto bucket size follows the span", () => {
    expect(autoBucket({ from: now - 86400000, to: now })).toBe("hour")
    expect(autoBucket({ from: now - 30 * 86400000, to: now })).toBe("day")
    expect(autoBucket({ from: now - 200 * 86400000, to: now })).toBe("week")
  })
  test("extent runs from the first answer to the last, at least an hour wide", () => {
    expect(answerExtent([])).toBe(null)
    const one = answerExtent([at("2026-10-01T10:00:00Z", "q1", "z1", true)])!
    expect(one.to - one.from).toBe(3600000)
  })
  test("a window is clamped to the extent, or reset when outside it", () => {
    expect(clampRange({ from: 0, to: 50 }, { from: 10, to: 100 })).toEqual({
      from: 10,
      to: 50,
    })
    expect(clampRange({ from: 200, to: 300 }, { from: 10, to: 100 })).toEqual({
      from: 10,
      to: 100,
    })
  })
  test("buckets cover the range with no gaps", () => {
    expect(
      bucketStarts({ from: now - 3 * 86400000, to: now }, "day").length,
    ).toBe(4)
  })
  test("series counts answers, accuracy per bucket and running accuracy", () => {
    const answers = [
      at("2026-10-08T09:00:00", "q1", "z1", true),
      at("2026-10-08T10:00:00", "q2", "z2", false),
      at("2026-10-10T09:00:00", "q1", "z1", true),
    ]
    const range = {
      from: new Date("2026-10-08T00:00:00").getTime(),
      to: new Date("2026-10-10T23:00:00").getTime(),
    }
    const s = series(answers, range, "day")
    expect(s.answered).toEqual([2, 0, 1])
    expect(s.accuracy).toEqual([50, null, 100])
    expect(s.running).toEqual([50, 50, 66.7])
  })
})

test("summary reports coverage of the scope", () => {
  const answers = [
    at("2026-10-01T10:00:00Z", "q1", "z1", true),
    at("2026-10-02T10:00:00Z", "q1", "z1", false),
  ]
  expect(summary(answers, ["q1", "q2"])).toEqual({
    answered: 2,
    correct: 1,
    percent: 50,
    distinct: 1,
    inScope: 2,
    coverage: 50,
  })
})
