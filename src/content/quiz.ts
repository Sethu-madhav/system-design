export interface Option {
  readonly text: string
  readonly correct?: true
  readonly why?: string
}

interface QuestionBase<S extends string> {
  readonly prompt: string
  readonly explain: string
  readonly replay?: S
}

export type Question<S extends string = string> =
  | (QuestionBase<S> & { readonly kind: "choice"; readonly options: readonly Option[] })
  | (QuestionBase<S> & { readonly kind: "multi"; readonly options: readonly Option[] })
  | (QuestionBase<S> & { readonly kind: "order"; readonly items: readonly string[] })

export type Quiz<S extends string = string> = readonly Question<S>[]

export type Answer = number | readonly number[]

export interface QuestionResult {
  readonly correct: boolean
  readonly picked: Answer | null
}

export interface QuizResult {
  readonly perQuestion: readonly QuestionResult[]
  readonly correct: number
  readonly total: number
  readonly needed: number
  readonly passed: boolean
}

export const PASS_RATIO = 0.7

export function grade(quiz: Quiz, answers: readonly (Answer | null)[]): QuizResult {
  const perQuestion = quiz.map((question, index): QuestionResult => {
    const answer = answers[index] ?? null
    let correct = false

    if (question.kind === "choice") {
      correct = typeof answer === "number" && question.options[answer]?.correct === true
    } else if (question.kind === "multi") {
      if (Array.isArray(answer)) {
        const picked = new Set(answer)
        const expected = new Set(
          question.options.flatMap((option, optionIndex) => option.correct === true ? [optionIndex] : []),
        )
        correct = picked.size === expected.size && [...expected].every((index) => picked.has(index))
      }
    } else if (Array.isArray(answer)) {
      correct = answer.length === question.items.length &&
        answer.every((itemIndex, index) => itemIndex === index)
    }

    return { correct, picked: answer }
  })
  const correct = perQuestion.filter((result) => result.correct).length
  const total = quiz.length
  let needed = 0

  while (needed < total && needed / total < PASS_RATIO) {
    needed += 1
  }

  return {
    perQuestion,
    correct,
    total,
    needed,
    passed: total > 0 && correct >= needed,
  }
}

export function checkQuiz(quiz: Quiz): readonly string[] {
  const problems: string[] = []
  if (quiz.length < 3) problems.push("quiz needs at least 3 questions")

  const prompts = new Set<string>()

  for (let index = 0; index < quiz.length; index += 1) {
    const question = quiz[index]
    const n = index + 1

    if (prompts.has(question.prompt)) problems.push(`question ${n}: duplicate prompt`)
    prompts.add(question.prompt)

    if (question.kind === "choice" || question.kind === "multi") {
      if (question.options.length < 2) problems.push(`question ${n}: needs at least 2 options`)

      const correct = question.options.filter((option) => option.correct === true).length

      if (question.kind === "choice") {
        if (correct !== 1) problems.push(`question ${n}: choice needs exactly 1 correct option`)
      } else if (correct === 0 || correct === question.options.length) {
        problems.push(`question ${n}: multi needs at least 1 correct and 1 wrong option`)
      }
    } else {
      if (question.items.length < 3) problems.push(`question ${n}: order needs at least 3 items`)
      if (new Set(question.items).size !== question.items.length) {
        problems.push(`question ${n}: order items must be distinct`)
      }
    }
  }

  return problems
}

export function shuffledOrder(n: number, seed: string): readonly number[] {
  let h = 2166136261

  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }

  let state = (h % 2147483646) + 1
  const order = Array.from({ length: n }, (_, i) => i)

  for (let i = n - 1; i >= 1; i -= 1) {
    state = (state * 16807) % 2147483647
    const j = Math.floor((state / 2147483647) * (i + 1))
    const swap = order[i]
    order[i] = order[j]
    order[j] = swap
  }

  if (n >= 2 && order.every((value, index) => value === index)) {
    return [...order.slice(1), order[0]]
  }

  return order
}
