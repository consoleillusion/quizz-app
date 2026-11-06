// Create the database objects described by the JSON Schemas in ./schema. Safe to run at any time:
// it only creates what's missing (CREATE ... IF NOT EXISTS) and never drops, alters or overwrites anything.
//   bun src/db/init.ts           create missing tables, views and triggers; warn about schema drift
//   bun src/db/init.ts --print   print the SQL without touching the database
// A changed schema needs a migration (src/db/migrations, run with `bun run db:migrate`); init won't apply it.

import { filter, fromPairs, keys, map, pipe, toPairs } from "ramda"
import { databaseSQL, tableName } from "./ddl.ts"
import { loadSchema } from "./loadSchema.ts"
import { makeValidators } from "./validate.ts"

const storedSchemas = async (db: any) => {
  // Purpose: read the schemas recorded when each table was created or last migrated, keyed by table name
  const exists = await db
    .prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'table_schema'",
    )
    .get()
  const rows = exists
    ? await db
        .prepare("SELECT table_name, json(jsonschema) AS s FROM table_schema")
        .all()
    : []
  return fromPairs(
    map((r: any) => [r.table_name, JSON.stringify(JSON.parse(r.s))], rows),
  ) as Record<string, string>
}

export const drift = (stored: Record<string, string>, schemas: any[]) => {
  // Purpose: list tables whose schema file no longer matches the schema they were built from
  const current = fromPairs(
    map((s: any) => [tableName(s), JSON.stringify(s)], schemas),
  ) as Record<string, string>
  return [
    ...pipe(
      keys,
      filter((t: string) => !(t in current)),
      map((t: string) => `${t}: table exists but its schema file was removed`),
    )(stored),
    ...pipe(
      toPairs,
      filter(([t, s]: [string, string]) => t in stored && stored[t] !== s),
      map(
        ([t]: [string, string]) =>
          `${t}: schema changed since the table was created`,
      ),
    )(current),
  ]
}

const main = async () => {
  // Purpose: validate the schemas, create anything missing, and report (not fix) schema drift
  const schemas = await loadSchema()
  makeValidators(schemas) // throws if any schema is invalid
  if (Bun.argv.includes("--print"))
    return console.log(databaseSQL(schemas).join(";\n\n") + ";")
  const { db } = await import("./db.ts")
  const stored = await storedSchemas(db)
  // Record schemas only for tables this run creates; a stored schema is changed only by a migration.
  await db.batch(
    databaseSQL(schemas, (table: string) => !(table in stored)),
    "write",
  )
  const tables = await db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
    .all()
  console.log(`${process.env.DB_PATH ?? ".db"}: ${tables.length} tables`)
  const problems = drift(stored, schemas)
  if (problems.length)
    console.warn(
      `Warning: the database is out of step with the schema files:\n  ${problems.join("\n  ")}\nWrite a migration in src/db/migrations and run \`bun run db:migrate\`.`,
    )
}

if (import.meta.main) await main()
