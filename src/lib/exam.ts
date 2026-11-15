// Choosing which questions an exam serves next. Pure: no DOM, storage or database access, so the
// browser and the tests share it.
//
// Which domain the next question comes from is a weighted random choice; which question within the
// domain is a strict order of precedence.
//   domain weight  (1 - accuracy) * (1 + NOVELTY / (1 + asked / NOVELTY_SCALE)), never below MIN_DOMAIN_WEIGHT
//                  accuracy is smoothed with one right and one wrong answer, so an untouched domain reads 50%.
//                  The novelty bonus fades as answers pile up, so thinly asked domains are drawn more often.
//                  "asked" counts every answer given in the domain, repeats included.
//   question order 1. never answered
//                  2. answered but not yet understood: the lower its share of right answers, the sooner
//                  3. understood: more than UNDERSTOOD_ABOVE of its answers were right, so it counts as answered
//                     correctly. These come last, the least asked first. The cutoff keeps a question you got
//                     wrong once among many right answers from being asked for ever, and keeps a question you
//                     got right once from being shelved for good.
//                  Ties are broken at random.

export const BATCH = 10
export const NOVELTY = 2
export const NOVELTY_SCALE = 10
export const MIN_DOMAIN_WEIGHT = 0.05
export const UNDERSTOOD_ABOVE = 0.85

export type IndexedQuestion = { id: string; domain: number }
export type Tally = { asked: number; correct: number }
export type History = Record<string, Tally>

export const tallyAnswers = (answers: { question_id: string; correct: boolean }[]) => {
  // Purpose: per-question counts of answers given and answers that were right
  const history: History = {}
  for (const a of answers) {
    const t = (history[a.question_id] ??= { asked: 0, correct: 0 })
    t.asked++
    if (a.correct) t.correct++
  }
  return history
}

export const domainTallies = (index: IndexedQuestion[], history: History, domainCount: number) => {
  // Purpose: per-domain counts of answers given and right, over the questions in the exam index
  const tallies: Tally[] = Array.from({ length: domainCount }, () => ({ asked: 0, correct: 0 }))
  for (const q of index) {
    const t = history[q.id]
    if (t && tallies[q.domain]) {
      tallies[q.domain].asked += t.asked
      tallies[q.domain].correct += t.correct
    }
  }
  return tallies
}

export const domainWeight = ({ asked, correct }: Tally) => {
  // Purpose: how strongly a domain should be drawn: weak and thinly asked domains weigh more
  const accuracy = (correct + 1) / (asked + 2)
  const novelty = 1 + NOVELTY / (1 + asked / NOVELTY_SCALE)
  return Math.max(MIN_DOMAIN_WEIGHT, (1 - accuracy) * novelty)
}

export const questionRank = (t?: Tally): [number, number] =>
  // Purpose: sort key for a question within its domain; lower is asked sooner. [tier, tie value within the tier]
  !t || !t.asked
    ? [0, 0]
    : t.correct / t.asked > UNDERSTOOD_ABOVE
      ? [2, t.asked]
      : [1, t.correct / t.asked]

export const domainShares = (tallies: Tally[], present: boolean[]) => {
  // Purpose: each domain's share (0..1) of the next draw; domains with no questions get 0
  const weights = tallies.map((t, i) => (present[i] ? domainWeight(t) : 0))
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map(w => (total ? w / total : 0))
}

const pickWeighted = <T>(items: T[], weight: (x: T) => number, rng: () => number) => {
  // Purpose: one item chosen with probability proportional to its weight
  const weights = items.map(weight)
  const total = weights.reduce((a, b) => a + b, 0)
  if (!total) return items[Math.floor(rng() * items.length)]
  let r = rng() * total
  for (const [i, item] of items.entries()) {
    r -= weights[i]
    if (r < 0) return item
  }
  return items[items.length - 1]
}

const pickFirst = <T>(items: T[], rank: (x: T) => [number, number], rng: () => number) => {
  // Purpose: one of the items with the lowest rank, chosen at random among those tied
  const ranks = items.map(rank)
  const best = ranks.reduce((m, r) => (r[0] < m[0] || (r[0] === m[0] && r[1] < m[1]) ? r : m))
  const tied = items.filter((_, i) => ranks[i][0] === best[0] && ranks[i][1] === best[1])
  return tied[Math.floor(rng() * tied.length)]
}

export const drawQuestions = ({
  index,
  history,
  domainCount,
  exclude = [],
  count = BATCH,
  rng = Math.random,
}: {
  index: IndexedQuestion[]
  history: History
  domainCount: number
  exclude?: string[]
  count?: number
  rng?: () => number
}) => {
  // Purpose: choose up to `count` distinct question ids: pick a domain by weight, then a question in it.
  // Questions in `exclude` (already served this visit) are skipped until fewer than `count` remain;
  // then only the most recent `count` served are skipped.
  const skip = new Set(exclude)
  let pool = index.filter(q => !skip.has(q.id))
  if (pool.length < count) {
    const recent = new Set(exclude.slice(-count))
    pool = index.filter(q => !recent.has(q.id))
  }
  const weights = domainShares(
    domainTallies(index, history, domainCount),
    Array.from({ length: domainCount }, () => true)
  )
  const byDomain = new Map<number, IndexedQuestion[]>()
  for (const q of pool) byDomain.set(q.domain, [...(byDomain.get(q.domain) ?? []), q])
  const picked: string[] = []
  while (picked.length < count && byDomain.size) {
    const domain = pickWeighted([...byDomain.keys()], d => weights[d] ?? 0, rng)
    const list = byDomain.get(domain)!
    const q = pickFirst(list, x => questionRank(history[x.id]), rng)
    picked.push(q.id)
    list.splice(list.indexOf(q), 1)
    if (!list.length) byDomain.delete(domain)
  }
  return picked
}
