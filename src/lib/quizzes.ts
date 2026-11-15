// The quiz resource: queries and creation. Server-only.
import { kebabCase } from "change-case"
import { ascend, fromPairs, groupBy, map, sortWith } from "ramda"
import { db } from "../db/db.ts"
import { toHtml, toPlain } from "./markdown.ts"
import { HttpError } from "./rest.ts"
import { insertRow, parseRow, questionTables, selectColumns, validate } from "./schemas.ts"

const isUuid = (key: string) =>
  // Purpose: true when a URL key is a UUID rather than a slug
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)

const tagObject = "json_object('type', t.type, 'name', t.name, 'description', t.description)"

const summaryColumns = `${selectColumns("quiz", "q")}
  , (SELECT count(*) FROM quiz_member m WHERE m.quiz_id = q.id) AS question_count
  , (SELECT json_group_array(${tagObject}) FROM quiz_tag qt JOIN tag t ON t.id = qt.tag_id WHERE qt.quiz_id = q.id) AS tags
  , (SELECT json_group_array(${tagObject}) FROM quiz_rule r JOIN tag t ON t.id = r.tag_id WHERE r.quiz_id = q.id) AS rules`

const toQuiz = (row: any) =>
  // Purpose: a quiz row as JSON, with its question count, tags, tag rules and URL
  ({
    ...parseRow("quiz")(row),
    question_count: row.question_count,
    tags: JSON.parse(row.tags),
    rules: JSON.parse(row.rules),
    url: `/quiz/${row.slug}`,
  })

const taggedWith =
  // Purpose: SQL condition for quizzes carrying the tag named by the bound parameter
  "EXISTS (SELECT 1 FROM quiz_tag qt JOIN tag t ON t.id = qt.tag_id WHERE qt.quiz_id = q.id AND t.name = ?)"

export const listQuizzes = async ({
  limit,
  offset,
  tag,
}: {
  limit: number
  offset: number
  tag?: string | null
}) => {
  // Purpose: one page of quizzes, ordered by title, optionally only those tagged `tag`, plus the total count
  const where = tag ? `WHERE ${taggedWith}` : ""
  const args = tag ? [tag] : []
  const items = await db
    .prepare(`SELECT ${summaryColumns} FROM quiz q ${where} ORDER BY q.title LIMIT ? OFFSET ?`)
    .all([...args, limit, offset])
  const { total } = await db.prepare(`SELECT count(*) AS total FROM quiz q ${where}`).get(args)
  return { items: items.map(toQuiz), total: total as number }
}

export const getQuiz = async (key: string) => {
  // Purpose: one quiz by slug or id, or a 404
  const row = await db
    .prepare(`SELECT ${summaryColumns} FROM quiz q WHERE q.${isUuid(key) ? "id" : "slug"} = ?`)
    .get([key])
  if (!row) throw new HttpError(404, `No quiz ${key}`)
  return toQuiz(row)
}

const tagsByQuestion = async (quizId: string) => {
  // Purpose: the tags of every question in a quiz, keyed by question id
  const rows = await db
    .prepare(`SELECT qt.question_id, t.type, t.name, t.description
      FROM quiz_member m JOIN question_tag qt ON qt.question_id = m.question_id AND qt.question_type = m.question_type
      JOIN tag t ON t.id = qt.tag_id WHERE m.quiz_id = ?`)
    .all([quizId])
  return groupBy(
    (r: any) => r.question_id,
    map((r: any) => ({ ...r }), rows)
  ) as Record<string, any[]>
}

export const getQuestions = async (quizId: string) => {
  // Purpose: a quiz's questions (explicit and tag-rule matched) from every question table, with their tags.
  // Explicit questions come first in their set order; rule-matched ones follow, oldest first.
  const tags = await tagsByQuestion(quizId)
  const perType = await Promise.all(
    questionTables.map(async ([table, schema]) => {
      const rows = await db
        .prepare(`SELECT m.position, ${selectColumns(table, "q")}
      FROM quiz_member m JOIN ${table} q ON q.id = m.question_id
      WHERE m.quiz_id = ? AND m.question_type = ?`)
        .all([quizId, schema["x-question-type"]])
      return rows.map((r: any) => ({
        ...parseRow(table)(r),
        id: r.id,
        position: r.position,
        type: schema["x-question-type"],
        tags: map(({ question_id, ...t }: any) => t, tags[r.id] ?? []),
      }))
    })
  )
  return sortWith(
    [ascend((q: any) => q.position ?? Number.MAX_SAFE_INTEGER), ascend((q: any) => q.id)],
    perType.flat()
  )
}

export const withRendering = (q: any) => {
  // Purpose: add HTML for every Markdown field, and plain labels for <option> lists, for the quiz player
  const html: Record<string, string | string[]> = { text: toHtml(q.text) }
  if (q.explanation) html.explanation = toHtml(q.explanation)
  if (q.options) html.options = q.options.map((o: any) => toHtml(o.text))
  for (const k of ["prompts", "responses", "items"]) if (q[k]) html[k] = q[k].map(toHtml)
  return {
    ...q,
    html,
    plain: q.responses ? { responses: q.responses.map(toPlain) } : {},
  }
}

export const createQuiz = async (input: Record<string, unknown>) => {
  // Purpose: validate and insert a new quiz, deriving the slug from the title when it's missing
  const row = { ...input }
  if (!row.slug && typeof row.title === "string") row.slug = kebabCase(row.title)
  // A slug is only missing here because the title is; report the title, not both.
  const errors = validate("quiz", row).filter(
    e => input.slug || e.field !== "slug" || !e.message.startsWith("must have required")
  )
  if (errors.length) throw new HttpError(422, "The quiz is not valid", errors)
  const taken = await db.prepare("SELECT 1 FROM quiz WHERE slug = ?").get([row.slug])
  if (taken)
    throw new HttpError(409, `A quiz with slug ${row.slug} already exists`, [
      { field: "slug", message: "is already taken" },
    ])
  const id = await insertRow("quiz", row)
  return getQuiz(id)
}

export const questionIndex = async () => {
  // Purpose: a compact lookup for the dashboard: every question (type, short text, tag ids, quizzes),
  // every tag, and every quiz
  const members = await db
    .prepare(`SELECT m.quiz_id, q.id, q.question_type, q.text
    FROM quiz_member m JOIN question q ON q.id = m.question_id AND q.question_type = m.question_type`)
    .all()
  const links = await db.prepare("SELECT question_id, tag_id FROM question_tag").all()
  const tagRows = await db.prepare("SELECT id, type, name, description FROM tag").all()
  const quizRows = await db
    .prepare(`SELECT q.id, q.slug, q.title,
    (SELECT json_group_array(qt.tag_id) FROM quiz_tag qt WHERE qt.quiz_id = q.id) AS tags FROM quiz q`)
    .all()
  const tagIds = map(
    map((l: any) => l.tag_id),
    groupBy((l: any) => l.question_id, links)
  ) as Record<string, string[]>
  const questions: Record<
    string,
    { type: string; text: string; tags: string[]; quizzes: string[] }
  > = {}
  for (const r of members as any[]) {
    questions[r.id] ??= {
      type: r.question_type,
      text: shorten(toPlain(r.text)),
      tags: tagIds[r.id] ?? [],
      quizzes: [],
    }
    questions[r.id].quizzes.push(r.quiz_id)
  }
  return {
    questions,
    tags: fromPairs(
      map((t: any) => [t.id, { type: t.type, name: t.name, description: t.description }], tagRows)
    ),
    quizzes: fromPairs(
      map((r: any) => [r.id, { slug: r.slug, title: r.title, tags: JSON.parse(r.tags) }], quizRows)
    ),
  }
}

const shorten = (s: string, n = 140) =>
  // Purpose: one-line preview of a question, cut at n characters
  (s = s.replace(/\s+/g, " ").trim()).length > n ? `${s.slice(0, n - 1)}…` : s
