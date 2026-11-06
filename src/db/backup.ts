// Write a consistent copy of the database to backups/<timestamp>.db (safe while the server runs).
//   bun src/db/backup.ts [directory]
import { mkdirSync } from "fs"
import { join } from "path"

export const backup = async (db: any, directory = "backups") => {
  // Purpose: copy the live database to a timestamped file with VACUUM INTO and return its path
  mkdirSync(directory, { recursive: true })
  const path = join(directory, `${new Date().toISOString().replace(/[:.]/g, "-")}.db`)
  await db.exec(`VACUUM INTO '${path.replaceAll("'", "''")}'`)
  return path
}

if (import.meta.main) {
  const { db } = await import("./db.ts")
  console.log(`Backed up to ${await backup(db, Bun.argv[2])}`)
}
