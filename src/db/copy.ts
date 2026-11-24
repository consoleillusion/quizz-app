export const statementsFor = (table: string, columns: string[], rows: any[]) =>
  // Purpose: turn local rows into replacement inserts for the remote driver's batch()
  rows.map(row => ({
    sql: `INSERT OR REPLACE INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    args: columns.map(column => row[column]),
  }))
