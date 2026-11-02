import { expect, test } from "vitest"
import { defineLesson, defineScene, md } from "./author"
import { buildCurriculum, curriculum, neighbors, type TrackId } from "./curriculum"
import type { Quiz } from "./quiz"

const baseQuiz: Quiz<never> = [
  { kind: "choice", prompt: "One?", options: [{ text: "x", correct: true }, { text: "y" }], explain: "e" },
  { kind: "choice", prompt: "Two?", options: [{ text: "x", correct: true }, { text: "y" }], explain: "e" },
  { kind: "order", prompt: "Three?", items: ["a", "b", "c"], explain: "e" },
]

const makeDraft = (quiz: Quiz<never>) =>
  defineLesson({
    title: "Fake",
    summary: "A fake lesson for tests.",
    track: "edge",
    order: 1,
    sources: [{ use: "link", title: "Example", url: "https://example.com" }],
    scene: defineScene({
      a: { kind: "client", label: "A", at: [0, 0] },
      b: { kind: "server", label: "B", at: [2, 0] },
    }).steps((s) => ({ ask: s.step("A asks B.", s.send("a", "b")) })),
    body: () => md`Text.`,
    quiz,
  })

const baseDraft = makeDraft(baseQuiz)

const draft = (track: TrackId, order: number) => ({ default: { ...baseDraft, track, order } })
const key = (slug: string) => `./lessons/${slug}/lesson.ts`

test("slug comes from folder", () => {
  const c = buildCurriculum({ [key("dns-basics")]: draft("edge", 1) })
  expect(c.flat[0].slug).toBe("dns-basics")
})

test("non-kebab folder throws", () => {
  expect(() => buildCurriculum({ [key("DnsBasics")]: draft("edge", 1) })).toThrow(/is not kebab-case/)
  expect(() => buildCurriculum({ [key("dns_basics")]: draft("edge", 1) })).toThrow(/is not kebab-case/)
  expect(() => buildCurriculum({ [key("dns--basics")]: draft("edge", 1) })).toThrow(/is not kebab-case/)
  expect(() => buildCurriculum({ "./other/x/lesson.ts": draft("edge", 1) })).toThrow(
    "unexpected lesson path",
  )
  expect(() => buildCurriculum({ [key("x")]: {} })).toThrow(
    "./lessons/x/lesson.ts has no default export",
  )
})

test("tracks in TRACKS order", () => {
  const c = buildCurriculum({
    [key("d")]: draft("data", 1),
    [key("f")]: draft("foundations", 1),
    [key("e")]: draft("edge", 1),
  })

  expect(c.tracks.map((track) => track.id)).toEqual(["foundations", "edge", "data"])
})

test("lessons sorted by order, fractions allowed", () => {
  const c = buildCurriculum({
    [key("a")]: draft("edge", 3),
    [key("b")]: draft("edge", 1),
    [key("c")]: draft("edge", 2.5),
  })

  expect(c.flat.map((lesson) => lesson.order)).toEqual([1, 2.5, 3])
})

test("empty tracks omitted", () => {
  const c = buildCurriculum({ [key("only")]: draft("cache", 1) })
  expect(c.tracks).toHaveLength(1)
  expect(c.tracks[0].id).toBe("cache")
})

test("duplicate track+order throws", () => {
  const c = () =>
    buildCurriculum({
      [key("one")]: draft("edge", 2),
      [key("two")]: draft("edge", 2),
    })

  expect(c).toThrow("one and two share order 2 in track edge")
})

test("neighbors cross track boundaries", () => {
  const c = buildCurriculum({
    [key("f")]: draft("foundations", 1),
    [key("e")]: draft("edge", 1),
  })

  expect(neighbors(c, "f").next?.slug).toBe("e")
  expect(neighbors(c, "e").prev?.slug).toBe("f")
})

test("first lesson has no prev", () => {
  const c = buildCurriculum({
    [key("f")]: draft("foundations", 1),
    [key("e")]: draft("edge", 1),
  })

  expect(neighbors(c, "f")).not.toHaveProperty("prev")
  expect(neighbors(c, "e")).not.toHaveProperty("next")
  expect(neighbors(c, "nope")).toEqual({})
})

test("defineLesson throws with every quiz problem", () => {
  const first = baseQuiz[0]
  const third = baseQuiz[2]
  const bad = {
    kind: "choice",
    prompt: "Bad?",
    options: [{ text: "x" }, { text: "y" }],
    explain: "e",
  } as const

  expect(() => makeDraft([first, third])).toThrow('lesson "Fake": quiz needs at least 3 questions')
  expect(() => makeDraft([first, bad, third])).toThrow(
    'lesson "Fake": question 2: choice needs exactly 1 correct option',
  )
  expect(() => makeDraft([first, bad])).toThrow(
    'lesson "Fake": quiz needs at least 3 questions; question 2: choice needs exactly 1 correct option',
  )
})

test("the real curriculum holds the load-balancer lesson", () => {
  const lesson = curriculum.bySlug.get("load-balancer")

  expect(curriculum.tracks.map((track) => track.id)).toEqual(["edge"])
  expect(lesson?.minutes).toBe(2)
  expect(lesson?.headings.map((heading) => heading.id)).toEqual([
    "what-it-does",
    "how-it-picks-a-server",
    "horizontal-scaling",
  ])
  expect(lesson?.attributions.map((entry) => entry.text)).toEqual([
    'Adapted from "Load balancer" in The System Design Primer by Donne Martin.',
  ])
  expect(lesson?.furtherReading).toHaveLength(2)
})

test("finishLesson counts reading and scene time and defaults tags", () => {
  const short = buildCurriculum({
    [key("a")]: { default: { ...baseDraft, body: { ...baseDraft.body, words: 200 } } },
  })
  const long = buildCurriculum({
    [key("a")]: { default: { ...baseDraft, body: { ...baseDraft.body, words: 400 } } },
  })

  expect(short.bySlug.get("a")?.minutes).toBe(2)
  expect(long.bySlug.get("a")?.minutes).toBe(3)
  expect(baseDraft.tags).toEqual([])
})
