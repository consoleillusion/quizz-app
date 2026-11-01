// The answer resource: the logged-in user's answer history. Server-only.
import {db} from "../db/db.ts"
import {HttpError} from "./rest.ts"
import {parseRow, selectColumns, validate} from "./schemas.ts"

const MAX_BATCH = 1000
const fields = ["quiz_id", "question_type", "question_id", "answer", "points", "correct", "answered_at"]

const toIso = (ts: string) =>
  // Purpose: Turso stores timestamps as "YYYY-MM-DD HH:MM:SS.sss" (UTC); send them back as ISO 8601
  new Date(`${ts.replace(" ", "T")}Z`).toISOString()

export const listAnswers = async (userId: string, since?: string) => {
  // Purpose: the user's answers, oldest first, optionally only those recorded after a time
  const rows = await db.prepare(`SELECT ${selectColumns("user_answer", "a")} FROM user_answer a
    WHERE a.user_id = ? ${since ? "AND a.created_at > ?" : ""} ORDER BY a.answered_at`).all(since ? [userId, since] : [userId])
  return rows.map((r: any) => {
    const {id, created_at, updated_at, ...rest} = parseRow("user_answer")(r)
    return {...rest, answered_at: toIso(r.answered_at)}
  })
}

export const storeAnswers = async (userId: string, body: unknown) => {
  // Purpose: save a batch of the signed-in user's answers; repeats are ignored, so clients can resend safely.
  // Every record must name its user_id, and it must be the session user: nobody can write another
  // person's answers. Answers to questions that no longer exist are skipped; an unknown quiz_id is dropped.
  const batch = Array.isArray(body) ? body : [body]
  if (batch.length > MAX_BATCH) throw new HttpError(413, `Send at most ${MAX_BATCH} answers at a time`)
  const known = new Set((await db.prepare("SELECT id FROM quiz").all()).map((r: any) => r.id))
  let stored = 0, duplicate = 0
  const skipped: {index: number, reason: string}[] = []
  const insert = db.prepare(`INSERT INTO user_answer (user_id, ${fields.join(", ")}) VALUES (?, ${fields.map(() => "?").join(", ")})
    ON CONFLICT (user_id, question_id, answered_at) DO NOTHING`)
  for (const [index, item] of batch.entries()) {
    if (item?.user_id !== userId) {
      skipped.push({index, reason: item?.user_id ? "belongs to another user" : "user_id is required"}); continue
    }
    const picked = Object.fromEntries(fields.filter(f => item?.[f] !== undefined && item?.[f] !== null).map(f => [f, item[f]]))
    if (picked.quiz_id && !known.has(picked.quiz_id)) delete picked.quiz_id
    const row = {user_id: userId, ...picked}
    const errors = validate("user_answer", row)
    if (errors.length) { skipped.push({index, reason: errors.map(e => `${e.field} ${e.message}`).join("; ")}); continue }
    try {
      const r = await insert.run([userId, ...fields.map(f => f === "answer" ? JSON.stringify(row[f as keyof typeof row]) : row[f as keyof typeof row] ?? null)])
      r.changes ? stored++ : duplicate++
    } catch (e: any) {
      skipped.push({index, reason: /question_id not found/.test(e.message) ? "question no longer exists" : e.message})
    }
  }
  return {stored, duplicate, skipped}
}
