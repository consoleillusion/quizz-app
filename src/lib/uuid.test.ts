import {expect, test} from "bun:test"
import {connect} from "@tursodatabase/database"
import {isUuidV7, uuidv7, uuidv7Time} from "./uuid.ts"

test("generates distinct, valid v7 ids with the current time", () => {
  const now = Date.now()
  const ids = Array.from({length: 1000}, () => uuidv7(now))
  expect(new Set(ids).size).toBe(1000)
  expect(ids.every(id => isUuidV7(id))).toBe(true)
  expect(uuidv7Time(ids[0])).toBe(now)
})

test("rejects other versions, bad variants, malformed and implausible ids", () => {
  expect(isUuidV7("6ba7b811-9dad-11d1-80b4-00c04fd430c8")).toBe(false) // v1
  expect(isUuidV7("bb5ef3a8-68cd-5fa8-85b2-a074ba550112")).toBe(false) // v5
  expect(isUuidV7(uuidv7().replace(/-[89ab]/, "-c"))).toBe(false)       // variant
  expect(isUuidV7(uuidv7().toUpperCase())).toBe(false)
  expect(isUuidV7("not-a-uuid")).toBe(false)
  expect(isUuidV7(uuidv7(Date.UTC(2010, 0, 1)))).toBe(false)
  expect(isUuidV7(uuidv7(Date.now() + 7 * 86_400_000))).toBe(false)
})

test("the database reads the same timestamp from a client-made id", async () => {
  const db = await connect(":memory:", {experimental: ["custom_types"]})
  await db.exec("CREATE TABLE t (id uuid PRIMARY KEY) STRICT")
  const id = uuidv7()
  await db.prepare("INSERT INTO t VALUES (?)").run([id])
  const row = await db.prepare("SELECT id, uuid7_timestamp_ms(id) AS ms FROM t").get()
  expect(row.id).toBe(id)
  expect(row.ms).toBe(uuidv7Time(id))
})
