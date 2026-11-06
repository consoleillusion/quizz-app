// OPAQUE logins with per-session signing keys:
//   - session gains public_key (the Ed25519 JWK the browser made for that session)
//   - login_attempt holds the server's OPAQUE state between the two login requests
//   - existing scrypt accounts (test accounts only) get an OPAQUE record for a fixed test password
import * as opaque from "@serenity-kit/opaque"
import { opaqueIdentifier } from "../../lib/auth.ts"
import { keyStretching } from "../../lib/opaque-client.ts"
import { databaseSQL, rebuildDerivedSQL } from "../ddl.ts"
import { loadSchema } from "../loadSchema.ts"

// Test accounts only: every account that still has a scrypt hash gets this password.
const TEST_PASSWORD = "test-password"

const recordFor = (username: string, password: string) => {
  // Purpose: run both sides of OPAQUE registration here and return the registration record
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password })
  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: process.env.OPAQUE_SERVER_SETUP!,
    userIdentifier: opaqueIdentifier(username),
    registrationRequest,
  })
  return opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password,
    keyStretching,
  }).registrationRecord
}

export const up = async (db: any) => {
  // Purpose: add session.public_key and login_attempt, refresh derived objects and stored schemas, move scrypt accounts to OPAQUE
  await opaque.ready
  const schemas = await loadSchema()
  for (const drop of await rebuildDerivedSQL(db, schemas)) await db.exec(drop)
  await db.exec(
    "ALTER TABLE session ADD COLUMN public_key jsonb DEFAULT NULL CHECK (json_type(public_key) = 'object')",
  )
  await db.batch(databaseSQL(schemas), "write")
  for (const u of await db
    .prepare(
      "SELECT id, username FROM user WHERE password_hash LIKE 'scrypt$%'",
    )
    .all())
    await db
      .prepare("UPDATE user SET password_hash = ? WHERE id = ?")
      .run([`opaque$${recordFor(u.username, TEST_PASSWORD)}`, u.id])
}
