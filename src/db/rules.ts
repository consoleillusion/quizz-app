// Semantic rules per question type: the invariants JSON Schema can't express.
// Each rule takes a question row and returns a list of problems (empty = valid).

const positive = (options: {points: number}[]) =>
  // Purpose: count options that award positive points
  options.filter(o => o.points > 0).length

export const isPermutation = (xs: number[], n: number) =>
  // Purpose: true when xs holds each of 0..n-1 exactly once
  xs.length === n && [...xs].sort((a, b) => a - b).every((x, i) => x === i)

export const slotNumbers = (q: {text: string, exhibit?: string}) =>
  // Purpose: list the distinct slot numbers (⟦n⟧) used in a question's text and exhibit
  [...new Set([...`${q.text}\n${q.exhibit ?? ""}`.matchAll(/⟦(\d+)⟧/g)].map(m => Number(m[1])))].sort((a, b) => a - b)

const check = (ok: boolean, message: string) =>
  // Purpose: turn a condition into a zero- or one-item problem list
  ok ? [] : [message]

export const rules: Record<string, (q: any) => string[]> = (
  // Purpose: exactly one option must be correct
  { multichoice: q => check(positive(q.options) === 1, `expected exactly 1 correct option, found ${positive(q.options)}`)

  // Purpose: the number of correct options must equal number_of_selections
  , multiselect: q =>
      check( positive(q.options) === q.number_of_selections
           , `number_of_selections is ${q.number_of_selections} but ${positive(q.options)} options are correct`
           )

  // Purpose: answer must pair every prompt with a distinct response
  , match: q =>
    [...check(q.prompts.length === q.responses.length, "prompts and responses must be the same length"),
     ...check(q.answer.length === q.prompts.length && isPermutation(q.answer, q.responses.length), "answer must map each prompt to a distinct response index")]

  // Purpose: answer must be a permutation of the item indexes
  , order: q =>
    check(isPermutation(q.answer, q.items.length), "answer must list every item index exactly once")

    // Purpose: slots must be numbered 1..n with one gap each, and accepted tokens must be in the bank
  , slotfill: q => {
    const slots = slotNumbers(q)
    return [
      ...check(slots.length === q.gaps.length && slots.every((n, i) => n === i + 1),
        `slots ${slots.join(",") || "none"} don't match ${q.gaps.length} gaps numbered from 1`),
      ...q.gaps.flatMap((g: any, i: number) =>
        g.accepted_tokens.filter((t: string) => !q.tokens.includes(t)).map((t: string) => `gap ${i + 1}: "${t}" is not in tokens`)),
    ]
  },

  // Purpose: open questions have no rules beyond their schema
  open: () => []
  })
