"""Add Markdown code markers to question strings (p, e, o, s, r). Exhibits (c) and tokens (bank) are left alone."""
import json, re, sys, glob

WHOLE_CODE = re.compile(r'^(\{|\[|[A-Z][\w-]*: \S|<[\w:.-]+[ />])')
LEADING_PATH = re.compile(r'^((?:(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) )?/\S+)(.*)$')
TAG_RUN = re.compile(r'<([\w:.-]+)(\s[^<>]*)?>[^<>]*</\1>|<[\w:.-]+(\s[^<>]*)?/>')
ANGLE_TOKEN = re.compile(r'(?<![`\w])([^\s`]*<[^<>\s][^<>]*>[^\s`]*)')

def fence(s):
    # Purpose: wrap a multi-line string in a fenced code block
    return "```\n" + s + "\n```"

def is_whole_code(s):
    # Purpose: true when a whole single-line string is code (JSON, a header line or an XML fragment), not code mixed with prose
    s = s.strip()
    if not WHOLE_CODE.match(s): return False
    if s.startswith("<"):
        root = re.match(r'^<([\w:.-]+)', s).group(1)
        return s.endswith(f"</{root}>") or (s.endswith("/>") and s.count("<") == 1)
    if s[0] in "{[": return s[-1] in "}]"
    return ", " not in s and " and " not in s

def trim_punct(token):
    # Purpose: split trailing sentence punctuation off a code token so it stays outside the marker
    m = re.match(r'^(.*?)([.,;:?!)]*)$', token)
    return m.group(1), m.group(2)

def mark(s):
    # Purpose: return s with code marked: fenced if multi-line, whole-span if code, else inline spans
    if "`" in s: return s
    if "\n" in s: return fence(s)
    if is_whole_code(s): return f"`{s}`"
    header = re.match(r'^([A-Z][\w-]*: [^,]+)(,.*)$', s)
    if header: return f"`{header.group(1)}`" + mark_inline(header.group(2))
    lead = LEADING_PATH.match(s)
    if lead:
        body, punct = trim_punct(lead.group(1))
        return f"`{body}`{punct}" + mark_inline(lead.group(2))
    return mark_inline(s)

def mark_inline(s):
    # Purpose: mark XML runs and tokens containing <...> inside prose
    s = TAG_RUN.sub(lambda m: f"`{m.group(0)}`", s)
    def token(m):
        # Purpose: wrap one whitespace-delimited token that contains <...>
        body, punct = trim_punct(m.group(1))
        return f"`{body}`{punct}" if body else m.group(0)
    parts = re.split(r'(`[^`]*`)', s)
    return "".join(p if p.startswith("`") else ANGLE_TOKEN.sub(token, p) for p in parts)

def convert(q):
    # Purpose: apply code markers to every display string of a compact question
    q = dict(q)
    q["p"], q["e"] = mark(q["p"]), mark(q["e"])
    for k in ("o", "s", "r"):
        if k in q: q[k] = [mark(x) for x in q[k]]
    return q

if __name__ == "__main__":
    write = "--write" in sys.argv
    changed = 0
    out = {}
    for f in sorted(glob.glob("/workspace/src/db/question_sets/*/questions.json")):
        qs = json.load(open(f)); new = [convert(q) for q in qs]
        for a, b in zip(qs, new):
            for k in ("p", "e", "o", "s", "r"):
                av, bv = a.get(k), b.get(k)
                for x, y in (zip(av, bv) if isinstance(av, list) else [(av, bv)]):
                    if x != y: changed += 1; out.setdefault("pairs", []).append((x, y))
        if write: open(f, "w").write(json.dumps(new, indent=1, ensure_ascii=False) + "\n")
    json.dump(out.get("pairs", []), open("/tmp/code_marker_pairs.json", "w"), ensure_ascii=False)
    print(f"{changed} strings changed" + (" (written)" if write else " (dry run)"))
