/** A same-site path to return to after logging in or signing up; anything else goes to the exam list. */
export const safeNext = (next: unknown) =>
  typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/"
