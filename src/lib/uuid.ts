// UUIDv7, the same id type the database generates (uuid7()). Shared by browser and server.
// Uses crypto.getRandomValues, which (unlike crypto.randomUUID) works on plain-http LAN pages.

const V7 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const DAY = 86_400_000
const EARLIEST = Date.UTC(2020, 0, 1)

export const uuidv7 = (now = Date.now()) => {
  // Purpose: a new UUIDv7: 48-bit millisecond timestamp, version 7, variant 10, 74 random bits
  const b = crypto.getRandomValues(new Uint8Array(16))
  for (let i = 0; i < 6; i++) b[i] = Math.floor(now / 2 ** (8 * (5 - i))) & 0xff
  b[6] = (b[6] & 0x0f) | 0x70
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = [...b].map((x) => x.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export const uuidv7Time = (id: string) =>
  // Purpose: the millisecond timestamp embedded in a UUIDv7
  parseInt(id.replace(/-/g, "").slice(0, 12), 16)

export const isUuidV7 = (id: unknown, now = Date.now()): id is string =>
  // Purpose: true for a lower-case UUIDv7 whose timestamp is after 2020 and not more than a day in the future
  typeof id === "string" &&
  V7.test(id) &&
  uuidv7Time(id) >= EARLIEST &&
  uuidv7Time(id) <= now + DAY
