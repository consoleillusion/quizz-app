/**
 * Every request under /api goes to the site's SRS server: accounts, sessions,
 * questions, tags and answers as JSON:API (see src/lib/srs.ts).
 *
 * @module
 */
import type { APIRoute } from "astro"
import { srs } from "../../lib/srs.ts"

export const prerender = false

export const ALL: APIRoute = async ({ request }) => (await srs())(request)
