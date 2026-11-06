// OPAQUE sign-up and login end to end: the server functions against a scratch in-memory database,
// driven by the same OPAQUE client calls, key stretching and proof the browser uses.
import { beforeAll, expect, test } from "bun:test"
import * as opaque from "@serenity-kit/opaque"

let auth: typeof import("./auth.ts"), client: typeof import("./opaque-client.ts")
const publicKey = {
  kty: "OKP",
  crv: "Ed25519",
  x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo",
  use: "sig",
  kid: "test",
}

beforeAll(async () => {
  await opaque.ready
  process.env.DB_PATH = ":memory:"
  process.env.OPAQUE_SERVER_SETUP = opaque.server.createSetup()
  const { db } = await import("../db/db.ts")
  const { databaseSQL } = await import("../db/ddl.ts")
  const { loadSchema } = await import("../db/loadSchema.ts")
  await db.batch(databaseSQL(await loadSchema()), "write")
  auth = await import("./auth.ts")
  client = await import("./opaque-client.ts")
})

const signUp = async (username: string, password: string) => {
  // Purpose: what the browser does to sign up, minus the network and IndexedDB
  const { clientRegistrationState, registrationRequest } = opaque.client.startRegistration({
    password,
  })
  const { registrationResponse } = await auth.registrationResponse({
    username,
    registrationRequest,
  })
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password,
    keyStretching: client.keyStretching,
  })
  return auth.register({ username, registrationRecord, publicKey })
}

const logIn = async (username: string, password: string, key = publicKey) => {
  // Purpose: what the browser does to log in; null when the browser itself detects a wrong password
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  })
  const { loginId, loginResponse } = await auth.startLogin({
    username,
    startLoginRequest,
  })
  const finished = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretching: client.keyStretching,
  })
  if (!finished) return null
  return auth.finishLogin({
    loginId,
    finishLoginRequest: finished.finishLoginRequest,
    publicKey: key,
    proof: await client.proofFor(finished.sessionKey, key.x),
  })
}

test("sign up, then log in with the right password", async () => {
  const { user } = await signUp("Alice", "correct horse battery")
  expect(user.username).toBe("Alice")
  const login = await logIn("alice", "correct horse battery")
  expect(login?.user.id).toBe(user.id)
  expect(login?.publicKey).toEqual(publicKey)
})

test("a taken username is refused at the first sign-up step", async () => {
  await expect(
    auth.registrationResponse({ username: "ALICE", registrationRequest: "x" })
  ).rejects.toMatchObject({ status: 409 })
})

test("a wrong password or unknown user fails without saying which", async () => {
  expect(await logIn("alice", "wrong password")).toBeNull()
  expect(await logIn("nobody", "whatever password")).toBeNull()
})

test("a login attempt can't be reused, and the key must be bound to the login", async () => {
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password: "correct horse battery",
  })
  const { loginId, loginResponse } = await auth.startLogin({
    username: "alice",
    startLoginRequest,
  })
  const { finishLoginRequest, sessionKey } = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password: "correct horse battery",
    keyStretching: client.keyStretching,
  })!
  const other = {
    ...publicKey,
    x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  }
  await expect(
    auth.finishLogin({
      loginId,
      finishLoginRequest,
      publicKey: other,
      proof: await client.proofFor(sessionKey, publicKey.x),
    })
  ).rejects.toMatchObject({ status: 401 })
  await expect(
    auth.finishLogin({
      loginId,
      finishLoginRequest,
      publicKey,
      proof: await client.proofFor(sessionKey, publicKey.x),
    })
  ).rejects.toMatchObject({ status: 401 })
})

test("a public key that isn't an Ed25519 JWK is refused", async () => {
  const { clientRegistrationState, registrationRequest } = opaque.client.startRegistration({
    password: "another password",
  })
  const { registrationResponse } = await auth.registrationResponse({
    username: "bob",
    registrationRequest,
  })
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password: "another password",
    keyStretching: client.keyStretching,
  })
  await expect(
    auth.register({
      username: "bob",
      registrationRecord,
      publicKey: { kty: "RSA" },
    })
  ).rejects.toMatchObject({ status: 422 })
})
