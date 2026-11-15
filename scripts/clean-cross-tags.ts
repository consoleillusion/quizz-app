// Remove exam, domain and objective tags that a question should not carry, and report what was removed.
//   DB_PATH=<db> HOMES=<homes.json> bun scripts/clean-cross-tags.ts [--dry-run]
// A question's home exam is the one it was written for (HOMES maps the older questions to their exam; the
// rest are CISSP when they carry the topic cissp, otherwise DCNAUTO). Any other exam's tags stay only when the
// question fits that exam's scope (see lib/exam-scope.ts). CISSP and Cisco questions never share tags.
// Stop the dev server first: the database file can only be opened once.
import { db } from "../src/db/db.ts"
import { transaction } from "../src/lib/questions.ts"
import { CISSP, DCNAUTO, fits } from "./lib/exam-scope.ts"

const dry = Bun.argv.includes("--dry-run")
const homes: Record<string, string> = JSON.parse(await Bun.file(process.env.HOMES!).text())
const tags: any[] = await db.prepare("SELECT id, type, name FROM tag").all()
const byId = new Map(tags.map(t => [t.id, t]))
const links: any[] = await db.prepare("SELECT question_type, question_id, tag_id FROM question_tag").all()
const tagsOf = new Map<string, any[]>()
for (const l of links) tagsOf.set(l.question_id, [...(tagsOf.get(l.question_id) ?? []), { ...byId.get(l.tag_id), question_type: l.question_type }])

const bodies: Record<string, string> = {
  multichoice: "json(options)", multiselect: "json(options)", match: "json(prompts) || json(responses)",
  order: "json(items)", slotfill: "json(tokens) || json(gaps)",
}
const corpusOf = new Map<string, string>()
for (const [type, body] of Object.entries(bodies)) {
  const rows: any[] = await db.prepare(`SELECT id, text, exhibit, explanation, ${body} AS body FROM question_${type}`).all()
  for (const r of rows) corpusOf.set(r.id, `${r.text}\n${r.exhibit ?? ""}\n${r.explanation ?? ""}\n${r.body ?? ""}`)
}

const removed: Record<string, number> = {}
let questions = 0
await transaction(async () => {
  for (const [id, mine] of tagsOf) {
    const exams = mine.filter(t => t.type === "exam").map(t => t.name)
    const home = homes[id] ?? (exams.length === 1 ? exams[0] : mine.some(t => t.type === "topic" && t.name === "cissp") ? CISSP : DCNAUTO)
    const corpus = corpusOf.get(id) ?? ""
    const drop = exams.filter(e => e !== home && (e === CISSP || home === CISSP || !fits(e, corpus)))
    if (!drop.length) continue
    questions++
    for (const e of drop) {
      removed[`${home} -> ${e}`] = (removed[`${home} -> ${e}`] ?? 0) + 1
      for (const t of mine) {
        if (t.name === e || t.name.startsWith(`${e}:`)) await db.prepare("DELETE FROM question_tag WHERE question_id = ? AND tag_id = ?").run([id, t.id])
      }
    }
    // a vendor tag stays only while an exam of that vendor remains
    const left = exams.filter(e => !drop.includes(e))
    for (const t of mine.filter(t => t.type === "vendor"))
      if (!left.some(e => e.startsWith(`${t.name}:`))) await db.prepare("DELETE FROM question_tag WHERE question_id = ? AND tag_id = ?").run([id, t.id])
  }
  console.log(`${dry ? "Dry run (rolled back): would clean" : "Cleaned"} tags on ${questions} questions`)
  if (dry) throw new Error("dry run: rolled back")
}).catch(e => {
  if (!dry || e.message !== "dry run: rolled back") throw e
})
console.log(Object.entries(removed).sort().map(([k, v]) => `  ${k}: ${v}`).join("\n"))
