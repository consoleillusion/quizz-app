import {db} from "./db.ts"
import {loadSchema} from './loadSchema.ts'
import {getReasonPhrase} from 'http-status-codes'
import {httpMethods} from './httpMethods.ts'
import {kebabCase,snakeCase} from 'change-case'
import {mergeAll,keys} from 'ramda'
import { Elysia } from 'elysia'
import { Serializer } from 'ts-japi'

const columns = schema => '(' + keys(schema.properties).map(snakeCase).join(',') + ')'
const variables = schema => 'VALUES(' + keys(schema.properties).map(x=>'?').join(',') + ')'

/*
const operations = verb => resource => (
  { get: async resource => {
    const ResourceSerializer = new Serializer(resource.title)
    const res = ResourceSerializer(db.prepare(`SELECT * FROM ${snakeCase(resource.title)}`))
    return res
  }
  , put: r => 'db.prepare(`INSERT INTO ${snakeCase(schema.title)} ${columns(schema)} ${variables(schema)}`)'
  , post: r => 'db.prepare(`INSERT INTO ${snakeCase(schema.title)} ${columns(schema)} ${variables(schema)}`)'
  , delete: r => 'db.prepare(`DELETE FROM ${snakeCase(schema.title)} WHERE UUID = ? RETURNING *`)'
  , options: r => '{ status: 200, method: "OPTIONS", allowedMethods: verbs }'
  , head: r => 'db.prepare(`SELECT COUNT(*) AS count FROM ${snakeCase(schema.title)}`)'
  , patch: r => 'x' //db.prepare(`UPDATE ${snakeCase(schema.title)} SET ... WHERE UUID = ?`)
  })[verb]
 */

const resources = await loadSchema()
const server = new Elysia()

const resourceGet =
  resource => async req => {
    const ResourceSerializer = new Serializer(snakeCase(resource.title))
    const select = db.prepare(
    `SELECT * FROM ${snakeCase(resource.title)}_view`
    )

    //console.log(`SELECT * FROM ${snakeCase(resource.title)}`)
    //const x = Promise.all((await select.all()).map(async row => await ResourceSerializer.serialize(row)))
    const x = await ResourceSerializer.serialize(await select.all())
    const y = await (await select.all())
    console.log(y)
    console.log(x)
    return x
}

for (const resource of resources){
  server.get('/' + kebabCase(resource['title']), resourceGet(resource))
  server.put('/' + kebabCase(resource['title']), 'Hello Elysia')
  server.post('/' + kebabCase(resource['title']), 'Hello Elysia')
  server.delete('/' + kebabCase(resource['title']), 'Hello Elysia')
  server.options('/' + kebabCase(resource['title']), 'Hello Elysia')
  server.head('/' + kebabCase(resource['title']), 'Hello Elysia')
  server.patch('/' + kebabCase(resource['title']), 'Hello Elysia')
}

console.log('listening on 127.0.0.1:' + process.env.ELYSIA_PORT)
server.listen(process.env.ELYSIA_PORT)

      /*
    .get('/user/:id', ({ params: { id }}) => id)
    .post('/form', ({ body }) => body)
    .listen(process.env.ELYSIA_PORT)

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

    */
