// The quiz resource: queries and creation. Server-only.
import {kebabCase} from "change-case"
import {db} from "../db/db.ts"
import {HttpError} from "./rest.ts"
import {insertRow, parseRow, questionTables, selectColumns, validate} from "./schemas.ts"
import {toHtml, toPlain} from "./markdown.ts"

const isUuid = (key: string) =>
  // Purpose: true when a URL key is a UUID rather than a slug
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)

const summaryColumns = `${selectColumns("quiz", "q")},
  (SELECT count(*) FROM quiz_question i WHERE i.quiz_id = q.id) AS question_count,
  (SELECT json_group_array(name) FROM quiz_tag t WHERE t.quiz_id = q.id) AS tags`

const toQuiz = (row: any) =>
  // Purpose: a quiz row as JSON, with its question count, tags and URL
  ({...parseRow("quiz")(row), question_count: row.question_count, tags: JSON.parse(row.tags), url: `/quiz/${row.slug}`})

export const listQuizzes = async ({limit, offset}: {limit: number, offset: number}) => {
  // Purpose: one page of quizzes, ordered by title, plus the total count
  const items = await db.prepare(`SELECT ${summaryColumns} FROM quiz q ORDER BY q.title LIMIT ? OFFSET ?`).all([limit, offset])
  const {total} = await db.prepare("SELECT count(*) AS total FROM quiz").get()
  return {items: items.map(toQuiz), total: total as number}
}

export const getQuiz = async (key: string) => {
  // Purpose: one quiz by slug or id, or a 404
  const row = await db.prepare(`SELECT ${summaryColumns} FROM quiz q WHERE q.${isUuid(key) ? "id" : "slug"} = ?`).get([key])
  if (!row) throw new HttpError(404, `No quiz ${key}`)
  return toQuiz(row)
}

export const getQuestions = async (quizId: string) => {
  // Purpose: a quiz's questions from every question table, in quiz order
  const perType = await Promise.all(questionTables.map(async ([table, schema]) => {
    const rows = await db.prepare(`SELECT i.position, ${selectColumns(table, "q")}
      FROM quiz_question i JOIN ${table} q ON q.id = i.question_id
      WHERE i.quiz_id = ? AND i.question_type = ?`).all([quizId, schema["x-question-type"]])
    return rows.map((r: any) => ({...parseRow(table)(r), id: r.id, position: r.position, type: schema["x-question-type"]}))
  }))
  return perType.flat().sort((a: any, b: any) => a.position - b.position)
}

export const withRendering = (q: any) => {
  // Purpose: add HTML for every Markdown field, and plain labels for <option> lists, for the quiz player
  const html: Record<string, string | string[]> = {text: toHtml(q.text)}
  if (q.explanation) html.explanation = toHtml(q.explanation)
  if (q.options) html.options = q.options.map((o: any) => toHtml(o.text))
  for (const k of ["prompts", "responses", "items"]) if (q[k]) html[k] = q[k].map(toHtml)
  return {...q, html, plain: q.responses ? {responses: q.responses.map(toPlain)} : {}}
}

export const createQuiz = async (input: Record<string, unknown>) => {
  // Purpose: validate and insert a new quiz, deriving the slug from the title when it's missing
  const row = {...input}
  if (!row.slug && typeof row.title === "string") row.slug = kebabCase(row.title)
  // A slug is only missing here because the title is; report the title, not both.
  const errors = validate("quiz", row).filter(e => input.slug || e.field !== "slug" || !e.message.startsWith("must have required"))
  if (errors.length) throw new HttpError(422, "The quiz is not valid", errors)
  const taken = await db.prepare("SELECT 1 FROM quiz WHERE slug = ?").get([row.slug])
  if (taken) throw new HttpError(409, `A quiz with slug ${row.slug} already exists`, [{field: "slug", message: "is already taken"}])
  const id = await insertRow("quiz", row)
  return getQuiz(id)
}

export const questionIndex = async () => {
  // Purpose: a compact lookup of every question in a quiz (type, objectives, short text, quizzes) and of every quiz, for the dashboard
  const rows = await db.prepare(`
    SELECT i.quiz_id, q.id, q.question_type, q.text, json(q.objectives) AS objectives
    FROM quiz_question i JOIN question q ON q.id = i.question_id AND q.question_type = i.question_type`).all()
  const questions: Record<string, {type: string, objectives: string[], text: string, quizzes: string[]}> = {}
  for (const r of rows as any[]) {
    questions[r.id] ??= {type: r.question_type, objectives: JSON.parse(r.objectives), text: shorten(toPlain(r.text)), quizzes: []}
    questions[r.id].quizzes.push(r.quiz_id)
  }
  const quizRows = await db.prepare(`SELECT q.id, q.slug, q.title, q.exam,
    (SELECT json_group_array(name) FROM quiz_tag t WHERE t.quiz_id = q.id) AS tags FROM quiz q`).all()
  const quizzes = Object.fromEntries((quizRows as any[]).map(r => [r.id, {slug: r.slug, title: r.title, exam: r.exam, tags: JSON.parse(r.tags)}]))
  return {questions, quizzes}
}

const shorten = (s: string, n = 140) =>
  // Purpose: one-line preview of a question, cut at n characters
  (s = s.replace(/\s+/g, " ").trim()).length > n ? `${s.slice(0, n - 1)}…` : s
