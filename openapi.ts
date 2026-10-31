import {db} from "./src/db/db.ts"
import {loadSchema} from './src/db/loadSchema.ts'
import {getReasonPhrase} from 'http-status-codes'
import {httpMethods} from './httpMethods.ts'
import {snakeCase} from 'change-case'
import {mergeAll,keys} from 'ramda'

const columns = schema => '(' + keys(schema.properties).map(snakeCase).join(',') + ')'
const variables = schema => {
const x = 'VALUES(' + keys(schema.properties).map(x=>'?').join(',') + ')'
console.log(x)
return x
}

const operations = ({ schema, verbs, verb }) => (
  { get: db.prepare(`SELECT * FROM ${snakeCase(schema.title)}`)
  , put: db.prepare(`INSERT INTO ${snakeCase(schema.title)} ${columns(schema)} ${variables(schema)}`)
  , post: db.prepare(`INSERT INTO ${snakeCase(schema.title)} ${columns(schema)} ${variables(schema)}`)
  , delete: db.prepare(`DELETE FROM ${snakeCase(schema.title)} WHERE UUID = ? RETURNING *`)
  , options: { status: 200, method: "OPTIONS", allowedMethods: verbs }
  , head: db.prepare(`SELECT COUNT(*) AS count FROM ${snakeCase(schema.title)}`)
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
  
const x =
  { openapi: '3.0.0'
  , servers: [ { url: 'http://petstore.swagger.io/v2' } ]
  , info:
    { description: 'This is a sample server Petstore server. For this sample, you can use the api key `special-key` to test the authorization filters.'
    , version: '1.0.0'
    , title: 'OpenAPI Petstore'
    , license:
      { name: 'Apache-2.0'
      , url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    }
  , tags:
    [ { name: 'quiz', description: 'Everything about quizes' }
    , { name: 'user', description: 'Operations about user' }
    ]
  , paths: mergeAll((await loadSchema()).map(s=>toPaths({schema:s})))
  , externalDocs:
    { description: 'Find out more about Swagger'
    , url: 'http://swagger.io'
    }
  , components:
    { requestBodies: { UserArray: '[Object]', Pet: '[Object]' }
    , securitySchemes: { petstore_auth: '[Object]', api_key: '[Object]' }
    //, schemas: schemas
    }
  }
      /*
console.log(JSON.stringify(x.paths))
    paths: {
      '/pet': { post: [Object], put: [Object] },
      '/pet/findByStatus': { get: [Object] },
      '/pet/findByTags': { get: [Object] },
      '/pet/{petId}': { get: [Object], post: [Object], delete: [Object] },
      '/pet/{petId}/uploadImage': { post: [Object] },
      '/store/inventory': { get: [Object] },
      '/store/order': { post: [Object] },
      '/store/order/{orderId}': { get: [Object], delete: [Object] },
      '/user': { post: [Object] },
      '/user/createWithArray': { post: [Object] },
      '/user/createWithList': { post: [Object] },
      '/user/login': { get: [Object] },
      '/user/logout': { get: [Object] },
      '/user/{username}': { get: [Object], put: [Object], delete: [Object] }
    },
    */
