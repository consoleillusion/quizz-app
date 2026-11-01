//import {createClient} from "@libsql/client/web"
import {db} from "./db.ts"

import {loadSchema} from './loadSchema.ts'
import {snakeCase} from 'change-case'
import {join} from "path"
import {trim,isNotEmpty,assoc,difference,keys,values,isEmpty} from 'ramda'

const toSQLColumnType = 
  s => ( s.type == 'string' && s.format == 'uuid' ? 'uuid'
       : s.type == 'string' && s.format == 'date-time' ? 'timestamp'
       : s.type == 'string' ? 'TEXT'
       : s.type == 'integer' ? 'INTEGER'
       : s.type == 'number' ? 'REAL'
       : s.type == 'boolean' ? 'boolean'
       : s.type == 'object' ? 'BLOB'//'jsonb'
       : s.type == 'array' ? 'BLOB'//'jsonb'
       : 'TEXT'
       )

const toSQLDefault =
  s => ( s.default ? `DEFAULT '${s.default}'`
       : s.default === '' ? `DEFAULT ''`
       : s.default === false ? `DEFAULT '0'`
       : s.default === 0 ? `DEFAULT 0`
       : ''
       )

const toSQLCheck =
  (s,column_name) =>
       ( s.type === 'string'
       ? ( s.minLength && s.maxLength
         ? `CHECK (LENGTH(${column_name}) BETWEEN ${s.minLength} AND ${s.maxLength})`
         : s.minLength
         ? `CHECK (LENGTH(${column_name}) >= ${s.minLength})`
         : s.maxLength
         ? `CHECK (LENGTH(${column_name}) <= ${s.maxLength})`
         : ''
         )
       : s.type === "number"
         ? ( s.min && s.max
           ? `CHECK (${column_name} BETWEEN ${s.min} AND ${s.max})`
           : s.minLength
           ? `CHECK (${column_name} >= ${s.min})`
           : s.maxLength
           ? `CHECK (${column_name} <= ${s.max})`
           : ''
           )

       : ''
       )

const toSQLColumn =
  ([column_name, s]) =>
  	[ snakeCase(column_name)
	, toSQLColumnType(s)
	, toSQLDefault(s)
	, toSQLCheck(s,column_name)
        ].filter(y => y !== "").join(' ')

const createTableSQL =
  schema =>  `
CREATE TABLE IF NOT EXISTS ${schema.dbTableName}
( id BLOB PRIMARY KEY DEFAULT (uuid7())
, ${ Object.entries(schema['properties']).map(toSQLColumn).concat
( (Object.entries(schema['x-relations'] || [])).map( ([k,v]) =>
`${k}_id BLOB
, FOREIGN KEY (${k}_id) REFERENCES ${v.table || k}(id)`)
)
.join('\n, ')
}
, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)
STRICT
`

    //, createRelations(resource)	    

const createRelations =
  schema => ''

const createTriggerSQL =
  schema => `
CREATE TRIGGER IF NOT EXISTS ${schema.dbTableName}_modified
AFTER UPDATE ON ${schema.dbTableName}
FOR EACH ROW
BEGIN
    UPDATE ${schema.dbTableName}
    SET updated_at = CURRENT_TIMESTAMP
    WHERE uuid = OLD.uuid;
END`

const createMetaSQL =
  schema => 
    [ `INSERT INTO table_schema ('table_name', 'jsonschema')`
    , `VALUES ('${schema.dbTableName}', jsonb('${JSON.stringify(schema).replace(/'/g,"''")}'))`
    ].join(' ')

const initTableSQL =
  resource =>
    [ createTableSQL(resource)
    , createTriggerSQL(resource)
    , createMetaSQL(resource)
    ]

const defaultTables =
  [ {title:"Table Schema",properties:{table_name:{type:"string"},jsonschema:{type: "object"}}}
  , {title:"User",properties:{username:{type:"string"},email:{type:"string",format:"email"}}}
  ]

const cmds =
  (await loadSchema(join(import.meta.dirname, "./schema")))
  .concat(defaultTables)
  .map(s => assoc('dbTableName',snakeCase(s.title),s))
  .map(initTableSQL)
  .flat().map(trim).filter(isNotEmpty)
  .sort((a, b) => {
      const priority =
        sql => sql.includes('CREATE TABLE') && !sql.includes('FOREIGN') ? 0
             : sql.includes('CREATE TABLE') ? 1
             : sql.includes('CREATE TRIGGER') ? 2
             : sql.includes('INSERT INTO') ? 3
	     : 4;
      return priority(a) - priority(b);
  })
  //.sort((a, b) => Number(b.includes('CREATE TABLE')) - Number(a.includes('CREATE TABLE')))

console.log(cmds.join(';\n\n'))
/*
const results = await db.batch(cmds, "write")
 */
