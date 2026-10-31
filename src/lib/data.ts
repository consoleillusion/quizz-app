// Build-time data access for pages. Server-only: never import this from a client component.
import {db} from "../db/db.ts"

export type QuestionSet = {id: string, slug: string, title: string, description: string, exam: string,
  difficulty: string, randomize_question_order: boolean, randomize_option_order: boolean,
  question_count: number, tags: string[]}
export type Question = {id: string, type: string, position: number, text: string, exhibit?: string,
  explanation?: string, objectives: string[], [field: string]: unknown}

// The database is self-describing: init.ts stores each table's JSON Schema in table_schema.
const schemaRows = await db.prepare("SELECT table_name, json(jsonschema) AS schema FROM table_schema").all()
const schemas: Record<string, any> = Object.fromEntries(schemaRows.map((r: any) => [r.table_name, JSON.parse(r.schema)]))
const questionTables = Object.entries(schemas).filter(([, s]) => s["x-question-type"])

const parseRow = (schema: any) => (row: Record<string, unknown>) =>
  // Purpose: turn a raw row into plain JSON, parsing jsonb columns and booleans and dropping nulls
  Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null).map(([k, v]) => {
    const type = schema.properties[k]?.type
    return [k, type === "array" || type === "object" ? JSON.parse(v as string) : type === "boolean" ? Boolean(v) : v]
  }))

const selectColumns = (schema: any, alias: string) =>
  // Purpose: list a question table's schema columns, reading jsonb columns back as JSON text
  Object.entries(schema.properties).map(([k, x]: any) =>
    ["array", "object"].includes(x.type) ? `json(${alias}.${k}) AS ${k}` : `${alias}.${k}`).join(", ")

export const getSets = async (): Promise<QuestionSet[]> => {
  // Purpose: list every question set with its question count and tags
  const setSchema = schemas.question_set
  const rows = await db.prepare(`
    SELECT s.*, count(DISTINCT i.id) AS question_count,
           (SELECT json_group_array(name) FROM question_set_tag t WHERE t.question_set_id = s.id) AS tags
    FROM question_set s LEFT JOIN question_set_item i ON i.question_set_id = s.id
    GROUP BY s.id ORDER BY s.slug`).all()
  return rows.map((r: any) => ({...parseRow(setSchema)(r), question_count: r.question_count, tags: JSON.parse(r.tags)}) as QuestionSet)
}

export const getQuestions = async (setId: string): Promise<Question[]> => {
  // Purpose: load a set's questions from every question table, in set order
  const perType = await Promise.all(questionTables.map(async ([table, schema]) => {
    const rows = await db.prepare(`
      SELECT q.id, i.position, ${selectColumns(schema, "q")}
      FROM question_set_item i JOIN ${table} q ON q.id = i.question_id
      WHERE i.question_set_id = ? AND i.question_type = ?`).all([setId, schema["x-question-type"]])
    return rows.map((r: any) => ({...parseRow(schema)(r), id: r.id, position: r.position, type: schema["x-question-type"]}))
  }))
  return (perType.flat() as Question[]).sort((a, b) => a.position - b.position)
}
