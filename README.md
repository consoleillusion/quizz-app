# Exam practice site

Astro + Svelte practice site for Cisco and other certification exams, served at techstudy.app. Questions, tags, accounts and answers live in SRS (the Standard Resource Server, `srs` package), mounted at `/api`. Runs on Bun; deployed on Vercel with a Turso database.

## Routes

| Path | What it is |
|---|---|
| `/` | the exams (tags of type `exam`) with question and domain counts |
| `/exam/<name>` | one exam: 10 questions at a time, weighted towards the visitor's weakest domains |
| `/exam/<name>/questions` | JSON: `{questions: [[id, domain position], ...]}`; with `filter[id]=a,b,…` (at most 20), those questions rendered for the player |
| `/dashboard` | progress over time, drawn in the browser from the visitor's answers |
| `/session`, `/user` | log in and out, sign up |
| `/api/...` | the SRS JSON:API: `tag`, `question`, `answer`, accounts and sessions |

Page reads go to SRS in-process (`src/lib/srs.ts`); the browser talks to `/api` with the SRS client (`src/lib/account.ts`). OPAQUE runs in the browser, so passwords never reach the server; the session is a bearer token in localStorage. Answers are kept in the browser (IndexedDB) and, when signed in, synced to the account's `answer` rows (`src/lib/progress.ts`). Answers given before signing up move into the new account.

## Data model

The schemas are in `srs/schema`; `bun run srs:init` turns them into `.srs/` (migrations, `schemas.json`, types). Run it again after any schema change and commit `.srs/`.

- `tag`: typed (`vendor`, `exam`, `domain`, `objective`, `topic`, `generic`), named from the vendor down (`cisco`, `cisco:300-435`, `cisco:300-435:5.0`). Public.
- `question`: one table for every type. Common columns (`type`, `text`, `exhibit`, `explanation`, `bloom`, `difficulty`, `links`) plus a `body` holding the type's own fields, validated against that type's shape, with a table check that `body.type` matches `type`. Every question has at least one tag. Questions belong to whoever wrote them and can be shared or made public; anyone can read public ones.
- `answer`: private to its owner; one row per answer given (`answer`, `points`, `correct`, `answered_at`, `question`).

One table with a typed `body` keeps every read indexed: an exam page reads the question ids of each domain tag and then at most 20 questions by id, rather than joining a table per type.

## Local development

```sh
bun install
bun run srs:init     # prints OPAQUE_SERVER_SETUP: put it in .env
bun run dev
```

Without `SRS_DATABASE_URL` the site uses the local SQLite file `srs.db` (set `SRS_DB_PATH` to change it) and applies `.srs/migrations` on first use.

Copy the question bank from the authoring database (`.db`) into SRS with the site running:

```sh
bun run to-srs --from .db --server http://localhost:4321/api --username <you> --password '<password>' [--answers-of <old username>]
```

Tags and questions keep their ids; the account you name owns them (it is registered if it doesn't exist). Rows already in SRS are skipped, so the script can be run again. The dev server holds a lock on `.db`, so pass a copy (`cp .db /tmp/old.db`) while it runs. Locally, `SRS_RATE_LIMIT_PER_MINUTE=0` in `.env` makes the copy faster.

The question authoring scripts (`scripts/import-questions.ts`, `retag-overlaps.ts`, `clean-cross-tags.ts`) write to `.db`; run `to-srs` afterwards to add the new questions to SRS.

## Vercel

Vercel builds pick the Vercel adapter (Bun runtime); local builds use the standalone Node adapter (`bun run build && bun run start`).

Set these in the Vercel project:

| Variable | Value |
|---|---|
| `SRS_DATABASE_URL` | the Turso database URL (`turso db show <db> --url`) |
| `SRS_DATABASE_TOKEN` | a token for it (`turso db tokens create <db>`) |
| `OPAQUE_SERVER_SETUP` | the value `srs:init` printed; keep it, or every account stops working |
| `SRS_TRUSTED_PROXY_HOPS` | `1`, so the rate limit counts each visitor by the address Vercel forwards |

Before the first deploy, and after every schema change, apply the migrations to the remote database from your machine with the same two database variables set:

```sh
SRS_DATABASE_URL=... SRS_DATABASE_TOKEN=... bun run srs:migrate
```

Then copy the data with `to-srs`, pointing `--server` at `https://techstudy.app/api`.
