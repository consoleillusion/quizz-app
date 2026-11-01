// Browser-side answer storage in IndexedDB, per user. Every record carries user_id, and every
// read is filtered to the current identity (see identity.ts), so one person never sees another's
// answers in a shared browser. Two stores:
//   current     the latest answer to each question in each quiz, per user (the quiz player's state;
//               Restart clears it). Key [user_id, quiz_id, question_id].
//   answer_log  every answer ever given, append-only, per user (the dashboard). Never cleared by Restart.
// Records mirror the user_answer table, so they sync to the server through /answer when signed in.
// Falls back to in-memory storage when IndexedDB is unavailable.
import {resolveIdentity} from "./identity.ts"

export type AnswerRecord = {user_id: string, quiz_id: string, question_type: string, question_id: string,
  answer: any[], points: number, correct: boolean, answered_at: string}

const DB_NAME = "enauto-quiz"
const VERSION = 10
const CURRENT = "current"
const LOG = "answer_log"
const LEGACY = ["quiz_answers", "answers"]
const memory = {current: new Map<string, AnswerRecord>(), log: [] as AnswerRecord[]}

const request = <T>(r: IDBRequest<T>) =>
  // Purpose: wrap an IndexedDB request in a promise
  new Promise<T>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })

const upgrade = (db: IDBDatabase, tx: IDBTransaction, ownerId: string) => {
  // Purpose: create the per-user stores and move older records into them, stamped with the current user
  const current = db.objectStoreNames.contains(CURRENT) ? tx.objectStore(CURRENT)
    : db.createObjectStore(CURRENT, {keyPath: ["user_id", "quiz_id", "question_id"]})
  if (!current.indexNames.contains("by_user_quiz")) current.createIndex("by_user_quiz", ["user_id", "quiz_id"])
  if (!current.indexNames.contains("by_user")) current.createIndex("by_user", "user_id")
  const log = db.objectStoreNames.contains(LOG) ? tx.objectStore(LOG) : db.createObjectStore(LOG, {autoIncrement: true})
  if (!log.indexNames.contains("by_user")) log.createIndex("by_user", "user_id")
  log.openCursor().onsuccess = e => {
    // Purpose: stamp log records made before answers were per-user
    const c = (e.target as IDBRequest<IDBCursorWithValue>).result
    if (!c) return
    if (!c.value.user_id) c.update({...c.value, user_id: ownerId})
    c.continue()
  }
  for (const name of LEGACY.filter(n => db.objectStoreNames.contains(n))) {
    tx.objectStore(name).getAll().onsuccess = e => {
      // Purpose: copy a legacy store's records into the current store, then drop the legacy store
      for (const r of (e.target as IDBRequest<any[]>).result) {
        const quiz_id = r.quiz_id ?? r.question_set_id
        if (quiz_id) current.put({...r, quiz_id, question_set_id: undefined, user_id: r.user_id ?? ownerId})
      }
      db.deleteObjectStore(name)
    }
  }
}

const open = (ownerId: string) =>
  // Purpose: open the database at the current version, upgrading it when needed
  new Promise<IDBDatabase | null>(resolve => {
    try {
      const r = indexedDB.open(DB_NAME, VERSION)
      r.onupgradeneeded = () => upgrade(r.result, r.transaction!, ownerId)
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => resolve(null)
      r.onblocked = () => resolve(null)
    } catch { resolve(null) }
  })

const reassign = async (db: IDBDatabase, from: string, to: string) => {
  // Purpose: move every record of one user id to another (an anonymous id joining an account)
  const tx = db.transaction([CURRENT, LOG], "readwrite")
  const current = tx.objectStore(CURRENT), log = tx.objectStore(LOG)
  for (const r of await request(current.index("by_user").getAll(from)) as AnswerRecord[]) {
    current.delete([r.user_id, r.quiz_id, r.question_id])
    current.put({...r, user_id: to})
  }
  log.index("by_user").openCursor(from).onsuccess = e => {
    // Purpose: re-stamp each log record of the old id
    const c = (e.target as IDBRequest<IDBCursorWithValue>).result
    if (c) { c.update({...c.value, user_id: to}); c.continue() }
  }
  await new Promise(done => { tx.oncomplete = done; tx.onerror = done })
}

let ready: Promise<{db: IDBDatabase | null, userId: string}> | undefined
const session = () => {
  // Purpose: once per page: resolve who we are, open storage, and fold an anonymous id into a new
  // account (then push everything that account has in this browser to the server)
  ready ??= (async () => {
    const {id, adopt} = resolveIdentity()
    const db = await open(adopt ?? id)
    if (db && adopt) {
      await reassign(db, adopt, id)
      const all = await request(db.transaction(LOG).objectStore(LOG).index("by_user").getAll(id))
      for (let i = 0; i < all.length; i += 500) await pushAnswers(all.slice(i, i + 500)).catch(() => false)
    }
    return {db, userId: id}
  })()
  return ready
}

export const currentUserId = async () =>
  // Purpose: the user id answers are being recorded under in this browser
  (await session()).userId

const store = async (name: string, mode: IDBTransactionMode) => {
  // Purpose: one object store plus the current user id; store is null when IndexedDB isn't usable
  const {db, userId} = await session()
  return {s: db ? db.transaction(name, mode).objectStore(name) : null, userId}
}

export const loadAnswers = async (quizId: string): Promise<AnswerRecord[]> => {
  // Purpose: the current user's current answers for one quiz
  const {s, userId} = await store(CURRENT, "readonly")
  return s ? request(s.index("by_user_quiz").getAll([userId, quizId]))
    : [...memory.current.values()].filter(r => r.user_id === userId && r.quiz_id === quizId)
}

export const saveAnswer = async (input: Omit<AnswerRecord, "user_id">) => {
  // Purpose: record an answer for the current user: current answer, history, and the server when signed in
  const {db, userId} = await session()
  const record: AnswerRecord = {...input, user_id: userId}
  if (db) {
    const tx = db.transaction([CURRENT, LOG], "readwrite")
    tx.objectStore(CURRENT).put(record)
    tx.objectStore(LOG).add(record)
    await new Promise(done => { tx.oncomplete = done })
  } else {
    memory.current.set(`${userId}/${record.quiz_id}/${record.question_id}`, record)
    memory.log.push(record)
  }
  pushAnswers([record]).catch(() => {}) // best effort; the dashboard's sync resends anything missed
}

export const clearAnswers = async (quizId: string) => {
  // Purpose: clear the current user's current answers for one quiz (the history keeps them)
  const {s, userId} = await store(CURRENT, "readwrite")
  if (!s) { for (const [k, r] of memory.current) if (r.user_id === userId && r.quiz_id === quizId) memory.current.delete(k); return }
  const keys = await request(s.index("by_user_quiz").getAllKeys([userId, quizId]))
  await Promise.all(keys.map(k => request(s.delete(k))))
}

const logKey = (r: {question_id: string, answered_at: string}) =>
  // Purpose: identify one answer event (the same key the server uses to ignore repeats)
  `${r.question_id}|${new Date(r.answered_at).toISOString()}`

const byTime = (a: AnswerRecord, b: AnswerRecord) =>
  // Purpose: order answers oldest first
  Date.parse(a.answered_at) - Date.parse(b.answered_at)

export const loadLog = async (): Promise<AnswerRecord[]> => {
  // Purpose: the current user's full answer history, first copying in current answers the log lacks
  const {db, userId} = await session()
  if (!db) return memory.log.filter(r => r.user_id === userId).sort(byTime)
  const logged: AnswerRecord[] = await request(db.transaction(LOG).objectStore(LOG).index("by_user").getAll(userId))
  const current: AnswerRecord[] = await request(db.transaction(CURRENT).objectStore(CURRENT).index("by_user").getAll(userId))
  const seen = new Set(logged.map(logKey))
  const missing = current.filter(r => !seen.has(logKey(r)))
  if (missing.length) {
    const tx = db.transaction(LOG, "readwrite")
    for (const r of missing) tx.objectStore(LOG).add(r)
    await new Promise(done => { tx.oncomplete = done })
  }
  return [...logged, ...missing].sort(byTime)
}

const pushAnswers = async (records: AnswerRecord[]) => {
  // Purpose: send answers to the server; only works for the signed-in user's own records
  if (!records.length || !document.body.dataset.userId) return false
  const r = await fetch("/answer", {method: "POST", headers: {"content-type": "application/json", accept: "application/json"}, body: JSON.stringify(records)})
  return r.ok
}

export const syncLog = async (): Promise<{answers: AnswerRecord[], synced: boolean}> => {
  // Purpose: merge the current user's history with the server's (both directions) when signed in
  const local = await loadLog()
  const {db, userId} = await session()
  if (!document.body.dataset.userId) return {answers: local, synced: false}
  const r = await fetch("/answer?format=json", {headers: {accept: "application/json"}}).catch(() => null)
  if (!r?.ok) return {answers: local, synced: false}
  const remote: AnswerRecord[] = (await r.json()).filter((a: AnswerRecord) => a.user_id === userId)
  const localKeys = new Set(local.map(logKey)), remoteKeys = new Set(remote.map(logKey))
  const toServer = local.filter(a => !remoteKeys.has(logKey(a)))
  for (let i = 0; i < toServer.length; i += 500) await pushAnswers(toServer.slice(i, i + 500))
  const fromServer = remote.filter(a => !localKeys.has(logKey(a)))
  if (db && fromServer.length) {
    const tx = db.transaction(LOG, "readwrite")
    for (const a of fromServer) tx.objectStore(LOG).add(a)
    await new Promise(done => { tx.oncomplete = done })
  } else memory.log.push(...fromServer)
  return {answers: [...local, ...fromServer].sort(byTime), synced: true}
}
