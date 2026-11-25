/**
 * Build the site's SRS database on this machine from the authoring database,
 * and optionally upload it to Turso as the live database.
 *
 * ```sh
 * bun run publish-db --username consoleillusion --password '…' [--answers-of <old username>] [--upload]
 * ```
 *
 * 1. Creates `techstudy-srs.db` (or `--out`) from `.srs/migrations`.
 * 2. Runs SRS in this process on a free local port and copies tags, questions
 *    and answers into it with scripts/to-srs.ts. Any failure stops here.
 * 3. Checkpoints the file in WAL mode, as `turso db import` needs.
 * 4. With `--upload`, after you confirm: destroys the Turso database
 *    `--database` (default `techstudy-srs`), imports the file under that
 *    name, and prints the URL and a new token to put in Vercel.
 *
 * The account is created here, so `OPAQUE_SERVER_SETUP` in `.env` must be the
 * value Vercel has, or logging in on the live site fails.
 *
 * @module
 */
import { Database as Sqlite } from "bun:sqlite"
import { existsSync, rmSync } from "node:fs"
import { parseArgs } from "node:util"
import { createInterface } from "node:readline/promises"

const { values: args } = parseArgs({
  options:
    { from: { type: "string", default: ".db" }
    , out: { type: "string", default: "techstudy-srs.db" }
    , database: { type: "string", default: "techstudy-srs" }
    , username: { type: "string" }
    , password: { type: "string" }
    , "answers-of": { type: "string" }
    , upload: { type: "boolean", default: false }
    }
})

/** Stop with a message. */
const fail = (message: string): never => {
  console.error(`\n${message}`)
  process.exit(1)
}

if (!args.username || !args.password) fail("Give --username and --password for the account that will own the questions.")
if (!process.env.OPAQUE_SERVER_SETUP) fail("OPAQUE_SERVER_SETUP is not set. Put the value from Vercel in .env.")
if (process.env.SRS_DATABASE_URL) fail("SRS_DATABASE_URL is set; unset it so the database is built in a local file.")
if (args.out !== `${args.database}.db`)
  console.warn(`Note: turso db import names the database after the file, so ${args.out} becomes "${args.out.replace(/\.db$/, "")}".`)

/** Run a command, showing its output; return its exit code and, if asked, its stdout. */
const run = async (command: string[], capture = false) => {
  const child = Bun.spawn(command, { stdout: capture ? "pipe" : "inherit", stderr: "inherit", stdin: "inherit" })
  const output = capture ? await new Response(child.stdout).text() : ""
  return { code: await child.exited, output: output.trim() }
}

// 1. A fresh file with the site's tables.
for (const suffix of ["", "-wal", "-shm"]) rmSync(`${args.out}${suffix}`, { force: true })
// The authoring database may be open in a dev server; read a copy.
const source = `/tmp/publish-db-source-${process.pid}.db`
for (const suffix of ["", "-wal"]) if (existsSync(`${args.from}${suffix}`)) await Bun.write(`${source}${suffix}`, Bun.file(`${args.from}${suffix}`))

process.env.SRS_RATE_LIMIT_PER_MINUTE = "0"
const { applyMigrations, createServerApp, openDatabase } = await import("srs")
const schemas = (await import("../.srs/schemas.json")).default
const db = await openDatabase(args.out)
await applyMigrations(db, ".srs/migrations")

// 2. SRS on a free port, and the copy into it.
const app = await createServerApp({ loaded: schemas as never, db, transport: "bearer" })
const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: request => app.fetch(request) })
console.log(`Building ${args.out} from ${args.from}…`)
const copy = await run(
  [ process.execPath, "scripts/to-srs.ts", "--from", source, "--server", `http://127.0.0.1:${server.port}`
  , "--username", args.username!, "--password", args.password!
  , ...(args["answers-of"] ? ["--answers-of", args["answers-of"]] : [])
  ])
server.stop(true)
await (db as unknown as { close: () => Promise<void> }).close?.()
for (const suffix of ["", "-wal"]) rmSync(`${source}${suffix}`, { force: true })
if (copy.code !== 0) fail(`Copying failed (see above); ${args.out} is incomplete and was not uploaded.`)

// 3. WAL mode with an empty log, as turso db import needs.
const file = new Sqlite(args.out)
const check = file.query("PRAGMA integrity_check").get() as { integrity_check: string }
if (check.integrity_check !== "ok") fail(`${args.out} failed its integrity check: ${check.integrity_check}`)
file.exec("PRAGMA journal_mode = WAL")
file.exec("PRAGMA wal_checkpoint(TRUNCATE)")
const count = (table: string) => (file.query(`SELECT count(*) AS n FROM "${table}"`).get() as { n: number }).n
console.log(`\n${args.out} is ready: ${count("tag")} tags, ${count("question")} questions, ${count("answer")} answers, ${count("user")} account(s).`)
file.close()

if (!args.upload) {
  console.log(`Run again with --upload to replace the Turso database "${args.database}" with it.`)
  process.exit(0)
}

// 4. Replace the Turso database.
const readline = createInterface({ input: process.stdin, output: process.stdout })
const answer = await readline.question(`\nThis destroys the Turso database "${args.database}" and everything in it, then uploads ${args.out}. Type the database name to go ahead: `)
readline.close()
if (answer.trim() !== args.database) fail("Not uploaded.")

const exists = (await run(["turso", "db", "show", args.database!, "--url"], true)).code === 0
if (exists && (await run(["turso", "db", "destroy", args.database!, "--yes"])).code !== 0) fail("turso db destroy failed.")
if ((await run(["turso", "db", "import", args.out!])).code !== 0)
  fail("turso db import failed. If it says the file is not in WAL mode, update the Turso CLI (turso update) and run this again.")
const url = await run(["turso", "db", "show", args.database!, "--url"], true)
const token = await run(["turso", "db", "tokens", "create", args.database!], true)
if (url.code !== 0 || token.code !== 0) fail("The database was imported, but reading its URL or making a token failed; run turso db show and turso db tokens create yourself.")

console.log(`
Uploaded. In Vercel (Settings → Environment Variables), set:

  SRS_DATABASE_URL   = ${url.output}
  SRS_DATABASE_TOKEN = ${token.output}

then redeploy, and log in at the site as ${args.username}.`)
