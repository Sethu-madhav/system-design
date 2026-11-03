import { expect, test } from "vitest"
import { DEFAULT_KNOBS, inkFrame, runCounter, runRecipe } from "@/lib/ink"
import type { NodeKind } from "./model"
import { NODE_SHAPES, sceneEdgeRecipe, sceneNodeRecipe } from "./ink"

const subpaths = (svg: string | undefined) => (svg ?? "").match(/M/g)?.length ?? 0
const base: { tier: "lo"; density: "comfortable"; dir: "ltr"; knobs: typeof DEFAULT_KNOBS } = { tier: "lo", density: "comfortable", dir: "ltr", knobs: DEFAULT_KNOBS }
const nodeKinds: NodeKind[] = ["client", "internet", "dns", "cdn", "lb", "proxy", "server", "service", "cache", "db", "queue", "worker", "storage"]

test("every NodeKind draws a non-empty rest layer", () => {
  expect(Object.keys(NODE_SHAPES)).toHaveLength(13)
  for (const kind of nodeKinds) {
    expect(subpaths(runRecipe(sceneNodeRecipe, { ...base, seed: kind, box: { w: 76, h: 50 }, params: { kind } }).parts.rest)).toBeGreaterThan(0)
  }
})

test("scene-node is deterministic for the same seed", () => {
  const run = (seed: string) => runRecipe(sceneNodeRecipe, { ...base, seed, box: { w: 76, h: 50 }, params: { kind: "db" } })
  expect(run("a")).toEqual(run("a"))
  expect(run("a").parts.rest).not.toEqual(run("b").parts.rest)
})

test("scene-edge heads both draws two heads", () => {
  const run = (heads: "both" | "a->b") => runRecipe(sceneEdgeRecipe, { ...base, seed: "edge", box: { w: 120, h: 16 }, params: { x1: 8, y1: 8, x2: 112, y2: 8, heads } })
  expect(subpaths(run("both").parts.rest)).toBe(subpaths(run("a->b").parts.rest) * 2)
})

test("runCounter does not grow when the same node is rendered twice through inkFrame", () => {
  const request: { seed: string; tier: "lo"; density: "comfortable"; dir: "ltr"; knobs: typeof DEFAULT_KNOBS; box: { w: number; h: number }; params: { kind: "db" } } = { ...base, seed: "node", box: { w: 76, h: 50 }, params: { kind: "db" } }
  inkFrame(sceneNodeRecipe, request)
  const runs = runCounter.runs
  inkFrame(sceneNodeRecipe, request)
  expect(runCounter.runs).toBe(runs)
})
