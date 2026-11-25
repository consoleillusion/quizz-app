/**
 * What pages need about questions beyond one exam: the dashboard's compact
 * index of every question and tag, and the HTML the quiz player shows.
 * Server-only.
 *
 * @module
 */
import { toHtml, toPlain } from "./markdown.ts"
import { api } from "./srs.ts"

type Page<T> = { data: T[], links?: { next?: string | null } }
type QuestionResource = { id: string, attributes: { type: string, text: string }, relationships: { tags: { data: { id: string }[] } } }
type TagResource = { id: string, attributes: { type: string, name: string, description?: string } }

/** Every resource of a collection path, 100 at a time. */
const everything = async <T>(path: string, visitor?: Request) => {
  const found: T[] = []
  for (let page = 1; ; page++) {
    const { data, links } = await api<Page<T>>(`${path}&page[size]=100&page[number]=${page}&page[total]=false`, visitor)
    found.push(...data)
    if (!links?.next) return found
  }
}

const shorten = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

const INDEX_TTL_MS = 5 * 60_000
let indexed: { at: number, index: ReturnType<typeof buildIndex> } | undefined

const buildIndex = async (visitor?: Request) => {
  const [questions, tags] = await Promise.all([
    everything<QuestionResource>("/question?fields[question]=type,text,tags&sort=id", visitor),
    everything<TagResource>("/tag?fields[tag]=type,name,description&sort=name", visitor),
  ])
  return {
    questions: Object.fromEntries(
      questions.map(q => [q.id, { type: q.attributes.type, text: shorten(toPlain(q.attributes.text)), tags: q.relationships.tags.data.map(t => t.id), quizzes: [] as string[] }])),
    tags: Object.fromEntries(tags.map(t => [t.id, { type: t.attributes.type, name: t.attributes.name, description: t.attributes.description }])),
    quizzes: {} as Record<string, { slug: string, title: string, tags: string[] }>,
  }
}

/** The dashboard's lookup of every public question (type, short text, tag ids) and every tag; kept for five minutes. */
export const questionIndex = (visitor?: Request) => {
  if (!indexed || Date.now() - indexed.at > INDEX_TTL_MS) {
    const index = buildIndex(visitor)
    indexed = { at: Date.now(), index }
    index.catch(() => { indexed = undefined })
  }
  return indexed.index
}

/** Add HTML for every Markdown field, and plain labels for option and sortable-list items, for the quiz player. */
export const withRendering = (q: any) => {
  const html: Record<string, string | string[]> = { text: toHtml(q.text) }
  if (q.explanation) html.explanation = toHtml(q.explanation)
  if (q.options) html.options = q.options.map((o: any) => toHtml(o.text))
  for (const k of ["prompts", "responses", "items"]) if (q[k]) html[k] = q[k].map(toHtml)
  return {
    ...q,
    html,
    plain: {
      ...(q.responses ? { responses: q.responses.map(toPlain) } : {}),
      ...(q.items ? { items: q.items.map(toPlain) } : {}),
    },
  }
}
