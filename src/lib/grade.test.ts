import {describe, expect, test} from "bun:test"
import {grade, isComplete} from "./grade.ts"

const opts = (...pts: number[]) => pts.map((points, i) => ({text: `o${i}`, points}))

describe("grade", () => {
  test("multichoice", () => {
    const q = {type: "multichoice", options: opts(0, 1, 0, 0)}
    expect(grade(q, [1])).toEqual({correct: true, points: 1, max: 1})
    expect(grade(q, [2]).correct).toBe(false)
  })
  test("multiselect is all-or-nothing and order-free", () => {
    const q = {type: "multiselect", number_of_selections: 2, options: opts(1, 0, 0, 1, 0)}
    expect(grade(q, [3, 0])).toEqual({correct: true, points: 2, max: 2})
    expect(grade(q, [0, 1])).toEqual({correct: false, points: 0, max: 2})
  })
  test("match gives a point per pair", () => {
    const q = {type: "match", prompts: ["a", "b", "c"], answer: [2, 0, 1]}
    expect(grade(q, [2, 0, 1]).correct).toBe(true)
    expect(grade(q, [2, 1, 0])).toEqual({correct: false, points: 1, max: 3})
  })
  test("order needs the exact sequence", () => {
    const q = {type: "order", items: ["a", "b", "c"], answer: [1, 0, 2]}
    expect(grade(q, [1, 0, 2]).correct).toBe(true)
    expect(grade(q, [0, 1, 2])).toEqual({correct: false, points: 0, max: 1})
  })
  test("slotfill scores each gap", () => {
    const q = {type: "slotfill", gaps: [{accepted_tokens: ["43"]}, {accepted_tokens: ["80", "8080"], points: 2}]}
    expect(grade(q, ["43", "8080"])).toEqual({correct: true, points: 3, max: 3})
    expect(grade(q, ["67", "80"])).toEqual({correct: false, points: 2, max: 3})
  })
  test("open honours case and number rules", () => {
    expect(grade({type: "open", answers: ["Running"]} as any, [" running "]).correct).toBe(true)
    expect(grade({type: "open", answers: ["Running"], case_sensitive: true} as any, ["running"]).correct).toBe(false)
    expect(grade({type: "open", answers: ["830"], answer_type: "integer"} as any, ["0830"]).correct).toBe(true)
  })
})

describe("isComplete", () => {
  test("needs every slot filled", () => {
    expect(isComplete({type: "match", prompts: ["a", "b"]}, [1, null])).toBe(false)
    expect(isComplete({type: "match", prompts: ["a", "b"]}, [1, 0])).toBe(true)
    expect(isComplete({type: "multiselect", number_of_selections: 2}, [1])).toBe(false)
    expect(isComplete({type: "multichoice"}, undefined)).toBe(false)
  })
})
