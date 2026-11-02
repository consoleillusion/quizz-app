import {snakeCase} from 'change-case'
import {join} from "path"
import {trim,isNotEmpty,assoc,difference,keys,values,isEmpty} from 'ramda'

const toSQLColumnType = 
  s => ( s.type == 'string' && s.format == 'uuid' ? 'BLOB'
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
       : s.enum
       	 ? ( `CHECK (${column_name} IN (${s.enum.map(x=>"'"+x+"'").join(', ')}))`
	   )
       :   ''
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
( (Object.entries(schema['x-relations'] ?? {}).filter(([k,v])=>v.cardinality==="one").map( ([k,v]) =>
`${k}_id BLOB REFERENCES ${v.table || k}(id)`)
  )
)
.join('\n, ')
}
, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)
STRICT
`

const createRelations =
  resource => [resource].concat(Object.entries(resource["x-relations"] ?? {}).filter(([k,v])=>v.cardinality==="many").map(([k,v]) => (
  { $schema: "https://json-schema.org/draft/2020-12/schema"
  , title: 'Relation ' + [resource.title,(v.table || k)].sort().join(' ')
  , type: "object"
  , additionalProperties: false
  , description: `A relation between "${snakeCase(resource.title)}" and ${v.table || k}`
  , properties: []
  , "x-relations":
    { [v.table || k]: {cardinality:'one'}
    , [snakeCase(resource.title)]: {cardinality:'one'}
    }
  })))

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
    , createViews(resource)
    ]
const createViews = r => `
CREATE VIEW IF NOT EXISTS view_${r.dbTableName}_json AS
SELECT json_object(
    ${Object.keys(r.properties ?? {})
      .concat(['id', 'updated_at'])
      .map(k => `'${k}', ${k === 'id' ? `hex(${r.dbTableName}.${k})` : `${r.dbTableName}.${k}`}`)

      .concat(
        Object.entries(r['x-relations'] ?? {})
          .filter(([k, v]) => v.cardinality === 'many')
          .map(([k, v]) => {
            const table = v.table || k
            const relation = `relation_${[r.dbTableName, table].sort().join('_')}`

            return `'${k}', json((
        SELECT json_group_array(
          json_object(
            'id', hex(${table}.id),
            'name', ${table}.name,
            'kind', ${table}.kind
          )
        )
        FROM ${relation}
        JOIN ${table} ON ${table}.id = ${relation}.${k}_id
        WHERE ${relation}.${r.dbTableName}_id = ${r.dbTableName}.id
      ))`
          })
      )
      .join('\n    , ')}
) AS json
FROM ${r.dbTableName}`

const defaultTables =
  [ {title:"Table Schema",properties:{table_name:{type:"string"},jsonschema:{type: "object"}}}
  , {title:"User",properties:{username:{type:"string"},email:{type:"string",format:"email"}}}
  ]

export const jsonSchemaToSQL =
  schema => schema
  .concat(defaultTables)
  .flatMap(createRelations)
  .map(s => assoc('dbTableName',snakeCase(s.title),s))
  //.flatMap(createViews)
  .map(initTableSQL)
  .flat().map(trim).filter(isNotEmpty)
  .sort((a, b) => {
      const priority =
        sql => sql.includes('CREATE TABLE') && !sql.includes('REFERENCES') ? 0
             : sql.includes('CREATE TABLE') ? 1
             : sql.includes('CREATE VIEW') ? 2
             : sql.includes('CREATE TRIGGER') ? 3
             : sql.includes('INSERT INTO') ? 4
	     : 5;
      return priority(a) - priority(b);
  })


/*
 */
