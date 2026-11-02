const CUE = "\uE000"

interface CueRecord {
  readonly step: string
  readonly text: string
}

const cueData = new WeakMap<object, CueRecord>()

declare const cueBrand: unique symbol

export interface CueToken<S extends string = string> {
  readonly [cueBrand]: S
}

export type CueFn<S extends string> = (step: S, text: string) => CueToken<S>

export type Inline =
  | { readonly t: "text"; readonly v: string }
  | { readonly t: "strong"; readonly c: readonly Inline[] }
  | { readonly t: "em"; readonly c: readonly Inline[] }
  | { readonly t: "code"; readonly v: string }
  | { readonly t: "link"; readonly href: string; readonly c: readonly Inline[] }
  | { readonly t: "cue"; readonly step: string; readonly text: string }

export type CalloutKind = "note" | "tradeoff" | "pitfall"

export type Block =
  | { readonly t: "h"; readonly level: 2 | 3; readonly id: string; readonly c: readonly Inline[] }
  | { readonly t: "p"; readonly c: readonly Inline[] }
  | { readonly t: "ul" | "ol"; readonly items: readonly (readonly Inline[])[] }
  | { readonly t: "callout"; readonly kind: CalloutKind; readonly c: readonly Inline[] }
  | { readonly t: "code"; readonly lang: string; readonly v: string }

export interface Prose {
  readonly blocks: readonly Block[]
  readonly cues: readonly string[]
  readonly words: number
}

interface ParseState {
  readonly records: readonly CueRecord[]
  next: number
}

type Segment =
  | { readonly kind: "group"; readonly lines: readonly string[] }
  | { readonly kind: "code"; readonly lang: string; readonly v: string }

function fail(message: string): never {
  throw new Error(`prose: ${message}`)
}

function isBlank(line: string): boolean {
  return /^\s*$/.test(line)
}

function isHeading(line: string): boolean {
  return line.startsWith("## ") || line.startsWith("### ")
}

export function makeCue<S extends string>(): CueFn<S> {
  return (step, text) => {
    const token = Object.freeze({}) as CueToken<S>
    cueData.set(token, { step, text })
    return token
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function inlineText(inlines: readonly Inline[]): string {
  let text = ""
  for (const inline of inlines) {
    if (inline.t === "text" || inline.t === "code") {
      text += inline.v
    } else if (inline.t === "cue") {
      text += inline.text
    } else {
      text += inlineText(inline.c)
    }
  }
  return text
}

export function blockText(block: Block): string {
  switch (block.t) {
    case "h":
    case "p":
    case "callout":
      return inlineText(block.c)
    case "ul":
    case "ol":
      return block.items.map((item) => inlineText(item)).join("\n")
    case "code":
      return block.v
  }
}

function parseInlines(src: string, line: string, state: ParseState): Inline[] {
  const out: Inline[] = []
  let buf = ""
  let i = 0

  const flush = () => {
    if (buf !== "") {
      out.push({ t: "text", v: buf })
      buf = ""
    }
  }

  while (i < src.length) {
    const ch = src[i]
    if (ch === CUE) {
      flush()
      const record = state.records[state.next]
      if (record === undefined) fail("cue out of range")
      state.next += 1
      out.push({ t: "cue", step: record.step, text: record.text })
      i += 1
      continue
    }
    if (ch === "`") {
      flush()
      const end = src.indexOf("`", i + 1)
      if (end === -1) fail("unclosed code span")
      const v = src.slice(i + 1, end)
      if (v.includes(CUE)) fail("cue inside code")
      out.push({ t: "code", v })
      i = end + 1
      continue
    }
    if (ch === "*") {
      flush()
      if (src[i + 1] === "*") {
        const end = src.indexOf("**", i + 2)
        if (end === -1) fail("unclosed emphasis")
        out.push({ t: "strong", c: parseInlines(src.slice(i + 2, end), line, state) })
        i = end + 2
      } else {
        const end = src.indexOf("*", i + 1)
        if (end === -1) fail("unclosed emphasis")
        out.push({ t: "em", c: parseInlines(src.slice(i + 1, end), line, state) })
        i = end + 1
      }
      continue
    }
    if (ch === "[") {
      flush()
      const close = src.indexOf("]", i + 1)
      if (close === -1) fail(`unsupported syntax "${line}"`)
      if (src[close + 1] !== "(") fail(`unsupported syntax "${line}"`)
      const paren = src.indexOf(")", close + 2)
      if (paren === -1) fail(`unsupported syntax "${line}"`)
      const href = src.slice(close + 2, paren)
      if (!href.startsWith("https://") && !href.startsWith("#/")) {
        fail("link must start with https:// or #/")
      }
      out.push({ t: "link", href, c: parseInlines(src.slice(i + 1, close), line, state) })
      i = paren + 1
      continue
    }
    buf += ch
    i += 1
  }

  flush()
  return out
}

function dedent(text: string): string[] {
  const all = text.split("\n")
  let start = 0
  let end = all.length
  while (start < end && isBlank(all[start])) start += 1
  while (end > start && isBlank(all[end - 1])) end -= 1
  const body = all.slice(start, end)

  let indent = Infinity
  for (const line of body) {
    if (isBlank(line)) continue
    let spaces = 0
    while (line[spaces] === " ") spaces += 1
    if (spaces < indent) indent = spaces
  }
  const width = indent === Infinity ? 0 : indent

  return body.map((line) => (isBlank(line) ? "" : line.slice(width)))
}

function scanSegments(lines: readonly string[]): Segment[] {
  const segments: Segment[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith("```")) {
      if (line.includes(CUE)) fail("cue inside code")
      const lang = line.slice(3).trim()
      let end = i + 1
      while (end < lines.length && lines[end] !== "```") end += 1
      if (end >= lines.length) fail("unclosed code fence")
      const content = lines.slice(i + 1, end)
      if (content.some((inner) => inner.includes(CUE))) fail("cue inside code")
      segments.push({ kind: "code", lang, v: content.join("\n") })
      i = end + 1
      continue
    }
    if (isBlank(line)) {
      i += 1
      continue
    }
    if (isHeading(line)) {
      segments.push({ kind: "group", lines: [line] })
      i += 1
      continue
    }

    const group: string[] = []
    while (i < lines.length) {
      const current = lines[i]
      if (isBlank(current) || current.startsWith("```") || isHeading(current)) break
      group.push(current)
      i += 1
    }
    segments.push({ kind: "group", lines: group })
  }

  return segments
}

function checkUnsupported(segments: readonly Segment[]): void {
  for (const segment of segments) {
    if (segment.kind !== "group") continue
    for (const line of segment.lines) {
      const trimmed = line.trimStart()
      const unsupported = `unsupported syntax "${trimmed}"`
      if (trimmed.startsWith("|")) fail(unsupported)
      if (trimmed.startsWith("#") && !trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
        fail(unsupported)
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("+ ")) fail(unsupported)
      const plain = trimmed.replace(/`[^`]*`/g, "")
      if (plain.includes("![")) fail(unsupported)
      if (/<[A-Za-z/!]/.test(plain)) fail(unsupported)
    }
  }
}

function parseHeading(
  level: 2 | 3,
  text: string,
  state: ParseState,
  ids: Set<string>,
): Block {
  const c = parseInlines(text, text, state)
  const id = slugify(inlineText(c))
  if (id === "") fail("heading id is empty")
  if (ids.has(id)) fail(`duplicate heading id "${id}"`)
  ids.add(id)
  return { t: "h", level, id, c }
}

function parseList(lines: readonly string[], ordered: boolean, state: ParseState): Block {
  const sources: string[] = []

  for (const line of lines) {
    const marker = ordered ? /^\d+\. /.exec(line) : null
    if (ordered && marker !== null) {
      sources.push(line.slice(marker[0].length))
      continue
    }
    if (!ordered && line.startsWith("- ")) {
      sources.push(line.slice(2))
      continue
    }
    if (/^\s/.test(line)) {
      const trimmed = line.trim()
      if (trimmed.startsWith("- ") || /^\d+\. /.test(trimmed)) fail("nested list")
      const previous = sources[sources.length - 1]
      if (previous === undefined) fail(`missing blank line before "${trimmed}"`)
      sources[sources.length - 1] = `${previous} ${trimmed}`
      continue
    }
    fail(`missing blank line before "${line}"`)
  }

  return {
    t: ordered ? "ol" : "ul",
    items: sources.map((source) => parseInlines(source, source, state)),
  }
}

function parseCallout(lines: readonly string[], state: ParseState): Block {
  const first = lines[0]
  const match = /^> (note|tradeoff|pitfall): /.exec(first)
  if (match === null) fail(`unknown callout kind "${first}"`)
  const kindText = match[1]
  if (kindText !== "note" && kindText !== "tradeoff" && kindText !== "pitfall") {
    fail(`unknown callout kind "${first}"`)
  }
  const parts = [first.slice(match[0].length)]

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (!line.startsWith("> ")) fail(`missing blank line before "${line}"`)
    parts.push(line.slice(2))
  }

  const source = parts.map((part) => part.trim()).join(" ")
  return { t: "callout", kind: kindText, c: parseInlines(source, source, state) }
}

function parseParagraph(lines: readonly string[], state: ParseState): Block {
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.startsWith("- ") || line.startsWith("> ") || /^\d+\. /.test(line)) {
      fail(`missing blank line before "${line}"`)
    }
  }
  const source = lines.map((line) => line.trim()).join(" ")
  return { t: "p", c: parseInlines(source, source, state) }
}

function parseGroup(lines: readonly string[], state: ParseState, ids: Set<string>): Block {
  const first = lines[0]
  if (first.startsWith("### ")) return parseHeading(3, first.slice(4), state, ids)
  if (first.startsWith("## ")) return parseHeading(2, first.slice(3), state, ids)
  if (first.startsWith("- ")) return parseList(lines, false, state)
  if (/^\d+\. /.test(first)) return parseList(lines, true, state)
  if (first.startsWith("> ")) return parseCallout(lines, state)
  return parseParagraph(lines, state)
}

export function md(strings: TemplateStringsArray, ...cues: CueToken[]): Prose {
  for (const part of strings) {
    if (part.includes(CUE)) fail("reserved character in text")
  }

  const records: CueRecord[] = []
  for (const token of cues) {
    const record = cueData.get(token)
    if (record === undefined) fail("interpolation is not a cue")
    records.push(record)
  }

  let text = ""
  for (let i = 0; i < strings.length; i += 1) {
    text += strings[i]
    if (i < cues.length) text += CUE
  }

  const segments = scanSegments(dedent(text))
  checkUnsupported(segments)

  const state: ParseState = { records, next: 0 }
  const ids = new Set<string>()
  const blocks: Block[] = []
  for (const segment of segments) {
    if (segment.kind === "code") {
      blocks.push({ t: "code", lang: segment.lang, v: segment.v })
    } else {
      blocks.push(parseGroup(segment.lines, state, ids))
    }
  }

  let words = 0
  for (const block of blocks) {
    words += blockText(block).split(/\s+/).filter(Boolean).length
  }

  return { blocks, cues: records.map((record) => record.step), words }
}
