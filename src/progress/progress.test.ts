import { describe, expect, it } from "vitest"
import { PASS_RATIO } from "@/content"
import {
  EMPTY,
  STORAGE_KEY,
  apply,
  createProgressStore,
  join,
  memoryKV,
  parseDoc,
  sameDoc,
  statusOf,
  summarize,
  type Fact,
  type KV,
  type ProgressDoc,
} from "./progress"

function generator(seed: number) {
  let state = seed
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function randomDoc(random: () => number): ProgressDoc {
  const lessons: Record<string, { openedAt?: number; sceneDoneAt?: number; bestQuiz?: { correct: number; total: number; at: number }; lastQuiz?: { correct: number; total: number; at: number } }> = {}
  for (const slug of ["a", "b", "c"]) {
    const facts: { openedAt?: number; sceneDoneAt?: number; bestQuiz?: { correct: number; total: number; at: number }; lastQuiz?: { correct: number; total: number; at: number } } = {}
    if (random() < 0.5) facts.openedAt = Math.floor(random() * 4)
    if (random() < 0.5) facts.sceneDoneAt = Math.floor(random() * 4)
    if (random() < 0.5) {
      const total = 1 + Math.floor(random() * 4)
      facts.bestQuiz = { correct: Math.floor(random() * (total + 1)), total, at: Math.floor(random() * 4) }
    }
    if (random() < 0.5) {
      const total = 1 + Math.floor(random() * 4)
      facts.lastQuiz = { correct: Math.floor(random() * (total + 1)), total, at: Math.floor(random() * 4) }
    }
    if (Object.keys(facts).length) lessons[slug] = facts
  }
  return { v: 1, lessons }
}

describe("progress", () => {
  it("parseDoc(null) is EMPTY", () => {
    for (const raw of [null, "", "{not json", "[]", "42", "null"]) expect(sameDoc(parseDoc(raw), EMPTY)).toBe(true)
  })

  it("parseDoc drops malformed fields but keeps good ones", () => {
    const doc = parseDoc('{"v":1,"lessons":{"a":{"openedAt":5,"sceneDoneAt":"x","bestQuiz":{"correct":5,"total":4,"at":1},"lastQuiz":{"correct":1,"total":4,"at":2},"extra":true},"b":"nope","c":{"openedAt":-1}}}')
    expect(doc).toEqual({ v: 1, lessons: { a: { openedAt: 5, lastQuiz: { correct: 1, total: 4, at: 2 } } } })
    expect(parseDoc('{"v":1,"lessons":[]}')).toEqual(EMPTY)
  })

  it("parseDoc unknown v is EMPTY", () => {
    expect(sameDoc(parseDoc('{"v":2,"lessons":{"a":{"openedAt":1}}}'), EMPTY)).toBe(true)
    expect(sameDoc(parseDoc('{"lessons":{"a":{"openedAt":1}}}'), EMPTY)).toBe(true)
  })

  it("apply opened twice equals once", () => {
    const opened: Fact = { kind: "opened", slug: "a", at: 10 }
    const quiz: Fact = { kind: "quiz", slug: "a", correct: 3, total: 4, at: 2 }
    expect(sameDoc(apply(apply(EMPTY, opened), opened), apply(EMPTY, opened))).toBe(true)
    expect(sameDoc(apply(apply(EMPTY, quiz), quiz), apply(EMPTY, quiz))).toBe(true)
  })

  it("openedAt keeps the minimum", () => {
    const doc = apply(apply(apply(EMPTY, { kind: "opened", slug: "a", at: 50 }), { kind: "opened", slug: "a", at: 20 }), { kind: "opened", slug: "a", at: 70 })
    expect(doc.lessons.a?.openedAt).toBe(20)
  })

  it("bestQuiz keeps the higher ratio", () => {
    let doc = apply(EMPTY, { kind: "quiz", slug: "a", correct: 2, total: 4, at: 1 })
    doc = apply(doc, { kind: "quiz", slug: "a", correct: 3, total: 4, at: 2 })
    doc = apply(doc, { kind: "quiz", slug: "a", correct: 1, total: 4, at: 3 })
    doc = apply(doc, { kind: "quiz", slug: "a", correct: 3, total: 4, at: 9 })
    expect(doc.lessons.a?.bestQuiz).toEqual({ correct: 3, total: 4, at: 2 })
  })

  it("lastQuiz keeps the latest", () => {
    let doc = apply(EMPTY, { kind: "quiz", slug: "a", correct: 3, total: 4, at: 2 })
    doc = apply(doc, { kind: "quiz", slug: "a", correct: 1, total: 4, at: 3 })
    doc = apply(doc, { kind: "quiz", slug: "a", correct: 4, total: 4, at: 1 })
    expect(doc.lessons.a?.lastQuiz).toEqual({ correct: 1, total: 4, at: 3 })
  })

  it("join is commutative", () => {
    const random = generator(123456)
    for (let index = 0; index < 200; index += 1) {
      const x = randomDoc(random)
      const y = randomDoc(random)
      expect(sameDoc(join(x, y), join(y, x))).toBe(true)
    }
  })

  it("join is associative", () => {
    const random = generator(234567)
    for (let index = 0; index < 200; index += 1) {
      const x = randomDoc(random)
      const y = randomDoc(random)
      const z = randomDoc(random)
      expect(sameDoc(join(join(x, y), z), join(x, join(y, z)))).toBe(true)
    }
  })

  it("join is idempotent", () => {
    const random = generator(345678)
    for (let index = 0; index < 200; index += 1) {
      const x = randomDoc(random)
      const y = randomDoc(random)
      expect(sameDoc(join(x, x), x)).toBe(true)
      expect(sameDoc(join(x, join(x, y)), join(x, y))).toBe(true)
    }
  })

  it("statusOf new/started/done", () => {
    expect(statusOf(EMPTY, "a")).toBe("new")
    expect(statusOf(EMPTY, "toString")).toBe("new")
    const opened = apply(EMPTY, { kind: "opened", slug: "a", at: 1 })
    expect(statusOf(opened, "a")).toBe("started")
    const tried = apply(opened, { kind: "quiz", slug: "a", correct: 2, total: 4, at: 2 })
    expect(statusOf(tried, "a")).toBe("started")
    const passed = apply(tried, { kind: "quiz", slug: "a", correct: 7, total: 10, at: 3 })
    expect(PASS_RATIO).toBe(0.7)
    expect(statusOf(passed, "a")).toBe("done")
    expect(statusOf(passed, "never")).toBe("new")
  })

  it("summarize nextSlug skips done lessons", () => {
    let doc = apply(EMPTY, { kind: "quiz", slug: "a", correct: 4, total: 4, at: 1 })
    doc = apply(doc, { kind: "opened", slug: "b", at: 2 })
    doc = apply(doc, { kind: "quiz", slug: "z", correct: 4, total: 4, at: 3 })
    expect(summarize(doc, ["a", "b", "c"])).toEqual({ done: 1, total: 3, nextSlug: "b" })
    doc = apply(doc, { kind: "quiz", slug: "b", correct: 4, total: 4, at: 4 })
    doc = apply(doc, { kind: "quiz", slug: "c", correct: 4, total: 4, at: 5 })
    expect(summarize(doc, ["a", "b", "c"])).toEqual({ done: 3, total: 3, nextSlug: undefined })
  })

  it("store.record writes join of memory and storage", () => {
    const kv = memoryKV()
    kv.setItem(STORAGE_KEY, JSON.stringify(apply(EMPTY, { kind: "opened", slug: "a", at: 5 })))
    const store = createProgressStore(kv)
    kv.setItem(STORAGE_KEY, JSON.stringify(apply(EMPTY, { kind: "opened", slug: "b", at: 6 })))
    store.record({ kind: "opened", slug: "c", at: 7 })
    const stored = parseDoc(kv.getItem(STORAGE_KEY))
    expect(Object.keys(stored.lessons).sort()).toEqual(["a", "b", "c"])
    expect(sameDoc(store.read(), stored)).toBe(true)
  })

  it("two stores on one fake KV keep both facts after interleaved records", () => {
    const kv = memoryKV()
    const storeA = createProgressStore(kv)
    const storeB = createProgressStore(kv)
    storeA.record({ kind: "opened", slug: "a", at: 1 })
    storeB.record({ kind: "quiz", slug: "b", correct: 3, total: 4, at: 2 })
    storeA.record({ kind: "scene-done", slug: "a", at: 3 })
    const stored = parseDoc(kv.getItem(STORAGE_KEY))
    expect(stored.lessons.a?.openedAt).toBe(1)
    expect(stored.lessons.a?.sceneDoneAt).toBe(3)
    expect(stored.lessons.b?.bestQuiz).toEqual({ correct: 3, total: 4, at: 2 })
  })

  it("clear empties storage and memory", () => {
    const kv = memoryKV()
    const store = createProgressStore(kv)
    store.record({ kind: "opened", slug: "a", at: 1 })
    let notifications = 0
    store.subscribe(() => { notifications += 1 })
    store.clear()
    expect(kv.getItem(STORAGE_KEY)).toBe(null)
    expect(sameDoc(store.read(), EMPTY)).toBe(true)
    expect(notifications).toBeGreaterThan(0)
  })

  it("a throwing KV keeps facts in memory", () => {
    const throwing: KV = {
      getItem: () => { throw new Error("read") },
      setItem: () => { throw new Error("write") },
      removeItem: () => { throw new Error("remove") },
    }
    const store = createProgressStore(throwing)
    store.record({ kind: "opened", slug: "a", at: 1 })
    expect(statusOf(store.read(), "a")).toBe("started")
  })
})
