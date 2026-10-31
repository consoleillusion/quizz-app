// Converts the legacy compact quizlet format into typed question rows.
// Compact fields: g domain, t objective, p prompt, c exhibit, o options, a answer,
// e explanation, y type (m multiselect, x match, o order, g slotfill; absent = multichoice),
// s left/ordered items, r right items (match), bank tokens (slotfill).

export const compactType = (q: any) =>
  // Purpose: name the question table a compact question belongs in
  ({m: "multiselect", x: "match", o: "order", g: "slotfill"} as Record<string, string>)[q.y] ?? "multichoice"

const common = (exam: string) => (q: any) => ({
  // Purpose: fields every question type shares
  text: q.p,
  ...(q.c ? {exhibit: q.c} : {}),
  explanation: q.e,
  objectives: [`${exam}:${q.t}`],
})

const correctOption = (q: any) =>
  // Purpose: the text of the correct option in a matching or ordering question
  q.o[q.a] as string

const converters: Record<string, (q: any) => object> = {
  multichoice: q =>
    // Purpose: one option worth a point, the rest worth nothing
    ({options: q.o.map((text: string, i: number) => ({text, points: i === q.a ? 1 : 0}))}),

  multiselect: q =>
    // Purpose: every listed answer worth a point; selections = number of answers
    ({number_of_selections: q.a.length,
      options: q.o.map((text: string, i: number) => ({text, points: q.a.includes(i) ? 1 : 0}))}),

  match: q =>
    // Purpose: turn "1-d, 2-b, …" into a prompt-to-response index array
    ({prompts: q.s, responses: q.r,
      answer: [...correctOption(q).matchAll(/(\d+)-([a-z])/g)].map(m => m[2].charCodeAt(0) - 97)}),

  order: q =>
    // Purpose: turn "2, 4, 5, 3, 1" into 0-based item indexes in sequence
    ({items: q.s, answer: [...correctOption(q).matchAll(/\d+/g)].map(m => Number(m[0]) - 1)}),

  slotfill: q =>
    // Purpose: one gap per answer token, accepting just that token
    ({tokens: q.bank, gaps: q.a.map((t: string) => ({accepted_tokens: [t]}))}),
}

export const fromCompact = (exam: string) => (q: any) => {
  // Purpose: convert one compact question into {type, row} for its question table
  const type = compactType(q)
  return {type, row: {...common(exam)(q), ...converters[type](q)}}
}
