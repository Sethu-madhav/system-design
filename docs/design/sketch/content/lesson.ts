// src/content/lesson.ts
//
// Owns: what a lesson is. One file per lesson (src/content/lessons/<slug>/lesson.ts)
// default-exports `defineLesson({...})`. The slug is the folder name, never
// authored. defineLesson validates and compiles everything the lesson owns
// (prose, scene timeline, quiz) at module load, so a broken lesson fails the
// content test, and the app only ever holds a parsed, compiled Lesson.
//
// Type flow (why one call is enough):
//   scene: Scene<N, S>             -> S = the step ids, inferred, not context-sensitive
//   body: ({ cue }) => md`...`     -> cue(step: S, ...)   typo = tsc error
//   quiz: Quiz<S>                  -> replay?: S          typo = tsc error
//   sources: Sources               -> adapted only from AdaptableRepo  = tsc error otherwise

import type { Scene } from "@/scene"
import type { Timeline } from "@/scene"
import type { CueFn, Prose, Block } from "./prose"
import type { Quiz } from "./quiz"
import type { Sources, Attribution, SourceRef } from "./sources"
import type { TrackId } from "./curriculum"

export interface LessonInput<N extends string, S extends string> {
  readonly title: string
  /** One sentence; shown on cards and in search results. */
  readonly summary: string
  readonly track: TrackId
  /** Position within the track. Fractions allowed (8.5) so inserting never renumbers. Unique per track. */
  readonly order: number
  readonly sources: Sources
  readonly tags?: readonly string[]
  readonly scene: Scene<N, S>
  readonly body: (kit: { readonly cue: CueFn<S> }) => Prose
  /** NoInfer: S comes from the scene only; otherwise a typo in `replay` would widen S instead of failing. */
  readonly quiz: Quiz<NoInfer<S>>
}

/** What a lesson module default-exports. Has no slug yet; curriculum.ts adds it from the path. */
export interface LessonDraft {
  readonly title: string
  readonly summary: string
  readonly track: TrackId
  readonly order: number
  readonly tags: readonly string[]
  readonly sources: Sources
  readonly body: Prose
  readonly timeline: Timeline
  readonly quiz: Quiz
}

/** The domain object the app uses. Everything derivable is derived here, once. */
export interface Lesson extends LessonDraft {
  readonly slug: string
  readonly minutes: number // from body.words + scene duration
  readonly attributions: readonly Attribution[] // from adapted sources
  readonly furtherReading: readonly Extract<SourceRef, { use: "link" }>[]
  readonly headings: readonly Extract<Block, { t: "h" }>[] // table of contents
}

export function defineLesson<N extends string, S extends string>(_input: LessonInput<N, S>): LessonDraft {
  // TODO: timeline = compile(input.scene); body = input.body({ cue: makeCue<S>() });
  // problems = checkQuiz(input.quiz); if problems.length, throw with all of them.
  throw new Error("not implemented")
}

/** Pure: draft + slug -> Lesson. Called by curriculum.ts only. */
export function finishLesson(_slug: string, _draft: LessonDraft): Lesson {
  throw new Error("not implemented")
}
