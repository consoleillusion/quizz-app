// Typed, namespaced tags on questions and quizzes, and tag-rule (dynamic) quizzes.
//   - objectives columns become objective tags (plus their domain, exam and vendor tags)
//   - quiz_tag(name) becomes quiz_tag(tag_id) referencing the new tag table
//   - questions in single-topic quizzes get that topic's tag
//   - quiz gains rule_match; quiz_rule, question_tag and migration tables are created
import { chain, fromPairs, map, pipe, toPairs, uniq } from "ramda"
import { databaseSQL, rebuildDerivedSQL, tableName } from "../ddl.ts"
import { loadSchema } from "../loadSchema.ts"

const vendor = "cisco"
const exam = {
  name: "cisco:300-435",
  description:
    "Automating and Programming Cisco Enterprise Solutions v2.0 (300-435 ENAUTO)",
}

const domains: Record<string, string> = {
  "1.0": "Network Automation Foundation",
  "2.0": "Device-Level Network Automation",
  "3.0": "Controller-Based Network Automation",
  "4.0": "Operations",
  "5.0": "AI in Automation",
}

const objectives: Record<string, string> = {
  "1.1": "Describe OpenConfig, IETF, and native YANG models",
  "1.2": "Describe NETCONF and RESTCONF",
  "1.3":
    "Construct a JSON payload based on a YANG model using tools such as YANG Suite and pyang",
  "1.4":
    "Construct the XML payload based on a YANG model using tools such as YANG Suite and pyang",
  "1.5": "Interpret a YANG module tree generated per RFC8340",
  "2.1":
    "Construct a network automation solution with Python using Netmiko to manage and monitor configurations",
  "2.2":
    "Construct a network automation solution with Python using ncclient to manage and monitor configurations",
  "2.3":
    "Construct a network automation solution with Python using RESTCONF to manage and monitor configurations",
  "2.4":
    "Construct a network automation solution with Ansible to manage configurations",
  "2.5":
    "Construct a device-level network automation solution for Day 0 provisioning",
  "2.6":
    "Troubleshoot network automation solutions based on RESTCONF, NETCONF and YANG models",
  "2.7":
    "Construct on-box automations using EEM, guest shell, and on-box Python",
  "3.1":
    "Construct a controller-based network automation solution for Day-0 provisioning",
  "3.2":
    "Construct a controller-based network automation solution with Python to manage and monitor configurations",
  "3.3":
    "Construct advanced network configuration templates using Jinja2 constructs such as loops, conditionals, output modifiers, and filters",
  "3.4":
    "Construct a controller-based network automation solution with Ansible to manage configurations",
  "3.5":
    "Construct security automation solutions such as policy enforcement, compliance monitoring, and network segmentation",
  "3.6": "Troubleshoot network automation solutions based on REST APIs",
  "4.1":
    "Describe the use of Cisco platform APIs for the testing and validation phase of a network automation solution",
  "4.2":
    "Describe the use of network topology simulations related to enterprise operations",
  "4.3":
    "Construct a controller-based network automation solution to manage device software versions",
  "4.4":
    "Construct a controller-based network automation solution to monitor network health",
  "4.5":
    "Configure a subscription for model driven telemetry on a Cisco IOS XE device (CLI, NETCONF, and RESTCONF)",
  "4.6": "Implement webhook-based monitoring using controllers",
  "5.1": "Describe AI in controller-based platforms",
  "5.2": "Describe AI-assisted code development for network automation",
  "5.3":
    "Describe the security risks in a given AI-based network automation solution",
  "5.4":
    "Construct an MCP server to provide network information to an AI agent using Python FastMCP",
}

// Old quiz tags that describe the kind of quiz rather than a technology.
const genericTags = ["topic", "practice", "blueprint"]

const domainOf = (number: string) => `${number.split(".")[0]}.0`

const blueprintTags = () => [
  { type: "vendor", name: vendor, description: "Cisco" },
  { type: "exam", ...exam },
  ...map(
    ([n, d]) => ({ type: "domain", name: `${exam.name}:${n}`, description: d }),
    toPairs(domains),
  ),
  ...map(
    ([n, d]) => ({
      type: "objective",
      name: `${exam.name}:${n}`,
      description: d,
    }),
    toPairs(objectives),
  ),
]

const tagsForObjective = (old: string) =>
  // old values look like "300-435:2.3"
  [
    `vendor|${vendor}`,
    `exam|${exam.name}`,
    `domain|${exam.name}:${domainOf(old.split(":")[1])}`,
    `objective|${vendor}:${old}`,
  ]

export const up = async (db: any) => {
  // Purpose: move objectives and quiz tag names into typed tags, and add tag-rule quizzes
  const schemas = await loadSchema()
  const questionTables = schemas.filter((s: any) => s["x-question-type"])

  // 1. Read what's about to change shape.
  const oldQuizTags = await db
    .prepare("SELECT quiz_id, name FROM quiz_tag")
    .all()
  const oldObjectives = chain(
    (rows: any[]) => rows,
    await Promise.all(
      map(
        async (s: any) =>
          map(
            (r: any) => ({
              question_type: s["x-question-type"],
              question_id: r.id,
              objectives: JSON.parse(r.objectives),
            }),
            await db
              .prepare(
                `SELECT id, json(objectives) AS objectives FROM ${tableName(s)}`,
              )
              .all(),
          ),
        questionTables,
      ),
    ),
  )
  const topicMembers = await db
    .prepare(`SELECT DISTINCT t.name AS tag, i.question_type, i.question_id
    FROM quiz_tag t JOIN quiz_question i ON i.quiz_id = t.quiz_id`)
    .all()

  // 2. Drop views and triggers (recreated from the schemas below), then reshape tables.
  for (const drop of await rebuildDerivedSQL(db, schemas)) await db.exec(drop)
  await db.exec("ALTER TABLE quiz_tag RENAME TO quiz_tag_old")
  for (const s of questionTables)
    await db.exec(`ALTER TABLE ${tableName(s)} DROP COLUMN objectives`)
  await db.exec(
    "ALTER TABLE quiz ADD COLUMN rule_match TEXT DEFAULT 'all' CHECK (rule_match IN ('all', 'any'))",
  )

  // 3. Create everything the schemas describe (new tables, views, triggers) and record the schemas.
  await db.batch(databaseSQL(schemas), "write")

  // 4. Fill the tag tables.
  await db.exec("BEGIN")
  try {
    const topicNames = uniq(map((r: any) => r.name, oldQuizTags))
    const tags = [
      ...blueprintTags(),
      ...map(
        (name: string) => ({
          type: genericTags.includes(name) ? "generic" : "topic",
          name,
          description: "",
        }),
        topicNames,
      ),
    ]
    const insertTag = db.prepare(
      "INSERT INTO tag (type, name, description) VALUES (?, ?, ?) RETURNING id",
    )
    const ids: Record<string, string> = {}
    for (const t of tags)
      ids[`${t.type}|${t.name}`] = (
        await insertTag.get([t.type, t.name, t.description])
      ).id
    const tagId = (name: string) =>
      ids[`generic|${name}`] ?? ids[`topic|${name}`]

    const link = db.prepare(
      "INSERT OR IGNORE INTO question_tag (question_type, question_id, tag_id) VALUES (?, ?, ?)",
    )
    for (const q of oldObjectives)
      for (const key of uniq(chain(tagsForObjective, q.objectives)))
        await link.run([q.question_type, q.question_id, ids[key]])
    for (const m of topicMembers)
      if (!genericTags.includes(m.tag))
        await link.run([m.question_type, m.question_id, tagId(m.tag)])

    const quizTag = db.prepare(
      "INSERT OR IGNORE INTO quiz_tag (quiz_id, tag_id) VALUES (?, ?)",
    )
    for (const r of oldQuizTags) await quizTag.run([r.quiz_id, tagId(r.name)])
    await db.exec("DROP TABLE quiz_tag_old")
    await db.exec("COMMIT")
  } catch (e) {
    await db.exec("ROLLBACK")
    throw e
  }
}
