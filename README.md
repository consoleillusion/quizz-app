# ENAUTO quiz app

Astro + Svelte quiz app for Cisco ENAUTO 300-435. Runs on Bun; data in Turso (SQLite).

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

`question_set` holds set metadata; `question_set_item` places a question (`question_type` +
`question_id`) at a `position` in a set, so sets can share and reorder questions. Views:
`question` (shared columns of every question table) and `question_set_summary` (sets with counts).

```sh
bun run db:init    # create missing tables; fails if the DB has drifted from the schema
bun run db:reset   # delete .db, rebuild from schema, seed all sets
bun run db:seed    # validate and load src/db/question_sets/*  (--prune drops unused questions)
bun run db:check   # validate the question sets without writing
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

### Adding a question set

Create `src/db/question_sets/<slug>/` with `set.yml` (title, description, exam, difficulty, tags)
and `questions.json` in the compact quizlet format, then `bun run db:seed`.
