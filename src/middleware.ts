// Runs before every page: looks up the logged-in user from the session cookie.
import { defineMiddleware } from "astro:middleware"
import { sessionUser } from "./lib/auth.ts"

export const onRequest = defineMiddleware(async (context, next) => {
  // Purpose: make the session user available to every page as Astro.locals.user
  context.locals.user = await sessionUser(context.cookies)
  return next()
})
