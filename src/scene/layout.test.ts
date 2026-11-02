import { expect, test } from "vitest"
import { defineScene } from "./model"
import { compile } from "./timeline"
import { lintLayout } from "./layout"

test("edge through a third node is reported", () => {
  const straight = compile(
    defineScene({
      a: { kind: "client", label: "A", at: [0, 0] },
      m: { kind: "server", label: "M", at: [1, 0] },
      b: { kind: "server", label: "B", at: [2, 0] },
    }).steps((s) => ({ go: s.step("A sends to B.", s.send("a", "b")) })),
  )

  expect(lintLayout(straight)).toEqual(["edge a~b crosses m"])

  const diagonal = compile(
    defineScene({
      a: { kind: "client", label: "A", at: [0, 0] },
      m: { kind: "server", label: "M", at: [1, 1] },
      b: { kind: "server", label: "B", at: [2, 2] },
    }).steps((s) => ({ go: s.step("A sends to B.", s.send("a", "b")) })),
  )

  expect(lintLayout(diagonal)).toEqual(["edge a~b crosses m"])
})

test("edge that clears every node is not reported", () => {
  const timeline = compile(
    defineScene({
      a: { kind: "client", label: "A", at: [0, 0] },
      m: { kind: "server", label: "M", at: [1, 1] },
      b: { kind: "server", label: "B", at: [2, 1] },
    }).steps((s) => ({ go: s.step("A sends to B.", s.send("a", "b")) })),
  )

  expect(lintLayout(timeline)).toEqual([])
})

test("node outside the 8 by 5 grid is reported", () => {
  const wide = compile(
    defineScene({
      m: { kind: "server", label: "M", at: [8, 0] },
    }).steps((s) => ({ go: s.step("M waits.", s.focus("m")) })),
  )

  expect(lintLayout(wide)).toEqual(["m is outside the grid"])

  const tall = compile(
    defineScene({
      m: { kind: "server", label: "M", at: [0, 5] },
    }).steps((s) => ({ go: s.step("M waits.", s.focus("m")) })),
  )

  expect(lintLayout(tall)).toEqual(["m is outside the grid"])
})

test("edge that passes near a node's center is reported", () => {
  const timeline = compile(
    defineScene({
      a: { kind: "client", label: "A", at: [0, 0] },
      m: { kind: "server", label: "M", at: [1, 0] },
      b: { kind: "server", label: "B", at: [3, 1] },
    }).steps((s) => ({ go: s.step("A sends to B.", s.send("a", "b")) })),
  )

  expect(lintLayout(timeline)).toEqual(["edge a~b crosses m"])
})
