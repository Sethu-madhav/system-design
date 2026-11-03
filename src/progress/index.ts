import * as React from "react"
import { curriculum } from "@/content"
import {
  createProgressStore,
  memoryKV,
  statusOf,
  summarize,
  type Fact,
  type LessonStatus,
  type ProgressDoc,
  type ProgressSummary,
  type ProgressStore,
} from "./progress"

export interface UseProgress {
  readonly doc: ProgressDoc
  readonly summary: ProgressSummary
  status(slug: string): LessonStatus
  record(fact: Fact): void
  clear(): void
}

let store: ProgressStore | undefined

function getStore(): ProgressStore {
  if (store !== undefined) return store
  try {
    store = typeof window === "undefined" ? createProgressStore(memoryKV()) : createProgressStore(window.localStorage)
  } catch {
    store = createProgressStore(memoryKV())
  }
  return store
}

export function useProgress(): UseProgress {
  const current = getStore()
  const doc = React.useSyncExternalStore(current.subscribe, current.read)
  const summary = React.useMemo(
    () => summarize(doc, curriculum.flat.map((lesson) => lesson.slug)),
    [doc],
  )
  return {
    doc,
    summary,
    status: (slug) => statusOf(doc, slug),
    record: current.record,
    clear: current.clear,
  }
}

export { STORAGE_KEY } from "./progress"
export type { Fact, LessonStatus, ProgressDoc, ProgressSummary } from "./progress"
