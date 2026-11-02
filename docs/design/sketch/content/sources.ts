// src/content/sources.ts
//
// Owns: the source registry and the license rule from docs/sources.md, in a form
// the TypeScript compiler enforces. docs/sources.md stays the human-facing source
// of truth; `content.test.ts` parses its table and fails `pnpm build` if this
// registry disagrees with it (hand-synced list -> build fails on mismatch).
//
// Invariant encoded in types: a SourceRef with `use: "adapted"` can only name a
// repo whose rule is "adapt". Citing a "Link only" repo as adapted is a tsc error,
// and `pnpm build` starts with `tsc -b`.

export type Rule = "adapt" | "link" | "link-only"

export interface SourceInfo {
  readonly rule: Rule
  readonly title: string
  readonly author: string
  readonly url: string
  readonly license: string
  /** Required for rule "adapt": CC BY 4.0 wants a link to the license. */
  readonly licenseUrl?: string
}

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

/** Repos whose rule is "adapt". Derived from SOURCES, never listed by hand. */
export type AdaptableRepo = {
  [K in RepoId]: (typeof SOURCES)[K]["rule"] extends "adapt" ? K : never
}[RepoId]

/**
 * What a lesson cites. Two shapes, discriminated by `use`:
 * - adapted: the lesson paraphrases `section` of an adaptable repo. Attribution
 *   text (author, license link, "changed" notice) is derived, never authored.
 * - link: further reading. Any URL; `repo` is set when the URL is in a table repo.
 */
export type SourceRef =
  | { readonly use: "adapted"; readonly repo: AdaptableRepo; readonly section: string; readonly anchor: string }
  | { readonly use: "link"; readonly title: string; readonly url: string; readonly repo?: RepoId }

/** Non-empty: every lesson names at least one source (docs/sources.md, "Who enforces"). */
export type Sources = readonly [SourceRef, ...SourceRef[]]

/** A rendered attribution line. The UI never builds attribution strings itself. */
export interface Attribution {
  readonly text: string // "Adapted from “Load balancer” in The System Design Primer by Donne Martin."
  readonly sourceUrl: string // repo url + "#" + anchor
  readonly license: string
  readonly licenseUrl: string
  readonly changed: "Text paraphrased and shortened; diagrams are original."
}

export function attribution(_ref: Extract<SourceRef, { use: "adapted" }>): Attribution {
  throw new Error("not implemented")
}

/**
 * Parses the markdown table in docs/sources.md into repo -> rule.
 * Used only by content.test.ts to prove SOURCES matches the doc.
 * Rule column text: "Adapt." -> adapt, "Link." -> link, "Link only." -> link-only.
 */
export function parseSourcesTable(_markdown: string): ReadonlyMap<string, Rule> {
  // TODO: find the "| Repo |" header row, skip the separator row,
  // for each row: repo = text inside [..] of column 1, rule = column 4 trimmed.
  // Throw on an unknown rule string so a new rule in the doc forces a code change.
  throw new Error("not implemented")
}
