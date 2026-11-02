import { defineScene } from "./model"

const nodes = { client: { kind: "client", label: "C", at: [0, 0] }, lb: { kind: "lb", label: "L", at: [2, 0] } } as const

export const ok = () => defineScene(nodes).steps((s) => ({ ask: s.step("x", s.send("client", "lb")) }))

// @ts-expect-error send to an unknown node id
export const bad1 = () => defineScene(nodes).steps((s) => ({ ask: s.step("x", s.send("client", "nope")) }))

// @ts-expect-error focus on an unknown node id
export const bad2 = () => defineScene(nodes).steps((s) => ({ ask: s.step("x", s.focus("nope")) }))

// @ts-expect-error unknown node kind
export const bad3 = () => defineScene({ x: { kind: "robot", label: "X", at: [0, 0] } })
