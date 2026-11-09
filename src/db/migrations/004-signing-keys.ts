// Signing keys from tweetnacl on both ends:
//   - login_attempt gains public_key (the browser's key from the first login request)
//   - session gains server_secret_key (the server's secret signing key for that session)
import { databaseSQL, rebuildDerivedSQL } from "../ddl.ts"
import { loadSchema } from "../loadSchema.ts"

export const up = async (db: any) => {
  // Purpose: add login_attempt.public_key and session.server_secret_key, refresh derived objects and stored schemas
  const schemas = await loadSchema()
  for (const drop of await rebuildDerivedSQL(db, schemas)) await db.exec(drop)
  await db.exec(
    "ALTER TABLE login_attempt ADD COLUMN public_key jsonb DEFAULT NULL CHECK (json_type(public_key) = 'object')"
  )
  await db.exec("ALTER TABLE session ADD COLUMN server_secret_key TEXT DEFAULT NULL")
  await db.batch(databaseSQL(schemas), "write")
}
