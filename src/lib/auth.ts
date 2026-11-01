// Username/password accounts and cookie sessions. Server-only.
// Passwords: scrypt with a random 16-byte salt, stored as "scrypt$<salt hex>$<hash hex>".
// Sessions: a random 32-byte token in an HttpOnly cookie; the database keeps only its SHA-256.
import {createHash, randomBytes, scryptSync, timingSafeEqual} from "node:crypto"
import type {AstroCookies} from "astro"
import {db} from "../db/db.ts"
import {HttpError} from "./rest.ts"
import {insertRow, validate} from "./schemas.ts"
import {isUuidV7, uuidv7} from "./uuid.ts"

export type User = {id: string, username: string, email?: string, created_at: string}

export const SESSION_COOKIE = "session"
const SESSION_DAYS = 30
const MIN_PASSWORD = 8

export const hashPassword = (password: string) => {
  // Purpose: hash a password with a fresh random salt
  const salt = randomBytes(16)
  return `scrypt$${salt.toString("hex")}$${scryptSync(password, salt, 32).toString("hex")}`
}

export const checkPassword = (password: string, stored: string) => {
  // Purpose: true when a password matches a stored hash, compared in constant time
  const [scheme, salt, hash] = stored.split("$")
  if (scheme !== "scrypt" || !salt || !hash) return false
  const expected = Buffer.from(hash, "hex")
  return timingSafeEqual(scryptSync(password, Buffer.from(salt, "hex"), expected.length), expected)
}

const sha256 = (s: string) =>
  // Purpose: hex SHA-256 of a string, used to store session tokens
  createHash("sha256").update(s).digest("hex")

const publicUser = (row: any): User =>
  // Purpose: the fields of a user row that are safe to send to clients
  ({id: row.id, username: row.username, ...(row.email ? {email: row.email} : {}), created_at: row.created_at})

export const register = async (input: Record<string, unknown>) => {
  // Purpose: create an account from a username and password (email optional), or explain why not.
  // id is the UUIDv7 the browser has been answering under; it becomes the account id, so the
  // browser's existing answers belong to the new account. Without one, the server makes one.
  const {username, password, email} = input as Record<string, string>
  const id = input.id === undefined || input.id === "" ? uuidv7() : input.id
  const errors = typeof password === "string" && password.length >= MIN_PASSWORD ? []
    : [{field: "password", message: `must be at least ${MIN_PASSWORD} characters`}]
  if (!isUuidV7(id)) errors.push({field: "id", message: "must be a lower-case UUIDv7 with a plausible timestamp"})
  const row = {username: String(username ?? "").trim(), password_hash: "pending", ...(email ? {email: String(email).trim()} : {})}
  errors.push(...validate("user", row))
  if (errors.length) throw new HttpError(422, "Can't create that account", errors)
  if (await db.prepare("SELECT 1 FROM user WHERE username = ? COLLATE NOCASE").get([row.username]))
    throw new HttpError(409, `The username ${row.username} is taken`, [{field: "username", message: "is already taken"}])
  if (await db.prepare("SELECT 1 FROM user WHERE id = ?").get([id]))
    throw new HttpError(409, "That client id already belongs to an account", [{field: "id", message: "is already registered"}])
  await insertRow("user", {id, ...row, password_hash: hashPassword(password)})
  return publicUser(await db.prepare("SELECT * FROM user WHERE id = ?").get([id]))
}

export const authenticate = async (username: unknown, password: unknown) => {
  // Purpose: the user for a username and password, or a 401 that doesn't say which was wrong
  const row = typeof username === "string" && await db.prepare("SELECT * FROM user WHERE username = ? COLLATE NOCASE").get([username.trim()])
  if (!row || typeof password !== "string" || !checkPassword(password, row.password_hash))
    throw new HttpError(401, "Wrong username or password")
  return publicUser(row)
}

export const startSession = async (cookies: AstroCookies, user: User, secure: boolean) => {
  // Purpose: create a session for the user and set its cookie
  const token = randomBytes(32).toString("base64url")
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000)
  await insertRow("session", {user_id: user.id, token_hash: sha256(token), expires_at: expires.toISOString()})
  cookies.set(SESSION_COOKIE, token, {path: "/", httpOnly: true, sameSite: "lax", secure, expires})
}

export const endSession = async (cookies: AstroCookies) => {
  // Purpose: delete the current session and clear its cookie
  const token = cookies.get(SESSION_COOKIE)?.value
  if (token) await db.prepare("DELETE FROM session WHERE token_hash = ?").run([sha256(token)])
  cookies.delete(SESSION_COOKIE, {path: "/"})
}

export const sessionUser = async (cookies: AstroCookies): Promise<User | null> => {
  // Purpose: the logged-in user for the request's session cookie, if the session is still valid
  const token = cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const row = await db.prepare(`SELECT u.* FROM session s JOIN user u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP`).get([sha256(token)])
  return row ? publicUser(row) : null
}

export const requireUser = (user: User | null) => {
  // Purpose: the user, or a 401 for endpoints that need a login
  if (!user) throw new HttpError(401, "Log in first")
  return user
}

export const safeNext = (next: unknown) =>
  // Purpose: a same-site path to return to after logging in; anything else goes to /quiz
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/quiz"
