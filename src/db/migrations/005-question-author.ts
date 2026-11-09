// Questions gain an author: free text, null when unknown (the model name for generated questions).
//   - author column on every question table
//   - the question view now includes it
import { databaseSQL, isQuestionTable, rebuildDerivedSQL, tableName } from "../ddl.ts"
import { loadSchema } from "../loadSchema.ts"

export const up = async (db: any) => {
  // Purpose: add author to each question table, then recreate the views, triggers and stored schemas
  const schemas = await loadSchema()
  for (const drop of await rebuildDerivedSQL(db, schemas)) await db.exec(drop)
  for (const schema of schemas.filter(isQuestionTable))
    await db.exec(`ALTER TABLE ${tableName(schema)} ADD COLUMN author TEXT DEFAULT NULL`)
  await db.batch(databaseSQL(schemas), "write")
}
