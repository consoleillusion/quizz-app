// Count each quiz's tag rules once in the quiz_member view instead of once per question_tag row.
import { databaseSQL, rebuildDerivedSQL } from "../ddl.ts"
import { loadSchema } from "../loadSchema.ts"

export const up = async (db: any) => {
  // Purpose: recreate the views and triggers with the optimised quiz_member definition
  const schemas = await loadSchema()
  for (const drop of await rebuildDerivedSQL(db, schemas)) await db.exec(drop)
  await db.batch(databaseSQL(schemas, () => false, Boolean(process.env.DB_URL)), "write")
}
