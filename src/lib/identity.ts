// Who the browser is answering as. Every visitor gets a UUIDv7 the first time they use the app;
// their answers are stored under it. When they sign up, that id becomes their account id. When
// a session is active its account id (from the SRS session, see account.ts) wins.
// Stored as {id, account}: account=true means the id belongs to a signed-in account.
import { signedInUserId } from "./account.ts"
import { uuidv7 } from "./uuid.ts"

const KEY = "enauto.identity"
export type Identity = { id: string; account: boolean }
let memory: Identity | null = null

const read = (): Identity | null => {
  // Purpose: the saved identity, or null when none is saved or storage is blocked
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "null")
  } catch {
    return memory
  }
}

const write = (identity: Identity) => {
  // Purpose: save the identity, keeping an in-memory copy when storage is blocked
  memory = identity
  try {
    localStorage.setItem(KEY, JSON.stringify(identity))
  } catch {
    /* in-memory only */
  }
}

/** The signed-in account's id, or null when signed out. */
export const sessionUserId = () => signedInUserId()

export const resolveIdentity = () => {
  // Purpose: work out the current identity and what changed since the last page:
  //   adopt: an anonymous id whose answers now belong to the account that just signed in
  //   left:  an account id that has just signed out (its answers stop showing)
  const saved = read()
  const account = sessionUserId()
  if (account) {
    write({ id: account, account: true })
    return {
      id: account,
      adopt: saved && !saved.account && saved.id !== account ? saved.id : null,
      left: null,
    }
  }
  if (!saved || saved.account) {
    const fresh = { id: uuidv7(), account: false }
    write(fresh)
    return { id: fresh.id, adopt: null, left: saved?.id ?? null }
  }
  return { id: saved.id, adopt: null, left: null }
}

export const anonymousId = () =>
  // Purpose: the id to register with: the current anonymous id (created if needed)
  resolveIdentity().id
