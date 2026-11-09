// The exam resource: an exam is a tag of type exam, and every question carrying that tag belongs to it.
// Domains are the domain tags under the exam's name. Server-only.
import { db } from "../db/db.ts"
import { HttpError } from "./rest.ts"
import { parseRow, questionTables, selectColumns } from "./schemas.ts"

export const MAX_IDS = 20

export const listExams = async () => {
  // Purpose: every exam that has questions, with its question and domain counts, ordered by name
  const rows = await db
    .prepare(`SELECT t.name, t.description,
      (SELECT count(*) FROM question_tag qt WHERE qt.tag_id = t.id) AS question_count,
      (SELECT count(*) FROM tag d WHERE d.type = 'domain' AND substr(d.name, 1, length(t.name) + 1) = t.name || ':') AS domain_count
      FROM tag t WHERE t.type = 'exam' ORDER BY t.name`)
    .all()
  return rows
    .filter((r: any) => r.question_count > 0)
    .map((r: any) => ({ ...r, url: `/exam/${r.name}` }))
}

const assignments = async (examId: string, examName: string, domainNames: string[]) => {
  // Purpose: each question of the exam once, with the position of its first domain under the exam. A question
  // can carry more than one domain tag of the same exam (when it serves several objectives); it counts once.
  // A question with no domain tag under this exam is left out.
  const position = new Map<string, number>(domainNames.map((name, i) => [name, i]))
  const rows = await db
    .prepare(`SELECT eq.question_id AS id, d.name AS domain
      FROM question_tag eq
      JOIN question_tag dq ON dq.question_type = eq.question_type AND dq.question_id = eq.question_id
      JOIN tag d ON d.id = dq.tag_id AND d.type = 'domain' AND substr(d.name, 1, ?) = ?
      WHERE eq.tag_id = ? ORDER BY eq.question_id`)
    .all([examName.length + 1, `${examName}:`, examId])
  const first = new Map<string, number>()
  for (const r of rows as any[]) {
    const p = position.get(r.domain)
    if (p !== undefined && p < (first.get(r.id) ?? Number.POSITIVE_INFINITY)) first.set(r.id, p)
  }
  return first
}

export const getExam = async (name: string) => {
  // Purpose: one exam by tag name with its domains (in blueprint order) and how many questions each holds, or a 404
  const exam = await db
    .prepare("SELECT id, name, description FROM tag WHERE type = 'exam' AND name = ?")
    .get([name])
  if (!exam) throw new HttpError(404, `No exam ${name}`)
  const domains = await db
    .prepare(`SELECT d.name, d.description FROM tag d
      WHERE d.type = 'domain' AND substr(d.name, 1, ?) = ?`)
    .all([name.length + 1, `${name}:`])
  domains.sort((a: any, b: any) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  const first = await assignments(exam.id as string, name, domains.map((d: any) => d.name))
  const counts = domains.map(() => 0)
  for (const p of first.values()) counts[p]++
  return {
    id: exam.id as string,
    name: exam.name as string,
    description: (exam.description as string) ?? "",
    question_count: first.size,
    domains: domains.map((d: any, i: number) => ({ type: "domain", ...d, question_count: counts[i] })),
    url: `/exam/${exam.name}`,
  }
}

export const examIndex = async (exam: Awaited<ReturnType<typeof getExam>>) => {
  // Purpose: every question in the exam as [id, domain position], with nothing else, so the browser can choose
  // which to ask for
  const first = await assignments(exam.id, exam.name, exam.domains.map((d: any) => d.name))
  return [...first.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([id, p]) => [id, p])
}

export const getExamQuestions = async (exam: { id: string }, ids: string[]) => {
  // Purpose: the full stored questions with these ids that belong to the exam, in the order asked for, with their tags
  if (ids.length > MAX_IDS) throw new HttpError(400, `Ask for at most ${MAX_IDS} questions at a time`)
  if (!ids.length) return []
  // (uuid columns don't match IN (?, ...) in this database engine, so OR the equalities instead)
  const anyOf = (column: string) => `(${ids.map(() => `${column} = ?`).join(" OR ")})`
  const tagRows = await db
    .prepare(`SELECT qt.question_id, t.type, t.name, t.description
      FROM question_tag qt JOIN tag t ON t.id = qt.tag_id WHERE ${anyOf("qt.question_id")}`)
    .all(ids)
  const tags = new Map<string, any[]>()
  for (const { question_id, ...t } of tagRows as any[])
    tags.set(question_id, [...(tags.get(question_id) ?? []), t])
  const perType = await Promise.all(
    questionTables.map(async ([table, schema]) => {
      const rows = await db
        .prepare(`SELECT ${selectColumns(table, "q")} FROM ${table} q
          WHERE ${anyOf("q.id")} AND q.id IN (SELECT question_id FROM question_tag WHERE tag_id = ?)`)
        .all([...ids, exam.id])
      return rows.map((r: any) => ({
        ...parseRow(table)(r),
        id: r.id,
        type: schema["x-question-type"],
        tags: tags.get(r.id) ?? [],
      }))
    })
  )
  const byId = new Map(perType.flat().map((q: any) => [q.id, q]))
  return ids.flatMap(id => (byId.has(id) ? [byId.get(id)] : []))
}
