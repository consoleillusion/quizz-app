import { connect as connectRemote } from "@tursodatabase/serverless"
import { remote } from "./remote.ts"

const options = {
  experimental: ["views", "custom_types", "encryption", "vacuum"],
}

export const open = async (path: string = process.env.DB_PATH ?? ".db") => {
  // Purpose: open the remote Turso database when configured, otherwise the local file
  if (process.env.DB_URL) {
    const connection = connectRemote({
      url: process.env.DB_URL,
      authToken: process.env.DB_AUTH_TOKEN,
    })
    await connection.exec("PRAGMA foreign_keys = ON")
    return remote(connection)
  }
  const { connect: connectLocal } = await import("@tursodatabase/database")
  const db = await connectLocal(path, options)
  await db.exec("PRAGMA foreign_keys = ON")
  return db
}

export const db = await open()
