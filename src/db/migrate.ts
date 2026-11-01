// Apply pending migrations from ./migrations, oldest first, after taking a backup.
// Each migration is a module exporting `up(db)` and is recorded in the migration table once applied.
//   bun src/db/migrate.ts            apply pending migrations
//   bun src/db/migrate.ts --status   list applied and pending migrations
import {basename, join} from "path"
import {difference, map, pipe, prop, sortBy} from "ramda"
import {backup} from "./backup.ts"

const directory = join(import.meta.dirname, "migrations")

const available = async () =>
  // Purpose: migration names found on disk, in order
  pipe
    ( map((f: string) => basename(f, ".ts"))
    , sortBy((n: string) => n)
    )(await Array.fromAsync(new Bun.Glob("[0-9][0-9][0-9]-*.ts").scan({cwd: directory})))

const applied = async (db: any) => {
  // Purpose: names of migrations already applied to this database
  const exists = await db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'migration'").get()
  return exists ? map(prop("name"), await db.prepare("SELECT name FROM migration").all()) as string[] : []
}

const main = async () => {
  // Purpose: back up, then run each pending migration and record it
  const {db} = await import("./db.ts")
  const pending = difference(await available(), await applied(db))
  if (Bun.argv.includes("--status")) return console.log({applied: await applied(db), pending})
  if (!pending.length) return console.log("No pending migrations.")
  console.log(`Backed up to ${await backup(db)}`)
  for (const name of pending) {
    const {up} = await import(join(directory, `${name}.ts`))
    await up(db)
    await db.exec("CREATE TABLE IF NOT EXISTS migration (id uuid PRIMARY KEY DEFAULT (uuid7()), name TEXT NOT NULL UNIQUE, created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP) STRICT")
    await db.prepare("INSERT INTO migration (name) VALUES (?)").run([name])
    console.log(`Applied ${name}`)
  }
}

await main()
