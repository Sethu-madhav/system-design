// src/progress/progress.ts
//
// Owns: the learner's progress and the one localStorage key it lives in.
//
// Shared state: two tabs can both write. Each record merges with what is in
// storage before writing, so one tab never erases another tab's facts:
//   record(fact): mem = join(apply(mem, fact), readStorage()); write(mem)
// Every field only moves one way (first-opened is a min, best quiz is a max), so
// `join` is commutative, associative, and idempotent and a fact recorded twice
// changes nothing. There is no live sync: another tab sees new facts on reload.
//
// Completion is derived (best quiz passed), never stored.

export const STORAGE_KEY = "sd.progress"

export interface QuizScore {
  readonly correct: number
  readonly total: number
  readonly at: number
}

export interface LessonFacts {
  readonly openedAt?: number // min
  readonly sceneDoneAt?: number // min
  readonly bestQuiz?: QuizScore // max by correct/total, ties -> earlier
  readonly lastQuiz?: QuizScore // max by at
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

/** Boundary parse: anything malformed is dropped field by field, never thrown. Unknown v -> EMPTY. */
export function parseDoc(_raw: string | null): ProgressDoc {
  throw new Error("not implemented")
}

export function apply(_doc: ProgressDoc, _fact: Fact): ProgressDoc {
  throw new Error("not implemented")
}

export function join(_a: ProgressDoc, _b: ProgressDoc): ProgressDoc {
  throw new Error("not implemented")
}

export function sameDoc(_a: ProgressDoc, _b: ProgressDoc): boolean {
  throw new Error("not implemented")
}

export type LessonStatus = "new" | "started" | "done"

/** done = bestQuiz passes PASS_RATIO; started = any fact; else new. Slugs not in the curriculum are kept but ignored. */
export function statusOf(_doc: ProgressDoc, _slug: string): LessonStatus {
  throw new Error("not implemented")
}

export interface ProgressSummary {
  readonly done: number
  readonly total: number
  /** First lesson in curriculum order that is not done: the "continue" target. */
  readonly nextSlug?: string
}

export function summarize(_doc: ProgressDoc, _orderedSlugs: readonly string[]): ProgressSummary {
  throw new Error("not implemented")
}

/** Minimal Storage so tests pass a Map-backed fake; the hook passes window.localStorage. */
export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface ProgressStore {
  read(): ProgressDoc
  record(fact: Fact): void
  /** Settings page "reset progress". */
  clear(): void
  subscribe(cb: () => void): () => void
}

export function createProgressStore(_kv: KV, _key?: string): ProgressStore {
  throw new Error("not implemented")
}
