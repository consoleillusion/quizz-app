// Table schemas and validators, read from the database itself (init.ts stores each
// table's JSON Schema in table_schema), plus helpers for moving rows in and out.
import { db } from "../db/db.ts"
import { errorsByField, makeValidators } from "../db/validate.ts"

const rows = await db
  .prepare("SELECT table_name, json(jsonschema) AS schema FROM table_schema")
  .all()
export const schemas: Record<string, any> = Object.fromEntries(
  rows.map((r: any) => [r.table_name, JSON.parse(r.schema)]),
)
export const validators = makeValidators(Object.values(schemas))
export const questionTables = Object.entries(schemas).filter(
  ([, s]) => s["x-question-type"],
) as [string, any][]

const jsonTypes = ["array", "object"]

export const parseRow = (table: string) => (row: Record<string, unknown>) => {
  // Purpose: turn a raw row into plain JSON, parsing jsonb columns and booleans and dropping nulls
  const props = schemas[table].properties
  return Object.fromEntries(
    Object.entries(row)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => {
        const type = props[k]?.type
        return [
          k,
          jsonTypes.includes(type)
            ? JSON.parse(v as string)
            : type === "boolean"
              ? Boolean(v)
              : v,
        ]
      }),
  )
}

export const selectColumns = (table: string, alias = table) =>
  // Purpose: list a table's columns for SELECT, reading jsonb columns back as JSON text
  ["id", ...Object.keys(schemas[table].properties), "created_at", "updated_at"]
    .map((k) =>
      jsonTypes.includes(schemas[table].properties[k]?.type)
        ? `json(${alias}.${k}) AS ${k}`
        : `${alias}.${k}`,
    )
    .join(", ")

export const validate = (table: string, row: object) =>
  // Purpose: check a row against its table schema; returns field errors (empty when valid)
  validators[table](row) ? [] : errorsByField(validators[table].errors)

export const insertRow = async (
  table: string,
  row: Record<string, unknown>,
) => {
  // Purpose: insert a validated row (id optional; the database makes one when absent) and return its id
  const props = schemas[table].properties
  const cols = Object.keys(row)
  const values = cols.map((k) =>
    jsonTypes.includes(props[k]?.type) ? JSON.stringify(row[k]) : row[k],
  )
  const { id } = await db
    .prepare(
      `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) RETURNING id`,
    )
    .get(values)
  return id as string
}
