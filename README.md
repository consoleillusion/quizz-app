# ENAUTO quiz app

Astro + Svelte quiz app for Cisco ENAUTO 300-435. Runs on Bun; data in Turso (SQLite).
Server-rendered (Astro `output: "server"`, Node adapter running under Bun).

## Routes

Every resource URL serves HTML by default. Add `?format=json` (or send `Accept: application/json`)
for JSON. Sending a JSON body also gets a JSON response.

| Method | Path | HTML | JSON |
|---|---|---|---|
| GET | `/quiz?page=&limit=` | quiz cards, paged (default 12 per page, max 100), plus a create form | `{items, total, page, limit, pages, links}` |
| POST | `/quiz` | form post → `303` to the new quiz; errors re-render the form (`422`/`409`) | JSON body → `201` + `Location`; errors as `{error, errors: [{field, message}]}` |
| GET | `/quiz/<slug or id>` | the quiz player | the quiz with its questions |

Other methods get `405` with an `Allow` header. Bodies are validated against the table's JSON
Schema (read from `table_schema`), and the create form is generated from that same schema
(`src/components/SchemaForm.astro`), so a schema change updates validation and the form together.
A missing `slug` is derived from the title.

```sh
bun run dev        # dev server (add -- --port 4359 to pick a port)
bun run build && bun run start   # production server on $PORT (default 4359)
```

Only one process can open `.db` at a time, so stop the server before `db:reset` or `db:seed`.


## Database

Tables are generated from the JSON Schemas in `src/db/schema` (one `.yml` per table).
Each question type has its own table, because each type has its own shape:

| Table | Type | Answer is stored as |
|---|---|---|
| `question_multichoice` | one correct option | `options[].points` (1 for the correct option) |
| `question_multiselect` | choose *n* | `options[].points`, `number_of_selections` |
| `question_match` | pair prompts with responses | `answer[i]` = response index for prompt *i* |
| `question_order` | put items in sequence | `answer` = item indexes in order |
| `question_slotfill` | fill ⟦n⟧ slots from a token bank | `gaps[n-1].accepted_tokens` |
| `question_open` | type the answer | `answers` |

`quiz` holds set metadata; `quiz_question` places a question (`question_type` +
`question_id`) at a `position` in a set, so sets can share and reorder questions. Views:
`question` (shared columns of every question table) and `quiz_summary` (sets with counts).

```sh
bun run db:init    # create missing tables; fails if the DB has drifted from the schema
bun run db:reset   # delete .db, rebuild from schema, seed all sets
bun run db:seed    # validate and load src/db/quizzes/*  (--prune drops unused questions)
bun run db:check   # validate the quizzes without writing
bun run db:sql     # print the generated SQL
```

Changing a schema: edit the `.yml`, then `bun run db:reset`. `init` records each table's schema
in `table_schema` and refuses to run against a database built from a different schema.

Validation happens in three layers: ajv against the schema, the per-type rules in
`src/db/rules.ts`, and SQL constraints (NOT NULL, CHECK, UNIQUE, foreign keys and triggers for the
polymorphic question reference).

### Schema extensions

- `x-references: <table>` foreign key to `<table>(id)` (CASCADE if required, else SET NULL)
- `x-unique: [[col, ...], ...]` table-level UNIQUE constraints
- `x-question-type: <name>` marks a question table

Every table also gets `id` (uuid7), `created_at` and `updated_at`. Seeded question ids are UUIDv5
of the question's content, so re-seeding is idempotent.

### Adding a quiz

Create `src/db/quizzes/<slug>/` with `quiz.yml` (title, description, exam, difficulty, tags)
and `questions.json` in the compact quizlet format, then `bun run db:seed`.
