import { expect, test } from "vitest"
import { defineLesson, defineScene, md } from "@/content/author"
import { finishLesson } from "@/content/lesson"
import type { Quiz } from "@/content/quiz"
import { buildIndex, search, tokenize } from "./search"

const baseQuiz: Quiz<never> = [
  { kind: "choice", prompt: "One?", options: [{ text: "x", correct: true }, { text: "y" }], explain: "e" },
  { kind: "choice", prompt: "Two?", options: [{ text: "x", correct: true }, { text: "y" }], explain: "e" },
  { kind: "order", prompt: "Three?", items: ["a", "b", "c"], explain: "e" },
]

const scene = () => defineScene({
  app: { kind: "client", label: "App", at: [0, 0] },
  db: { kind: "server", label: "Database", at: [2, 0] },
})

const caching = finishLesson("caching", defineLesson({
  title: "Caching",
  summary: "Keep hot data close to the reader.",
  tags: ["cdn"],
  track: "edge",
  order: 1,
  sources: [{ use: "link", title: "Example", url: "https://example.com" }],
  scene: scene().steps((s) => ({
    miss: s.step("The cache misses, so the app reads the database.", s.send("app", "db")),
    fill: s.step("The app stores the answer in the cache for next time.", s.send("app", "db")),
  })),
  body: () => md`## Write through

The app writes to the cache and the database together. Round robin has nothing to do with it.

### Eviction

When the cache is full, the least recently used entry goes first.`,
  quiz: baseQuiz,
}))

const queues = finishLesson("queues", defineLesson({
  title: "Queues",
  summary: "Hand work to a worker and answer the caller right away.",
  tags: ["async"],
  track: "edge",
  order: 2,
  sources: [{ use: "link", title: "Example", url: "https://example.com" }],
  scene: scene().steps((s) => ({
    push: s.step("The app pushes a job onto the queue.", s.send("app", "db")),
  })),
  body: () => md`## Why queue

A queue absorbs bursts. Workers drain it at their own pace, and caching results is a separate concern.`,
  quiz: baseQuiz,
}))

const index = buildIndex([caching, queues])

test("tokenize lowercases and strips accents", () => {
  expect(tokenize("Café, ÉCOLE!")).toEqual(["cafe", "ecole"])
})

test("tokenize keeps l4 and l7", () => {
  expect(tokenize("L4 vs L7 at a 7")).toEqual(["l4", "vs", "l7", "at"])
})

test("title hit outranks body hit", () => {
  const hits = search(index, "caching")
  expect(hits).toHaveLength(2)
  expect(hits.map((hit) => [hit.doc.kind, hit.doc.slug, hit.doc.title])).toEqual([
    ["lesson", "caching", "Caching"],
    ["section", "queues", "Why queue"],
  ])
})

test("exact word outranks a prefix match", () => {
  const hits = search(index, "queue")
  expect(hits.map((hit) => [hit.doc.kind, hit.doc.slug, hit.doc.title, hit.score])).toEqual([
    ["section", "queues", "Why queue", 6],
    ["lesson", "queues", "Queues", 5],
    ["step", "queues", "Step 1", 4],
  ])
})

test("last token prefix-matches ('rou' finds round robin)", () => {
  expect(search(index, "rou").map((hit) => hit.doc.title)).toEqual(["Write through"])
  expect(search(index, "rou robin")).toEqual([])
})

test("all tokens must match", () => {
  expect(search(index, "cache database").map((hit) => [hit.doc.title, hit.score])).toEqual([
    ["Step 1", 8],
    ["Write through", 4],
  ])
})

test("step caption hit carries the step anchor", () => {
  expect(search(index, "misses")).toMatchObject([{
    doc: { kind: "step", slug: "caching", anchor: "miss", title: "Step 1", lessonTitle: "Caching" },
  }])
})

test("section hit carries the heading id", () => {
  expect(search(index, "eviction")).toMatchObject([{
    doc: { kind: "section", anchor: "eviction", title: "Eviction" },
    snippet: { before: "", match: "", after: "When the cache is full, the least recently used entry goes first." },
  }])
})

test("snippet centers on the first match", () => {
  const drain = search(index, "drain").find((hit) => hit.doc.slug === "queues")
  expect(drain?.snippet.before).toBe("A queue absorbs bursts. Workers ")
  expect(drain?.snippet.match).toBe("drain")
  expect(drain?.snippet.after.startsWith(" it at their own pace")).toBe(true)
  expect(drain?.snippet.after.endsWith("…")).toBe(true)
  expect(drain?.snippet.after).toHaveLength(61)
  const concern = search(index, "concern").find((hit) => hit.doc.slug === "queues")
  expect(concern?.snippet.before.startsWith("…")).toBe(true)
  expect(concern?.snippet.before).toHaveLength(61)
  expect(concern?.snippet.match).toBe("concern")
  expect(concern?.snippet.after).toBe(".")
})

test("empty query returns []", () => {
  expect(search(index, "")).toEqual([])
  expect(search(index, "   ")).toEqual([])
  expect(search(index, "a 7")).toEqual([])
})

test("limit respected", () => {
  expect(search(index, "the", 2)).toHaveLength(2)
  expect(search(index, "the").length).toBeGreaterThan(2)
})

test("tag hit scores weight 3", () => {
  expect(search(index, "cdn").map((hit) => [hit.doc.kind, hit.doc.slug, hit.score])).toEqual([
    ["lesson", "caching", 6],
  ])
})

test("ties keep document order", () => {
  expect(search(index, "app").map((hit) => [hit.doc.kind, hit.doc.slug, hit.doc.title, hit.score])).toEqual([
    ["step", "caching", "Step 1", 4],
    ["step", "caching", "Step 2", 4],
    ["step", "queues", "Step 1", 4],
    ["section", "caching", "Write through", 2],
  ])
})
