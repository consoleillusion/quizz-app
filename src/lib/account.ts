/**
 * The browser's account: sign-up, log-in and log-out through the site's SRS
 * server at /api. OPAQUE runs here, so the password never leaves the
 * browser; the session is kept in localStorage and every API request carries
 * it as a bearer token.
 *
 * @module
 */
import { browserStorage, createResourceServerClient, ResourceServerError } from "srs/client"

/** Where the signed-in username is kept: the session holds only the user id. */
const USERNAME_KEY = "techstudy.username"

/** The client for the site's API, created on first use. */
let client: ReturnType<typeof createResourceServerClient> | undefined
export const api = () =>
  (client ??= createResourceServerClient({ baseUrl: `${location.origin}/api`, storage: browserStorage() }))

/** The signed-in account's id, or null when signed out or the session has expired. */
export const signedInUserId = () => {
  const session = api().session
  return session && Date.parse(session.expiresAt) > Date.now() ? session.userId : null
}

/** The signed-in username, or null. */
export const signedInUsername = () => (signedInUserId() ? localStorage.getItem(USERNAME_KEY) : null)

/** A message for a failed sign-in or sign-up that a visitor can act on. */
const explain = (error: unknown) =>
  error instanceof ResourceServerError
    ? error.status === 401 ? "Wrong username or password"
      : error.status === 409 ? "That username is taken"
      : error.status === 429 ? "Too many attempts; wait a minute and try again"
      : error.message
    : error instanceof Error ? error.message : String(error)

const remember = (username: string) => localStorage.setItem(USERNAME_KEY, username)

/** Sign in, or throw an Error with a message to show. */
export const logIn = async ({ username, password }: { username: string, password: string }) => {
  try {
    await api().login({ username, password })
    remember(username)
  } catch (error) {
    throw new Error(explain(error))
  }
}

/** Create an account and sign in to it, or throw an Error with a message to show. */
export const signUp = async ({ username, password }: { username: string, password: string }) => {
  try {
    await api().register({ username, password })
    remember(username)
  } catch (error) {
    throw new Error(explain(error))
  }
}

/** End the session here and on the server. */
export const logOut = async () => {
  await api().logout().catch(() => {})
  localStorage.removeItem(USERNAME_KEY)
}
