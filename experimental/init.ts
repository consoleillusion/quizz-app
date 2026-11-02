import {db} from "./db.ts"
import {loadSchema} from './loadSchema.ts'
import {jsonSchemaToSQL} from './jsonSchemaToSQL/index.ts'
import {join} from "path"

const cmds = jsonSchemaToSQL(await loadSchema(join(import.meta.dirname, "./schema")))
const results = await db.batch(cmds, "write")
/*
console.log(cmds.join(';\n\n'))
console.log(x)
console.log(await loadSchema(join(import.meta.dirname, "./schema")))
*/
