// Browser side of OPAQUE sign-up and login (@serenity-kit/opaque): the password never leaves the browser.
// Each sign-up and login also makes a fresh Ed25519 signing key pair with tweetnacl (no WebCrypto, so plain
// http works): the public half goes to the server, the secret half is kept in localStorage along with the
// server's session public key, which the server sends back.
import * as opaque from "@serenity-kit/opaque"
import { clientProof, serverProof, signingKey } from "./signing.ts"

// Argon2id stretching of the password before OPAQUE; changing it breaks every existing account.
export const keyStretching = {
  "argon2id-custom": { memory: 2 ** 16, iterations: 4, parallelism: 2 },
} as const

const post = async (url: string, body: object) => {
  // Purpose: POST JSON and return the reply, or throw an Error carrying the server's message and field errors
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok)
    throw Object.assign(new Error(data.error ?? res.statusText), {
      errors: data.errors ?? [],
    })
  return data
}

const keepKeys = (key: ReturnType<typeof signingKey>, serverPublicKey: object) =>
  // Purpose: remember this session's secret signing key and the server's session public key, replacing the previous session's
  localStorage.setItem(
    "session-key",
    JSON.stringify({ kid: key.jwk.kid, secretKey: key.secretKey, serverPublicKey })
  )

export const signUp = async ({
  username,
  password,
  email,
  id,
}: {
  username: string
  password: string
  email?: string
  id?: string
}) => {
  // Purpose: register an account with OPAQUE and start its session; returns the new user
  await opaque.ready
  const { clientRegistrationState, registrationRequest } = opaque.client.startRegistration({
    password,
  })
  const { registrationResponse } = await post("/user", {
    username,
    email,
    id,
    registrationRequest,
  })
  const { registrationRecord } = opaque.client.finishRegistration({
    clientRegistrationState,
    registrationResponse,
    password,
    keyStretching,
  })
  // Registration keeps no server state between its requests, so the key travels with the second one.
  const key = signingKey()
  const reply = await post("/user", {
    username,
    email,
    id,
    registrationRecord,
    publicKey: key.jwk,
  })
  keepKeys(key, reply.serverPublicKey)
  return reply
}

export const logIn = async ({ username, password }: { username: string; password: string }) => {
  // Purpose: log in with OPAQUE and start a session bound to a fresh signing key pair; returns the user
  await opaque.ready
  const key = signingKey()
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  })
  const { loginId, loginResponse } = await post("/session", {
    username,
    startLoginRequest,
    publicKey: key.jwk,
  })
  const finished = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretching,
  })
  if (!finished) throw Object.assign(new Error("Wrong username or password"), { errors: [] })
  const reply = await post("/session", {
    loginId,
    finishLoginRequest: finished.finishLoginRequest,
    proof: clientProof(finished.sessionKey, key.jwk.x),
  })
  if (reply.serverProof !== serverProof(finished.sessionKey, reply.serverPublicKey?.x))
    throw Object.assign(new Error("The server's session key isn't bound to this login"), {
      errors: [],
    })
  keepKeys(key, reply.serverPublicKey)
  return reply
}
