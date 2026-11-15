// Test account only: abcd1234's password becomes "abcd1234" until a password-change feature exists.
import * as opaque from "@serenity-kit/opaque"
import { opaqueIdentifier } from "../../lib/auth.ts"
import { keyStretching } from "../../lib/opaque-client.ts"

const USERNAME = "abcd1234",
  PASSWORD = "abcd1234"

export const up = async (db: any) => {
  // Purpose: re-register the test account's OPAQUE record with its fixed password
  await opaque.ready
  const { clientRegistrationState, registrationRequest } = opaque.client.startRegistration({
    password: PASSWORD,
  })
  const { registrationResponse } = opaque.server.createRegistrationResponse({
    serverSetup: process.env.OPAQUE_SERVER_SETUP!,
    userIdentifier: opaqueIdentifier(USERNAME),
    registrationRequest,
  })
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password: PASSWORD,
    keyStretching,
  })
  await db
    .prepare("UPDATE user SET password_hash = ? WHERE username = ? COLLATE NOCASE")
    .run([`opaque$${registrationRecord}`, USERNAME])
}
