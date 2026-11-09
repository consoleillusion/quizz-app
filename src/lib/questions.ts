// Writing content to the database: tags, questions and quizzes. Server-only.
// Everything is validated against the table schemas (and the per-type rules) before it's stored.
import { any, isEmpty, map, uniq } from "ramda"
import { db } from "../db/db.ts"
import { rules } from "../db/rules.ts"
import { HttpError } from "./rest.ts"
import { insertRow, questionTables, validate } from "./schemas.ts"

export type TagRef = { type: string; name: string }
export type NewTag = TagRef & { description?: string }
export type NewQuestion = {
  type: string
  tags: TagRef[]
  [field: string]: unknown
}
export type NewQuiz = {
  slug: string
  title: string
  description?: string
  exam?: string
  difficulty?: string
  randomize_question_order?: boolean
  randomize_option_order?: boolean
  rule_match?: "all" | "any"
  tags?: TagRef[]
  rules?: TagRef[]
  questions?: string[]
}

const tableFor = (type: string) =>
  // Purpose: the question table for a question type, or a 422 for an unknown type
  questionTables.find(([, s]) => s["x-question-type"] === type)?.[0] ??
  (() => {
    throw new HttpError(422, `Unknown question type ${type}`)
  })()

export const ensureTag = async (tag: NewTag) => {
  // Purpose: the id of a tag, creating it (validated) when it doesn't exist yet
  const found = await db
    .prepare("SELECT id FROM tag WHERE type = ? AND name = ?")
    .get([tag.type, tag.name])
  if (found) return found.id as string
  const errors = validate("tag", tag)
  if (!isEmpty(errors)) throw new HttpError(422, `Tag ${tag.type}:${tag.name} is not valid`, errors)
  return insertRow("tag", tag)
}

export const tagId = async (ref: TagRef) => {
  // Purpose: the id of an existing tag, or a 422 naming the missing tag
  const found = await db
    .prepare("SELECT id FROM tag WHERE type = ? AND name = ?")
    .get([ref.type, ref.name])
  return (
    (found?.id as string) ??
    (() => {
      throw new HttpError(422, `No ${ref.type} tag named ${ref.name}`)
    })()
  )
}

export const objectiveTags = (objective: string): TagRef[] => {
  // Purpose: the objective tag plus the domain, exam and vendor tags it implies, from e.g. "cisco:300-435:2.1"
  const [vendor, exam, number] = objective.split(":")
  return [
    { type: "vendor", name: vendor },
    { type: "exam", name: `${vendor}:${exam}` },
    { type: "domain", name: `${vendor}:${exam}:${number.split(".")[0]}.0` },
    { type: "objective", name: objective },
  ]
}

export const createQuestion = async ({ type, tags, ...row }: NewQuestion) => {
  // Purpose: validate and store one question with its tags; returns its id
  const table = tableFor(type)
  const schemaProblems = map((e: any) => `${e.field} ${e.message}`, validate(table, row))
  const problems = isEmpty(schemaProblems) ? rules[type](row) : schemaProblems
  if (!isEmpty(problems))
    throw new HttpError(
      422,
      `Question is not valid: ${problems.join("; ")} (${String(row.text).slice(0, 60)})`
    )
  if (!any((t: TagRef) => t.type === "objective", tags))
    throw new HttpError(422, `Question needs an objective tag (${String(row.text).slice(0, 60)})`)
  const unmatched = tags.filter(
    (t: TagRef) =>
      t.type === "exam" &&
      !any((o: TagRef) => o.type === "objective" && o.name.startsWith(`${t.name}:`), tags)
  )
  if (!isEmpty(unmatched))
    throw new HttpError(
      422,
      `Question is tagged for exam ${unmatched.map((t: TagRef) => t.name).join(", ")} but has no objective of that exam (${String(row.text).slice(0, 60)})`
    )
  const ids = await Promise.all(map(tagId, uniq(tags)))
  const id = await insertRow(table, row)
  const link = db.prepare(
    "INSERT INTO question_tag (question_type, question_id, tag_id) VALUES (?, ?, ?)"
  )
  for (const t of uniq(ids)) await link.run([type, id, t])
  return id
}

export const addQuiz = async ({
  tags = [],
  rules: ruleTags = [],
  questions = [],
  ...meta
}: NewQuiz) => {
  // Purpose: store a quiz with its tags, tag rules and explicitly chosen questions; returns its id
  const errors = validate("quiz", meta)
  if (!isEmpty(errors)) throw new HttpError(422, `Quiz ${meta.slug} is not valid`, errors)
  const id = await insertRow("quiz", meta)
  const tagIds = await Promise.all(map(tagId, tags))
  const ruleIds = await Promise.all(map(tagId, ruleTags))
  for (const t of uniq(tagIds))
    await db.prepare("INSERT INTO quiz_tag (quiz_id, tag_id) VALUES (?, ?)").run([id, t])
  for (const t of uniq(ruleIds))
    await db.prepare("INSERT INTO quiz_rule (quiz_id, tag_id) VALUES (?, ?)").run([id, t])
  const item = db.prepare(`INSERT INTO quiz_question (quiz_id, question_type, question_id, position)
    SELECT ?, question_type, id, ? FROM question WHERE id = ?`)
  for (const [i, q] of questions.entries()) await item.run([id, i + 1, q])
  return id
}

export const transaction = async <T>(work: () => Promise<T>) => {
  // Purpose: run work in one transaction, rolling back everything if any part fails
  await db.exec("BEGIN")
  try {
    const result = await work()
    await db.exec("COMMIT")
    return result
  } catch (e) {
    await db.exec("ROLLBACK")
    throw e
  }
}
