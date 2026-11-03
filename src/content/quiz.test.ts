import { expect, test } from "vitest"
import { checkQuiz, grade, PASS_RATIO, shuffledOrder, type Question } from "./quiz"

const goodChoice: Question = {
  kind: "choice",
  prompt: "Pick one.",
  options: [
    { text: "x", correct: true },
    { text: "y" },
  ],
  explain: "e",
}

const goodMulti: Question = {
  kind: "multi",
  prompt: "Pick several.",
  options: [
    { text: "x", correct: true },
    { text: "y" },
  ],
  explain: "e",
}

const goodOrder: Question = {
  kind: "order",
  prompt: "Put these in order.",
  items: ["a", "b", "c"],
  explain: "e",
}

const withFirst = (first: Question): readonly Question[] => [first, goodMulti, goodOrder]

test("checkQuiz accepts a valid quiz", () => {
  expect(checkQuiz([goodChoice, goodMulti, goodOrder])).toEqual([])
})

test("checkQuiz: choice with 2 correct", () => {
  const bad: Question = {
    kind: "choice",
    prompt: "Pick one.",
    options: [
      { text: "x", correct: true },
      { text: "y", correct: true },
    ],
    explain: "e",
  }

  expect(checkQuiz(withFirst(bad))).toEqual(["question 1: choice needs exactly 1 correct option"])
})

test("choice with 0 correct", () => {
  const bad: Question = {
    kind: "choice",
    prompt: "Pick one.",
    options: [{ text: "x" }, { text: "y" }],
    explain: "e",
  }

  expect(checkQuiz(withFirst(bad))).toEqual(["question 1: choice needs exactly 1 correct option"])
})

test("multi with all or no correct", () => {
  const all: Question = {
    kind: "multi",
    prompt: "Pick all of them.",
    options: [
      { text: "x", correct: true },
      { text: "y", correct: true },
    ],
    explain: "e",
  }

  const none: Question = {
    kind: "multi",
    prompt: "Pick none of them.",
    options: [{ text: "x" }, { text: "y" }],
    explain: "e",
  }

  expect(checkQuiz(withFirst(all))).toEqual([
    "question 1: multi needs at least 1 correct and 1 wrong option",
  ])
  expect(checkQuiz(withFirst(none))).toEqual([
    "question 1: multi needs at least 1 correct and 1 wrong option",
  ])
})

test("order with 2 items", () => {
  const bad: Question = {
    kind: "order",
    prompt: "Put only two in order.",
    items: ["a", "b"],
    explain: "e",
  }

  expect(checkQuiz(withFirst(bad))).toEqual(["question 1: order needs at least 3 items"])
})

test("fewer than 3 questions", () => {
  expect(checkQuiz([goodChoice, goodMulti])).toEqual(["quiz needs at least 3 questions"])
})

test("duplicate prompt, repeated item and single option are reported", () => {
  const duplicate: Question = {
    kind: "choice",
    prompt: "Pick one.",
    options: [{ text: "x", correct: true }],
    explain: "e",
  }

  const repeated: Question = {
    kind: "order",
    prompt: "Put these in order.",
    items: ["x", "y", "x"],
    explain: "e",
  }

  expect(checkQuiz([goodChoice, duplicate, repeated])).toEqual([
    "question 2: duplicate prompt",
    "question 2: needs at least 2 options",
    "question 3: order items must be distinct",
  ])
})

test("shuffledOrder is deterministic and never identity", () => {
  const seeds = ["a", "b", "load-balancer:3", ""]

  for (let n = 2; n <= 8; n += 1) {
    const identity = Array.from({ length: n }, (_, i) => i)

    for (const seed of seeds) {
      const order = shuffledOrder(n, seed)
      const sorted = [...order].sort((a, b) => a - b)

      expect(sorted).toEqual(identity)
      expect(order).not.toEqual(identity)
      expect(shuffledOrder(n, seed)).toEqual(order)
    }
  }

  expect(shuffledOrder(0, "a")).toEqual([])
  expect(shuffledOrder(1, "a")).toEqual([0])
  expect(shuffledOrder(5, "load-balancer:3")).toEqual([1, 0, 2, 3, 4])
  expect(shuffledOrder(8, "a")).toEqual([2, 3, 1, 0, 7, 6, 4, 5])
})

test("grade choice right/wrong", () => {
  const quiz = [goodChoice, goodMulti, goodOrder]

  expect(grade(quiz, [0, [0], [0, 1, 2]])).toMatchObject({ correct: 3, passed: true })
  expect(grade(quiz, [1, [0], [0, 1, 2]]).perQuestion[0]).toEqual({ correct: false, picked: 1 })
  expect(grade(quiz, [[0], [0], [0, 1, 2]]).perQuestion[0]).toEqual({ correct: false, picked: [0] })
})

test("unanswered is wrong", () => {
  const quiz = [goodChoice, goodMulti, goodOrder]

  expect(grade(quiz, [null, null, null])).toMatchObject({
    correct: 0,
    perQuestion: [
      { correct: false, picked: null },
      { correct: false, picked: null },
      { correct: false, picked: null },
    ],
  })
  expect(grade(quiz, []).perQuestion).toEqual([
    { correct: false, picked: null },
    { correct: false, picked: null },
    { correct: false, picked: null },
  ])
})

test("multi needs exact set", () => {
  const question: Question = {
    kind: "multi",
    prompt: "Pick x and z.",
    options: [{ text: "x", correct: true }, { text: "y" }, { text: "z", correct: true }],
    explain: "e",
  }

  expect(grade([question], [[0, 2]]).perQuestion[0].correct).toBe(true)
  expect(grade([question], [[2, 0]]).perQuestion[0].correct).toBe(true)
  for (const answer of [[0], [0, 1, 2], [], 0]) {
    expect(grade([question], [answer]).perQuestion[0].correct).toBe(false)
  }
})

test("order needs identity", () => {
  expect(grade([goodOrder], [[0, 1, 2]]).perQuestion[0].correct).toBe(true)
  for (const answer of [[1, 0, 2], [0, 1], [0, 1, 2, 2], 0]) {
    expect(grade([goodOrder], [answer]).perQuestion[0].correct).toBe(false)
  }
})

test("passed at exactly PASS_RATIO", () => {
  expect(PASS_RATIO).toBe(0.7)
  const quiz: readonly Question[] = Array.from({ length: 10 }, (_, index) => ({
    kind: "choice",
    prompt: `Question ${index}`,
    options: [{ text: "right", correct: true }, { text: "wrong" }],
    explain: "e",
  }))

  expect(grade(quiz, [0, 0, 0, 0, 0, 0, 0, 1, 1, 1])).toMatchObject({
    correct: 7,
    needed: 7,
    passed: true,
  })
  expect(grade(quiz, [0, 0, 0, 0, 0, 0, 1, 1, 1, 1]).passed).toBe(false)
  expect(grade([goodChoice, goodMulti, goodOrder, goodChoice], [0, 0, [0], [0, 1, 2]]).needed).toBe(3)
})

test("grade is pure (same input twice equal)", () => {
  const quiz = [goodChoice, goodMulti, goodOrder]
  const answers = Object.freeze([
    0,
    Object.freeze([0]),
    Object.freeze([0, 1, 2]),
  ])

  expect(grade(quiz, answers)).toEqual(grade(quiz, answers))
})
