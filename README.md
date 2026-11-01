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

Only one process can open `.db` at a time, so stop the server before running database scripts other than `db:backup`.


## Database

All data lives in the database (`.db`, Turso/SQLite). The only YAML is the table schemas in
`src/db/schema`, one file per table; tables, views and triggers are generated from them.

Each question type has its own table, because each type has its own shape:

| Table | Type | Answer is stored as |
|---|---|---|
| `question_multichoice` | one correct option | `options[].points` (1 for the correct option) |
| `question_multiselect` | choose *n* | `options[].points`, `number_of_selections` |
| `question_match` | pair prompts with responses | `answer[i]` = response index for prompt *i* |
| `question_order` | put items in sequence | `answer` = item indexes in order |
| `question_slotfill` | fill ⟦n⟧ slots from a token bank | `gaps[n-1].accepted_tokens` |
| `question_open` | type the answer | `answers` |

Questions belong to no quiz. They carry typed tags (`question_tag` → `tag`): `vendor`, `exam`,
`domain`, `objective`, `topic` and `generic`, namespaced from the vendor down
(`cisco`, `cisco:300-435`, `cisco:300-435:5.0`, `cisco:300-435:5.4`). A quiz picks questions
explicitly (`quiz_question`, ordered) and/or by tag rules (`quiz_rule`, matching all or any of
the rule tags); the `quiz_member` view resolves both.

```sh
bun run db:init      # create missing tables, views and triggers; safe to run any time
bun run db:migrate   # back up, then apply pending migrations in src/db/migrations
bun run db:backup    # copy the live database to backups/<timestamp>.db
bun run db:sql       # print the generated SQL
```

`init` only ever creates what's missing and warns if a schema file no longer matches the table it
built. Changing a schema means writing a migration (`src/db/migrations/NNN-name.ts` exporting
`up(db)`); the database is never rebuilt.

Content is written through `src/lib/questions.ts` (`createQuestion`, `addQuiz`, `ensureTag`), which
validates against the schemas and the per-type rules in `src/db/rules.ts`.

### Schema extensions

- `x-references: <table>` foreign key to `<table>(id)` (CASCADE if required, else SET NULL)
- `x-unique: [[col, ...], ...]` table-level UNIQUE constraints
- `x-question-type: <name>` marks a question table
- `x-widget: textarea` renders a textarea in generated forms
- `x-private: [col, ...]` columns never sent to clients

Every table also gets `id` (uuid7), `created_at` and `updated_at`.
