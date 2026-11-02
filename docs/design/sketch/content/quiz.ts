// src/content/quiz.ts
//
// Owns: quiz shape and grading. Pure. The UI keeps answers in component state,
// calls `grade`, and records the result as a progress fact; it never decides
// correctness itself.

export interface Option {
  readonly text: string
  /** Marks a right answer. Kept on the option so the author sees answer and text together. */
  readonly correct?: true
  /** Shown after submit when this option was picked. */
  readonly why?: string
}

/**
 * `S` is the lesson's scene step-id union. `replay` lets the result screen offer
 * "show me" that jumps the diagram to the step that explains the answer. A typo
 * in `replay` is a tsc error.
 */
export type Question<S extends string = string> =
  | {
      readonly kind: "choice" // exactly one option has `correct: true`
      readonly prompt: string
      readonly options: readonly Option[]
      readonly explain: string
      readonly replay?: S
    }
  | {
      readonly kind: "multi" // one or more options are correct; all must be picked
      readonly prompt: string
      readonly options: readonly Option[]
      readonly explain: string
      readonly replay?: S
    }
  | {
      readonly kind: "order" // authored in the correct order; shown shuffled
      readonly prompt: string
      readonly items: readonly string[]
      readonly explain: string
      readonly replay?: S
    }

export type Quiz<S extends string = string> = readonly Question<S>[]

/** One answer per question, same index. choice: option index; multi: indices; order: item indices in chosen order. */
export type Answer = number | readonly number[]

export interface QuestionResult {
  readonly correct: boolean
  readonly picked: Answer | null
}

export interface QuizResult {
  readonly perQuestion: readonly QuestionResult[]
  readonly correct: number
  readonly total: number
  readonly passed: boolean
}

export const PASS_RATIO = 0.7

export function grade(_quiz: Quiz, _answers: readonly (Answer | null)[]): QuizResult {
  // TODO: unanswered -> incorrect. multi: set equality of picked and correct indices.
  // order: picked deep-equals [0..n-1]. passed = correct / total >= PASS_RATIO.
  throw new Error("not implemented")
}

/** Deterministic display order for "order" questions so reload shows the same puzzle. Never returns the identity order when n > 1. */
export function shuffledOrder(_n: number, _seed: string): readonly number[] {
  throw new Error("not implemented")
}

/** Content invariants; returns problems instead of throwing so the test can list all of them. */
export function checkQuiz(_quiz: Quiz): readonly string[] {
  // TODO: >= 3 questions; choice has exactly 1 correct; multi has >= 1 correct and >= 1 wrong;
  // >= 2 options; order has >= 3 items, all distinct; prompts unique.
  throw new Error("not implemented")
}
