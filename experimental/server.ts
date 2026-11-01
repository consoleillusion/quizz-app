import {db} from "./db.ts"
import {loadSchema} from './loadSchema.ts'
import {getReasonPhrase} from 'http-status-codes'
import {httpMethods} from './httpMethods.ts'
import {snakeCase} from 'change-case'
import {mergeAll,keys} from 'ramda'
import { Elysia } from 'elysia'

/*
new Elysia()
    .get('/', 'Hello Elysia')
    .get('/user/:id', ({ params: { id }}) => id)
    .post('/form', ({ body }) => body)
    .listen(process.env.ELYSIA_PORT)
   */

const columns = schema => '(' + keys(schema.properties).map(snakeCase).join(',') + ')'
const variables = schema => {
const x = 'VALUES(' + keys(schema.properties).map(x=>'?').join(',') + ')'
console.log(x)
return x
}

const operations = ({ schema, verbs, verb }) => (
  { get: 'db.prepare(`SELECT * FROM ${snakeCase(schema.title)}`)'
  , put: 'db.prepare(`INSERT INTO ${snakeCase(schema.title)} ${columns(schema)} ${variables(schema)}`)'
  , post: 'db.prepare(`INSERT INTO ${snakeCase(schema.title)} ${columns(schema)} ${variables(schema)}`)'
  , delete: 'db.prepare(`DELETE FROM ${snakeCase(schema.title)} WHERE UUID = ? RETURNING *`)'
  , options: '{ status: 200, method: "OPTIONS", allowedMethods: verbs }'
  , head: 'db.prepare(`SELECT COUNT(*) AS count FROM ${snakeCase(schema.title)}`)'

    /*
  , patch: 'x' //db.prepare(`UPDATE ${snakeCase(schema.title)} SET ... WHERE UUID = ?`)
*/

  })[verb]

const toPaths =
  ({schema, verbs=['get','put','post','patch','delete','options','head']}) => 
    ({['/'+snakeCase(schema.title)]: verbs
    .reduce(
        (acc,verb) => {
          acc[verb] = 
          { summary: httpMethods[verb].description + ': ' + schema.title
          , responses: httpMethods[verb].responses.reduce((a,c)=> {a[c.code] = { description: c.reason + ': ' + schema.title}; return a},{})
          , operationId: operations({schema,verbs,verb})
          }
          return acc
        }
    ,{})})
  
const paths = mergeAll((await loadSchema()).map(s=>toPaths({schema:s})))
console.log(JSON.stringify(paths))

      /*
    */
