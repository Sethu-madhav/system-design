export type Rule = "link" | "link-only"

export interface SourceInfo {
  readonly rule: Rule
  readonly title: string
  readonly author: string
  readonly url: string
  readonly license: string
}

export const SOURCES = {
  "donnemartin/system-design-primer": {
    rule: "link",
    title: "The System Design Primer",
    author: "Donne Martin",
    url: "https://github.com/donnemartin/system-design-primer",
    license: "CC BY 4.0",
  },
  "binhnguyennus/awesome-scalability": {
    rule: "link",
    title: "awesome-scalability",
    author: "Binh Nguyen",
    url: "https://github.com/binhnguyennus/awesome-scalability",
    license: "MIT",
  },
  "ByteByteGoHq/system-design-101": {
    rule: "link-only",
    title: "System Design 101",
    author: "ByteByteGo",
    url: "https://github.com/ByteByteGoHq/system-design-101",
    license: "CC BY-NC-ND 4.0",
  },
  "karanpratapsingh/system-design": {
    rule: "link-only",
    title: "System Design",
    author: "Karan Pratap Singh",
    url: "https://github.com/karanpratapsingh/system-design",
    license: "CC BY-NC-ND 4.0",
  },
  "ashishps1/awesome-system-design-resources": {
    rule: "link-only",
    title: "awesome-system-design-resources",
    author: "Ashish Pratap Singh",
    url: "https://github.com/ashishps1/awesome-system-design-resources",
    license: "GPL-3.0",
  },
  "InterviewReady/system-design-resources": {
    rule: "link-only",
    title: "system-design-resources",
    author: "InterviewReady",
    url: "https://github.com/InterviewReady/system-design-resources",
    license: "GPL-3.0",
  },
  "checkcheckzz/system-design-interview": {
    rule: "link-only",
    title: "system-design-interview",
    author: "checkcheckzz",
    url: "https://github.com/checkcheckzz/system-design-interview",
    license: "None",
  },
} as const satisfies Record<string, SourceInfo>

export type RepoId = keyof typeof SOURCES

export interface SourceRef {
  readonly use: "link"
  readonly title: string
  readonly url: string
  readonly repo?: RepoId
}

export type Sources = readonly [SourceRef, ...SourceRef[]]

function toRule(text: string): Rule {
  if (text === "Link.") return "link"
  if (text === "Link only.") return "link-only"
  throw new Error(`Unknown rule: ${text}`)
}

export function parseSourcesTable(markdown: string): ReadonlyMap<string, Rule> {
  const lines = markdown.split("\n")
  const headerIndex = lines.findIndex((line) => line.startsWith("| Repo |"))
  if (headerIndex === -1) {
    throw new Error("Repo table not found")
  }
  const separator = lines[headerIndex + 1] ?? ""
  if (!/^\|[-:| ]+\|$/.test(separator.trim())) {
    throw new Error(`Repo table has no separator row: ${separator}`)
  }

  const rules = new Map<string, Rule>()
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.startsWith("|")) break
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim())
    const key = /^\[([^\]]+)\]\(/.exec(cells[0] ?? "")?.[1]
    const rule = cells[3]
    if (key === undefined || rule === undefined) {
      throw new Error(`Malformed Repo row: ${line}`)
    }
    if (rules.has(key)) {
      throw new Error(`Duplicate Repo row: ${key}`)
    }
    rules.set(key, toRule(rule))
  }
  return rules
}
