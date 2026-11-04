# Step 25. Node shapes you can recognize, colored by role

## Why

The diagram nodes are mostly plain boxes with a mark inside, so a reader has to read the label to tell a database from a cache. The user asked for shapes that look like the things they stand for, each with its own color. This step redraws all 13 node kinds as pictures, adds 2 kinds and fills every node with the color of its role.

A database is a cylinder, a server is a rack with lights, a load balancer is one arrow splitting into three, a cache is a memory chip with a lightning bolt, and a queue is a tube of messages. The new kinds are `mobile`, a phone, and `nosql`, a stack of documents. The 3 lessons that draw a "Phone" switch to `mobile`.

There are 8 accent paints in the ink engine and 15 kinds, so color goes by role. Kinds in one role share a color, and the shape tells them apart. Each kind of data store gets its own role, since that is the difference a learner most needs to see.

| Role | Paint | Kinds |
| :--- | :--- | :--- |
| `outside` | `pencil` (gray) | `client`, `mobile`, `internet` |
| `edge` | `tangerine` | `dns`, `cdn`, `lb`, `proxy` |
| `compute` | `grass` | `server`, `service`, `worker` |
| `sql` | `sky` | `db` |
| `nosql` | `grape` | `nosql` |
| `cache` | `tomato` | `cache` |
| `queue` | `lemon` | `queue` |
| `storage` | `teal` | `storage` |

Adding a kind later takes 3 edits, one name in `NodeKind`, one entry in `NODE_ROLE` and one shape in `NODE_SHAPES`. Both maps are typed `Record<NodeKind, ...>`, so the build fails if a new kind has no shape or no role. An API gateway would join `edge` and a container would join `compute`. A Kubernetes cluster is a boundary around nodes, not a node, and needs its own step.

Product names stay in labels. The cache is a generic memory chip, so a node labelled "Redis" uses `cache` and draws no logo.

This step was step 25 in the plan. The availability lesson moves to step 26.

## Branch and coder rules

- Branch `step/25-node-shapes` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 8 files below may change, and only by the patch in "How to do it". Do not edit any other file.
- Do not change the shapes, colors or tests. Opus wrote and checked them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the code to make it pass.
- Do not kill processes.

## What changes

### 1. Roles

`src/scene/model.ts` adds `mobile` and `nosql` to `NodeKind`. It adds the `NodeRole` type and the `NODE_ROLE` map from the table above.

### 2. Shapes and colors

`src/scene/ink.ts` adds `ROLE_PAINT`, the paint for each role. Every shape is drawn on a 100 by 66 grid that a small `pad` helper scales to the node's box. Nodes range from 48 by 34 px to 100 by 66 px. `pad` has 5 pens. `fill` lays a marker wash in the role's paint at alpha 0.42. `ink` and `pencil` draw outlines, `dot` draws a small filled circle and `solid` fills a shape in ink, for the lightning bolt. Each shape fills first and outlines second, so the outline sits on top. The focus ring, the down cross and the edge recipe do not change.

### 3. The stage

`src/scene/ScenePlayer.tsx` puts `data-role` on every node, next to `data-kind`.

### 4. Lessons

In `what-system-design-is`, `latency-and-throughput` and `scaling-up-and-out`, the `phone` node changes from `kind: "client"` to `kind: "mobile"`. Nothing else in those files changes. The load balancer lesson's "You" stays `client`.

### 5. Tests

- `src/scene/ink.test.ts` lists all 15 kinds and expects 15 shapes. A new test holds a fixed table of the paint each kind must use. For every kind, it checks that `ROLE_PAINT[NODE_ROLE[kind]]` matches the table, that the rest layer has a `fill="var(--ll-<paint>)"` path and that no other accent paint appears.
- `e2e/scene-static.spec.ts` has a new test on `what-system-design-is`. The phone has `data-kind="mobile"` and `data-role="outside"`, the app server has `data-role="compute"`, and the database has `data-role="sql"` and a rest path filled with `var(--ll-sky)`.

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/25-node-shapes.md > /tmp/step25.diff && git apply /tmp/step25.diff && git status --short`
   It must apply cleanly. The status must list exactly these 8 lines, in any order.
   `M e2e/scene-static.spec.ts`, `M src/content/lessons/latency-and-throughput/lesson.ts`, `M src/content/lessons/scaling-up-and-out/lesson.ts`, `M src/content/lessons/what-system-design-is/lesson.ts`, `M src/scene/ScenePlayer.tsx`, `M src/scene/ink.test.ts`, `M src/scene/ink.ts` and `M src/scene/model.ts`.
   If the patch does not apply, or the list differs, stop and report it.
2. Install. `pnpm install > /tmp/install25.log 2>&1; tail -3 /tmp/install25.log`
3. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 80 tests, the same as main.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 199 tests in 14 files. Main has 198, and this step adds 1.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e.log`. 60 tests. Main has 59, and this step adds 1.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run.

## Report

End with this report and nothing else.

```
files: <output of git status --short>
build: <count> <count> <count>
test: <count> <count> <count>
e2e: <count> <count> <count>
failures: <each failing test name and its first Error line, or none>
```

## Checks Opus ran on the prototype

- Changing `sql` to `"grape"` in `ROLE_PAINT` fails the new unit test.
- Changing `db` to `"nosql"` in `NODE_ROLE` fails the new unit test.
- Drawing the worker's gear with `p.ink` instead of `p.fill`, which leaves it unfilled, fails the new unit test.
- Removing `data-role` from `ScenePlayer.tsx` fails the new e2e test.
- An earlier draft of the unit test read the expected paint from `ROLE_PAINT` itself, so swapping a color passed. The fixed table in the test replaced it.
- With all of it in place, build passed 80, unit 199 in 14 files and e2e 60.
- All 15 shapes were rendered through the real recipe at 100 by 66 and at 48 by 34 px and checked by eye. An early database fill crossed itself into an hourglass, and the shape in the patch fixes it.
- The step 26 availability patch still applies cleanly on top of this one.

## What you see

Every diagram has colored, hand-drawn pictures in place of plain boxes. The phone is a gray phone, the app servers are green racks, the database is a blue cylinder and the load balancer is an orange splitter. The queue in lesson 1.2 is a yellow tube of messages. Captions, steps and labels do not change.

## Appendix. The patch

````diff
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index dffaee5..35cdc6c 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -87,6 +87,18 @@ test("what-system-design-is shows 8 cues, 'dies' crosses out the database and 'b
   await expect(db.getByTestId("scene-note")).toHaveText("runs out first")
 })
 
+test("nodes carry their kind and role, and the database is filled with its role color", async ({ page }) => {
+  await gotoReady(page, "/#/learn/what-system-design-is")
+  const scene = page.getByTestId("scene")
+  const phone = scene.locator('[data-scene-node="phone"]')
+  const db = scene.locator('[data-scene-node="db"]')
+  await expect(phone).toHaveAttribute("data-kind", "mobile")
+  await expect(phone).toHaveAttribute("data-role", "outside")
+  await expect(scene.locator('[data-scene-node="server"]')).toHaveAttribute("data-role", "compute")
+  await expect(db).toHaveAttribute("data-role", "sql")
+  await expect(db.locator('svg[data-ink] [data-layer="rest"] path[fill="var(--ll-sky)"]').first()).toBeAttached()
+})
+
 test("latency-and-throughput shows 9 cues, 'wait' notes the queue wait and 'shed' marks the queue full", async ({ page }) => {
   const lesson = "/#/learn/latency-and-throughput"
   await gotoReady(page, lesson)
diff --git a/src/content/lessons/latency-and-throughput/lesson.ts b/src/content/lessons/latency-and-throughput/lesson.ts
index 50638ae..90de5d7 100644
--- a/src/content/lessons/latency-and-throughput/lesson.ts
+++ b/src/content/lessons/latency-and-throughput/lesson.ts
@@ -1,7 +1,7 @@
 import { defineLesson, defineScene, md } from "@/content/author"
 
 const scene = defineScene({
-  phone: { kind: "client", label: "Phone", at: [0, 1] },
+  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
   queue: { kind: "queue", label: "Queue", at: [2, 0] },
   server: { kind: "server", label: "Feed server", at: [4, 1] },
 }).steps((s) => ({
diff --git a/src/content/lessons/scaling-up-and-out/lesson.ts b/src/content/lessons/scaling-up-and-out/lesson.ts
index e7377aa..d9822b6 100644
--- a/src/content/lessons/scaling-up-and-out/lesson.ts
+++ b/src/content/lessons/scaling-up-and-out/lesson.ts
@@ -1,7 +1,7 @@
 import { defineLesson, defineScene, md } from "@/content/author"
 
 const scene = defineScene({
-  phone: { kind: "client", label: "Phone", at: [0, 1] },
+  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
   lb: { kind: "lb", label: "Load balancer", at: [2, 1], hidden: true },
   one: { kind: "server", label: "Server 1", at: [4, 0] },
   two: { kind: "server", label: "Server 2", at: [4, 1], hidden: true },
diff --git a/src/content/lessons/what-system-design-is/lesson.ts b/src/content/lessons/what-system-design-is/lesson.ts
index c94135a..253865c 100644
--- a/src/content/lessons/what-system-design-is/lesson.ts
+++ b/src/content/lessons/what-system-design-is/lesson.ts
@@ -1,7 +1,7 @@
 import { defineLesson, defineScene, md } from "@/content/author"
 
 const scene = defineScene({
-  phone: { kind: "client", label: "Phone", at: [0, 0] },
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
   server: { kind: "server", label: "App server", at: [2, 0] },
   db: { kind: "db", label: "Database", at: [4, 0] },
 }).steps((s) => ({
diff --git a/src/scene/ScenePlayer.tsx b/src/scene/ScenePlayer.tsx
index cdc70e0..7cdac3d 100644
--- a/src/scene/ScenePlayer.tsx
+++ b/src/scene/ScenePlayer.tsx
@@ -6,7 +6,7 @@ import { InkLayer, useInkBox, useInkContext } from "@/lib/ink"
 import { frameAt, type Frame, type Motion, type Timeline } from "./timeline"
 import { initialPlayer, reducePlayer, type PlayerEvent, type PlayerState } from "./player"
 import { gridOf, layoutScene, MAX_CELL, MIN_CELL, pointOn } from "./layout"
-import type { PacketTone } from "./model"
+import { NODE_ROLE, type PacketTone } from "./model"
 import { sceneEdgeRecipe, sceneNodeRecipe } from "./ink"
 import "./scene.css"
 
@@ -162,7 +162,7 @@ export function ScenePlayer() {
             {Object.entries(timeline.nodes).map(([id, def]) => {
               const rect = layout.nodes[id]
               const view = frame.nodes[id]
-              return <div key={id} data-scene-node={id} data-kind={def.kind} data-visible={String(view.visible)} aria-hidden={!view.visible} data-focus={view.focus ? "" : undefined} data-down={view.status === "down" ? "" : undefined} className="absolute" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
+              return <div key={id} data-scene-node={id} data-kind={def.kind} data-role={NODE_ROLE[def.kind]} data-visible={String(view.visible)} aria-hidden={!view.visible} data-focus={view.focus ? "" : undefined} data-down={view.status === "down" ? "" : undefined} className="absolute" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
                 <InkLayer recipe={sceneNodeRecipe} seed={id} params={{ kind: def.kind }} />
                 <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[calc(100%+1.5rem)] text-center font-hand text-sm leading-tight">{def.label}</span>
                 {view.note ? <span data-testid="scene-note" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max bg-paper px-1 font-hand text-sm text-red">{view.note}</span> : null}
diff --git a/src/scene/ink.test.ts b/src/scene/ink.test.ts
index 72150e1..c422aa6 100644
--- a/src/scene/ink.test.ts
+++ b/src/scene/ink.test.ts
@@ -1,19 +1,38 @@
 import { expect, test } from "vitest"
 import { DEFAULT_KNOBS, inkFrame, runCounter, runRecipe } from "@/lib/ink"
-import type { NodeKind } from "./model"
-import { NODE_SHAPES, sceneEdgeRecipe, sceneNodeRecipe } from "./ink"
+import { NODE_ROLE, type NodeKind } from "./model"
+import { NODE_SHAPES, ROLE_PAINT, sceneEdgeRecipe, sceneNodeRecipe } from "./ink"
 
 const subpaths = (svg: string | undefined) => (svg ?? "").match(/M/g)?.length ?? 0
 const base: { tier: "lo"; density: "comfortable"; dir: "ltr"; knobs: typeof DEFAULT_KNOBS } = { tier: "lo", density: "comfortable", dir: "ltr", knobs: DEFAULT_KNOBS }
-const nodeKinds: NodeKind[] = ["client", "internet", "dns", "cdn", "lb", "proxy", "server", "service", "cache", "db", "queue", "worker", "storage"]
+const nodeKinds: NodeKind[] = ["client", "mobile", "internet", "dns", "cdn", "lb", "proxy", "server", "service", "cache", "db", "nosql", "queue", "worker", "storage"]
 
 test("every NodeKind draws a non-empty rest layer", () => {
-  expect(Object.keys(NODE_SHAPES)).toHaveLength(13)
+  expect(Object.keys(NODE_SHAPES)).toHaveLength(15)
   for (const kind of nodeKinds) {
     expect(subpaths(runRecipe(sceneNodeRecipe, { ...base, seed: kind, box: { w: 76, h: 50 }, params: { kind } }).parts.rest)).toBeGreaterThan(0)
   }
 })
 
+const FILL: Readonly<Record<NodeKind, string>> = {
+  client: "pencil", mobile: "pencil", internet: "pencil",
+  dns: "tangerine", cdn: "tangerine", lb: "tangerine", proxy: "tangerine",
+  server: "grass", service: "grass", worker: "grass",
+  cache: "tomato", db: "sky", nosql: "grape", queue: "lemon", storage: "teal",
+}
+const ACCENTS = ["tomato", "tangerine", "lemon", "grass", "teal", "sky", "grape", "bubblegum"]
+
+test("every NodeKind fills with its role color and no other accent", () => {
+  for (const kind of nodeKinds) {
+    expect(ROLE_PAINT[NODE_ROLE[kind]]).toBe(FILL[kind])
+    const rest = runRecipe(sceneNodeRecipe, { ...base, seed: kind, box: { w: 76, h: 50 }, params: { kind } }).parts.rest ?? ""
+    expect(rest).toContain(`fill="var(--ll-${FILL[kind]})"`)
+    for (const other of ACCENTS) {
+      if (other !== FILL[kind]) expect(rest).not.toContain(`var(--ll-${other})`)
+    }
+  }
+})
+
 test("scene-node is deterministic for the same seed", () => {
   const run = (seed: string) => runRecipe(sceneNodeRecipe, { ...base, seed, box: { w: 76, h: 50 }, params: { kind: "db" } })
   expect(run("a")).toEqual(run("a"))
diff --git a/src/scene/ink.ts b/src/scene/ink.ts
index ca8994d..7bcd7a6 100644
--- a/src/scene/ink.ts
+++ b/src/scene/ink.ts
@@ -1,21 +1,185 @@
-import { asterisk, arrow, box, cloud, cross, dashedBox, defineRecipe, focusRing, line, loop, squiggle, type Box, type Ink } from "@/lib/ink"
-import type { NodeKind } from "./model"
+import { arrow, cross, defineRecipe, ellipsePoly, focusRing, wash, type Box, type Ink, type PaintKey, type Pt } from "@/lib/ink"
+import { NODE_ROLE, type NodeKind, type NodeRole } from "./model"
 import type { EdgeDef } from "./timeline"
 
-export const NODE_SHAPES: Readonly<Record<NodeKind, (ink: Ink, b: Box) => void>> = {
-  client: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h * 0.75 - 3); line(ink, b.w * 0.25, b.h * 0.82, b.w * 0.75, b.h * 0.82) },
-  internet: (ink, b) => cloud(ink, b.w / 2, b.h / 2, b.w - 6, b.h - 6),
-  dns: (ink, b) => { box(ink, 3, 7, b.w - 6, b.h - 10); box(ink, 7, 3, b.w * 0.35, 8) },
-  cdn: (ink, b) => { cloud(ink, b.w / 2, b.h / 2, b.w - 6, b.h - 6); cloud(ink, b.w / 2, b.h / 2, b.w * 0.48, b.h * 0.42, { pen: "pencil" }) },
-  lb: (ink, b) => { loop(ink, b.w / 2, b.h / 2, (b.w - 6) / 2, (b.h - 6) / 2); line(ink, b.w * 0.27, b.h / 2, b.w * 0.73, b.h / 2, { pen: "pencil" }) },
-  proxy: (ink, b) => dashedBox(ink, 3, 3, b.w - 6, b.h - 6, { r: b.h / 3 }),
-  server: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); line(ink, 7, b.h / 3, b.w - 7, b.h / 3, { pen: "pencil" }); line(ink, 7, b.h * 2 / 3, b.w - 7, b.h * 2 / 3, { pen: "pencil" }) },
-  service: (ink, b) => box(ink, 3, 3, b.w - 6, b.h - 6, { corner: b.h / 4 }),
-  cache: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); squiggle(ink, 8, b.h / 2, b.w - 16, { pen: "orange" }) },
-  db: (ink, b) => { loop(ink, b.w / 2, 8, (b.w - 6) / 2, 6); loop(ink, b.w / 2, b.h - 8, (b.w - 6) / 2, 6, { turns: 0.5, a0: 0 }); line(ink, 3, 8, 3, b.h - 8); line(ink, b.w - 3, 8, b.w - 3, b.h - 8) },
-  queue: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); for (const x of [b.w / 4, b.w / 2, b.w * 3 / 4]) line(ink, x, 6, x, b.h - 6, { pen: "pencil" }) },
-  worker: (ink, b) => { box(ink, 3, 3, b.w - 6, b.h - 6); asterisk(ink, b.w / 2, b.h / 2, b.h * 0.35, { pen: "pencil" }) },
-  storage: (ink, b) => { loop(ink, b.w / 2, 8, (b.w - 6) / 2, 5); line(ink, 3, 8, 8, b.h - 4); line(ink, b.w - 3, 8, b.w - 8, b.h - 4); line(ink, 8, b.h - 4, b.w - 8, b.h - 4) },
+export const ROLE_PAINT: Readonly<Record<NodeRole, PaintKey>> = {
+  outside: "pencil",
+  edge: "tangerine",
+  compute: "grass",
+  sql: "sky",
+  nosql: "grape",
+  cache: "tomato",
+  queue: "lemon",
+  storage: "teal",
+}
+
+const UNIT_W = 100
+const UNIT_H = 66
+const FILL_ALPHA = 0.42
+
+interface Pad {
+  fill(pts: readonly Pt[]): void
+  ink(pts: readonly Pt[]): void
+  pencil(pts: readonly Pt[]): void
+  dot(x: number, y: number, r: number): void
+  solid(pts: readonly Pt[]): void
+}
+
+function pad(ink: Ink, b: Box, color: PaintKey): Pad {
+  const sx = b.w / UNIT_W
+  const sy = b.h / UNIT_H
+  const at = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [x * sx, y * sy])
+  return {
+    fill: (pts) => { wash(ink, at(pts), color, { alpha: FILL_ALPHA, material: "wash" }) },
+    ink: (pts) => { ink.stroke(at(pts), "ink", { end: "soft", start: "soft" }) },
+    pencil: (pts) => { ink.stroke(at(pts), "pencil", { end: "soft", start: "soft" }) },
+    dot: (x, y, r) => { ink.poly("marker", ellipsePoly(x * sx, y * sy, r * sx, r * sy, 12), "ink", 0.95) },
+    solid: (pts) => { ink.poly("marker", at(pts), "ink", 0.95) },
+  }
+}
+
+const rect = (x: number, y: number, w: number, h: number): Pt[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]
+const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 18): Pt[] =>
+  Array.from({ length: n + 1 }, (_, i) => {
+    const a = a0 + (a1 - a0) * i / n
+    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]
+  })
+const ring = (cx: number, cy: number, rx: number, ry: number): Pt[] => arc(cx, cy, rx, ry, 0, Math.PI * 2, 28)
+const seg = (x1: number, y1: number, x2: number, y2: number): Pt[] => [[x1, y1], [x2, y2]]
+
+function gear(p: Pad, cx: number, cy: number, r: number, spoke: number) {
+  p.ink(ring(cx, cy, r, r))
+  for (let i = 0; i < 8; i++) {
+    const a = i * Math.PI / 4
+    p.ink(seg(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r + spoke), cy + Math.sin(a) * (r + spoke)))
+  }
+}
+
+const CLOUD: Pt[] = [
+  ...arc(30, 40, 14, 12, Math.PI * 0.5, Math.PI * 1.5),
+  ...arc(48, 26, 18, 16, Math.PI * 1.1, Math.PI * 1.95),
+  ...arc(70, 38, 14, 13, Math.PI * 1.4, Math.PI * 2.5),
+  [30, 52],
+]
+
+export const NODE_SHAPES: Readonly<Record<NodeKind, (p: Pad) => void>> = {
+  client: (p) => {
+    p.fill(rect(22, 8, 56, 38))
+    p.ink(rect(22, 8, 56, 38))
+    p.ink([[12, 52], [88, 52], [82, 59], [18, 59], [12, 52]])
+  },
+  mobile: (p) => {
+    p.fill(rect(38, 8, 24, 50))
+    p.ink(rect(36, 4, 28, 58))
+    p.ink(seg(46, 10, 54, 10))
+    p.dot(50, 55, 1.8)
+  },
+  internet: (p) => {
+    p.fill(CLOUD)
+    p.ink(CLOUD)
+  },
+  dns: (p) => {
+    const top: Pt[] = [[30, 12], [70, 12], [78, 20], [70, 28], [30, 28], [30, 12]]
+    const low: Pt[] = [[70, 34], [30, 34], [22, 42], [30, 50], [70, 50], [70, 34]]
+    p.fill(top)
+    p.fill(low)
+    p.ink(seg(50, 6, 50, 62))
+    p.ink(top)
+    p.ink(low)
+  },
+  cdn: (p) => {
+    p.fill(ring(50, 33, 26, 27))
+    p.ink(ring(50, 33, 26, 27))
+    p.pencil(seg(24, 33, 76, 33))
+    p.pencil(arc(50, 33, 11, 27, -Math.PI / 2, Math.PI / 2))
+    p.pencil(arc(50, 33, 11, 27, Math.PI / 2, Math.PI * 1.5))
+    p.dot(36, 20, 3)
+    p.dot(65, 42, 3)
+    p.dot(44, 50, 3)
+  },
+  lb: (p) => {
+    p.fill(rect(36, 14, 28, 38))
+    p.ink(rect(36, 14, 28, 38))
+    p.ink(seg(6, 33, 36, 33))
+    for (const y of [12, 33, 54]) {
+      p.ink(seg(64, 33, 92, y))
+      const dx = 92 - 64
+      const dy = y - 33
+      const l = Math.hypot(dx, dy)
+      const ux = dx / l
+      const uy = dy / l
+      p.ink([[92 - ux * 7 - uy * 4, y - uy * 7 + ux * 4], [92, y], [92 - ux * 7 + uy * 4, y - uy * 7 - ux * 4]])
+    }
+  },
+  proxy: (p) => {
+    const shield: Pt[] = [[50, 5], [74, 13], [74, 31], [70, 45], [50, 61], [30, 45], [26, 31], [26, 13], [50, 5]]
+    p.fill(shield)
+    p.ink(shield)
+    p.ink([[40, 33], [47, 40], [60, 25]])
+  },
+  server: (p) => {
+    p.fill(rect(24, 6, 52, 54))
+    p.ink(rect(24, 6, 52, 54))
+    p.ink(seg(24, 24, 76, 24))
+    p.ink(seg(24, 42, 76, 42))
+    for (const y of [15, 33, 51]) {
+      p.pencil(seg(31, y, 54, y))
+      p.dot(68, y, 2.6)
+    }
+  },
+  service: (p) => {
+    p.fill(rect(20, 8, 60, 50))
+    p.ink(rect(20, 8, 60, 50))
+    gear(p, 50, 33, 9, 6)
+  },
+  worker: (p) => {
+    p.fill(ring(50, 33, 20, 20))
+    gear(p, 50, 33, 20, 6)
+    p.ink(ring(50, 33, 7, 7))
+    p.pencil(arc(50, 33, 33, 28, -Math.PI * 0.3, Math.PI * 0.3))
+  },
+  cache: (p) => {
+    p.fill(rect(16, 16, 68, 34))
+    p.ink(rect(16, 16, 68, 34))
+    for (const x of [25, 38, 50, 62, 75]) {
+      p.pencil(seg(x, 16, x, 8))
+      p.pencil(seg(x, 50, x, 58))
+    }
+    p.solid([[54, 20], [42, 35], [50, 35], [45, 47], [58, 30], [50, 30], [54, 20]])
+  },
+  db: (p) => {
+    const body: Pt[] = [[24, 12], ...arc(50, 54, 26, 7, Math.PI, 0), [76, 12]]
+    p.fill([...body, [24, 12]])
+    p.ink(ring(50, 12, 26, 7))
+    p.ink([[24, 12], [24, 54]])
+    p.ink([[76, 12], [76, 54]])
+    p.ink(arc(50, 54, 26, 7, 0, Math.PI))
+    p.pencil(arc(50, 26, 26, 7, 0, Math.PI))
+    p.pencil(arc(50, 40, 26, 7, 0, Math.PI))
+  },
+  nosql: (p) => {
+    p.fill(rect(30, 16, 36, 44))
+    p.ink([[38, 6], [74, 6], [74, 50]])
+    p.ink([[34, 11], [70, 11], [70, 55]])
+    p.ink(rect(30, 16, 36, 44))
+    p.ink([[44, 26], [41, 27], [41, 36], [38, 38], [41, 40], [41, 49], [44, 50]])
+    p.ink([[52, 26], [55, 27], [55, 36], [58, 38], [55, 40], [55, 49], [52, 50]])
+  },
+  queue: (p) => {
+    p.fill(rect(8, 18, 74, 30))
+    p.ink(seg(8, 18, 82, 18))
+    p.ink(seg(8, 48, 82, 48))
+    for (const x of [14, 36, 58]) p.ink(rect(x, 24, 16, 18))
+    p.ink(seg(84, 33, 96, 33))
+    p.ink([[90, 28], [96, 33], [90, 38]])
+  },
+  storage: (p) => {
+    const bucket: Pt[] = [[22, 14], [30, 60], [70, 60], [78, 14]]
+    p.fill([...bucket, [22, 14]])
+    p.ink(ring(50, 14, 28, 6))
+    p.ink(bucket)
+    p.pencil(seg(26, 32, 74, 32))
+  },
 }
 
 export const sceneNodeRecipe = defineRecipe<{ kind: NodeKind }>({
@@ -23,7 +187,7 @@ export const sceneNodeRecipe = defineRecipe<{ kind: NodeKind }>({
   layers: ["rest", "focus", "invalid"],
   pad: 14,
   draw(ink, b, { kind }) {
-    ink.layer("rest", () => NODE_SHAPES[kind](ink, b))
+    ink.layer("rest", () => NODE_SHAPES[kind](pad(ink, b, ROLE_PAINT[NODE_ROLE[kind]])))
     ink.layer("focus", () => focusRing(ink, 0, 0, b.w, b.h, { gap: 5 }))
     ink.layer("invalid", () => {
       const s = Math.min(b.w, b.h) * 0.8
diff --git a/src/scene/model.ts b/src/scene/model.ts
index ff2edbf..4bfd8d9 100644
--- a/src/scene/model.ts
+++ b/src/scene/model.ts
@@ -1,6 +1,26 @@
 export type NodeKind =
-  | "client" | "internet" | "dns" | "cdn" | "lb" | "proxy" | "server"
-  | "service" | "cache" | "db" | "queue" | "worker" | "storage"
+  | "client" | "mobile" | "internet" | "dns" | "cdn" | "lb" | "proxy" | "server"
+  | "service" | "cache" | "db" | "nosql" | "queue" | "worker" | "storage"
+
+export type NodeRole = "outside" | "edge" | "compute" | "sql" | "nosql" | "cache" | "queue" | "storage"
+
+export const NODE_ROLE: Readonly<Record<NodeKind, NodeRole>> = {
+  client: "outside",
+  mobile: "outside",
+  internet: "outside",
+  dns: "edge",
+  cdn: "edge",
+  lb: "edge",
+  proxy: "edge",
+  server: "compute",
+  service: "compute",
+  worker: "compute",
+  cache: "cache",
+  db: "sql",
+  nosql: "nosql",
+  queue: "queue",
+  storage: "storage",
+}
 
 export type Cell = readonly [col: number, row: number]
 
````
