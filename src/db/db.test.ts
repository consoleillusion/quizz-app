import { expect, test } from "bun:test"
import { remote } from "./remote.ts"

const connection = {
  // Purpose: stand in for the serverless driver's async prepare result
  prepare: (sql: string) =>
    Promise.resolve({
      all: async (args: any[]) => args,
      get: async (args: any[]) => args[0],
      run: async (args: any[]) => ({ rowsAffected: args.length }),
    }),
  exec: async (sql: string) => sql,
  batch: async (sqls: any[], mode?: string) => ({ sqls, mode }),
}

test("the remote driver keeps the local prepare/get/all/run shape", async () => {
  const db = remote(connection as any)
  const statement = db.prepare("SELECT ?")
  expect(await statement.all([1, 2])).toEqual([1, 2])
  expect(await statement.get([7])).toEqual(7)
  expect(await statement.get([])).toBeNull()
  expect(await statement.run([1])).toEqual({ rowsAffected: 1 })
  expect(await db.exec("PRAGMA foreign_keys = ON")).toBe("PRAGMA foreign_keys = ON")
  expect(await db.batch(["SELECT 1"], "write")).toEqual({ sqls: ["SELECT 1"], mode: "write" })
})
