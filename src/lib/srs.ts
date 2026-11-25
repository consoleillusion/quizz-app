/**
 * The site's SRS server, mounted at `/api` (src/pages/api/[...path].ts) and
 * read in-process by server-rendered pages. Server-only.
 *
 * With `SRS_DATABASE_URL` set (Vercel) it uses the remote Turso database;
 * apply migrations first with `bunx srs migrate`. Otherwise it opens the
 * local file `SRS_DB_PATH` (default `srs.db`) and brings it up to date from
 * `.srs/migrations` on first use.
 *
 * @module
 */
import { applyMigrations, createServerApp, openDatabase } from "srs"
import { createHandler } from "srs/serverless"
import schemas from "../../.srs/schemas.json"

/** Where the API is mounted. */
export const API_BASE = "/api"

type Handler = (request: Request) => Promise<Response> | Response

const build = async (): Promise<Handler> => {
  if (process.env.SRS_DATABASE_URL) return createHandler({ schemas, basePath: API_BASE })
  // Vercel's filesystem is read-only, so a local database can never work there.
  if (process.env.VERCEL)
    throw new Error("SRS_DATABASE_URL is not set for this deployment. Add SRS_DATABASE_URL and SRS_DATABASE_TOKEN in Vercel (Settings → Environment Variables) for this environment, then redeploy.")
  const db = await openDatabase(process.env.SRS_DB_PATH ?? "srs.db")
  await applyMigrations(db, ".srs/migrations")
  const app = await createServerApp({ loaded: schemas as never, db, transport: "bearer", basePath: API_BASE })
  return (request: Request) => {
    const url = new URL(request.url)
    url.pathname = url.pathname.slice(API_BASE.length) || "/"
    return app.fetch(new Request(url.toString(), request))
  }
}

let handler: Promise<Handler> | undefined

/** The handler for requests under {@link API_BASE}, built once per process. */
export const srs = (): Promise<Handler> => (handler ??= build())

/** An error the API answered with, carrying its status and first error detail. */
export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

/**
 * GET a path of the API in-process, as an anonymous visitor, and return the
 * JSON:API document.
 *
 * @param path - The path under the API, such as `/tag?filter[type]=exam`.
 * @param visitor - The page request, whose client address is passed on so the rate limit counts the visitor rather than the site.
 */
export const api = async <T = any>(path: string, visitor?: Request): Promise<T> => {
  const forwarded = visitor?.headers.get("x-forwarded-for")
  const response =
    await (await srs())(
      new Request(`http://srs.internal${API_BASE}${path}`
        , { headers: { accept: "application/vnd.api+json", ...(forwarded ? { "x-forwarded-for": forwarded } : {}) } }))
  const body = await response.json()
  if (!response.ok) throw new ApiError(response.status, body?.errors?.[0]?.detail ?? `The API answered ${response.status}`)
  return body as T
}
