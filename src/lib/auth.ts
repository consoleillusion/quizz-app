// Accounts and cookie sessions, with OPAQUE password authentication (@serenity-kit/opaque). Server-only.
// The password never reaches the server: user.password_hash holds "opaque$<registration record>".
// Registration and login each take two requests; login keeps the server's state between them in
// login_attempt, so no state lives in the process. Every session stores the Ed25519 public key the
// browser made for it (for signing requests later), bound to the login by an HMAC under OPAQUE's session key.
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto"
import * as opaque from "@serenity-kit/opaque"
import type { AstroCookies } from "astro"
import { db } from "../db/db.ts"
import { HttpError } from "./rest.ts"
import { insertRow, validate } from "./schemas.ts"
import { isUuidV7, uuidv7 } from "./uuid.ts"

export type User = {
  id: string
  username: string
  email?: string
  created_at: string
}

export const SESSION_COOKIE = "session"
const SESSION_DAYS = 30
const LOGIN_SECONDS = 120
const RECORD = "opaque$"

await opaque.ready
const serverSetup = process.env.OPAQUE_SERVER_SETUP ?? ""
if (!serverSetup) throw new Error("OPAQUE_SERVER_SETUP is not set (see .env)")

export const opaqueIdentifier = (username: string) =>
  // Purpose: the identifier OPAQUE binds a record to: the username, trimmed and lower-cased like logins
  username.trim().toLowerCase()

export const proofFor = (sessionKey: string, x: string) =>
  // Purpose: HMAC-SHA256 of a session public key's `x` under OPAQUE's session key, base64url
  createHmac("sha256", sessionKey).update(x).digest("base64url")

const sha256 = (s: string) =>
  // Purpose: hex SHA-256 of a string, used to store session tokens
  createHash("sha256").update(s).digest("hex")

const publicUser = (row: any): User =>
  // Purpose: the fields of a user row that are safe to send to clients
  ({
    id: row.id,
    username: row.username,
    ...(row.email ? { email: row.email } : {}),
    created_at: row.created_at,
  })

const opaqueStep = <T>(step: () => T) => {
  // Purpose: run an OPAQUE step on data from the browser, turning malformed messages into a 400
  try {
    return step()
  } catch {
    throw new HttpError(400, "Malformed OPAQUE message")
  }
}

const requireString = (input: Record<string, unknown>, field: string) => {
  // Purpose: a non-empty string field from a request body, or a 422 naming it
  const value = input[field]
  if (typeof value !== "string" || !value)
    throw new HttpError(422, `${field} is required`, [
      { field, message: "is required" },
    ])
  return value
}

const requirePublicKey = (publicKey: unknown) => {
  // Purpose: the session's public signing key, or a 422 when it isn't an Ed25519 JWK
  const errors = validate("session", { public_key: publicKey }).filter(
    (e) => e.field === "public_key",
  )
  if (errors.length)
    throw new HttpError(422, "publicKey must be an Ed25519 JWK", errors)
  return publicKey
}

const newAccount = async (input: Record<string, unknown>) => {
  // Purpose: check a sign-up's username, email and client id are valid and free; returns the user row.
  // id is the UUIDv7 the browser has been answering under, so its answers belong to the new account.
  const { username, email } = input as Record<string, string>
  const id = input.id === undefined || input.id === "" ? uuidv7() : input.id
  const row = {
    username: String(username ?? "").trim(),
    password_hash: RECORD,
    ...(email ? { email: String(email).trim() } : {}),
  }
  const errors = [
    ...(isUuidV7(id)
      ? []
      : [
          {
            field: "id",
            message: "must be a lower-case UUIDv7 with a plausible timestamp",
          },
        ]),
    ...validate("user", row),
  ]
  if (errors.length)
    throw new HttpError(422, "Can't create that account", errors)
  if (
    await db
      .prepare("SELECT 1 FROM user WHERE username = ? COLLATE NOCASE")
      .get([row.username])
  )
    throw new HttpError(409, `The username ${row.username} is taken`, [
      { field: "username", message: "is already taken" },
    ])
  if (await db.prepare("SELECT 1 FROM user WHERE id = ?").get([id]))
    throw new HttpError(409, "That client id already belongs to an account", [
      { field: "id", message: "is already registered" },
    ])
  return { id: id as string, ...row }
}

export const registrationResponse = async (input: Record<string, unknown>) => {
  // Purpose: registration step 1: answer the browser's OPAQUE registration request for a free username
  const { username } = await newAccount(input)
  const registrationRequest = requireString(input, "registrationRequest")
  return opaqueStep(() =>
    opaque.server.createRegistrationResponse({
      serverSetup,
      userIdentifier: opaqueIdentifier(username),
      registrationRequest,
    }),
  )
}

export const register = async (input: Record<string, unknown>) => {
  // Purpose: registration step 2: store the account with its OPAQUE record; returns the user and session key
  const row = await newAccount(input)
  const record = requireString(input, "registrationRecord")
  const publicKey = requirePublicKey(input.publicKey)
  await insertRow("user", { ...row, password_hash: RECORD + record })
  return {
    user: publicUser(
      await db.prepare("SELECT * FROM user WHERE id = ?").get([row.id]),
    ),
    publicKey,
  }
}

export const startLogin = async (input: Record<string, unknown>) => {
  // Purpose: login step 1: answer the browser and keep the server's state for step 2. Unknown
  // usernames get OPAQUE's fake answer, so this step doesn't reveal which accounts exist.
  const username = requireString(input, "username").trim()
  const startLoginRequest = requireString(input, "startLoginRequest")
  const row = await db
    .prepare("SELECT password_hash FROM user WHERE username = ? COLLATE NOCASE")
    .get([username])
  const registrationRecord = row?.password_hash.startsWith(RECORD)
    ? row.password_hash.slice(RECORD.length)
    : null
  const { serverLoginState, loginResponse } = opaqueStep(() =>
    opaque.server.startLogin({
      serverSetup,
      userIdentifier: opaqueIdentifier(username),
      registrationRecord,
      startLoginRequest,
    }),
  )
  const expires = new Date(Date.now() + LOGIN_SECONDS * 1000).toISOString()
  const loginId = await insertRow("login_attempt", {
    username,
    server_login_state: serverLoginState,
    expires_at: expires,
  })
  return { loginId, loginResponse }
}

export const finishLogin = async (input: Record<string, unknown>) => {
  // Purpose: login step 2: check the password proof and that the session key is bound to this login;
  // returns the user and session key. The attempt is deleted whatever happens, so it can't be replayed.
  const wrong = new HttpError(401, "Wrong username or password")
  const attempt =
    typeof input.loginId === "string" &&
    (await db
      .prepare(
        "DELETE FROM login_attempt WHERE id = ? AND expires_at > CURRENT_TIMESTAMP RETURNING username, server_login_state",
      )
      .get([input.loginId]))
  if (!attempt || typeof input.finishLoginRequest !== "string") throw wrong
  const finishLoginRequest = input.finishLoginRequest
  const sessionKey = (() => {
    try {
      return opaque.server.finishLogin({
        serverLoginState: attempt.server_login_state,
        finishLoginRequest,
      }).sessionKey
    } catch {
      throw wrong
    }
  })()
  const publicKey = requirePublicKey(input.publicKey) as { x: string }
  const expected = Buffer.from(proofFor(sessionKey, publicKey.x)),
    given = Buffer.from(String(input.proof ?? ""))
  if (given.length !== expected.length || !timingSafeEqual(given, expected))
    throw new HttpError(401, "The session key isn't bound to this login")
  const user = await db
    .prepare("SELECT * FROM user WHERE username = ? COLLATE NOCASE")
    .get([attempt.username])
  if (!user) throw wrong
  return { user: publicUser(user), publicKey }
}

export const startSession = async (
  cookies: AstroCookies,
  user: User,
  publicKey: unknown,
  secure: boolean,
) => {
  // Purpose: create a session for the user, holding the session's public signing key, and set its cookie
  const token = randomBytes(32).toString("base64url")
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await insertRow("session", {
    user_id: user.id,
    token_hash: sha256(token),
    expires_at: expires.toISOString(),
    public_key: publicKey,
  })
  cookies.set(SESSION_COOKIE, token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    expires,
  })
}

export const endSession = async (cookies: AstroCookies) => {
  // Purpose: delete the current session and clear its cookie
  const token = cookies.get(SESSION_COOKIE)?.value
  if (token)
    await db
      .prepare("DELETE FROM session WHERE token_hash = ?")
      .run([sha256(token)])
  cookies.delete(SESSION_COOKIE, { path: "/" })
}

export const sessionUser = async (
  cookies: AstroCookies,
): Promise<User | null> => {
  // Purpose: the logged-in user for the request's session cookie, if the session is still valid
  const token = cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const row = await db
    .prepare(`SELECT u.* FROM session s JOIN user u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`)
    .get([sha256(token)])
  return row ? publicUser(row) : null
}

export const requireUser = (user: User | null) => {
  // Purpose: the user, or a 401 for endpoints that need a login
  if (!user) throw new HttpError(401, "Log in first")
  return user
}

export const safeNext = (next: unknown) =>
  // Purpose: a same-site path to return to after logging in; anything else goes to /quiz
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/quiz"
