// Count each quiz's tag rules once in the quiz_member view instead of once per question_tag row.
import { quizMemberSQL, quizSummarySQL } from "../ddl.ts"

export const up = async (db: any) => {
  // Purpose: replace only the two views that depend on quiz_member; recreating every view broke Turso Cloud's schema
  await db.exec("DROP VIEW IF EXISTS quiz_summary")
  await db.exec("DROP VIEW IF EXISTS quiz_member")
  await db.exec(quizMemberSQL())
  await db.exec(quizSummarySQL())
}
