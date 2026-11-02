export type Rule = "adapt" | "link" | "link-only"

interface SourceBase {
  readonly title: string
  readonly author: string
  readonly url: string
  readonly license: string
}

export type SourceInfo =
  | (SourceBase & { readonly rule: "adapt"; readonly licenseUrl: string })
  | (SourceBase & { readonly rule: "link" | "link-only" })

export const SOURCES = {
  "donnemartin/system-design-primer": {
    rule: "adapt",
    title: "The System Design Primer",
    author: "Donne Martin",
    url: "https://github.com/donnemartin/system-design-primer",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
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

export type AdaptableRepo = {
  [K in RepoId]: (typeof SOURCES)[K]["rule"] extends "adapt" ? K : never
}[RepoId]

export type SourceRef =
  | { readonly use: "adapted"; readonly repo: AdaptableRepo; readonly section: string; readonly anchor: string }
  | { readonly use: "link"; readonly title: string; readonly url: string; readonly repo?: RepoId }

export type Sources = readonly [SourceRef, ...SourceRef[]]

export const CHANGE_NOTICE = "Text paraphrased and shortened. Diagrams are original."

export interface Attribution {
  readonly text: string
  readonly sourceUrl: string
  readonly license: string
  readonly licenseUrl: string
  readonly changed: typeof CHANGE_NOTICE
}

export function attribution(ref: Extract<SourceRef, { use: "adapted" }>): Attribution {
  const source = SOURCES[ref.repo]
  return {
    text: `Adapted from "${ref.section}" in ${source.title} by ${source.author}.`,
    sourceUrl: `${source.url}#${ref.anchor}`,
    license: source.license,
    licenseUrl: source.licenseUrl,
    changed: CHANGE_NOTICE,
  }
}

function toRule(text: string): Rule {
  if (text === "Adapt.") return "adapt"
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
