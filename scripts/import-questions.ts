// Import questions from a TOON file into the database, one table per question type.
//   DB_PATH=<db> bun scripts/import-questions.ts <file.toon>... [--dry-run] [--exam-rename old=new] [--author name]
// An optional `tag` block ({type, name, description}) is created first, so new exams, domains and objectives get
// their descriptions. The file has one block per type (multichoice, multiselect, match, order, slotfill). Each row carries
// a `tags` field ("type:name|type:name|...") and the fields listed in its header. Rows whose text is
// already stored are skipped, so a run can be repeated. Everything is stored in one transaction, so a
// bad row stores nothing. Stop the dev server first: the database file can only be opened once.
import { decode } from "@toon-format/toon"
import { db } from "../src/db/db.ts"
import { createQuestion, ensureTag, objectiveTags, transaction, type NewQuestion } from "../src/lib/questions.ts"
import { examOf, fits } from "./lib/exam-scope.ts"

const args = Bun.argv.slice(2)
const valueFlags = ["--exam-rename", "--author"]
const files = args.filter((a, i) => !a.startsWith("--") && !valueFlags.includes(args[i - 1]))
const dry = args.includes("--dry-run")
const author = args.includes("--author") ? args[args.indexOf("--author") + 1] : undefined
const rename = args.includes("--exam-rename") ? args[args.indexOf("--exam-rename") + 1].split("=") : null
if (!files.length) throw new Error("Usage: bun scripts/import-questions.ts <file.toon>... [--dry-run] [--exam-rename old=new] [--author name]")

const seeded = (text: string) => {
  // Purpose: a repeatable random number generator seeded from a string (FNV-1a hash, then mulberry32)
  let h = 2166136261
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0)!, 16777619)
  return () => {
    // Purpose: next number in 0..1
    h = (h + 0x6d2b79f5) | 0
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const shuffled = <T>(xs: T[], rng: () => number, keepOrder = false) => {
  // Purpose: a shuffled copy; when keepOrder is false the result never equals the input order
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = [...xs]
    for (let k = a.length - 1; k > 0; k--) {
      const r = Math.floor(rng() * (k + 1))
      ;[a[k], a[r]] = [a[r], a[k]]
    }
    if (keepOrder || a.some((x, i) => x !== xs[i])) return a
  }
  return [...xs].reverse()
}

const filled = (...xs: unknown[]) =>
  // Purpose: the non-empty strings among the values, in order
  xs.map(x => String(x ?? "")).filter(x => x !== "")

const exhibitText = (raw: unknown) =>
  // Purpose: an exhibit without its Markdown fence lines, since the player shows it preformatted
  String(raw ?? "")
    .split("\n")
    .filter(line => !line.startsWith("```"))
    .join("\n")
    .trim()

const tagsOf = (raw: string) => {
  // Purpose: parse "type:name|type:name" into tag refs, applying --exam-rename, plus the domain, exam and vendor each objective implies
  const text = rename ? raw.replaceAll(rename[0], rename[1]) : raw
  const refs = text.split("|").map(part => {
    const i = part.indexOf(":")
    return { type: part.slice(0, i), name: part.slice(i + 1) }
  })
  // A question that serves several exams lists an objective for each; every one implies its own exam, domain and vendor.
  const objectives = refs.filter(r => r.type === "objective")
  const seen = new Set<string>()
  return [...refs, ...objectives.flatMap(o => objectiveTags(o.name))].filter(r => {
    const key = `${r.type}:${r.name}`
    return seen.has(key) ? false : (seen.add(key), true)
  })
}

const build: Record<string, (row: any, rng: () => number) => Record<string, unknown>> = {
  multichoice: (r, rng) => ({
    options: shuffled(
      [
        { text: r.correct, points: 1 },
        ...filled(r.w1, r.w2, r.w3).map(text => ({ text, points: 0 })),
      ],
      rng,
      true
    ),
  }),
  multiselect: (r, rng) => {
    const right = filled(r.c1, r.c2, r.c3)
    return {
      number_of_selections: right.length,
      options: shuffled(
        [
          ...right.map(text => ({ text, points: 1 })),
          ...filled(r.w1, r.w2, r.w3).map(text => ({ text, points: 0 })),
        ],
        rng,
        true
      ),
    }
  },
  match: (r, rng) => {
    const prompts: string[] = [],
      right: string[] = []
    for (const n of [1, 2, 3, 4, 5])
      if (r[`p${n}`] !== "") {
        prompts.push(r[`p${n}`])
        right.push(r[`r${n}`])
      }
    const responses = shuffled(right, rng)
    return { prompts, responses, answer: right.map(x => responses.indexOf(x)) }
  },
  order: (r, rng) => {
    const correct = filled(r.s1, r.s2, r.s3, r.s4, r.s5, r.s6)
    const items = shuffled(correct, rng)
    return { items, answer: correct.map(x => items.indexOf(x)) }
  },
  slotfill: (r, rng) => {
    const accepted = filled(r.a1, r.a2, r.a3, r.a4, r.a5)
    const tokens = shuffled([...new Set([...accepted, ...filled(r.d1, r.d2, r.d3)])], rng, true)
    return { tokens, gaps: accepted.map(t => ({ accepted_tokens: [t], points: 1 })) }
  },
}

const data: Record<string, any[]> = {}
for (const file of files)
  for (const [block, rows] of Object.entries(decode(await Bun.file(file).text()) as Record<string, any[]>))
    data[block] = [...(data[block] ?? []), ...rows]
const items: NewQuestion[] = []
const homeOf = new Map<NewQuestion, string>() // the exam a question is written for: the first objective listed
for (const [type, rows] of Object.entries(data)) {
  if (!build[type]) continue // e.g. an audit table
  for (const r of rows) {
    const exhibit = exhibitText(r.exhibit)
    const first = r.tags.split("|").find((t: string) => t.startsWith("objective:"))!.slice("objective:".length)
    const item: NewQuestion = {
      type,
      tags: tagsOf(r.tags),
      text: r.text,
      ...(exhibit ? { exhibit } : {}),
      ...build[type](r, seeded(r.text)),
      explanation: r.explanation,
      ...(Number.isInteger(r.bloom) ? { bloom: r.bloom } : {}),
      ...(Number.isInteger(r.difficulty) ? { difficulty: r.difficulty } : {}),
      ...((r.author || author) ? { author: r.author || author } : {}),
    }
    homeOf.set(item, examOf(rename ? first.replaceAll(rename[0], rename[1]) : first))
    items.push(item)
  }
}

const scopeErrors = items.flatMap(q => {
  // Purpose: the exams a question is tagged for although it mentions a technology outside the exam's scope
  const corpus = JSON.stringify({ ...q, tags: undefined })
  return q.tags.filter(t => t.type === "exam" && t.name !== homeOf.get(q) && !fits(t.name, corpus)).map(t => `  ${t.name}: ${String(q.text).slice(0, 90)}`)
})
if (scopeErrors.length) throw new Error(`Questions outside the scope of an exam they are tagged for:\n${scopeErrors.join("\n")}`)

const exists = async (text: string) =>
  // Purpose: true when a question with exactly this text is already stored
  Boolean(await db.prepare("SELECT 1 FROM question WHERE text = ?").get([text]))

// questions that start the same way as one that is already stored are probably the same question: list them
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 70)
const known = new Map<string, string>()
for (const r of (await db.prepare("SELECT text FROM question").all()) as any[]) known.set(norm(r.text), r.text)
const similar = items.filter(q => known.has(norm(q.text as string)) && known.get(norm(q.text as string)) !== q.text)
if (similar.length) console.log(`Warning: ${similar.length} questions start like a stored question:\n${similar.map(q => `  ${String(q.text).slice(0, 100)}`).join("\n")}`)

let stored = 0,
  skipped = 0
const byType: Record<string, number> = {}
await transaction(async () => {
  for (const t of data.tag ?? []) await ensureTag({ type: t.type, name: t.name, description: t.description })
  for (const q of items) {
    if (await exists(q.text as string)) {
      skipped++
      continue
    }
    for (const t of q.tags) await ensureTag(t)
    await createQuestion(q)
    stored++
    byType[q.type] = (byType[q.type] ?? 0) + 1
  }
  if (dry) throw new Error("dry run: rolled back")
}).catch(e => {
  if (!dry || e.message !== "dry run: rolled back") throw e
})
console.log(`${dry ? "Dry run (rolled back): would store" : "Stored"} ${stored}, skipped ${skipped} already present`, byType)
