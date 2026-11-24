import { expect, test } from "bun:test"
import { createTableSQL, databaseSQL, questionTagIndexesSQL, quizMemberSQL } from "./ddl.ts"
import { loadSchema } from "./loadSchema.ts"

const quiz = (await loadSchema()).find(s => s.title === "Quiz")

test("portable DDL uses only standard SQLite types", () => {
  const sql = createTableSQL(quiz, true)
  expect(sql).toContain("id TEXT PRIMARY KEY DEFAULT (uuid_str(uuid7()))")
  expect(sql).toContain("created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP")
  expect(sql).not.toMatch(/\b(uuid|jsonb|timestamp|boolean)\b/)
})

test("local DDL keeps Turso custom types", () => {
  const sql = createTableSQL(quiz)
  expect(sql).toContain("id uuid PRIMARY KEY DEFAULT (uuid7())")
  expect(sql).toContain("created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP")
})

test("quiz_member counts rules once per quiz", () => {
  const sql = quizMemberSQL()
  expect(sql).toContain("WITH rule_counts AS")
  expect(sql).toContain("count(DISTINCT r.tag_id) = rc.n")
  expect(sql).not.toContain("SELECT count(*) FROM quiz_rule r2")
})

test("question_tag lookup indexes are created for new databases", async () => {
  const sql = databaseSQL(await loadSchema())
  for (const index of questionTagIndexesSQL) expect(sql).toContain(index)
})
