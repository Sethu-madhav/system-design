// src/content/index.ts — the app-facing surface of src/content.
// Pages import the built curriculum and domain types; they never import a lesson
// file, the parser, or the source registry internals.

export { curriculum, neighbors, TRACKS } from "./curriculum"
export type { Curriculum, Track, TrackId } from "./curriculum"
export type { Lesson } from "./lesson"
export type { Prose, Block, Inline } from "./prose"
export { grade, shuffledOrder, PASS_RATIO } from "./quiz"
export type { Quiz, Question, Answer, QuizResult } from "./quiz"
export type { Attribution, SourceRef } from "./sources"
