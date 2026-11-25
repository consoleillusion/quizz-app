/**
 * Response helpers the site's pages share: errors with a status, JSON or HTML
 * by request, and method checks. They read no database.
 *
 * @module
 */
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: { field: string; message: string }[] = []
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

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  // Purpose: a JSON response with the given status and extra headers
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  })

export const jsonError = (e: HttpError) =>
  // Purpose: the JSON body for an HTTP error, with any field errors
  json({ error: e.message, ...(e.errors.length ? { errors: e.errors } : {}) }, e.status)

export const seeOther = (location: string) =>
  // Purpose: redirect a browser to a new resource after a form post
  new Response(null, { status: 303, headers: { location } })

export const methodNotAllowed = (allow: string[]) =>
  // Purpose: reject an HTTP method this resource doesn't support
  new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { allow: allow.join(", "), "content-type": "application/json" },
  })
