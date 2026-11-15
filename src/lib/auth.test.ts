// OPAQUE sign-up and login end to end: the server functions against a scratch in-memory database,
// driven by the same OPAQUE client calls, key stretching, tweetnacl keys and proofs the browser uses.
import { beforeAll, expect, test } from "bun:test"
import * as opaque from "@serenity-kit/opaque"

let auth: typeof import("./auth.ts"), client: typeof import("./opaque-client.ts")
let signing: typeof import("./signing.ts"), db: any
// Purpose: a fresh browser signing key, as the browser makes at each sign-up and login
const key = () => signing.signingKey()

beforeAll(async () => {
  await opaque.ready
  process.env.DB_PATH = ":memory:"
  process.env.OPAQUE_SERVER_SETUP = opaque.server.createSetup()
  ;({ db } = await import("../db/db.ts"))
  const { databaseSQL } = await import("../db/ddl.ts")
  const { loadSchema } = await import("../db/loadSchema.ts")
  await db.batch(databaseSQL(await loadSchema()), "write")
  auth = await import("./auth.ts")
  client = await import("./opaque-client.ts")
  signing = await import("./signing.ts")
})

const signUp = async (username: string, password: string) => {
  // Purpose: what the browser does to sign up, minus the network and localStorage
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
  const k = key()
  return { k, ...(await auth.register({ username, registrationRecord, publicKey: k.jwk })) }
}

const logIn = async (username: string, password: string) => {
  // Purpose: what the browser does to log in; null when the browser itself detects a wrong password
  const k = key()
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({ password })
  const { loginId, loginResponse } = await auth.startLogin({
    username,
    startLoginRequest,
    publicKey: k.jwk,
  })
  const finished = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretching: client.keyStretching,
  })
  if (!finished) return null
  const reply = await auth.finishLogin({
    loginId,
    finishLoginRequest: finished.finishLoginRequest,
    proof: signing.clientProof(finished.sessionKey, k.jwk.x),
  })
  return { k, finished, ...reply }
}

test("sign up hands back the browser's key and a fresh server key pair", async () => {
  const r = await signUp("Alice", "correct horse battery")
  expect(r.user.username).toBe("Alice")
  expect(r.publicKey).toEqual(r.k.jwk)
  expect(r.serverKey.jwk.x).not.toBe(r.k.jwk.x)
  expect(signing.unb64url(r.serverKey.secretKey).length).toBe(64)
})

test("log in with the right password: keys exchanged and the server's proof checks out", async () => {
  const login = await logIn("alice", "correct horse battery")
  expect(login?.publicKey).toEqual(login?.k.jwk)
  expect(login?.serverProof).toBe(
    signing.serverProof(login!.finished.sessionKey, login!.serverKey.jwk.x)
  )
})

test("a session stores the browser's public key and the server's secret key", async () => {
  const login = (await logIn("alice", "correct horse battery"))!
  const cookies = { set() {}, get: () => undefined, delete() {} } as any
  await auth.startSession(cookies, login.user, login.publicKey, login.serverKey, false)
  const row = await db
    .prepare("SELECT json(public_key) AS public_key, server_secret_key FROM session ORDER BY created_at DESC")
    .get()
  expect(JSON.parse(row.public_key)).toEqual(login.k.jwk)
  expect(row.server_secret_key).toBe(login.serverKey.secretKey)
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

test("a login attempt can't be reused, and the browser's key must be bound to the login", async () => {
  const attempt = async () => {
    const k = key()
    const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
      password: "correct horse battery",
    })
    const { loginId, loginResponse } = await auth.startLogin({
      username: "alice",
      startLoginRequest,
      publicKey: k.jwk,
    })
    const { finishLoginRequest, sessionKey } = opaque.client.finishLogin({
      clientLoginState,
      loginResponse,
      password: "correct horse battery",
      keyStretching: client.keyStretching,
    })!
    return { k, loginId, finishLoginRequest, sessionKey }
  }
  const a = await attempt()
  const other = key()
  // proof for a different key than the one sent in step 1
  await expect(
    auth.finishLogin({
      loginId: a.loginId,
      finishLoginRequest: a.finishLoginRequest,
      proof: signing.clientProof(a.sessionKey, other.jwk.x),
    })
  ).rejects.toMatchObject({ status: 401 })
  // the attempt is spent even though it failed
  await expect(
    auth.finishLogin({
      loginId: a.loginId,
      finishLoginRequest: a.finishLoginRequest,
      proof: signing.clientProof(a.sessionKey, a.k.jwk.x),
    })
  ).rejects.toMatchObject({ status: 401 })
})

test("a public key that isn't an Ed25519 JWK is refused at sign-up and at login", async () => {
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
    auth.register({ username: "bob", registrationRecord, publicKey: { kty: "RSA" } })
  ).rejects.toMatchObject({ status: 422 })
  const { startLoginRequest } = opaque.client.startLogin({ password: "x" })
  await expect(
    auth.startLogin({ username: "alice", startLoginRequest, publicKey: { kty: "RSA" } })
  ).rejects.toMatchObject({ status: 422 })
})
