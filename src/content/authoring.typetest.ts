import { defineLesson, defineScene, md } from "./author"

const scene = defineScene({
  a: { kind: "client", label: "A", at: [0, 0] },
  b: { kind: "server", label: "B", at: [2, 0] },
}).steps((s) => ({ ask: s.step("x", s.send("a", "b")) }))

const base = { title: "T", summary: "S", order: 1, sources: [{ use: "link", title: "x", url: "https://example.com" }] } as const

const quiz = [] as const

export const ok = () =>
  defineLesson({
    ...base,
    track: "edge",
    scene,
    body: ({ cue }) => md`${cue("ask", "x")}`,
    quiz: [{ kind: "order", prompt: "p", items: ["a"], explain: "e", replay: "ask" }],
  })

// @ts-expect-error send to an unknown node id
export const bad1 = () => defineScene({ a: { kind: "client", label: "A", at: [0, 0] } }).steps((s) => ({ ask: s.step("x", s.send("a", "nope")) }))

// @ts-expect-error cue to an unknown step
export const bad2 = () => defineLesson({ ...base, track: "edge", scene, body: ({ cue }) => md`${cue("nope", "x")}`, quiz })

export const bad3 = () =>
  defineLesson({
    ...base,
    track: "edge",
    scene,
    body: () => md`x`,
    // @ts-expect-error replay of an unknown step
    quiz: [{ kind: "order", prompt: "p", items: ["a"], explain: "e", replay: "nope" }],
  })

export const bad4 = () =>
  defineLesson({
    ...base,
    // @ts-expect-error unknown track
    track: "nope",
    scene,
    body: () => md`x`,
    quiz,
  })
