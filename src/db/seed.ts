// Load every question set in ./question_sets into the database.
//   bun src/db/seed.ts            validate everything, then upsert questions and rebuild set membership
//   bun src/db/seed.ts --check    validate only; write nothing
//   bun src/db/seed.ts --prune    also delete questions no set references
// Each folder holds set.yml (set metadata) and questions.json (compact questions).
// Question ids are UUIDv5 of the question's content, so re-seeding is idempotent and a
// question that appears in several sets is stored once.
import {basename, dirname, join} from "path"
import {loadSchema} from "./loadSchema.ts"
import {makeValidators, errorText} from "./validate.ts"
import {tableName} from "./ddl.ts"
import {rules} from "./rules.ts"
import {fromCompact} from "./seed/compact.ts"

const args = new Set(Bun.argv.slice(2))
const setsDir = join(import.meta.dirname, "question_sets")
const QUESTION_NAMESPACE = "8a3d6f0e-5c2b-4e71-9f4a-2b7c1d9e0a55"

const questionId = (type: string, row: object) =>
  // Purpose: derive a stable id from a question's type and content
  Bun.randomUUIDv5(JSON.stringify([type, row]), QUESTION_NAMESPACE)

const readSets = async () => {
  // Purpose: read each set folder's metadata and questions
  const files = (await Array.fromAsync(new Bun.Glob("*/set.yml").scan({cwd: setsDir}))).sort()
  return Promise.all(files.map(async file => {
    const dir = join(setsDir, dirname(file))
    const {tags = [], ...meta} = Bun.YAML.parse(await Bun.file(join(dir, "set.yml")).text()) as any
    return {slug: basename(dir), meta, tags, compact: await Bun.file(join(dir, "questions.json")).json()}
  }))
}

const prepareSet = (validators: Record<string, any>, questionTables: Record<string, string>) => (set: any) => {
  // Purpose: convert and validate one set's questions, collecting every problem
  const problems: string[] = []
  const metaRow = {slug: set.slug, ...set.meta}
  if (!validators.question_set(metaRow)) problems.push(`${set.slug}/set.yml: ${errorText(validators.question_set.errors)}`)
  const questions = set.compact.map((q: any, i: number) => {
    const {type, row} = fromCompact(set.meta.exam)(q)
    const table = questionTables[type]
    const where = `${set.slug} Q${i + 1} (${type})`
    if (!validators[table](row)) problems.push(`${where}: ${errorText(validators[table].errors)}`)
    else problems.push(...rules[type](row).map(p => `${where}: ${p}`))
    return {type, table, row, id: questionId(type, row)}
  })
  return {...set, metaRow, questions, problems}
}

const jsonColumns = (schema: any) =>
  // Purpose: names of columns stored as jsonb (arrays and objects)
  new Set(Object.entries(schema.properties).filter(([, x]: any) => ["array", "object"].includes(x.type)).map(([k]) => k))

const toParams = (json: Set<string>, row: Record<string, unknown>) =>
  // Purpose: order a row's values for binding, serialising jsonb columns
  Object.entries(row).map(([k, v]) => json.has(k) ? JSON.stringify(v) : v)

const insertSQL = (table: string, columns: string[], conflict: string) =>
  // Purpose: build a parameterised INSERT with an ON CONFLICT clause
  `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")}) ${conflict}`

const writeSets = async (db: any, schemas: Record<string, any>, sets: any[]) => {
  // Purpose: upsert questions and sets, then rebuild each set's items and tags, in one transaction
  const setJson = jsonColumns(schemas.question_set)
  await db.exec("BEGIN")
  try {
    let inserted = 0
    for (const set of sets) {
      for (const q of set.questions) {
        const cols = ["id", ...Object.keys(q.row)]
        const r = await db.prepare(insertSQL(q.table, cols, "ON CONFLICT (id) DO NOTHING"))
          .run([q.id, ...toParams(jsonColumns(schemas[q.table]), q.row)])
        inserted += r.changes ?? 0
      }
      const metaCols = Object.keys(set.metaRow)
      const updates = metaCols.filter(c => c !== "slug").map(c => `${c} = excluded.${c}`).join(", ")
      const {id: setId} = await db.prepare(insertSQL("question_set", metaCols, `ON CONFLICT (slug) DO UPDATE SET ${updates} RETURNING id`))
        .get(toParams(setJson, set.metaRow))
      await db.prepare("DELETE FROM question_set_item WHERE question_set_id = ?").run([setId])
      await db.prepare("DELETE FROM question_set_tag WHERE question_set_id = ?").run([setId])
      const item = db.prepare("INSERT INTO question_set_item (question_set_id, question_type, question_id, position) VALUES (?, ?, ?, ?)")
      for (const [i, q] of set.questions.entries()) await item.run([setId, q.type, q.id, i + 1])
      const tag = db.prepare("INSERT INTO question_set_tag (question_set_id, name) VALUES (?, ?)")
      for (const name of set.tags) await tag.run([setId, name])
    }
    await db.exec("COMMIT")
    return inserted
  } catch (e) {
    await db.exec("ROLLBACK")
    throw e
  }
}

const orphanSQL = (table: string, type: string, verb: "SELECT count(*) AS n" | "DELETE") =>
  // Purpose: select or delete questions in one table that no set references
  `${verb} FROM ${table} WHERE id NOT IN (SELECT question_id FROM question_set_item WHERE question_type = '${type}')`

const main = async () => {
  // Purpose: validate all sets, then write them unless --check was given
  const schemaList = await loadSchema()
  const schemas = Object.fromEntries(schemaList.map(s => [tableName(s), s]))
  const questionTables = Object.fromEntries(schemaList.filter(s => s["x-question-type"]).map(s => [s["x-question-type"], tableName(s)]))
  const sets = (await readSets()).map(prepareSet(makeValidators(schemaList), questionTables))

  const problems = sets.flatMap(s => s.problems)
  const total = sets.reduce((n, s) => n + s.questions.length, 0)
  const unique = new Set(sets.flatMap(s => s.questions.map((q: any) => q.id))).size
  console.log(`${sets.length} sets, ${total} questions (${unique} unique)`)
  if (problems.length) {
    console.error(`${problems.length} problems; nothing written:\n  ${problems.join("\n  ")}`)
    process.exit(1)
  }
  if (args.has("--check")) return console.log("All questions valid.")

  const {db} = await import("./db.ts")
  const inserted = await writeSets(db, schemas, sets)
  console.log(`Wrote ${sets.length} sets; ${inserted} new questions (${unique - inserted} already present).`)
  for (const [type, table] of Object.entries(questionTables)) {
    const sql = orphanSQL(table, type, args.has("--prune") ? "DELETE" : "SELECT count(*) AS n")
    if (args.has("--prune")) { const r = await db.prepare(sql).run(); if (r.changes) console.log(`Pruned ${r.changes} from ${table}`) }
    else { const {n} = await db.prepare(sql).get(); if (n) console.log(`${table}: ${n} questions in no set (run with --prune to delete)`) }
  }
}

await main()
