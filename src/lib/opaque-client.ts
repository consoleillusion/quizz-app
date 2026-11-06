// Browser side of OPAQUE sign-up and login (@serenity-kit/opaque): the password never leaves the browser.
// Each sign-up and login also makes a fresh Ed25519 signing key for the new session: the private key
// is non-extractable and kept in IndexedDB, and only the public key (a JWK) is sent to the server.
import * as opaque from "@serenity-kit/opaque"

// Argon2id stretching of the password before OPAQUE; changing it breaks every existing account.
export const keyStretching = {
  "argon2id-custom": { memory: 2 ** 16, iterations: 4, parallelism: 2 },
} as const

const requireSecureContext = () => {
  // Purpose: fail clearly where WebCrypto is missing: browsers only provide it on HTTPS or localhost
  if (!globalThis.crypto?.subtle)
    throw Object.assign(
      new Error(
        "This page must be opened over HTTPS (or on localhost) to sign up or log in.",
      ),
      { errors: [] },
    )
}

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

const base64url = (bytes: ArrayBuffer) =>
  // Purpose: unpadded base64url text of some bytes
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

export const proofFor = async (sessionKey: string, x: string) => {
  // Purpose: HMAC-SHA256 of the session public key's `x` under OPAQUE's session key (the server checks the same)
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  return base64url(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(x)),
  )
}

const saveSigningKey = (privateKey: CryptoKey, kid: string) =>
  // Purpose: keep the session's private signing key in IndexedDB, replacing the previous session's
  new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("session-key", 1)
    open.onupgradeneeded = () => open.result.createObjectStore("keys")
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const tx = open.result.transaction("keys", "readwrite")
      tx.objectStore("keys").put({ kid, privateKey }, "current")
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    }
  })

const newSessionKey = async () => {
  // Purpose: make the new session's Ed25519 key pair, store the private half, return the public half as a JWK
  const { privateKey, publicKey } = (await crypto.subtle.generateKey(
    { name: "Ed25519" },
    false,
    ["sign", "verify"],
  )) as CryptoKeyPair
  const { x } = await crypto.subtle.exportKey("jwk", publicKey)
  const kid = crypto.randomUUID()
  await saveSigningKey(privateKey, kid)
  return { kty: "OKP", crv: "Ed25519", x: x!, use: "sig", kid }
}

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
  requireSecureContext()
  await opaque.ready
  const { clientRegistrationState, registrationRequest } =
    opaque.client.startRegistration({ password })
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
  return post("/user", {
    username,
    email,
    id,
    registrationRecord,
    publicKey: await newSessionKey(),
  })
}

export const logIn = async ({
  username,
  password,
}: {
  username: string
  password: string
}) => {
  // Purpose: log in with OPAQUE and start a session bound to a fresh signing key; returns the user
  requireSecureContext()
  await opaque.ready
  const { clientLoginState, startLoginRequest } = opaque.client.startLogin({
    password,
  })
  const { loginId, loginResponse } = await post("/session", {
    username,
    startLoginRequest,
  })
  const finished = opaque.client.finishLogin({
    clientLoginState,
    loginResponse,
    password,
    keyStretching,
  })
  if (!finished)
    throw Object.assign(new Error("Wrong username or password"), { errors: [] })
  const publicKey = await newSessionKey()
  return post("/session", {
    loginId,
    finishLoginRequest: finished.finishLoginRequest,
    publicKey,
    proof: await proofFor(finished.sessionKey, publicKey.x),
  })
}
