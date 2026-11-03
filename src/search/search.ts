import type { Block, Inline, Lesson } from "@/content"

interface DocBase {
  readonly slug: string
  readonly lessonTitle: string
  readonly title: string
  readonly text: string
}

export type SearchDoc =
  | (DocBase & { readonly kind: "lesson" })
  | (DocBase & { readonly kind: "section"; readonly anchor: string })
  | (DocBase & { readonly kind: "step"; readonly anchor: string })

export type DocKind = SearchDoc["kind"]

export interface Posting {
  readonly doc: number
  readonly weight: number
}

export interface SearchIndex {
  readonly docs: readonly SearchDoc[]
  readonly postings: ReadonlyMap<string, readonly Posting[]>
}

export interface Snippet {
  readonly before: string
  readonly match: string
  readonly after: string
}

export interface Hit {
  readonly doc: SearchDoc
  readonly score: number
  readonly snippet: Snippet
}

export const DEFAULT_LIMIT = 20

export function tokenize(text: string): readonly string[] {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length >= 2)
}

function inlineText(inlines: readonly Inline[]): string {
  return inlines.map((inline) => {
    switch (inline.t) {
      case "text":
      case "code":
        return inline.v
      case "cue":
        return inline.text
      case "strong":
      case "em":
      case "link":
        return inlineText(inline.c)
    }
  }).join("")
}

function blockText(block: Block): string {
  switch (block.t) {
    case "h":
    case "p":
    case "callout":
      return inlineText(block.c)
    case "ul":
    case "ol":
      return block.items.map(inlineText).join(" ")
    case "code":
      return block.v
  }
}

function plainBlocks(blocks: readonly Block[]): string {
  return blocks.map(blockText).join(" ")
}

function addField(weights: Map<string, number>, text: string, weight: number) {
  for (const token of tokenize(text)) {
    weights.set(token, Math.max(weights.get(token) ?? 0, weight))
  }
}

function addPostings(postings: Map<string, Posting[]>, doc: number, weights: ReadonlyMap<string, number>) {
  for (const [token, weight] of weights) {
    const entries = postings.get(token) ?? []
    entries.push({ doc, weight })
    postings.set(token, entries)
  }
}

export function buildIndex(lessons: readonly Lesson[]): SearchIndex {
  const docs: SearchDoc[] = []
  const postings = new Map<string, Posting[]>()

  for (const lesson of lessons) {
    const lessonDoc: SearchDoc = {
      kind: "lesson",
      slug: lesson.slug,
      lessonTitle: lesson.title,
      title: lesson.title,
      text: lesson.summary,
    }
    docs.push(lessonDoc)
    const lessonPosition = docs.length - 1
    const lessonWeights = new Map<string, number>()
    addField(lessonWeights, lesson.title, 5)
    for (const tag of lesson.tags) addField(lessonWeights, tag, 3)
    addField(lessonWeights, lesson.summary, 1)
    addPostings(postings, lessonPosition, lessonWeights)

    const blocks = lesson.body.blocks
    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i]
      if (block?.t !== "h") continue
      let end = i + 1
      while (end < blocks.length && blocks[end]?.t !== "h") end += 1
      const section: SearchDoc = {
        kind: "section",
        slug: lesson.slug,
        lessonTitle: lesson.title,
        title: inlineText(block.c),
        text: plainBlocks(blocks.slice(i + 1, end)),
        anchor: block.id,
      }
      docs.push(section)
      const position = docs.length - 1
      const sectionWeights = new Map<string, number>()
      addField(sectionWeights, section.title, 3)
      addField(sectionWeights, section.text, 1)
      addPostings(postings, position, sectionWeights)
    }

    for (const step of lesson.timeline.steps) {
      const doc: SearchDoc = {
        kind: "step",
        slug: lesson.slug,
        lessonTitle: lesson.title,
        title: `Step ${step.index + 1}`,
        text: step.caption,
        anchor: step.id,
      }
      docs.push(doc)
      const stepWeights = new Map<string, number>()
      addField(stepWeights, doc.text, 2)
      addPostings(postings, docs.length - 1, stepWeights)
    }
  }

  return { docs, postings }
}

function snippet(text: string, queryTokens: readonly string[]): Snippet {
  const lower = text.toLowerCase()
  let matchAt = -1
  for (let i = 0; i < lower.length; i += 1) {
    const wordStart = i === 0 || !/[a-z0-9]/.test(lower[i - 1] ?? "")
    if (!wordStart) continue
    const matching = queryTokens.find((token, tokenIndex) => {
      if (!lower.startsWith(token, i)) return false
      return tokenIndex === queryTokens.length - 1 || !/[a-z0-9]/.test(lower[i + token.length] ?? "")
    })
    if (matching !== undefined) {
      matchAt = i
      break
    }
  }
  if (matchAt === -1) return { before: "", match: "", after: `${text.slice(0, 120)}${text.length > 120 ? "…" : ""}` }
  let end = matchAt
  while (end < lower.length && /[a-z0-9]/.test(lower[end] ?? "")) end += 1
  return {
    before: `${matchAt > 60 ? "…" : ""}${text.slice(Math.max(0, matchAt - 60), matchAt)}`,
    match: text.slice(matchAt, end),
    after: `${text.slice(end, end + 60)}${end + 60 < text.length ? "…" : ""}`,
  }
}

export function search(index: SearchIndex, query: string, limit = DEFAULT_LIMIT): readonly Hit[] {
  const queryTokens = [...new Set(tokenize(query))]
  if (queryTokens.length === 0) return []

  const candidateKeys = queryTokens.map((token, tokenIndex) => {
    const keys: string[] = []
    if (index.postings.has(token)) keys.push(token)
    if (tokenIndex === queryTokens.length - 1) {
      for (const key of index.postings.keys()) {
        if (key !== token && key.startsWith(token)) keys.push(key)
      }
    }
    return keys.map((key) => ({ key, postings: index.postings.get(key) ?? [] }))
  })

  let documentScores = new Map<number, number>()
  for (const [tokenIndex, candidates] of candidateKeys.entries()) {
    const token = queryTokens[tokenIndex]
    if (token === undefined) continue
    const tokenScores = new Map<number, number>()
    for (const candidate of candidates) {
      const multiplier = candidate.key === token ? 2 : 1
      for (const posting of candidate.postings) {
        const score = posting.weight * multiplier
        tokenScores.set(posting.doc, Math.max(tokenScores.get(posting.doc) ?? 0, score))
      }
    }
    if (tokenIndex === 0) {
      documentScores = tokenScores
    } else {
      for (const [doc, score] of documentScores) {
        const tokenScore = tokenScores.get(doc)
        if (tokenScore === undefined) documentScores.delete(doc)
        else documentScores.set(doc, score + tokenScore)
      }
    }
    if (documentScores.size === 0) return []
  }

  return [...documentScores.entries()]
    .map(([position, score]) => ({ doc: index.docs[position], score, position }))
    .filter((entry): entry is { doc: SearchDoc; score: number; position: number } => entry.doc !== undefined)
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, limit)
    .map(({ doc, score }) => ({ doc, score, snippet: snippet(doc.text, queryTokens) }))
}
