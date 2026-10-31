// Markdown for question text, rendered at build time. Raw HTML is disabled, so
// things like <rpc-reply> outside code markers are escaped, never interpreted.
import MarkdownIt from "markdown-it"

const md = new MarkdownIt({html: false, linkify: false, typographer: false})

export const toHtml = (s: string) =>
  // Purpose: render a string as block Markdown when it has line breaks, otherwise inline
  s.includes("\n") ? md.render(s) : md.renderInline(s)

export const toPlain = (s: string) =>
  // Purpose: drop Markdown code markers for places that can't hold HTML, such as <option> labels
  s.replace(/^```\w*\n?|\n?```$/g, "").replaceAll("`", "")
