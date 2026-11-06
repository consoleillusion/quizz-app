// Tag helpers shared by server and browser. Tags are {type, name, description}, with names
// namespaced from the vendor down: cisco, cisco:300-435, cisco:300-435:5.0, cisco:300-435:5.4.
import { find, last, propEq, split } from "ramda"

export type Tag = {
  id?: string
  type: string
  name: string
  description?: string
}

export const tagTypes = [
  "exam",
  "domain",
  "objective",
  "topic",
  "generic",
  "vendor",
] as const

export const ofType =
  (type: string) =>
  (tags: Tag[] = []) =>
    // Purpose: the first of a question's or quiz's tags with the given type
    find(propEq(type, "type"), tags) as Tag | undefined

export const number = (tag?: Tag) =>
  // Purpose: the last segment of a namespaced tag name, e.g. "5.4" from cisco:300-435:5.4
  tag ? (last(split(":", tag.name)) as string) : ""

export const label = (tag: Tag) =>
  // Purpose: how a tag reads in menus and summaries
  tag.type === "domain" || tag.type === "objective"
    ? `${number(tag)} ${tag.description ?? ""}`.trim()
    : tag.type === "exam" || tag.type === "vendor"
      ? tag.description || tag.name
      : tag.name
