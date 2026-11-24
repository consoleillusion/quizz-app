// Copy the local database into an empty remote Turso database created from ./schema.
//   DB_URL=<url> DB_AUTH_TOKEN=<token> bun scripts/copy-to-turso.ts

import { splitEvery } from "ramda"
import { connect } from "@tursodatabase/database"
import { connect as connectRemote } from "@tursodatabase/serverless"
import { statementsFor } from "../src/db/copy.ts"
import { sortByDependency, tableName } from "../src/db/ddl.ts"
import { loadSchema } from "../src/db/loadSchema.ts"
import { remote } from "../src/db/remote.ts"

const url = process.env.DB_URL
const authToken = process.env.DB_AUTH_TOKEN
if (!url || !authToken) throw new Error("Set DB_URL and DB_AUTH_TOKEN first")

const local = await connect(process.env.DB_PATH ?? ".db", {
  experimental: ["views", "custom_types", "encryption", "vacuum"],
})
const destination = remote(connectRemote({ url, authToken }))

// Purpose: refuse to mix data into a database that is not freshly initialised
let existing: number
try {
  existing = (await destination.prepare("SELECT count(*) AS n FROM tag").get())?.n ?? 0
} catch {
  throw new Error("Remote database has no tables; run `bun run db:init` with DB_URL set first")
}
if (existing) throw new Error(`Remote database already has ${existing} tags; use a fresh database`)

const schemas = await loadSchema()
const tables = sortByDependency(schemas).map(tableName)

for (const table of tables) {
  const columns = (await local.prepare(`PRAGMA table_info(${table})`).all()).map(
    (column: any) => column.name
  )
  const rows = await local.prepare(`SELECT ${columns.join(", ")} FROM ${table}`).all()
  for (const batch of splitEvery(200, statementsFor(table, columns, rows)))
    await destination.batch(batch, "write")
  console.log(`${table}: ${rows.length}`)
}
