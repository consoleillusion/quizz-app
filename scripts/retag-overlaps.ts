// Add the exam, domain and objective tags that overlapping questions are missing, and rate bloom and
// difficulty for the questions that gain tags.
//   DB_PATH=<db> bun scripts/retag-overlaps.ts [--dry-run]
// A rule says: a question tagged with objective FROM also serves objectives TO of another exam, when its
// text matches WHEN (or always, with no WHEN). Only close topics are mapped: knowing one should help with
// the other. Tags are only added, never removed, and a run can be repeated. Bloom and difficulty are only
// filled where empty, from the objective's verb, the question type and its exhibit (a rule-based estimate).
// Stop the dev server first: the database file can only be opened once.
import { db } from "../src/db/db.ts"
import { objectiveTags, transaction } from "../src/lib/questions.ts"

const A = "cisco:300-435",
  B = "cisco:350-901",
  C = "cisco:300-635",
  S = "isc2:cissp"
type Rule = { from: string; to: string[]; when?: RegExp }
const o = (exam: string, n: string) => `${exam}:${n}`

const rules: Rule[] = [
  // 300-435 ENAUTO -> 300-635 DCNAUTO, 350-901 AUTOCOR, CISSP
  { from: o(A, "1.1"), to: [o(C, "1.1")] },
  { from: o(A, "1.2"), to: [o(C, "1.4")], when: /netconf/i },
  { from: o(A, "1.2"), to: [o(B, "1.3")], when: /restconf/i },
  { from: o(A, "1.3"), to: [o(B, "2.7")] },
  { from: o(A, "1.3"), to: [o(C, "1.5")], when: /pyang|yang suite/i },
  { from: o(A, "1.4"), to: [o(C, "1.5")], when: /pyang|yang suite/i },
  { from: o(A, "1.5"), to: [o(C, "1.5")], when: /pyang|\btree\b/i },
  { from: o(A, "2.1"), to: [o(B, "1.4")] },
  { from: o(A, "2.2"), to: [o(C, "3.1"), o(B, "1.4")] },
  { from: o(A, "2.3"), to: [o(B, "1.3"), o(B, "1.4")] },
  { from: o(A, "2.4"), to: [o(B, "1.1"), o(C, "2.3")] },
  { from: o(A, "2.5"), to: [o(C, "3.2")], when: /ztp|day[- ]?0|zero[- ]touch|poap/i },
  { from: o(A, "2.6"), to: [o(B, "1.3")], when: /restconf/i },
  { from: o(A, "2.7"), to: [o(C, "3.3")], when: /guest ?shell|on-box|python|bash/i },
  { from: o(A, "3.2"), to: [o(B, "1.6")], when: /pagination|offset|rate.?limit|429|retry-after|token|expire|401|authenticat/i },
  { from: o(A, "3.3"), to: [o(C, "2.2")] },
  { from: o(A, "3.4"), to: [o(B, "1.1"), o(C, "2.3")] },
  { from: o(A, "3.5"), to: [o(S, "4.1")], when: /segment/i },
  { from: o(A, "3.5"), to: [o(S, "4.2")], when: /802\.1x|posture|\bnac\b|network access control/i },
  { from: o(A, "3.6"), to: [o(B, "1.6")], when: /429|pagination|401|403|404|rate.?limit|status code|retry|5\d\d/i },
  { from: o(A, "4.1"), to: [o(B, "3.4"), o(C, "4.2")], when: /pyats|genie|learn|diff|validat/i },
  { from: o(A, "4.2"), to: [o(B, "2.4"), o(C, "4.1")] },
  { from: o(A, "4.4"), to: [o(C, "4.6")], when: /health/i },
  { from: o(A, "4.5"), to: [o(B, "3.1"), o(C, "4.3"), o(C, "4.4")] },
  { from: o(A, "4.6"), to: [o(B, "3.2")], when: /webhook/i },
  { from: o(A, "5.2"), to: [o(B, "4.1"), o(C, "5.1")] },
  { from: o(A, "5.3"), to: [o(B, "4.2"), o(C, "5.2")] },
  { from: o(A, "5.3"), to: [o(S, "3.7")], when: /poison|adversarial|prompt injection|injection/i },
  { from: o(A, "5.4"), to: [o(B, "4.3"), o(C, "5.3")] },
  // 350-901 AUTOCOR -> 300-435, 300-635, CISSP
  { from: o(B, "1.1"), to: [o(C, "2.3")] },
  { from: o(B, "1.1"), to: [o(A, "2.4")], when: /ios_|network_cli|cisco\.ios|nxos|device/i },
  { from: o(B, "1.1"), to: [o(A, "3.4")], when: /meraki|catalyst|dnac|controller|ise/i },
  { from: o(B, "1.2"), to: [o(C, "2.4")] },
  { from: o(B, "1.3"), to: [o(A, "1.2"), o(A, "2.3")], when: /restconf/i },
  { from: o(B, "1.4"), to: [o(A, "2.1")], when: /netmiko/i },
  { from: o(B, "1.4"), to: [o(A, "2.2"), o(C, "3.1")], when: /ncclient|netconf/i },
  { from: o(B, "1.4"), to: [o(A, "2.3")], when: /restconf/i },
  { from: o(B, "1.5"), to: [o(C, "2.1")], when: /\biac\b|infrastructure as code|version control|\bgit/i },
  { from: o(B, "1.6"), to: [o(A, "3.2")] },
  { from: o(B, "1.6"), to: [o(A, "3.6")], when: /error|401|403|404|429|5\d\d|retry/i },
  { from: o(B, "2.1"), to: [o(C, "2.1")] },
  { from: o(B, "2.2"), to: [o(C, "2.1")], when: /gitlab|pipeline|ci\/cd|\bci\b/i },
  { from: o(B, "2.3"), to: [o(C, "2.1")], when: /gitlab|pipeline|ci\/cd|\bci\b/i },
  { from: o(B, "2.3"), to: [o(S, "8.2")], when: /sast|dast|security scan|dependency scan|secret scan/i },
  { from: o(B, "2.4"), to: [o(A, "4.2"), o(C, "4.1")] },
  { from: o(B, "2.6"), to: [o(C, "4.5")] },
  { from: o(B, "2.7"), to: [o(A, "1.3")], when: /json/i },
  { from: o(B, "3.1"), to: [o(A, "4.5"), o(C, "4.3")] },
  { from: o(B, "3.2"), to: [o(A, "4.6")], when: /webhook/i },
  { from: o(B, "3.2"), to: [o(S, "7.2")], when: /siem|centrali[sz]ed log|log aggregation|syslog server/i },
  { from: o(B, "3.4"), to: [o(A, "4.1"), o(C, "4.2")] },
  { from: o(B, "3.5"), to: [o(S, "3.6")], when: /\bpki\b|certificate authority|intermediate|chain of trust|trust store|root ca|\bcsr\b/i },
  { from: o(B, "3.6"), to: [o(S, "8.5")], when: /input validation|injection|sanitiz|parameteri[sz]|allow-?list|hard-?cod/i },
  { from: o(B, "4.1"), to: [o(A, "5.2"), o(C, "5.1")] },
  { from: o(B, "4.2"), to: [o(A, "5.3"), o(C, "5.2")] },
  { from: o(B, "4.2"), to: [o(S, "3.7")], when: /poison|adversarial|prompt injection|injection/i },
  { from: o(B, "4.3"), to: [o(A, "5.4"), o(C, "5.3")] },
  { from: o(B, "4.4"), to: [o(C, "5.3")] },
  { from: o(B, "4.5"), to: [o(A, "5.2"), o(C, "5.1")] },
]

const tables: Record<string, string> = {
  multichoice: "json(options)",
  multiselect: "json(options)",
  match: "json(prompts) || json(responses)",
  order: "json(items)",
  slotfill: "json(tokens) || json(gaps)",
}

const verbBloom = (description: string) => {
  // Purpose: the Bloom level suggested by the opening verb of an objective
  const verb = description.trim().split(/\s+/)[0]
  return ({ Describe: 2, Interpret: 3, Use: 3, Construct: 3, Implement: 3, Configure: 3, Integrate: 3, Select: 5, Diagnose: 4, Troubleshoot: 4, Evaluate: 5 } as Record<string, number>)[verb] ?? 3
}

const estimate = (type: string, q: any, baseBloom: number) => {
  // Purpose: a rule-based Bloom level and difficulty for a question from its objective verb, type and exhibit
  let bloom = baseBloom
  if (type === "match") bloom = Math.min(bloom, 2)
  if (type === "order") bloom = Math.min(bloom, 3)
  if (type === "slotfill") bloom = Math.max(bloom, 2)
  const hasExhibit = Boolean(q.exhibit)
  if (hasExhibit && ["multichoice", "multiselect"].includes(type) && baseBloom >= 4) bloom = Math.max(bloom, 4)
  bloom = Math.max(1, Math.min(6, bloom))
  let difficulty = ({ 1: 1, 2: 2, 3: 3, 4: 3, 5: 4, 6: 5 } as Record<number, number>)[bloom]
  if ((type === "multiselect" && q.number_of_selections >= 3) || (type === "order" && q.n >= 6) || (type === "slotfill" && q.n >= 4)) difficulty += 1
  if (hasExhibit && bloom >= 3 && ["multichoice", "multiselect"].includes(type)) difficulty += 1
  if (type === "match" && q.n <= 4) difficulty -= 1
  return { bloom, difficulty: Math.max(1, Math.min(5, difficulty)) }
}

const dry = Bun.argv.includes("--dry-run")
const tagRows: any[] = await db.prepare("SELECT id, type, name, description FROM tag").all()
const tagByKey = new Map(tagRows.map(t => [`${t.type}:${t.name}`, t]))
const links: any[] = await db.prepare("SELECT question_type, question_id, tag_id FROM question_tag").all()
const have = new Set(links.map(l => `${l.question_id}|${l.tag_id}`))
const tagsOf = new Map<string, any[]>()
const tagById = new Map(tagRows.map(t => [t.id, t]))
for (const l of links) tagsOf.set(l.question_id, [...(tagsOf.get(l.question_id) ?? []), tagById.get(l.tag_id)])

const tally: Record<string, number> = {}
const touched = new Map<string, { type: string; base: number; row: any }>()
let added = 0
const insert = db.prepare("INSERT INTO question_tag (question_type, question_id, tag_id) VALUES (?, ?, ?) ON CONFLICT DO NOTHING")

await transaction(async () => {
  for (const [type, body] of Object.entries(tables)) {
    const extra = type === "multiselect" ? ", number_of_selections" : type === "order" ? ", json_array_length(items) AS n" : type === "slotfill" ? ", json_array_length(gaps) AS n" : type === "match" ? ", json_array_length(prompts) AS n" : ""
    const rows: any[] = await db.prepare(`SELECT id, text, exhibit, explanation, bloom, difficulty, ${body} AS body${extra} FROM question_${type}`).all()
    for (const q of rows) {
      const mine = tagsOf.get(q.id) ?? []
      const objectives = new Set(mine.filter(t => t.type === "objective").map(t => t.name))
      const corpus = `${q.text}\n${q.exhibit ?? ""}\n${q.explanation ?? ""}\n${q.body ?? ""}`
      for (const rule of rules) {
        if (!objectives.has(rule.from) || (rule.when && !rule.when.test(corpus))) continue
        for (const target of rule.to) {
          for (const t of objectiveTags(target)) {
            const tag = tagByKey.get(`${t.type}:${t.name}`)
            if (!tag) throw new Error(`Missing tag ${t.type}:${t.name}`)
            const key = `${q.id}|${tag.id}`
            if (have.has(key)) continue
            have.add(key)
            await insert.run([type, q.id, tag.id])
            added++
            if (t.type === "objective") tally[`${rule.from} -> ${target}`] = (tally[`${rule.from} -> ${target}`] ?? 0) + 1
            if (!touched.has(q.id)) {
              const own = tagByKey.get(`objective:${rule.from}`)
              touched.set(q.id, { type, base: verbBloom(own?.description ?? ""), row: q })
            }
          }
        }
      }
    }
  }
  let rated = 0
  for (const [id, t] of touched) {
    if (t.row.bloom && t.row.difficulty) continue
    const e = estimate(t.type, t.row, t.base)
    await db.prepare(`UPDATE question_${t.type} SET bloom = COALESCE(bloom, ?), difficulty = COALESCE(difficulty, ?) WHERE id = ?`).run([e.bloom, e.difficulty, id])
    rated++
  }
  console.log(`${dry ? "Dry run (rolled back): would add" : "Added"} ${added} tag links to ${touched.size} questions; rated bloom and difficulty on ${rated}`)
  if (dry) throw new Error("dry run: rolled back")
}).catch(e => {
  if (!dry || e.message !== "dry run: rolled back") throw e
})
console.log(Object.entries(tally).sort().map(([k, v]) => `  ${k}: ${v}`).join("\n"))
