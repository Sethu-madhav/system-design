// src/progress/index.ts — app-facing surface. One store per window, created lazily.
//
// const { doc, status, summary, record } = useProgress()
//   status(slug) -> "new" | "started" | "done"
//   record({ kind: "quiz", slug, correct, total, at: Date.now() })
// useProgress = useSyncExternalStore(store.subscribe, store.read).

import type { Fact, LessonStatus, ProgressDoc, ProgressSummary } from "./progress"

export interface UseProgress {
  readonly doc: ProgressDoc
  readonly summary: ProgressSummary
  status(slug: string): LessonStatus
  record(fact: Fact): void
  clear(): void
}

export function useProgress(): UseProgress {
  throw new Error("not implemented")
}

export type { Fact, LessonStatus } from "./progress"
