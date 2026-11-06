// Pure functions that turn table JSON Schemas into SQL. No database access here.
//
// Every table gets three generated columns that are not in its schema:
//   id uuid PRIMARY KEY (uuid7), created_at and updated_at timestamps.
// Column constraints come from the schema: required -> NOT NULL, default, enum,
// minLength/maxLength, minimum/maximum, minItems/maxItems and JSON array/object
// shape become CHECKs. Patterns, formats and item-level rules are left to ajv.
// Extension keywords:
//   x-references: <table>      foreign key to <table>(id)
//   x-unique: [[col, ...], ...] table-level UNIQUE constraints
//   x-question-type: <name>    marks a question table; feeds the question view
import { snakeCase } from "change-case"
import { chain, filter, has, isNotNil, pipe, prop, toPairs, uniq } from "ramda"

const nonEmpty = filter(Boolean) as (xs: string[]) => string[]

export const tableName = pipe(prop("title"), snakeCase) as (schema: any) => string

export const isQuestionTable = has("x-question-type")

const sqlString = (s: string) =>
  // Purpose: quote a value as an SQL string literal
  `'${String(s).replaceAll("'", "''")}'`

export const sqlLiteral = (v: unknown): string | number =>
  // Purpose: render a JSON Schema default as an SQL literal
  typeof v === "boolean"
    ? v
      ? 1
      : 0
    : typeof v === "number"
      ? v
      : typeof v === "string"
        ? sqlString(v)
        : sqlString(JSON.stringify(v))

export const columnType = (x: any) =>
  // Purpose: map a JSON Schema property to a Turso column type
  x.format === "uuid"
    ? "uuid"
    : x.format === "date-time"
      ? "timestamp"
      : ((
          {
            string: "TEXT",
            integer: "INTEGER",
            number: "REAL",
            boolean: "boolean",
            object: "jsonb",
            array: "jsonb",
          } as any
        )[x.type] ?? "TEXT")

export const columnChecks = (name: string, x: any) =>
  // Purpose: list the CHECK expressions a property's constraints imply
  nonEmpty([
    x.enum ? `${name} IN (${x.enum.map(sqlLiteral).join(", ")})` : "",
    x.type === "string" && isNotNil(x.minLength) ? `length(${name}) >= ${x.minLength}` : "",
    x.type === "string" && isNotNil(x.maxLength) ? `length(${name}) <= ${x.maxLength}` : "",
    ["integer", "number"].includes(x.type) && isNotNil(x.minimum) ? `${name} >= ${x.minimum}` : "",
    ["integer", "number"].includes(x.type) && isNotNil(x.maximum) ? `${name} <= ${x.maximum}` : "",
    x.type === "array" ? `json_type(${name}) = 'array'` : "",
    x.type === "object" ? `json_type(${name}) = 'object'` : "",
    x.type === "array" && isNotNil(x.minItems) ? `json_array_length(${name}) >= ${x.minItems}` : "",
    x.type === "array" && isNotNil(x.maxItems) ? `json_array_length(${name}) <= ${x.maxItems}` : "",
  ])

export const columnSQL =
  (required: string[]) =>
  ([name, x]: [string, any]) => {
    // Purpose: render one column definition from a schema property
    const isRequired = required.includes(name)
    const checks = columnChecks(name, x)
    return nonEmpty([
      name,
      columnType(x),
      isRequired ? "NOT NULL" : "",
      // Nullable columns need an explicit DEFAULT NULL: Turso fills omitted uuid columns with a random UUID.
      has("default", x) ? `DEFAULT ${sqlLiteral(x.default)}` : isRequired ? "" : "DEFAULT NULL",
      checks.length ? `CHECK (${checks.join(" AND ")})` : "",
      x["x-references"]
        ? `REFERENCES ${x["x-references"]}(id) ON DELETE ${isRequired ? "CASCADE" : "SET NULL"}`
        : "",
    ]).join(" ")
  }

export const createTableSQL = (schema: any) => {
  // Purpose: render CREATE TABLE for one schema, including generated id and timestamp columns
  const name = tableName(schema)
  const props = toPairs(schema.properties ?? {}) as [string, any][]
  const lines = [
    "id uuid PRIMARY KEY DEFAULT (uuid7())",
    ...props.map(columnSQL(schema.required ?? [])),
    "created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP",
    "updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP",
    ...(schema["x-unique"] ?? []).map((cols: string[]) => `UNIQUE (${cols.join(", ")})`),
  ]
  return `CREATE TABLE IF NOT EXISTS ${name} (\n  ${lines.join(",\n  ")}\n) STRICT`
}

export const updatedAtTriggerSQL = (schema: any) => {
  // Purpose: render the trigger that bumps updated_at on every update
  const name = tableName(schema)
  return `CREATE TRIGGER IF NOT EXISTS ${name}_updated_at AFTER UPDATE ON ${name}
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE ${name} SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END`
}

const questionColumns = ["text", "exhibit", "explanation"]

export const questionViewSQL = (schemas: any[]) =>
  // Purpose: render a view that unions the shared columns of every question table
  `CREATE VIEW IF NOT EXISTS question AS\n` +
  schemas
    .filter(isQuestionTable)
    .map(
      s =>
        `SELECT id, ${sqlString(s["x-question-type"])} AS question_type, ${questionColumns.join(", ")} FROM ${tableName(s)}`
    )
    .join("\nUNION ALL\n")

export const quizMemberSQL = () =>
  // Purpose: render a view of every quiz's questions: chosen explicitly (with a position) or matched by its tag rules
  `CREATE VIEW IF NOT EXISTS quiz_member AS
SELECT quiz_id, question_type, question_id, min(position) AS position
FROM
  ( SELECT quiz_id, question_type, question_id, position FROM quiz_question
    UNION ALL
    SELECT r.quiz_id, qt.question_type, qt.question_id, NULL
    FROM quiz_rule r
    JOIN quiz z ON z.id = r.quiz_id
    JOIN question_tag qt ON qt.tag_id = r.tag_id
    GROUP BY r.quiz_id, qt.question_type, qt.question_id
    HAVING z.rule_match = 'any' OR count(DISTINCT r.tag_id) = (SELECT count(*) FROM quiz_rule r2 WHERE r2.quiz_id = r.quiz_id)
  )
GROUP BY quiz_id, question_type, question_id`

export const quizSummarySQL = () =>
  // Purpose: render a view of each quiz with its question count (explicit and rule-matched)
  `CREATE VIEW IF NOT EXISTS quiz_summary AS
SELECT s.id, s.slug, s.title, s.description, s.exam, s.difficulty, count(m.question_id) AS question_count
FROM quiz s LEFT JOIN quiz_member m ON m.quiz_id = s.id
GROUP BY s.id`

const refersToQuestions = (schema: any) =>
  // Purpose: true when a table points at a question through question_type + question_id
  has("question_type", schema.properties ?? {}) && has("question_id", schema.properties ?? {})

export const questionRefTriggersSQL = (schema: any) => {
  // Purpose: enforce the polymorphic question_type/question_id reference, which a plain FK can't express
  const name = tableName(schema)
  const guard = (
    event: string
  ) => `CREATE TRIGGER IF NOT EXISTS ${name}_question_exists_${event.split(" ")[0].toLowerCase()}
BEFORE ${event} ON ${name}
FOR EACH ROW WHEN NOT EXISTS (SELECT 1 FROM question WHERE id = NEW.question_id AND question_type = NEW.question_type)
BEGIN
  SELECT RAISE(ABORT, '${name}: question_id not found in the table for question_type');
END`
  return [guard("INSERT"), guard("UPDATE OF question_type, question_id")]
}

export const questionDeleteTriggerSQL = (referencing: any[]) => (schema: any) => {
  // Purpose: when a question is deleted, delete rows that reference it (mirrors ON DELETE CASCADE)
  const name = tableName(schema)
  const type = sqlString(schema["x-question-type"])
  const deletes = referencing.map(
    r => `  DELETE FROM ${tableName(r)} WHERE question_type = ${type} AND question_id = OLD.id;`
  )
  return `CREATE TRIGGER IF NOT EXISTS ${name}_cascade_delete AFTER DELETE ON ${name}
FOR EACH ROW
BEGIN
${deletes.join("\n")}
END`
}

export const references = (schema: any) =>
  // Purpose: list the tables a schema's foreign keys point at
  uniq(
    Object.values(schema.properties ?? {})
      .map((x: any) => x["x-references"])
      .filter(Boolean)
  ) as string[]

export const sortByDependency = (schemas: any[]) => {
  // Purpose: order schemas so every table comes after the tables it references
  const byName = Object.fromEntries(schemas.map(s => [tableName(s), s]))
  const done = new Set<string>()
  const visit = (name: string, path: string[] = []): any[] => {
    // Purpose: depth-first walk that emits a table after its dependencies
    if (done.has(name)) return []
    if (path.includes(name)) throw new Error(`Foreign key cycle: ${[...path, name].join(" -> ")}`)
    if (!byName[name]) throw new Error(`${path.at(-1)} references unknown table ${name}`)
    const deps = chain(dep => visit(dep, [...path, name]), references(byName[name]))
    done.add(name)
    return [...deps, byName[name]]
  }
  return chain(s => visit(tableName(s)), schemas)
}

export const tableSchemaUpsertSQL = (schema: any) =>
  // Purpose: record the schema a table was generated from in table_schema
  `INSERT INTO table_schema (table_name, jsonschema) VALUES (${sqlString(tableName(schema))}, ${sqlString(JSON.stringify(schema))})
ON CONFLICT (table_name) DO UPDATE SET jsonschema = excluded.jsonschema`

export const databaseSQL = (schemas: any[], record: (table: string) => boolean = () => true) => {
  // Purpose: render every statement needed to build the database, in execution order. Everything is
  // CREATE ... IF NOT EXISTS; `record` picks which tables' schemas are written to table_schema.
  const tables = sortByDependency(schemas)
  const referencing = tables.filter(refersToQuestions)
  return [
    ...tables.map(createTableSQL),
    questionViewSQL(tables),
    quizMemberSQL(),
    quizSummarySQL(),
    ...tables.map(updatedAtTriggerSQL),
    ...chain(questionRefTriggersSQL, referencing),
    ...tables.filter(isQuestionTable).map(questionDeleteTriggerSQL(referencing)),
    ...tables.filter(s => record(tableName(s))).map(tableSchemaUpsertSQL),
  ]
}

export const rebuildDerivedSQL = async (db: any, schemas: any[]) => {
  // Purpose: for migrations only: drop every view and trigger so databaseSQL recreates them from the current schemas
  const derived = await db
    .prepare("SELECT type, name FROM sqlite_master WHERE type IN ('view', 'trigger')")
    .all()
  return derived.map((o: any) => `DROP ${o.type.toUpperCase()} IF EXISTS ${o.name}`)
}
