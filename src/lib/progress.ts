// Browser-side answer storage in IndexedDB. Records mirror the user_answer table
// (minus user_id) so they can be synced to the server later.
// Falls back to an in-memory map when IndexedDB is unavailable (private mode, blocked storage).

export type AnswerRecord = {question_set_id: string, question_type: string, question_id: string,
  answer: any[], points: number, correct: boolean, answered_at: string}

const DB_NAME = "enauto-quiz"
const STORE = "answers"
const memory = new Map<string, AnswerRecord>()

const request = <T>(r: IDBRequest<T>) =>
  // Purpose: wrap an IndexedDB request in a promise
  new Promise<T>((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error) })

let opening: Promise<IDBDatabase | null> | undefined

const openVersion = (version?: number) =>
  // Purpose: open the database, creating the answers store whenever an upgrade runs
  new Promise<IDBDatabase | null>(resolve => {
    try {
      const r = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME)
      r.onupgradeneeded = () => {
        if (r.result.objectStoreNames.contains(STORE)) return
        const store = r.result.createObjectStore(STORE, {keyPath: ["question_set_id", "question_id"]})
        store.createIndex("by_set", "question_set_id")
      }
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => resolve(null)
    } catch { resolve(null) }
  })

const openDb = () => {
  // Purpose: open the answers store once per page, repairing a database that lacks it
  opening ??= openVersion().then(db => {
    if (!db || db.objectStoreNames.contains(STORE)) return db
    const next = db.version + 1
    db.close()
    return openVersion(next)
  })
  return opening
}

const store = async (mode: IDBTransactionMode) => {
  // Purpose: get the answers object store, or null when IndexedDB isn't usable
  const db = await openDb()
  return db ? db.transaction(STORE, mode).objectStore(STORE) : null
}

export const loadAnswers = async (setId: string): Promise<AnswerRecord[]> => {
  // Purpose: read every saved answer for one question set
  const s = await store("readonly")
  return s ? request(s.index("by_set").getAll(setId)) : [...memory.values()].filter(r => r.question_set_id === setId)
}

export const saveAnswer = async (record: AnswerRecord) => {
  // Purpose: save or replace the answer to one question in one set
  const s = await store("readwrite")
  if (s) await request(s.put(record))
  else memory.set(`${record.question_set_id}/${record.question_id}`, record)
}

export const clearAnswers = async (setId: string) => {
  // Purpose: delete every saved answer for one question set
  const s = await store("readwrite")
  if (!s) { for (const [k, r] of memory) if (r.question_set_id === setId) memory.delete(k); return }
  const keys = await request(s.index("by_set").getAllKeys(setId))
  await Promise.all(keys.map(k => request(s.delete(k))))
}
