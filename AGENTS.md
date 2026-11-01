## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

### Quiz App

The goal is to build a learning and quiz app.

## Technology Stack

**Frontend & UI**
- Meta-framework: [Astro](<https://docs.astro.build/)
- Interactive Components: [Svelte](<https://docs.astro.build/en/guides/integrations-guide/svelte/>)
- CSS Framework: [Sakura](<https://oxal.org/projects/sakura/>)
**Backend & Data**
- Database: [Turso](<https://docs.turso.tech/sdk/ts/reference>)
- JSON API Server: [Elysia](<https://www.npmjs.com/package/elysia>)
- JSON:API Serialization: [ts-japi](<https://www.npmjs.com/package/ts-japi>)
**Authentication & Authorization**
- Authentication / Authorization: [Serenity](<https://github.com/serenity-kit/opaque>)
**Programming Paradigms & Utilities**
- Functional Programming: [Ramda](<https://ramdajs.com/docs/>)

### Coding Style
- Modular sections, using components.
- Prefer prerendered content where possible. If something that needs to be done can be done in astro rather than svelte, do it there, since it can be done without delivering javascript so it will be more performant.
- Rely heavily on global style. Please only minimally style components
- Simply Use the Sakura Dark CSS stylesheet. 
- Codebase should be small, Readable, Use libraries if necessary, but try to keep few dependencies as well. To meet these goals, use
    - Modular code
    - Functional style, often tacit/pointfree
    - Leverage well known conventions such as
        - jsonschema used to describe tables
        - native html functionality is used rather than reinventing with javascript
        - if importing a library could save a substantial amount of code without significantly forcing structural changes or slowing performance or security it should be considered.
        - LATER openapi used to describe api. Dont do this now, focus on the main tasks.
- Schema of the tables is defined in the schema folder, and the sqld/sqlite tables are generated directly from the schema. So you can rely on these types.
- Users can register, and their accounts are saved to the users table.
- Users answers are saved in the user_answers table on the server, but are also persisted to indexeddb in the browser. IndexedDB and the users answers on the server should be kept in sync.

### Code style (for new and changed code; don't restyle existing code just for this)
- Functional style with Ramda: small pure functions composed with `pipe`/`compose`; avoid loops and mutation where a Ramda function does the job.
- Use `const`. Avoid `let` and never use `var`.
- No classes. JSON Schema (in `src/db/schema/*.yml`) describes data shapes; use plain objects and functions.
- Leading commas, Haskell style, for multi-line objects, arrays and argument lists:
  ```ts
  import {pipe} from 'ramda'


  // Defining records
  const x =
    { a: 1
    , b: 2
    , c: 3
    }

  // Defining functions
  const fn =
    (val: string) => pipe
      ( fn1
      , fn2
      , fn3
      ) (val) 
  ```

- TypeScript with type annotations on parameters (and on exported values where it helps).
- Every function's first line is a `// Purpose: ...` comment.

### Data
- All data lives in the database. YAML is only for the table schemas in `src/db/schema`. No seed or fixture data files.
- Schema changes are applied with migrations in `src/db/migrations`, which change the database in place. Never rebuild the database to change its schema.
- Back up before migrating: `bun run db:backup`.
- Tags are typed (`vendor`, `exam`, `domain`, `objective`, `topic`, `generic`) and namespaced from the vendor down, e.g. `cisco:300-435:5.4`.
- Questions belong to no quiz. Quizzes reference questions explicitly (`quiz_question`) and/or by tag rules (`quiz_rule`).

## Extra Instructions
- Ignore whats in experimental folder for now
- Don't change all the coding unless you are already editing that file for some other reason
- If you are editing a file, do change the coding style to match it
