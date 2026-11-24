import { expect, test } from "bun:test"
import { statementsFor } from "./copy.ts"

test("copy statements bind every column in order", () => {
  const [first, second] = statementsFor("tag", ["id", "name"], [
    { id: "a", name: "one" },
    { id: "b", name: "two" },
  ])
  expect(first.sql).toBe("INSERT OR REPLACE INTO tag (id, name) VALUES (?, ?)")
  expect(first.args).toEqual(["a", "one"])
  expect(second.args).toEqual(["b", "two"])
})
