import { describe, expect, test } from "bun:test"
import {
  domainShares,
  domainTallies,
  domainWeight,
  drawQuestions,
  type IndexedQuestion,
  questionRank,
  UNDERSTOOD_ABOVE,
  tallyAnswers,
} from "./exam.ts"

const seeded = (seed: number) => () => {
  // Purpose: a small repeatable random number generator (mulberry32) for the tests
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const index = (...sizes: number[]): IndexedQuestion[] =>
  // Purpose: an exam index with sizes[d] questions in domain d, ids like "d1q3"
  sizes.flatMap((n, d) => Array.from({ length: n }, (_, k) => ({ id: `d${d}q${k}`, domain: d })))

describe("tallies", () => {
  test("count answers and right answers per question and per domain", () => {
    const h = tallyAnswers([
      { question_id: "d0q0", correct: true },
      { question_id: "d0q0", correct: false },
      { question_id: "d1q0", correct: true },
      { question_id: "other", correct: true },
    ])
    expect(h.d0q0).toEqual({ asked: 2, correct: 1 })
    expect(domainTallies(index(2, 2), h, 2)).toEqual([
      { asked: 2, correct: 1 },
      { asked: 1, correct: 1 },
    ])
  })
})

describe("weights", () => {
  test("a weak domain outweighs a strong one at the same volume", () => {
    expect(domainWeight({ asked: 20, correct: 5 })).toBeGreaterThan(
      domainWeight({ asked: 20, correct: 19 })
    )
  })
  test("a thinly asked domain outweighs a heavily asked one at the same accuracy", () => {
    expect(domainWeight({ asked: 2, correct: 1 })).toBeGreaterThan(
      domainWeight({ asked: 200, correct: 100 })
    )
  })
  test("a mastered domain never drops to zero", () => {
    expect(domainWeight({ asked: 500, correct: 500 })).toBeGreaterThan(0)
  })
  test("questions rank: unanswered, then least right, then understood", () => {
    const rank = (asked: number, correct: number) => questionRank({ asked, correct })
    expect(questionRank()).toEqual([0, 0])
    expect(rank(1, 0)[0]).toBe(1)
    expect(rank(4, 0)[1]).toBeLessThan(rank(4, 2)[1])
  })
  test("understood means strictly more than 85% right", () => {
    expect(UNDERSTOOD_ABOVE).toBe(0.85)
    expect(questionRank({ asked: 20, correct: 17 })[0]).toBe(1) // exactly 85%
    expect(questionRank({ asked: 7, correct: 6 })[0]).toBe(2) // 85.7%
    expect(questionRank({ asked: 1, correct: 1 })[0]).toBe(2)
    expect(questionRank({ asked: 100, correct: 99 })[0]).toBe(2) // one slip in a hundred is understood
  })
  test("shares sum to one and skip empty domains", () => {
    const s = domainShares(
      [
        { asked: 0, correct: 0 },
        { asked: 5, correct: 5 },
        { asked: 0, correct: 0 },
      ],
      [true, true, false]
    )
    expect(s[2]).toBe(0)
    expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })
})

describe("drawQuestions", () => {
  const idx = index(20, 20, 20)
  const draw = (history = {}, exclude: string[] = [], seed = 1, i = idx) =>
    drawQuestions({ index: i, history, domainCount: 3, exclude, rng: seeded(seed) })

  test("returns ten distinct questions", () => {
    const ids = draw()
    expect(ids).toHaveLength(10)
    expect(new Set(ids).size).toBe(10)
  })
  test("draws more from the domain that is going badly", () => {
    const history = tallyAnswers([
      ...Array.from({ length: 30 }, (_, k) => ({ question_id: `d0q${k % 20}`, correct: false })),
      ...Array.from({ length: 30 }, (_, k) => ({ question_id: `d1q${k % 20}`, correct: true })),
      ...Array.from({ length: 30 }, (_, k) => ({ question_id: `d2q${k % 20}`, correct: true })),
    ])
    const counts = [0, 0, 0]
    for (let s = 1; s <= 200; s++) for (const id of draw(history, [], s)) counts[Number(id[1])]++
    expect(counts[0]).toBeGreaterThan(counts[1] * 2)
    expect(counts[0]).toBeGreaterThan(counts[2] * 2)
  })
  test("favours a domain that has hardly been asked", () => {
    const history = tallyAnswers(
      Array.from({ length: 100 }, (_, k) => ({ question_id: `d0q${k % 20}`, correct: k % 2 === 0 }))
    )
    const counts = [0, 0, 0]
    for (let s = 1; s <= 200; s++) for (const id of draw(history, [], s)) counts[Number(id[1])]++
    expect(counts[1]).toBeGreaterThan(counts[0])
  })
  const one = index(10)
  const answers = (...spec: [number, number, number][]) =>
    // Purpose: history for questions d0q<k>: [k, times asked, times right]
    tallyAnswers(
      spec.flatMap(([k, asked, right]) =>
        Array.from({ length: asked }, (_, n) => ({ question_id: `d0q${k}`, correct: n < right }))
      )
    )
  const one10 = (history: object, count: number, seed = 1) =>
    drawQuestions({ index: one, history, domainCount: 1, count, rng: seeded(seed) })

  test("unanswered questions come before every answered one", () => {
    // d0q0..d0q7 answered (some wrong, some right); d0q8 and d0q9 never answered
    const h = answers([0, 1, 0], [1, 1, 0], [2, 3, 0], [3, 1, 1], [4, 1, 1], [5, 1, 1], [6, 1, 1], [7, 1, 1])
    for (let s = 1; s <= 30; s++) expect(one10(h, 2, s).sort()).toEqual(["d0q8", "d0q9"])
  })
  test("with everything answered, the least right come first", () => {
    // right shares: q0 0%, q1 25%, q2 50%, q3 75%, the rest 100% (understood)
    const h = answers([0, 4, 0], [1, 4, 1], [2, 4, 2], [3, 4, 3], ...[4, 5, 6, 7, 8, 9].map(k => [k, 2, 2] as [number, number, number]))
    for (let s = 1; s <= 30; s++) expect(one10(h, 4, s).sort()).toEqual(["d0q0", "d0q1", "d0q2", "d0q3"])
  })
  test("a question wrong once among many right is understood, and ranks behind one still being learned", () => {
    // q0: 19 of 20 right (95%, understood). q1: 1 of 2 right (50%, learning). Others unanswered.
    const h = answers([0, 20, 19], [1, 2, 1])
    const ids = drawQuestions({ index: index(2), history: h, domainCount: 1, count: 2, rng: seeded(1) })
    expect(ids).toEqual(["d0q1", "d0q0"])
  })
  test("a question right once is understood but is not shelved: it still comes when nothing else is left", () => {
    const h = answers([0, 1, 1], [1, 5, 5])
    const ids = drawQuestions({ index: index(2), history: h, domainCount: 1, count: 2, rng: seeded(1) })
    expect(ids).toEqual(["d0q0", "d0q1"]) // among understood questions the least asked is first
  })
  test("ties are broken at random", () => {
    const h = answers(...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => [k, 2, 1] as [number, number, number]))
    const first = new Set<string>()
    for (let s = 1; s <= 60; s++) first.add(one10(h, 1, s)[0])
    expect(first.size).toBeGreaterThan(3)
  })
  test("skips questions already served while enough remain", () => {
    const served = idx.slice(0, 40).map(q => q.id)
    for (const id of draw({}, served)) expect(served).not.toContain(id)
  })
  test("falls back to the whole exam, minus the last batch, when little is left", () => {
    const all = idx.map(q => q.id)
    const ids = draw({}, all)
    expect(ids).toHaveLength(10)
    for (const id of ids) expect(all.slice(-10)).not.toContain(id)
  })
  test("returns fewer when the exam is smaller than a batch", () => {
    expect(draw({}, [], 1, index(3))).toHaveLength(3)
    expect(draw({}, [], 1, [])).toEqual([])
  })
})
