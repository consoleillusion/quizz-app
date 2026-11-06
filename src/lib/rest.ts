// REST mechanics shared by every resource page. A resource URL serves HTML by default;
// ?format=json (or an Accept header that prefers JSON) asks for JSON instead.
//   GET  /<resource>            collection, paginated with ?page=&limit=
//   POST /<resource>            create; form posts get 303 to the new item, JSON gets 201 + Location
//   GET  /<resource>/<key>      one item
import { schemas } from "./schemas.ts"

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: { field: string; message: string }[] = [],
  ) {
    super(message)
  }
}

export const wantsJson = (request: Request) => {
  // Purpose: decide between JSON and HTML from ?format=, then the Accept and Content-Type headers
  const format = new URL(request.url).searchParams.get("format")
  if (format) return format === "json"
  const accept = request.headers.get("accept") ?? ""
  if (accept.includes("text/html")) return false
  return (
    accept.includes("application/json") ||
    (request.headers.get("content-type") ?? "").includes("application/json")
  )
}

export const json = (
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  // Purpose: a JSON response with the given status and extra headers
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  })

export const jsonError = (e: HttpError) =>
  // Purpose: the JSON body for an HTTP error, with any field errors
  json(
    { error: e.message, ...(e.errors.length ? { errors: e.errors } : {}) },
    e.status,
  )

export const seeOther = (location: string) =>
  // Purpose: redirect a browser to a new resource after a form post
  new Response(null, { status: 303, headers: { location } })

export const methodNotAllowed = (allow: string[]) =>
  // Purpose: reject an HTTP method this resource doesn't support
  new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { allow: allow.join(", "), "content-type": "application/json" },
  })

export const DEFAULT_LIMIT = 12
export const MAX_LIMIT = 100

export const pageParams = (url: URL) => {
  // Purpose: read ?page= (1-based) and ?limit= from a URL, clamped to sensible bounds
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT),
  )
  const page = Math.max(
    1,
    Math.floor(Number(url.searchParams.get("page")) || 1),
  )
  return { page, limit, offset: (page - 1) * limit }
}

export const pageUrl = (url: URL, page: number) => {
  // Purpose: the same URL pointing at another page, keeping limit and format
  const next = new URL(url)
  next.searchParams.set("page", String(page))
  return next.pathname + next.search
}

export const collection = (
  url: URL,
  items: unknown[],
  total: number,
  { page, limit }: { page: number; limit: number },
) => {
  // Purpose: wrap a page of items with paging metadata and navigation links
  const pages = Math.max(1, Math.ceil(total / limit))
  return {
    items,
    total,
    page,
    limit,
    pages,
    links: {
      self: pageUrl(url, page),
      first: pageUrl(url, 1),
      last: pageUrl(url, pages),
      ...(page > 1 ? { prev: pageUrl(url, page - 1) } : {}),
      ...(page < pages ? { next: pageUrl(url, page + 1) } : {}),
    },
  }
}

const coerce = (x: any, raw: string) =>
  // Purpose: convert one form field to the type its schema property declares
  x.type === "boolean"
    ? ["on", "true", "1"].includes(raw)
    : x.type === "integer" || x.type === "number"
      ? Number(raw)
      : raw.trim()

export const readBody = async (request: Request, table: string) => {
  // Purpose: read a JSON or form body as an object, coercing form fields by the table schema
  const type = request.headers.get("content-type") ?? ""
  if (type.includes("application/json")) {
    try {
      return await request.json()
    } catch {
      throw new HttpError(400, "Body is not valid JSON")
    }
  }
  if (!type.includes("form"))
    throw new HttpError(415, "Send application/json or a form")
  const form = await request.formData()
  const props = schemas[table].properties
  const body: Record<string, unknown> = {}
  for (const [name, x] of Object.entries(props) as [string, any][]) {
    const raw = form.get(name)
    if (x.type === "boolean")
      body[name] = raw !== null && coerce(x, String(raw))
    else if (raw !== null && String(raw).trim() !== "")
      body[name] = coerce(x, String(raw))
  }
  return body
}

const overridable = ["DELETE", "PUT", "PATCH"]

export const effectiveMethod = async (request: Request) => {
  // Purpose: the request's method, honouring a _method field on form posts (HTML forms can only GET or POST)
  if (
    request.method !== "POST" ||
    !(request.headers.get("content-type") ?? "").includes("form")
  )
    return request.method
  const method = String(
    (await request.clone().formData()).get("_method") ?? "",
  ).toUpperCase()
  return overridable.includes(method) ? method : "POST"
}
