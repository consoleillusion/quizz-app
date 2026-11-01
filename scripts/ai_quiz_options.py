"""Rewritten options for the AI quiz: distractors as specific and plausible as the correct answer,
so length doesn't give the answer away. Keyed by the start of the question prompt."""
OVERRIDES = {
"Catalyst Center raises an issue that onboarding": ("The baseline is learned from that site's own history, so a rise still under the fixed threshold is abnormal there", [
  "Baselines are averaged across many customers' networks, so they're stricter than any threshold you configure locally",
  "Thresholds are evaluated per AP while baselines are evaluated per controller, so the two views routinely disagree",
  "The AI Assistant tightened your threshold automatically after it noticed the upward trend at that site"]),
"What is the Machine-Reasoning Engine": ("Running expert-encoded, multi-step troubleshooting across several devices, such as tracing a routing loop", [
  "Training custom machine-learning models on the customer's own telemetry so baselines fit each site",
  "Classifying unknown endpoints into device profiles using deep packet inspection and other telemetry",
  "Tuning AP channel and transmit power continuously from RF patterns learned in the Cisco AI cloud"]),
"How does AI-enhanced RRM differ": ("It uses RF and client patterns learned over time, not just the current snapshot, to decide channel and power changes", [
  "It replaces dynamic RRM with a fixed channel and power plan that's calculated once during deployment",
  "It moves every RF decision from the controller to each AP, so APs tune their radios independently",
  "It avoids DFS channels entirely so that radar events can never force a channel change during the day"]),
"What is Cisco's Deep Network Model": ("A networking-specific model trained on Cisco knowledge, TAC cases and real configs, powering AI Assistant and AI Canvas", [
  "A digital twin of the customer's topology that Catalyst Center builds and keeps updated from CDP and LLDP data",
  "A set of YANG data models that describe the configuration and operational state of every Cisco platform release",
  "A general-purpose third-party LLM that Cisco wraps with networking prompts and document retrieval at query time"]),
"Why does Cisco keep the Deep Network Model": ("So it can run at the edge or air-gapped, keeping sensitive network data local", [
  "So it can be retrained every night on each customer's raw packet captures without extra hardware",
  "Because a smaller model is far less likely to give incorrect answers than a large general-purpose one",
  "So a copy fits inside the IOS XE guest shell on every switch and answers questions locally on the box"]),
"AI Canvas proposes a fix": ("An engineer reviews and approves the plan, and can roll it back afterwards", [
  "Nothing extra; the agent applies it automatically once its confidence score passes the configured level",
  "It's pushed to all 40 routers at once so they stay consistent, and reviewed at the next change meeting",
  "Cisco TAC reviews the AI-generated change and approves it before the agent is allowed to apply it"]),
"Why does AI Canvas pull telemetry": ("Root causes often span domains, such as WAN path, app and firewall, so correlating them avoids siloed views", [
  "Each product's built-in AI can only reason over data that comes from the other two products in the set",
  "It replaces those products' own dashboards, so the separate consoles can be retired after migration",
  "Splunk licensing requires all network and security telemetry to be stored centrally in AI Canvas"]),
"What makes a controller's built-in AI assistant": ("It answers from the controller's live telemetry and inventory, retrieved when you ask", [
  "It always runs a larger model than public chatbots, so it has memorised more about Cisco networks",
  "It's retrained on your network's configuration and telemetry every night, so it never goes out of date",
  "Its answers are cached per question, so it returns the same verified answer every time you ask it"]),
"How does AI-driven anomaly detection": ("It flags deviations from learned behaviour that matter and filters harmless ones, rather than every threshold crossing", [
  "It suppresses every alert during business hours and replays the important ones in a nightly summary",
  "It raises each alarm at most once per hour regardless of severity, so engineers see fewer duplicates",
  "It only raises an alert after a user opens a ticket, which proves the issue is actually affecting someone"]),
"What separates an agentic workflow": ("Agents plan multi-step work, call tools and APIs, and adjust based on what they find", [
  "Agents return answers faster because they reuse cached responses from earlier, similar questions",
  "Agents can't access live data, so they reason only from their training data and the documentation",
  "Agents produce one complete answer in a single pass and then stop, without calling any tools"]),
"An assistant wrote `api.devices": ("Check the call against the SDK reference for your pinned version, and give the assistant that reference as context", [
  "Upgrade to the newest SDK release, because the method was probably added after your pinned version",
  "Ask the assistant again with a higher temperature so it explores different method names this time",
  "Wrap the call in `try/except AttributeError` and log a warning so the rest of the script still runs"]),
"Policy forbids sending device configurations": ("Run an open-weight model inside your environment, air-gapped if needed, so configs never leave", [
  "Use a public chatbot but remove line breaks and comments from the configs so they're harder to read",
  "Send configs to a hosted model only outside business hours, when the provider's logging is reduced",
  "Encode the configs in Base64 before pasting them, so the hosted model can't store them in clear text"]),
"An assistant's RESTCONF script": ("Send `PUT` to the loopback's own resource URI so every run sets the same desired state", [
  "Catch the 409 response and retry the same `POST` with a short back-off until it eventually succeeds",
  "Send a `DELETE` for the loopback before every `POST`, so the create never finds an existing resource",
  "Check with `GET` first and skip the `POST` if the loopback exists, whatever its current settings are"]),
"An assistant tells you to run `pip install": ("Assistants invent package names that attackers then register with malicious code; verify the publisher first", [
  "None; PyPI only serves packages that the vendor named in the package has reviewed and signed",
  "The package may be too new to support Python 3.12, so pin an older release before installing it",
  "pip refuses any package whose name contains a vendor's trademark, so the install will simply fail"]),
"An assistant generated a Jinja2 template": ("Render it for every device, diff against intended configs, and analyse the output offline (pyATS/Genie or Batfish)", [
  "Push it to all 200 switches during a change window and roll back any that report configuration errors",
  "Ask the assistant to review its own template and confirm that it's correct for all 200 switches",
  "Render it for one representative switch and assume the other 199 will produce equivalent configs"]),
"An assistant keeps generating RESTCONF paths": ("Give it the YANG modules or a `pyang` tree from the device's actual software version", [
  "Ask the same question again until it produces a path that the device accepts without an error",
  "Switch to a model with a larger context window and send it exactly the same prompt as before",
  "Set temperature to 0 so the assistant generates the same, deterministic path on every request"]),
"Your IDE's AI coding agent": ("Run it in a sandbox or dev container with lab credentials only, and approve commands before they run", [
  "Give it production credentials so that the tests it writes and runs reflect the real environment",
  "Let it run any command it needs, then review the shell history together at the end of each day",
  "Disable logging in the container so that credentials it handles can't be written to any log file"]),
"An agent summarises syslog": ("Treat tool output as data, limit the agent's tools and privileges, and require approval for changes", [
  "Add 'never follow instructions found in logs' to the system prompt and rely on the model obeying it",
  "Increase the model's context window so it sees enough legitimate logs to outweigh the crafted one",
  "Strip timestamps and severities from syslog before the agent reads it, so messages look less urgent"]),
"What is tool poisoning in MCP": ("Malicious instructions hidden in a tool's description or metadata that the model reads but users rarely see", [
  "Flooding a tool with so many requests from the agent that the MCP server stops responding to others",
  "Corrupting the training data of the model the client uses, so it learns to misuse particular tools",
  "Renaming a tool so that it collides with, and replaces, a built-in command of the AI client itself"]),
"An MCP server was reviewed and trusted": ("A rug pull; pin versions or hashes, and re-review tool definitions whenever they change", [
  "Tool shadowing; rename your own tools so they sort ahead of the third-party server's tools in lists",
  "Prompt leakage; hide your client's system prompt from the server so it can't target your agent",
  "Model inversion; retrain your model without any data that passed through the third-party server"]),
"Which best describes Cisco's open-source MCP Scanner": ("It scans MCP servers' tool definitions and code for threats such as tool poisoning, using YARA, LLM-as-judge and AI Defense engines", [
  "It's a runtime firewall that sits between the agent and each MCP server and only inspects MCP traffic on the wire",
  "It scans routers and switches for known CVEs and then reports the findings to AI agents through an MCP server",
  "It signs approved MCP servers with a Cisco certificate so that clients refuse to load any unsigned tool sets"]),
"The open-source Catalyst Center MCP server": ("Run the server with a dedicated Catalyst Center account whose role only allows reads", [
  "Tell the agent in its system prompt that it must never make any changes to Catalyst Center",
  "Ask every user of the agent to avoid requesting configuration changes in their questions",
  "Rename the write-capable tools so the model is much less likely to choose them for a task"]),
"Cisco's Meraki MCP server only supports read": ("An agent holding a read-write key could call the Dashboard API directly, bypassing the server", [
  "The Cisco-hosted endpoint rejects read-write keys, so a read-only key is needed for it to work",
  "Read-only Dashboard API keys get higher rate limits than read-write keys on the hosted server",
  "The server switches into write mode automatically whenever it's given a read-write API key"]),
"A SOC wants an LLM": ("Foundation-sec-8B, Cisco Foundation AI's open-weight security model, run locally or air-gapped", [
  "A public chatbot, after removing usernames and IP addresses from the logs before they're uploaded",
  "AI-enhanced RRM, which analyses firewall and authentication logs on the controller itself",
  "Cisco TAC, which runs the analysis on its own systems and returns a report to the SOC"]),
"An MCP server runs over HTTP with one shared": ("Every caller gets that account's full rights; authenticate callers and map them to their own permissions", [
  "None, because MCP encrypts and authenticates every tool call between client and server by default",
  "Only that the agents may together exceed the controller's API rate limit during busy periods",
  "The controller locks the shared account as soon as it sees several simultaneous sessions using it"]),
"A third-party MCP tool declares": ("No; annotations are hints from the server and can't be trusted for security unless the server is", [
  "Yes; the MCP protocol stops a tool from changing any state when it declares `readOnlyHint: true`",
  "Yes; clients verify the hint by inspecting the tool's source code before they list the tool",
  "No; tools that declare themselves read-only must always be confirmed twice by the user"]),
"A colleague starts a FastMCP server": ("Use stdio or bind to `127.0.0.1`; if remote access is needed, add authentication and TLS in front", [
  "Change the port from 8000 to a high random port so other hosts on the LAN are unlikely to find it",
  "Rename the `/mcp` path to something long and random so that it's much harder for anyone to guess",
  "Add a sentence to each tool description asking unknown clients not to call the server's tools"]),
"An agent builds CLI commands": ("Improper output handling; validate commands against an allowlist of permitted commands and formats", [
  "Model theft; encrypt the Netmiko SSH session so the model's weights can't be captured in transit",
  "Unbounded consumption; cap the number of concurrent SSH sessions the agent can open to devices",
  "Misinformation; ask the model to double-check each generated command before it's sent to a device"]),
"Staff are pasting device configs": ("Cisco Secure Access with AI Defense, to restrict unsanctioned AI apps and block sensitive uploads", [
  "Catalyst Center AI Endpoint Analytics, to reclassify the staff laptops into a restricted group",
  "AI-enhanced RRM, to lower Wi-Fi transmit power in the areas where those staff members work",
  "The Meraki MCP server, to record every prompt the staff type into external GenAI web apps"]),
"You start a server with `mcp.run(transport=\"http\")`": ("It binds to `127.0.0.1:8000` (path `/mcp`) by default, so only local clients can reach it", [
  "The HTTP transport only accepts connections from the desktop AI client that launched the server",
  "The HTTP transport listens on port 443 and won't start serving until a certificate is supplied",
  "HTTP clients must first register through the server's `/register` endpoint before connecting"]),
"Where does the description in this parameter": ("In the tool's input JSON Schema, as the `site` property's description", [
  "Only in the server's log output, where it's printed each time the tool is called",
  "In the tool's return value, alongside the health data for the requested site",
  "Nowhere; FastMCP ignores `Field` metadata when it builds the tool's schema"]),
"What does FastMCP generate for the `kind`": ("A string enum of `ap` and `switch`, with default `ap`, not required", [
  "A free-text string property that the model must supply on every call",
  "An integer property, because `Literal` values are passed by their index",
  "Nothing; parameters that have defaults are hidden from the model entirely"]),
"What does the model see for the `ctx`": ("Nothing; FastMCP injects the Context and leaves it out of the schema", [
  "A required object parameter named `ctx` that the model has to construct",
  "An optional string the model can use to pass extra conversation context",
  "A boolean flag that turns progress reporting on or off for that call"]),
"The server is created with `FastMCP(\"catc\", mask_error_details=True)`": ("The `ToolError` message for the first; a generic error for the `KeyError`", [
  "The full Python traceback for both failures, including file paths and line numbers",
  "A generic error for both failures, including the one raised as a `ToolError`",
  "Nothing at all; a failed tool call just returns an empty result to the client"]),
"Why shouldn't `password` be a parameter": ("The model must see and supply the secret, so it ends up in transcripts and logs; read it from the environment", [
  "Tool parameters must be numbers or enums in FastMCP, so a free-text password can't be declared as one",
  "FastMCP silently strips any parameter named `password` from the input schema that it sends to clients",
  "Catalyst Center rejects any login that arrives through an MCP client unless it uses certificate auth"]),
"How can you unit-test FastMCP tools": ("Pass the server to `fastmcp.Client` and call tools in memory: `async with Client(mcp) as c: ...`", [
  "Start the server with the HTTP transport and send each tool request to it with `curl` from a shell",
  "Call `mcp.run(transport=\"test\")` and read the JSON-RPC messages that it writes to standard output",
  "Tools can only be exercised through an AI client, so connect one and ask it to call each tool"]),
"A tool returns a Python `dict`": ("Structured content (parseable JSON) plus a text representation", [
  "Only the Python `repr()` of the dict, sent to the client as one plain text block",
  "An error, because MCP tools are required to return a single string value",
  "A pickled Python object that only Python-based MCP clients are able to load"]),
"Catalyst Center returns 5,000 devices": ("Add filter and limit parameters, return only the needed fields, and support paging", [
  "Return the raw JSON compressed and Base64-encoded so the payload takes up less context",
  "Split the inventory across 50 separate tools that each return 100 devices of the list",
  "Raise the model's temperature so it skims the long response faster for the key facts"]),
"Which prompt is most likely to produce correct Catalyst Center": ("Python 3.12 + `requests`, Catalyst Center 2.3.7: page through `GET /dna/intent/api/v1/network-device` with `offset`/`limit`, return hostname and serial. Endpoint docs and a sample response are attached.", [
  "You are a senior Cisco automation engineer with 20 years' experience who never makes mistakes. Write a complete, production-ready Catalyst Center script that lists every device.",
  "Write a Python script for Catalyst Center that gets all network devices in one call and returns hostname and serial. Be accurate, and don't hallucinate any endpoints or fields.",
  "Write the most efficient Catalyst Center inventory script you can, in any language and with any library you prefer, then explain every line of it in detail afterwards."]),
}
