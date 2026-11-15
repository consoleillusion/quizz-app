import { connect } from "@tursodatabase/database"

const options = {
  experimental: ["views", "custom_types", "encryption", "vacuum"],
}

export const open = async (path: string = process.env.DB_PATH ?? ".db") => {
  // Purpose: open the database with foreign key enforcement switched on
  const db = await connect(path, options)
  await db.exec("PRAGMA foreign_keys = ON")
  return db
}

export const db = await open()
