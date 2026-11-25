/**
 * The exam resource, read from SRS. An exam is a tag of type exam, and every
 * question carrying that tag belongs to it. Domains are the domain tags named
 * under the exam, such as `cisco:300-435:5.0`. Server-only.
 *
 * Each read is a few indexed requests: tags by type and name, the question ids
 * of each domain tag, and at most 20 questions by id.
 *
 * @module
 */
import { HttpError } from "./http.ts"
import { api, ApiError } from "./srs.ts"

export const MAX_IDS = 20

type Resource = { type: string, id: string, attributes: Record<string, any>, relationships?: Record<string, { data?: any }> }
type Collection = { data: Resource[], included?: Resource[], links?: { next?: string | null } }

/** Every resource of a collection path, following next links, 100 at a time. */
const everything = async (path: string, visitor?: Request) => {
  const separator = path.includes("?") ? "&" : "?"
  const found: Resource[] = []
  for (let page = 1; ; page++) {
    const { data, links } = await api<Collection>(`${path}${separator}page[size]=100&page[number]=${page}&page[total]=false`, visitor)
    found.push(...data)
    if (!links?.next) return found
  }
}

const tagsOfType = (type: string, filter = "", visitor?: Request) =>
  everything(`/tag?filter[type]=${type}${filter}&fields[tag]=name,description&sort=name`, visitor)

/** The ids of the questions carrying a tag. */
const questionIds = async (tagId: string, visitor?: Request) =>
  (await api<{ data: { id: string }[] }>(`/tag/${tagId}/relationships/questions`, visitor)).data.map(q => q.id)

/** How many readable questions carry a tag. */
const questionCount = async (tagId: string, visitor?: Request) =>
  (await api<{ meta: { page: { total: number } } }>(`/question?filter[tags.id]=${tagId}&fields[question]=type&page[size]=1`, visitor)).meta.page.total

/** How long a process keeps the exam list: counting each exam's questions is the slowest read on the site. */
const LIST_TTL_MS = 5 * 60_000
let listed: { at: number, exams: Promise<Awaited<ReturnType<typeof countExams>>> } | undefined

/** Every exam that has questions, with its question and domain counts, ordered by name; kept for five minutes. */
export const listExams = (visitor?: Request) => {
  if (!listed || Date.now() - listed.at > LIST_TTL_MS) {
    const exams = countExams(visitor)
    listed = { at: Date.now(), exams }
    exams.catch(() => { listed = undefined })
  }
  return listed.exams
}

const countExams = async (visitor?: Request) => {
  const [exams, domains] = await Promise.all([tagsOfType("exam", "", visitor), tagsOfType("domain", "", visitor)])
  const counted = await Promise.all(
    exams.map(async exam => (
      { name: exam.attributes.name as string
      , description: exam.attributes.description ?? ""
      , question_count: await questionCount(exam.id, visitor)
      , domain_count: domains.filter(d => d.attributes.name.startsWith(`${exam.attributes.name}:`)).length
      , url: `/exam/${exam.attributes.name}`
      })))
  return counted.filter(exam => exam.question_count > 0)
}

/**
 * Each question of the exam once, with the position of its first domain. A
 * question can carry more than one domain tag of the same exam; it counts
 * once. A question with no domain tag under this exam is left out.
 */
const assignments = async (domainIds: string[], visitor?: Request) => {
  const perDomain = await Promise.all(domainIds.map(id => questionIds(id, visitor)))
  const first = new Map<string, number>()
  perDomain.forEach((ids, position) => {
    for (const id of ids) if (!first.has(id)) first.set(id, position)
  })
  return first
}

/** The question index getExam built for each exam it returned, kept out of the exam so pages don't send it. */
const indexes = new WeakMap<object, Map<string, number>>()

/** One exam by tag name with its domains (in blueprint order) and how many questions each holds, or a 404. */
export const getExam = async (name: string, visitor?: Request) => {
  const [exam] = await tagsOfType("exam", `&filter[name]=${encodeURIComponent(name)}`, visitor)
  if (!exam) throw new HttpError(404, `No exam ${name}`)
  const domains = await tagsOfType("domain", `&filter[name][starts]=${encodeURIComponent(`${name}:`)}`, visitor)
  domains.sort((a, b) => a.attributes.name.localeCompare(b.attributes.name, undefined, { numeric: true }))
  const first = await assignments(domains.map(d => d.id), visitor)
  const counts = domains.map(() => 0)
  for (const p of first.values()) counts[p]++
  const found = {
    id: exam.id,
    name: exam.attributes.name as string,
    description: (exam.attributes.description as string) ?? "",
    question_count: first.size,
    domains: domains.map((d, i) => ({ type: "domain", id: d.id, name: d.attributes.name, description: d.attributes.description, question_count: counts[i] })),
    url: `/exam/${exam.attributes.name}`,
  }
  indexes.set(found, first)
  return found
}

/** Every question in the exam as [id, domain position], with nothing else, so the browser can choose which to ask for. */
export const examIndex = (exam: Awaited<ReturnType<typeof getExam>>) =>
  [...(indexes.get(exam) ?? new Map()).entries()].sort(([a], [b]) => (a < b ? -1 : 1))

/**
 * The stored questions with these ids that belong to the exam, in the order
 * asked for, with their tags, in the shape the quiz player takes: the type's
 * own fields beside the common ones.
 */
export const getExamQuestions = async (exam: { id: string }, ids: string[], visitor?: Request) => {
  if (ids.length > MAX_IDS) throw new HttpError(400, `Ask for at most ${MAX_IDS} questions at a time`)
  if (!ids.length) return []
  let document: Collection
  try {
    document = await api<Collection>(
      `/question?filter[id][in]=${ids.join(",")}&filter[tags.id]=${exam.id}&include=tags&page[size]=${MAX_IDS}&page[total]=false`
      , visitor)
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) throw new HttpError(400, error.message)
    throw error
  }
  const tags = new Map((document.included ?? []).filter(r => r.type === "tag").map(t => [t.id, t.attributes]))
  const byId = new Map(
    document.data.map(q => {
      const { body: { type: _type, ...body } = {}, owner: _owner, visibility: _visibility, updated_at: _updated, ...common } = q.attributes
      const tagIds: { id: string }[] = q.relationships?.tags?.data ?? []
      return [q.id, {
        ...common,
        ...body,
        id: q.id,
        tags: tagIds.flatMap(t => (tags.has(t.id) ? [{ type: tags.get(t.id)!.type, name: tags.get(t.id)!.name, description: tags.get(t.id)!.description }] : [])),
      }]
    }))
  return ids.flatMap(id => (byId.has(id) ? [byId.get(id)] : []))
}
