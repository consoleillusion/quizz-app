//import {createClient} from "@libsql/client/web"
import {db} from "./db.ts"

import {loadSchema} from './loadSchema.ts'
import {snakeCase} from 'change-case'
import {join} from "path"
import {difference,keys,values,isEmpty} from 'ramda'

const toSQLColumn =
  ([column_name, x]) =>
        [ snakeCase(column_name)

        , x.type == 'string' && x.format == 'uuid' ? 'uuid'
        : x.type == 'string' && x.format == 'date-time' ? 'timestamp'
        : x.type == 'string' ? 'TEXT'
        : x.type == 'integer' ? 'INTEGER'
        : x.type == 'number' ? 'REAL'
        : x.type == 'boolean' ? 'boolean'
        : x.type == 'object' ? 'BLOB'//'jsonb'
        : x.type == 'array' ? 'BLOB'//'jsonb'
        : 'TEXT'

        , x.default ? `DEFAULT '${x.default}'`
        : x.default === '' ? `DEFAULT ''`
        : x.default === false ? `DEFAULT '0'`
        : x.default === 0 ? `DEFAULT 0`
        : ''

        /* String */
        , x.type === 'string'
          ? ( x.minLength && x.maxLength
            ? `CHECK (LENGTH(${column_name}) BETWEEN ${x.minLength} AND ${x.maxLength})`
            : x.minLength
            ? `CHECK (LENGTH(${column_name}) >= ${x.minLength})`
            : x.maxLength
            ? `CHECK (LENGTH(${column_name}) <= ${x.maxLength})`
            : ''
            )
        : x.type === "number"
          ? ( x.min && x.max
            ? `CHECK (${column_name} BETWEEN ${x.min} AND ${x.max})`
            : x.minLength
            ? `CHECK (${column_name} >= ${x.min})`
            : x.maxLength
            ? `CHECK (${column_name} <= ${x.max})`
            : ''
            )
        : ''
      /*&& isEmpty(difference(['minLength','maxLength'],keys(x)))
          ? `CHECK (LENGTH(${column_name}) BETWEEN ${x.minLength} AND ${x.maxLength})`
          : ''

        , (x.type === 'number' || x.type === 'integer') && isEmpty(difference(['min','max'],keys(x)))
          ? `CHECK ((${column_name}) BETWEEN ${x.min} AND ${x.max})`
          : x.min ? `CHECK (LENGTH(${column_name}) >= ${x.min})`
          : x.max ? `CHECK (LENGTH(${column_name}) <= ${x.max})`
          : ''
         */

        /* Number */
        /*
      Object.keys(x).includes('minLength')
          ? `CHECK (${column_name} >= ${x.min})`
          ? `CHECK (${column_name} >= ${x.min})`
        , x.minLength ? `CHECK (LENGTH(${column_name}) >= ${x.minLength})`
        , x.maxLength ? `CHECK (LENGTH(${column_name}) <= ${x.maxLength})`
        : ''
       */

        ].filter(y => y !== "").join(' ')
/*
       */

const createTableSQL =
  schema =>
    [ 'CREATE TABLE IF NOT EXISTS'
    , snakeCase(schema.title)
    + '('
    + [ 'uuid BLOB PRIMARY KEY DEFAULT (uuid7())'
      , Object.entries(schema.properties).map(toSQLColumn).join(', ')
      , 'updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP'
      ].filter(x => x !== "").join(', ')
    + ')'
    , 'STRICT'
    ].filter(x => x !== "").join(' ')
const createTriggerSQL =
  schema => 
    `CREATE TRIGGER IF NOT EXISTS ${snakeCase(schema.title)}_modified
AFTER UPDATE ON ${snakeCase(schema.title)}
FOR EACH ROW
BEGIN
    UPDATE ${snakeCase(schema.title)}
    SET updated_at = CURRENT_TIMESTAMP
    WHERE uuid = OLD.uuid;
END`
const createMetaSQL =
  schema => 
    [ `INSERT INTO table_schema ('table_name', 'jsonschema')`
    , `VALUES ('${snakeCase(schema.title)}', jsonb('${JSON.stringify(schema).replace(/'/g,"''")}'))`
    ].join(' ')


const initTableSQL =
  schema =>
    [ createTableSQL(schema)
    , createTriggerSQL(schema)
    , createMetaSQL(schema)
    ]

const cmds =
  (await loadSchema(join(import.meta.dirname, "./schema")))
  .concat({title:"Table Schema",properties:{table_name:{type:"string"},jsonschema:{type: "object"}}})
  .map(initTableSQL)
  .flat() 
  .sort((a, b) => Number(b.includes('CREATE TABLE')) - Number(a.includes('CREATE TABLE')))

const results = await db.batch(cmds, "write")
/*
console.log(JSON.stringify(results))
 */
  /*
*/
