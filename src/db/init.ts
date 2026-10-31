// Build the database from the JSON Schemas in ./schema.
//   bun src/db/init.ts           create anything missing; fail if existing tables have drifted
//   bun src/db/init.ts --reset   delete the database file and rebuild from scratch
//   bun src/db/init.ts --print   print the SQL without touching the database
import {existsSync, rmSync} from "fs"
import {loadSchema} from "./loadSchema.ts"
import {makeValidators} from "./validate.ts"
import {databaseSQL, tableName} from "./ddl.ts"

const args = new Set(Bun.argv.slice(2))
const dbPath = process.env.DB_PATH ?? ".db"

const removeDatabase = (path: string) => {
  // Purpose: delete the database file and its WAL/SHM companions
  for (const f of [path, `${path}-wal`, `${path}-shm`]) if (existsSync(f)) rmSync(f)
}

const storedSchemas = async (db: any) => {
  // Purpose: read the schemas recorded at the last init, keyed by table name
  const exists = await db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'table_schema'").get()
  if (!exists) return {}
  const rows = await db.prepare("SELECT table_name, json(jsonschema) AS s FROM table_schema").all()
  return Object.fromEntries(rows.map((r: any) => [r.table_name, r.s]))
}

const drift = (stored: Record<string, string>, schemas: any[]) => {
  // Purpose: list tables whose current schema differs from the one they were built from
  const current = Object.fromEntries(schemas.map(s => [tableName(s), JSON.stringify(s)]))
  return [
    ...Object.keys(stored).filter(t => !(t in current)).map(t => `${t}: table exists but its schema file was removed`),
    ...Object.keys(current).filter(t => t in stored && JSON.stringify(JSON.parse(stored[t])) !== current[t]).map(t => `${t}: schema changed since the table was created`),
  ]
}

const main = async () => {
  // Purpose: validate the schemas, check for drift, then create tables, views and triggers
  const schemas = await loadSchema()
  makeValidators(schemas) // throws if any schema is invalid
  const statements = databaseSQL(schemas)
  if (args.has("--print")) return console.log(statements.join(";\n\n") + ";")

  if (args.has("--reset")) removeDatabase(dbPath)
  const {db} = await import("./db.ts")
  const problems = drift(await storedSchemas(db), schemas)
  if (problems.length) {
    console.error(`Database ${dbPath} is out of step with the schema:\n  ${problems.join("\n  ")}\nRun with --reset to rebuild it (this deletes its data).`)
    process.exit(1)
  }
  await db.batch(statements, "write")
  const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all()
  console.log(`${dbPath}: ${tables.length} tables (${tables.map((t: any) => t.name).join(", ")})`)
}

await main()
