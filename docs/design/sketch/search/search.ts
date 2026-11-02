// src/search/search.ts
//
// Owns: search. The corpus is the curriculum (tens of lessons), so the index is
// built in memory on first open of the palette, from the same parsed Lesson
// objects the pages render. No build step, no extra dependency, no second copy
// of the text that could drift.
//
// Documents: one per lesson (title, summary, tags), one per h2/h3 section (heading
// + following blocks until the next heading), one per scene step caption.
// Scoring: per query token, exact word > prefix match; field weight title 5,
// heading 3, tag 3, caption 2, body 1; all tokens must match (AND).

import type { Lesson } from "@/content"

export type DocKind = "lesson" | "section" | "step"

export interface SearchDoc {
  readonly kind: DocKind
  readonly slug: string
  readonly lessonTitle: string
  /** h2/h3 id for sections; step id for steps. Becomes the route's `section`/`step`. */
  readonly anchor?: string
  readonly title: string
  readonly text: string
}

export interface SearchIndex {
  readonly docs: readonly SearchDoc[]
  /** token -> doc indices. Built once; search never rescans text to find candidates. */
  readonly postings: ReadonlyMap<string, readonly number[]>
}

export interface Hit {
  readonly doc: SearchDoc
  readonly score: number
  /** ~120 chars around the first match, split for highlighting. */
  readonly snippet: { readonly before: string; readonly match: string; readonly after: string }
}

export function tokenize(_text: string): readonly string[] {
  // TODO: lowercase, NFKD strip accents, split on non-alphanumerics, drop tokens < 2 chars, keep "l4"/"l7".
  throw new Error("not implemented")
}

export function buildIndex(_lessons: readonly Lesson[]): SearchIndex {
  throw new Error("not implemented")
}

export function search(_index: SearchIndex, _query: string, _limit?: number): readonly Hit[] {
  // TODO: tokens = tokenize(query); for the last token use prefix lookup over postings keys.
  throw new Error("not implemented")
}
