// Questions gain a difficulty rating: an integer 1 (very easy) to 5 (very hard), null when not rated.
//   - difficulty column on every question table
//   - the question view now includes bloom and difficulty
import { databaseSQL, isQuestionTable, rebuildDerivedSQL, tableName } from "../ddl.ts"
import { loadSchema } from "../loadSchema.ts"

export const up = async (db: any) => {
  // Purpose: add difficulty to each question table, then recreate the views, triggers and stored schemas
  const schemas = await loadSchema()
  for (const drop of await rebuildDerivedSQL(db, schemas)) await db.exec(drop)
  for (const schema of schemas.filter(isQuestionTable))
    await db.exec(
      `ALTER TABLE ${tableName(schema)} ADD COLUMN difficulty INTEGER DEFAULT NULL CHECK (difficulty >= 1 AND difficulty <= 5)`
    )
  await db.batch(databaseSQL(schemas), "write")
}
