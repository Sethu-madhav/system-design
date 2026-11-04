import { expect, test } from "vitest"
import { DEFAULT_KNOBS, inkFrame, runCounter, runRecipe } from "@/lib/ink"
import { NODE_ROLE, type NodeKind } from "./model"
import { NODE_SHAPES, ROLE_PAINT, sceneEdgeRecipe, sceneNodeRecipe } from "./ink"

const subpaths = (svg: string | undefined) => (svg ?? "").match(/M/g)?.length ?? 0
const base: { tier: "lo"; density: "comfortable"; dir: "ltr"; knobs: typeof DEFAULT_KNOBS } = { tier: "lo", density: "comfortable", dir: "ltr", knobs: DEFAULT_KNOBS }
const nodeKinds: NodeKind[] = ["client", "mobile", "internet", "dns", "cdn", "lb", "proxy", "server", "service", "cache", "db", "nosql", "queue", "worker", "storage"]

test("every NodeKind draws a non-empty rest layer", () => {
  expect(Object.keys(NODE_SHAPES)).toHaveLength(15)
  for (const kind of nodeKinds) {
    expect(subpaths(runRecipe(sceneNodeRecipe, { ...base, seed: kind, box: { w: 76, h: 50 }, params: { kind } }).parts.rest)).toBeGreaterThan(0)
  }
})

const FILL: Readonly<Record<NodeKind, string>> = {
  client: "pencil", mobile: "pencil", internet: "pencil",
  dns: "tangerine", cdn: "tangerine", lb: "tangerine", proxy: "tangerine",
  server: "grass", service: "grass", worker: "grass",
  cache: "tomato", db: "sky", nosql: "grape", queue: "lemon", storage: "teal",
}
const ACCENTS = ["tomato", "tangerine", "lemon", "grass", "teal", "sky", "grape", "bubblegum"]

test("every NodeKind fills with its role color and no other accent", () => {
  for (const kind of nodeKinds) {
    expect(ROLE_PAINT[NODE_ROLE[kind]]).toBe(FILL[kind])
    const rest = runRecipe(sceneNodeRecipe, { ...base, seed: kind, box: { w: 76, h: 50 }, params: { kind } }).parts.rest ?? ""
    expect(rest).toContain(`fill="var(--ll-${FILL[kind]})"`)
    for (const other of ACCENTS) {
      if (other !== FILL[kind]) expect(rest).not.toContain(`var(--ll-${other})`)
    }
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
