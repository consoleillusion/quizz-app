// Pure grading, shared by the quiz UI and (later) the server.
// An answer is an array, matching user_answer.answer:
//   multichoice [optionIndex]   multiselect [optionIndex, ...]   match [responseIndex per prompt]
//   order [itemIndex in sequence]   slotfill [token per gap]   open [typed value]
// Option and item indexes always refer to the stored order, never the shuffled display order.

export type Grade = { correct: boolean; points: number; max: number }

const sum = (xs: number[]) =>
  // Purpose: add up a list of numbers
  xs.reduce((a, b) => a + b, 0)

const sameMembers = (a: number[], b: number[]) =>
  // Purpose: true when two index lists hold the same values, ignoring order
  a.length === b.length && a.every((x) => b.includes(x))

const correctIndexes = (options: { points: number }[]) =>
  // Purpose: indexes of options that award positive points
  options.flatMap((o, i) => (o.points > 0 ? [i] : []))

const normalise = (q: any) => (value: string) => {
  // Purpose: canonicalise a typed answer for comparison under the question's rules
  const v = String(value).trim()
  return q.answer_type === "number" || q.answer_type === "integer"
    ? String(Number(v))
    : q.case_sensitive
      ? v
      : v.toLowerCase()
}

const graders: Record<string, (q: any, answer: any[]) => Grade> = {
  multichoice: (q, [i]) => {
    // Purpose: score a single choice by the chosen option's points
    const max = Math.max(...q.options.map((o: any) => o.points))
    const points = q.options[i]?.points ?? 0
    return {
      correct: points === max && max > 0,
      points: Math.max(points, 0),
      max,
    }
  },

  multiselect: (q, answer) => {
    // Purpose: all-or-nothing: the selection must be exactly the positive options
    const max = sum(correctIndexes(q.options).map((i) => q.options[i].points))
    const correct = sameMembers(answer, correctIndexes(q.options))
    return { correct, points: correct ? max : 0, max }
  },

  match: (q, answer) => {
    // Purpose: one point per correctly paired prompt
    const points = q.answer.filter(
      (r: number, i: number) => answer[i] === r,
    ).length
    return { correct: points === q.answer.length, points, max: q.answer.length }
  },

  order: (q, answer) => {
    // Purpose: all-or-nothing: the whole sequence must match
    const correct =
      answer.length === q.answer.length &&
      q.answer.every((x: number, i: number) => answer[i] === x)
    return { correct, points: correct ? 1 : 0, max: 1 }
  },

  slotfill: (q, answer) => {
    // Purpose: sum the points of each gap filled with an accepted token
    const gapPoints = (g: any) => g.points ?? 1
    const max = sum(q.gaps.map(gapPoints))
    const points = sum(
      q.gaps.map((g: any, i: number) =>
        g.accepted_tokens.includes(answer[i]) ? gapPoints(g) : 0,
      ),
    )
    return { correct: points === max, points, max }
  },

  open: (q, [value]) => {
    // Purpose: correct when the typed value matches any accepted answer
    const correct =
      value !== undefined &&
      q.answers.map(normalise(q)).includes(normalise(q)(value))
    return { correct, points: correct ? 1 : 0, max: 1 }
  },
}

export const grade = (q: { type: string }, answer: any[]): Grade =>
  // Purpose: grade an answer with the grader for the question's type
  graders[q.type](q, answer)

export const isComplete = (q: any, answer: any[] | undefined) => {
  // Purpose: true when an answer has a value everywhere the question needs one
  if (!answer) return false
  const filled = (n: number) =>
    answer.length === n &&
    answer.every((x) => x !== null && x !== undefined && x !== "")
  return (
    {
      multichoice: () => filled(1),
      multiselect: () => filled(q.number_of_selections),
      match: () => filled(q.prompts?.length),
      order: () => filled(q.items?.length),
      slotfill: () => filled(q.gaps?.length),
      open: () => filled(1),
    } as Record<string, () => boolean>
  )[q.type]()
}
