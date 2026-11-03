import { PASS_RATIO } from "@/content"

export const STORAGE_KEY = "sd.progress"

export interface QuizScore {
  readonly correct: number
  readonly total: number
  readonly at: number
}

export interface LessonFacts {
  readonly openedAt?: number
  readonly sceneDoneAt?: number
  readonly bestQuiz?: QuizScore
  readonly lastQuiz?: QuizScore
}

export interface ProgressDoc {
  readonly v: 1
  readonly lessons: Readonly<Record<string, LessonFacts>>
}

export type Fact =
  | { readonly kind: "opened"; readonly slug: string; readonly at: number }
  | { readonly kind: "scene-done"; readonly slug: string; readonly at: number }
  | { readonly kind: "quiz"; readonly slug: string; readonly correct: number; readonly total: number; readonly at: number }

export const EMPTY: ProgressDoc = { v: 1, lessons: {} }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function validTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function validScore(value: unknown): value is QuizScore {
  if (!isPlainObject(value)) return false
  return "correct" in value && typeof value.correct === "number" && Number.isInteger(value.correct) &&
    "total" in value && typeof value.total === "number" && Number.isInteger(value.total) && value.total >= 1 &&
    value.correct >= 0 && value.correct <= value.total && "at" in value && validTime(value.at)
}

export function parseDoc(raw: string | null): ProgressDoc {
  if (raw === null) return EMPTY
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return EMPTY
  }
  if (!isPlainObject(parsed) || !("v" in parsed) || parsed.v !== 1 || !("lessons" in parsed)) return EMPTY
  if (!isPlainObject(parsed.lessons)) return { v: 1, lessons: {} }

  const lessons = Object.entries(parsed.lessons).flatMap(([slug, value]) => {
    if (!isPlainObject(value)) return []
    const facts: { openedAt?: number; sceneDoneAt?: number; bestQuiz?: QuizScore; lastQuiz?: QuizScore } = {}
    if ("openedAt" in value && validTime(value.openedAt)) facts.openedAt = value.openedAt
    if ("sceneDoneAt" in value && validTime(value.sceneDoneAt)) facts.sceneDoneAt = value.sceneDoneAt
    if ("bestQuiz" in value && validScore(value.bestQuiz)) facts.bestQuiz = value.bestQuiz
    if ("lastQuiz" in value && validScore(value.lastQuiz)) facts.lastQuiz = value.lastQuiz
    return Object.keys(facts).length > 0 ? [[slug, facts]] : []
  })
  return { v: 1, lessons: Object.fromEntries(lessons) }
}

function ratioOrder(left: QuizScore, right: QuizScore): number {
  const leftCross = left.correct * right.total
  const rightCross = right.correct * left.total
  if (leftCross !== rightCross) return leftCross > rightCross ? 1 : -1
  if (left.at !== right.at) return left.at < right.at ? 1 : -1
  if (left.total !== right.total) return left.total > right.total ? 1 : -1
  return 0
}

function latestOrder(left: QuizScore, right: QuizScore): number {
  if (left.at !== right.at) return left.at > right.at ? 1 : -1
  const leftCross = left.correct * right.total
  const rightCross = right.correct * left.total
  if (leftCross !== rightCross) return leftCross > rightCross ? 1 : -1
  if (left.total !== right.total) return left.total > right.total ? 1 : -1
  return 0
}

function mergeLesson(a: LessonFacts | undefined, b: LessonFacts | undefined): LessonFacts | undefined {
  if (a === undefined) return b
  if (b === undefined) return a
  const openedAt = a.openedAt === undefined ? b.openedAt : b.openedAt === undefined ? a.openedAt : Math.min(a.openedAt, b.openedAt)
  const sceneDoneAt = a.sceneDoneAt === undefined ? b.sceneDoneAt : b.sceneDoneAt === undefined ? a.sceneDoneAt : Math.min(a.sceneDoneAt, b.sceneDoneAt)
  const bestQuiz = a.bestQuiz === undefined ? b.bestQuiz : b.bestQuiz === undefined || ratioOrder(a.bestQuiz, b.bestQuiz) >= 0 ? a.bestQuiz : b.bestQuiz
  const lastQuiz = a.lastQuiz === undefined ? b.lastQuiz : b.lastQuiz === undefined || latestOrder(a.lastQuiz, b.lastQuiz) >= 0 ? a.lastQuiz : b.lastQuiz
  return {
    ...(openedAt === undefined ? {} : { openedAt }),
    ...(sceneDoneAt === undefined ? {} : { sceneDoneAt }),
    ...(bestQuiz === undefined ? {} : { bestQuiz }),
    ...(lastQuiz === undefined ? {} : { lastQuiz }),
  }
}

export function join(a: ProgressDoc, b: ProgressDoc): ProgressDoc {
  const slugs = new Set([...Object.keys(a.lessons), ...Object.keys(b.lessons)])
  const lessons = Object.fromEntries([...slugs].flatMap((slug) => {
    const facts = mergeLesson(a.lessons[slug], b.lessons[slug])
    return facts === undefined ? [] : [[slug, facts]]
  }))
  return { v: 1, lessons }
}

export function apply(doc: ProgressDoc, fact: Fact): ProgressDoc {
  if (fact.kind === "opened") {
    if (!validTime(fact.at)) return doc
    return join(doc, { v: 1, lessons: { [fact.slug]: { openedAt: fact.at } } })
  }
  if (fact.kind === "scene-done") {
    if (!validTime(fact.at)) return doc
    return join(doc, { v: 1, lessons: { [fact.slug]: { sceneDoneAt: fact.at } } })
  }
  const score = { correct: fact.correct, total: fact.total, at: fact.at }
  if (!validScore(score)) return doc
  return join(doc, { v: 1, lessons: { [fact.slug]: { bestQuiz: score, lastQuiz: score } } })
}

function sameScore(a: QuizScore | undefined, b: QuizScore | undefined): boolean {
  return a === undefined ? b === undefined : b !== undefined && a.correct === b.correct && a.total === b.total && a.at === b.at
}

function sameFacts(a: LessonFacts | undefined, b: LessonFacts | undefined): boolean {
  if (a === undefined || b === undefined) return a === b
  return a.openedAt === b.openedAt && a.sceneDoneAt === b.sceneDoneAt &&
    sameScore(a.bestQuiz, b.bestQuiz) && sameScore(a.lastQuiz, b.lastQuiz)
}

export function sameDoc(a: ProgressDoc, b: ProgressDoc): boolean {
  const aSlugs = Object.keys(a.lessons)
  const bSlugs = Object.keys(b.lessons)
  return aSlugs.length === bSlugs.length && aSlugs.every((slug) => Object.hasOwn(b.lessons, slug) && sameFacts(a.lessons[slug], b.lessons[slug]))
}

export type LessonStatus = "new" | "started" | "done"

export function statusOf(doc: ProgressDoc, slug: string): LessonStatus {
  const facts = Object.hasOwn(doc.lessons, slug) ? doc.lessons[slug] : undefined
  if (facts === undefined) return "new"
  if (facts.bestQuiz !== undefined && facts.bestQuiz.correct / facts.bestQuiz.total >= PASS_RATIO) return "done"
  return "started"
}

export interface ProgressSummary {
  readonly done: number
  readonly total: number
  readonly nextSlug?: string
}

export function summarize(doc: ProgressDoc, orderedSlugs: readonly string[]): ProgressSummary {
  let done = 0
  let nextSlug: string | undefined
  for (const slug of orderedSlugs) {
    if (statusOf(doc, slug) === "done") done += 1
    else if (nextSlug === undefined) nextSlug = slug
  }
  return { done, total: orderedSlugs.length, ...(nextSlug === undefined ? {} : { nextSlug }) }
}

export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function memoryKV(): KV {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
}

export interface ProgressStore {
  read(): ProgressDoc
  record(fact: Fact): void
  clear(): void
  subscribe(cb: () => void): () => void
}

export function createProgressStore(kv: KV, key = STORAGE_KEY): ProgressStore {
  const safelyGet = () => {
    try {
      return kv.getItem(key)
    } catch {
      return null
    }
  }
  let memory = parseDoc(safelyGet())
  const subscribers = new Set<() => void>()
  const notify = () => subscribers.forEach((subscriber) => subscriber())
  return {
    read: () => memory,
    record: (fact) => {
      const next = join(apply(memory, fact), parseDoc(safelyGet()))
      try {
        kv.setItem(key, JSON.stringify(next))
      } catch {}
      if (!sameDoc(next, memory)) {
        memory = next
        notify()
      }
    },
    clear: () => {
      memory = EMPTY
      try {
        kv.removeItem(key)
      } catch {}
      notify()
    },
    subscribe: (cb) => {
      subscribers.add(cb)
      return () => { subscribers.delete(cb) }
    },
  }
}
