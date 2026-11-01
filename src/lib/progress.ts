// Browser-side answer storage in IndexedDB. Two stores:
//   quiz_answers  the current answer to each question in each quiz (what the quiz player shows);
//                 Restart clears a quiz's entries here.
//   answer_log    every answer ever given, append-only, for the dashboard. Never cleared by Restart.
// Records mirror the user_answer table (minus user_id) so they can be synced to the server later.
// Falls back to in-memory storage when IndexedDB is unavailable (private mode, blocked storage).

export type AnswerRecord = {quiz_id: string, question_type: string, question_id: string,
  answer: any[], points: number, correct: boolean, answered_at: string}

const DB_NAME = "enauto-quiz"
const CURRENT = "quiz_answers"
const LOG = "answer_log"
const memory = {current: new Map<string, AnswerRecord>(), log: [] as AnswerRecord[]}

const request = <T>(r: IDBRequest<T>) =>
  // Purpose: wrap an IndexedDB request in a promise
  new Promise<T>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })

const createMissingStores = (db: IDBDatabase) => {
  // Purpose: create whichever of the two stores (and their indexes) don't exist yet
  if (!db.objectStoreNames.contains(CURRENT)) {
    db.createObjectStore(CURRENT, {keyPath: ["quiz_id", "question_id"]}).createIndex("by_quiz", "quiz_id")
  }
  if (!db.objectStoreNames.contains(LOG)) {
    const log = db.createObjectStore(LOG, {autoIncrement: true})
    log.createIndex("by_time", "answered_at")
  }
}

const openVersion = (version?: number) =>
  // Purpose: open the database, creating missing stores whenever an upgrade runs
  new Promise<IDBDatabase | null>(resolve => {
    try {
      const r = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME)
      r.onupgradeneeded = () => createMissingStores(r.result)
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => resolve(null)
    } catch { resolve(null) }
  })

let opening: Promise<IDBDatabase | null> | undefined
const openDb = () => {
  // Purpose: open the database once per page, upgrading it when a store is missing
  opening ??= openVersion().then(db => {
    if (!db || [CURRENT, LOG].every(s => db.objectStoreNames.contains(s))) return db
    const next = db.version + 1
    db.close()
    return openVersion(next)
  })
  return opening
}

const store = async (name: string, mode: IDBTransactionMode) => {
  // Purpose: get one object store, or null when IndexedDB isn't usable
  const db = await openDb()
  return db ? db.transaction(name, mode).objectStore(name) : null
}

export const loadAnswers = async (quizId: string): Promise<AnswerRecord[]> => {
  // Purpose: read the current answers for one quiz
  const s = await store(CURRENT, "readonly")
  return s ? request(s.index("by_quiz").getAll(quizId)) : [...memory.current.values()].filter(r => r.quiz_id === quizId)
}

export const saveAnswer = async (record: AnswerRecord) => {
  // Purpose: make this the current answer for the question, and append it to the answer log
  const current = await store(CURRENT, "readwrite")
  const log = await store(LOG, "readwrite")
  if (current && log) { await request(current.put(record)); await request(log.add(record)) }
  else { memory.current.set(`${record.quiz_id}/${record.question_id}`, record); memory.log.push(record) }
  pushAnswers([record]).catch(() => {}) // best effort; the dashboard's sync resends anything missed
}

export const clearAnswers = async (quizId: string) => {
  // Purpose: clear one quiz's current answers (the answer log keeps its history)
  const s = await store(CURRENT, "readwrite")
  if (!s) { for (const [k, r] of memory.current) if (r.quiz_id === quizId) memory.current.delete(k); return }
  const keys = await request(s.index("by_quiz").getAllKeys(quizId))
  await Promise.all(keys.map(k => request(s.delete(k))))
}

const logKey = (r: AnswerRecord) =>
  // Purpose: identify one answer event (the same key the server uses to ignore repeats)
  `${r.question_id}|${new Date(r.answered_at).toISOString()}`

export const loadLog = async (): Promise<AnswerRecord[]> => {
  // Purpose: read every answer ever given, oldest first, first copying in any current answers the log
  // doesn't have yet (answers given before the log existed)
  const log = await store(LOG, "readonly")
  if (!log) return [...memory.log].sort((a, b) => a.answered_at.localeCompare(b.answered_at))
  const logged: AnswerRecord[] = await request(log.index("by_time").getAll())
  const current: AnswerRecord[] = await request((await store(CURRENT, "readonly"))!.getAll())
  const seen = new Set(logged.map(logKey))
  const missing = current.filter(r => !seen.has(logKey(r)))
  if (missing.length) {
    const writable = (await store(LOG, "readwrite"))!
    await Promise.all(missing.map(r => request(writable.add(r))))
  }
  return [...logged, ...missing].sort((a, b) => a.answered_at.localeCompare(b.answered_at))
}

const pushAnswers = async (records: AnswerRecord[]) => {
  // Purpose: send answers to the server for the logged-in user; false when not logged in or offline
  if (!records.length) return true
  const r = await fetch("/answer", {method: "POST", headers: {"content-type": "application/json", accept: "application/json"}, body: JSON.stringify(records)})
  return r.ok
}

export const syncLog = async (): Promise<{answers: AnswerRecord[], synced: boolean}> => {
  // Purpose: merge this browser's answer log with the server's (both directions), when logged in
  const local = await loadLog()
  const r = await fetch("/answer?format=json", {headers: {accept: "application/json"}}).catch(() => null)
  if (!r?.ok) return {answers: local, synced: false}
  const remote: AnswerRecord[] = await r.json()
  const localKeys = new Set(local.map(logKey)), remoteKeys = new Set(remote.map(logKey))
  const toServer = local.filter(a => !remoteKeys.has(logKey(a)))
  for (let i = 0; i < toServer.length; i += 500) await pushAnswers(toServer.slice(i, i + 500))
  const fromServer = remote.filter(a => !localKeys.has(logKey(a)))
  const log = await store(LOG, "readwrite")
  if (log) await Promise.all(fromServer.map(a => request(log.add(a))))
  else memory.log.push(...fromServer)
  return {answers: [...local, ...fromServer].sort((a, b) => Date.parse(a.answered_at) - Date.parse(b.answered_at)), synced: true}
}
