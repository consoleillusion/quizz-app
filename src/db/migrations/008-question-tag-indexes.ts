// Index question_tag by each end of the link: the unique index starts with question_type.
import { questionTagIndexesSQL } from "../ddl.ts"

export const up = async (db: any) => {
  // Purpose: create the lookup indexes on both new and existing databases
  for (const sql of questionTagIndexesSQL) await db.exec(sql)
}
