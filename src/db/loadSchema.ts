import $RefParser from "@apidevtools/json-schema-ref-parser"
import { join } from "path"

export const schemaDir = join(import.meta.dirname, "schema")

export async function loadSchema(directory: string = schemaDir) {
  // Purpose: read and dereference every table schema (top-level *.yml) in the schema folder
  const files = (
    await Array.fromAsync(new Bun.Glob("*.yml").scan({ cwd: directory, onlyFiles: true }))
  ).sort()
  return Promise.all(
    files.map(file =>
      $RefParser.dereference(join(directory, file), {
        dereference: { circular: "ignore" },
      })
    )
  )
}
