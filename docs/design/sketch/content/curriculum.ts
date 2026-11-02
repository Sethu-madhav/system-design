// src/content/curriculum.ts
//
// Owns: which lessons exist and their order. Lessons are discovered with
// import.meta.glob; nobody maintains a list of lessons. The only hand-written
// list is TRACKS (about ten sections, rarely changed), and a lesson naming a
// track that is not in it is a tsc error.
//
// Access patterns, all answered from one structure built once at module load:
//   home page: tracks in order, each with its lessons in order   -> curriculum.tracks
//   lesson page: lesson by slug                                   -> curriculum.bySlug
//   prev / next across track boundaries                           -> curriculum.flat + index
//   search index                                                  -> curriculum.flat

import type { Lesson, LessonDraft } from "./lesson"

export const TRACKS = [
  { id: "foundations", title: "Foundations" }, // performance vs scalability, latency vs throughput, CAP, consistency, availability
  { id: "edge", title: "Edge and traffic" }, // DNS, CDN, load balancer, reverse proxy
  { id: "application", title: "Application layer" }, // microservices, service discovery
  { id: "data", title: "Databases" },
  { id: "cache", title: "Caching" },
  { id: "async", title: "Asynchronism" },
  { id: "communication", title: "Communication" },
  { id: "security", title: "Security" },
  { id: "estimation", title: "Back of the envelope" },
  { id: "case-studies", title: "Case studies" },
] as const

export type TrackId = (typeof TRACKS)[number]["id"]

export interface Track {
  readonly id: TrackId
  readonly title: string
  readonly lessons: readonly Lesson[]
}

export interface Curriculum {
  readonly tracks: readonly Track[] // empty tracks omitted
  readonly flat: readonly Lesson[] // tracks order, then lesson order
  readonly bySlug: ReadonlyMap<string, Lesson>
}

export interface Neighbors {
  readonly prev?: Lesson
  readonly next?: Lesson
}

/**
 * Pure, so tests pass a fake module map. Keys look like
 * "./lessons/load-balancer/lesson.ts"; slug = the folder name.
 * Throws on: slug not kebab-case, duplicate (track, order).
 */
export function buildCurriculum(_modules: Record<string, { readonly default: LessonDraft }>): Curriculum {
  throw new Error("not implemented")
}

export function neighbors(_c: Curriculum, _slug: string): Neighbors {
  throw new Error("not implemented")
}

// The one place lesson files are found. Eager: the whole curriculum is text and
// small scene data, and search needs all of it anyway.
// Step 7 must define this export; content/index.ts re-exports it.
// export const curriculum = buildCurriculum(import.meta.glob("./lessons/*/lesson.ts", { eager: true }))
