import type { connect } from "@tursodatabase/serverless"

// Purpose: adapt the async HTTP driver to the sync-prepare shape the rest of the app uses
export const remote = (connection: ReturnType<typeof connect>) => ({
  // Purpose: keep prepare() synchronous for callers that chain .all()/.get()/.run()
  prepare: (sql: string) => {
    const statement = connection.prepare(sql)
    return {
      all: async (args: any[] = []) => (await statement).all(args),
      get: async (args: any[] = []) => (await (await statement).get(args)) ?? null,
      run: async (args: any[] = []) => (await statement).run(args),
    }
  },
  exec: (sql: string) => connection.exec(sql),
  batch: (sqls: any[], mode?: string) => connection.batch(sqls, mode),
})
