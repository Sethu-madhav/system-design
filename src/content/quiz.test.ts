import { expect, test } from "vitest"
import { checkQuiz, shuffledOrder, type Question } from "./quiz"

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
