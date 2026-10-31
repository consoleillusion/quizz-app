import Ajv2020 from "ajv/dist/2020.js"
import addFormats from "ajv-formats"
import {tableName} from "./ddl.ts"

export const extensionKeywords = ["x-references", "x-unique", "x-question-type"]

export const makeValidators = (schemas: any[]) => {
  // Purpose: compile one ajv validator per table, keyed by table name
  const ajv = new Ajv2020({allErrors: true, strict: true, useDefaults: false})
  addFormats(ajv)
  ajv.addVocabulary(extensionKeywords)
  return Object.fromEntries(schemas.map(schema => [tableName(schema), ajv.compile(schema)]))
}

export const errorText = (errors: any[] = []) =>
  // Purpose: flatten ajv errors into one readable line
  errors.map(e => `${e.instancePath || "/"} ${e.message}`).join("; ")
