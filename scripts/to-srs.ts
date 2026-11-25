/**
 * Copy the question bank from the old database into an SRS server.
 *
 * ```sh
 * bun scripts/to-srs.ts --from .db --server http://localhost:5734 \
 *   --username admin --password '…' [--answers-of <old username>]
 * ```
 *
 * Tags and questions keep their ids, so links and bookmarks still work. The
 * signed-in account owns every copied row, and questions are made public.
 * With `--answers-of`, that old user's answers are copied to the signed-in
 * account; other users register again. Rows that already exist are skipped,
 * so the script can be run again after a failure. It exits with status 1 when
 * any row failed. The script waits out the
 * server's rate limit; against a local server, `SRS_RATE_LIMIT_PER_MINUTE=0`
 * makes it faster.
 *
 * Quizzes are not copied: the site no longer has them.
 *
 * @module
 */
import { connect } from "@tursodatabase/database"
import { createResourceServerClient, memoryStorage, ResourceServerError } from "srs/client"
import { parseArgs } from "node:util"

const { values: args } = parseArgs({
  options:
    { from: { type: "string", default: ".db" }
    , server: { type: "string", default: "http://localhost:5734" }
    , username: { type: "string" }
    , password: { type: "string" }
    , "answers-of": { type: "string" }
    , parallel: { type: "string", default: "8" }
    }
})
if (!args.username || !args.password) {
  console.error("Give --username and --password for the account that will own the copied rows.")
  process.exit(2)
}

type OldRow = Record<string, unknown>

/** The fields each question type keeps in `body`, besides `type`. */
export const bodyFields: Record<string, string[]> =
  { multichoice: ["options"]
  , multiselect: ["number_of_selections", "options"]
  , match: ["prompts", "responses", "answer"]
  , order: ["items", "answer"]
  , slotfill: ["reuse_tokens", "tokens", "gaps"]
  , open: ["answer_type", "case_sensitive", "answers"]
  }

const booleanFields = new Set(["reuse_tokens", "case_sensitive"])
const jsonFields = new Set(["options", "prompts", "responses", "answer", "items", "tokens", "gaps", "answers", "links"])

/** Read a stored value as its JSON:API value: JSON text parsed, 0/1 as booleans. */
const valueOf = (name: string, value: unknown) =>
  value === null || value === undefined ? undefined
  : jsonFields.has(name) && typeof value === "string" ? JSON.parse(value)
  : booleanFields.has(name) ? Boolean(value)
  : value

/** Drop undefined entries so optional attributes are left out rather than sent as null. */
const defined = (entries: [string, unknown][]) =>
  Object.fromEntries(entries.filter(([, v]) => v !== undefined))

/**
 * The SRS question document for one row of an old per-type table.
 *
 * @param type - The question type, from the old table's name.
 * @param row - The old row.
 * @param tagIds - The ids of the tags it carries.
 */
export const questionDocument = (type: string, row: OldRow, tagIds: string[]) => (
  { data:
    { type: "question"
    , id: row.id as string
    , attributes: defined(
        [ ["type", type]
        , ["text", row.text]
        , ["exhibit", valueOf("exhibit", row.exhibit)]
        , ["explanation", valueOf("explanation", row.explanation)]
        , ["author", valueOf("author", row.author)]
        , ["bloom", valueOf("bloom", row.bloom)]
        , ["difficulty", valueOf("difficulty", row.difficulty)]
        , ["links", valueOf("links", row.links) ?? []]
        , ["visibility", "public"]
        , ["body", defined([["type", type], ...bodyFields[type].map(f => [f, valueOf(f, row[f])] as [string, unknown])])]
        ])
    , relationships: { tags: { data: tagIds.map(id => ({ type: "tag", id })) } }
    }
  })

/** A stored timestamp such as `2026-10-31 17:34:53.692`, read as UTC, in ISO form. */
export const isoTime = (value: unknown) => {
  const text = String(value)
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(text) ? text : `${text.replace(" ", "T")}Z`).toISOString()
}

const old = await connect(args.from!, { experimental: ["custom_types", "views"] } as never)
const all = async (sql: string, params: unknown[] = []) => (await (await old.prepare(sql)).all(...params)) as OldRow[]

const client = createResourceServerClient({ baseUrl: args.server, storage: memoryStorage() })
try {
  await client.login({ username: args.username, password: args.password })
} catch (error) {
  if (!(error instanceof ResourceServerError) || error.status !== 401) throw error
  await client.register({ username: args.username, password: args.password })
  console.log(`Registered ${args.username}`)
}

const counts = { created: 0, skipped: 0, failed: 0 }

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * POST a document, counting an existing row (409) as skipped and reporting
 * other failures. When the server's rate limit refuses it (429), wait and try
 * again, up to a few minutes.
 */
const send = async (path: string, document: unknown, label: string, attempt = 0): Promise<void> => {
  try {
    await client.post(path, document)
    counts.created++
  } catch (error) {
    if (error instanceof ResourceServerError && error.status === 409) { counts.skipped++; return }
    if (error instanceof ResourceServerError && error.status === 429 && attempt < 8) {
      await pause(1000 * 2 ** Math.min(attempt, 5))
      return send(path, document, label, attempt + 1)
    }
    counts.failed++
    console.error(`${label}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** Run the tasks, a few at a time. */
const inBatches = async <T>(items: T[], task: (item: T) => Promise<void>) => {
  const size = Number(args.parallel)
  for (let i = 0; i < items.length; i += size) await Promise.all(items.slice(i, i + size).map(task))
}

let anyFailed = false

const report = (what: string) => {
  console.log(`${what}: ${counts.created} created, ${counts.skipped} already there, ${counts.failed} failed`)
  if (counts.failed) anyFailed = true
  Object.assign(counts, { created: 0, skipped: 0, failed: 0 })
}

const tags = await all("SELECT id, type, name, description FROM tag ORDER BY name")
await inBatches(tags, async tag =>
  send("/tag"
    , { data:
        { type: "tag"
        , id: tag.id
        , attributes: defined([["type", tag.type], ["name", tag.name], ["description", valueOf("description", tag.description)], ["visibility", "public"]])
        }
      }
    , `tag ${tag.name}`))
report("Tags")

const links = await all("SELECT question_id, tag_id FROM question_tag")
const tagsOf = new Map<string, string[]>()
for (const { question_id, tag_id } of links)
  tagsOf.set(question_id as string, [...(tagsOf.get(question_id as string) ?? []), tag_id as string])

for (const type of Object.keys(bodyFields)) {
  const rows = await all(`SELECT * FROM question_${type}`)
  const untagged = rows.filter(r => !tagsOf.has(r.id as string))
  if (untagged.length) console.warn(`${untagged.length} ${type} questions have no tag and are left out: SRS needs at least one`)
  await inBatches(rows.filter(r => tagsOf.has(r.id as string)), async row =>
    send("/question", questionDocument(type, row, tagsOf.get(row.id as string)!), `${type} question ${row.id}`))
}
report("Questions")

if (args["answers-of"]) {
  const answers =
    await all(
      `SELECT a.question_id, a.answer, a.points, a.correct, a.answered_at
       FROM user_answer a JOIN user u ON u.id = a.user_id WHERE u.username = ? ORDER BY a.answered_at`
      , [args["answers-of"]])
  await inBatches(answers, async a =>
    send("/answer"
      , { data:
          { type: "answer"
          , attributes:
            { answer: valueOf("answer", a.answer)
            , points: a.points
            , correct: Boolean(a.correct)
            , answered_at: isoTime(a.answered_at)
            }
          , relationships: { question: { data: { type: "question", id: a.question_id } } }
          }
        }
      , `answer to ${a.question_id}`))
  report(`Answers of ${args["answers-of"]}`)
}

// Exit with an error when anything failed, so a caller (scripts/publish-db.ts) can stop.
process.exit(anyFailed ? 1 : 0)
