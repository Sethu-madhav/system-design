import { expect, test } from "vitest"
import { defineScene } from "./model"
import { compile } from "./timeline"
import { layoutScene, lintLayout, pointOn } from "./layout"

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

const lb = compile(
  defineScene({
    you: { kind: "client", label: "You", at: [0, 1] },
    lb: { kind: "lb", label: "LB", at: [2, 1] },
    a: { kind: "server", label: "A", at: [4, 0] },
    c: { kind: "server", label: "C", at: [4, 2], hidden: true },
  }).steps((s) => ({
    go: s.step("Go.", s.send("you", "lb"), s.send("lb", "a"), s.send("a", "lb", "200", "response")),
    more: s.step("More.", s.show("c"), s.send("lb", "c")),
  })),
)

test("cellPx is bucketed to 8 and clamped", () => {
  expect([500, 100, 5000].map((width) => layoutScene(lb, width).cellPx)).toEqual([96, 64, 128])
})

test("same width bucket gives identical layout", () => {
  expect(layoutScene(lb, 481)).toEqual(layoutScene(lb, 519))
})

test("node rects are integers", () => {
  for (const width of [300, 517, 733, 1200]) {
    for (const rect of Object.values(layoutScene(lb, width).nodes)) {
      expect([rect.x, rect.y, rect.w, rect.h].every(Number.isInteger)).toBe(true)
      expect(rect.w % 4).toBe(0)
      expect(rect.h % 2).toBe(0)
    }
  }
})

test("edge endpoints clipped outside both node rects", () => {
  const layout = layoutScene(lb, 517)
  for (const edge of Object.values(layout.edges)) {
    const [a, b] = edge.id.split("~")
    for (const rect of [layout.nodes[a], layout.nodes[b]]) {
      for (const [x, y] of [[edge.x1, edge.y1], [edge.x2, edge.y2]]) {
        expect(x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h).toBe(false)
      }
    }
  }
})

test("pointOn u=0 at from, u=1 at to, reversed when from is b", () => {
  const edge = layoutScene(lb, 517).edges["lb~you"]
  expect(pointOn(edge, true, 0)).toEqual([edge.x1, edge.y1])
  expect(pointOn(edge, true, 1)).toEqual([edge.x2, edge.y2])
  expect(pointOn(edge, false, 0)).toEqual([edge.x2, edge.y2])
  expect(pointOn(edge, false, 1)).toEqual([edge.x1, edge.y1])
})
