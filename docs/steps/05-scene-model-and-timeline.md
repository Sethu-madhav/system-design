# Step 5: scene model and timeline

## Goal

A lesson's diagram is a scene. A scene is plain data: nodes on a grid, and an ordered list of steps that send packets between nodes, show nodes or take them down. This step adds two things:

- `defineScene` builds a scene with typed ids. A send to a node id that does not exist does not compile.
- `compile` checks a scene and turns it into a timeline once. Then `frameAt(timeline, t, motion)` says what is on screen at time `t`, as a pure function. Play, pause, step back and scrub all become "set `t`".

Nothing changes in the browser. Step 9 draws frames, and step 10 animates them.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Load the tdd skill at `vendor/pstack/skills/tdd/SKILL.md` and follow it. Write `src/scene/timeline.test.ts` first and watch it fail.
- Run `pnpm install` first.
- Create only the four files listed below. Do not edit any other file, `package.json` included.
- Do not add any dependency.
- Do not add code comments. The only exception is the text after each `@ts-expect-error` directive given below.

## Files

### `src/scene/model.ts` (new)

Export exactly these names: `NodeKind`, `Cell`, `NodeDef`, `PacketTone`, `PersistentAction`, `SendAction`, `TransientAction`, `Action`, `StepDef`, `StepKit`, `Scene`, `SceneBuilder`, `EdgeId`, `defineScene` and `edgeId`.

```ts
export type NodeKind =
  | "client" | "internet" | "dns" | "cdn" | "lb" | "proxy" | "server"
  | "service" | "cache" | "db" | "queue" | "worker" | "storage"

export type Cell = readonly [col: number, row: number]

export interface NodeDef {
  readonly kind: NodeKind
  readonly label: string
  readonly at: Cell
  readonly hidden?: true
}

export type PacketTone = "request" | "response" | "data" | "error"

export type PersistentAction<N extends string> =
  | { readonly a: "show"; readonly nodes: readonly N[] }
  | { readonly a: "hide"; readonly nodes: readonly N[] }
  | { readonly a: "down"; readonly node: N }
  | { readonly a: "up"; readonly node: N }

export type SendAction<N extends string> = {
  readonly a: "send"
  readonly from: N
  readonly to: N
  readonly label: string
  readonly tone: PacketTone
}

export type TransientAction<N extends string> =
  | SendAction<N>
  | { readonly a: "parallel"; readonly sends: readonly SendAction<N>[] }
  | { readonly a: "focus"; readonly node: N }
  | { readonly a: "note"; readonly node: N; readonly text: string }

export type Action<N extends string> = PersistentAction<N> | TransientAction<N>

export interface StepDef<N extends string> {
  readonly caption: string
  readonly actions: readonly Action<N>[]
}

export interface StepKit<N extends string> {
  step(caption: string, ...actions: Action<N>[]): StepDef<N>
  send(from: N, to: N, label?: string, tone?: PacketTone): SendAction<N>
  parallel(...sends: SendAction<N>[]): TransientAction<N>
  show(...nodes: N[]): PersistentAction<N>
  hide(...nodes: N[]): PersistentAction<N>
  down(node: N): PersistentAction<N>
  up(node: N): PersistentAction<N>
  focus(node: N): TransientAction<N>
  note(node: N, text: string): TransientAction<N>
}

export interface Scene<N extends string = string, S extends string = string> {
  readonly nodes: Readonly<Record<N, NodeDef>>
  readonly steps: readonly { readonly id: S; readonly def: StepDef<N> }[]
}

export interface SceneBuilder<N extends string> {
  steps<const T extends Record<string, StepDef<N>>>(fn: (s: StepKit<N>) => T): Scene<N, Extract<keyof T, string>>
}

export type EdgeId = `${string}~${string}`

export function defineScene<const T extends Record<string, NodeDef>>(nodes: T): SceneBuilder<Extract<keyof T, string>>
export function edgeId(a: string, b: string): EdgeId
```

**`defineScene(nodes)`** returns a builder. `builder.steps(fn)` calls `fn` once with a `StepKit`, and returns `{ nodes, steps }`. `steps` lists the object's entries in key order, as `{ id, def }`. Each kit function returns plain data and checks nothing:

- `step(caption, ...actions)` gives `{ caption, actions }`.
- `send(from, to, label, tone)` gives a send. `label` defaults to `""` and `tone` defaults to `"request"`.
- `parallel`, `show`, `hide`, `down`, `up`, `focus` and `note` each give the matching action.

`defineScene` does no checks. `compile` does them all. One cast is allowed in `model.ts`, where an object key becomes a step id.

**`edgeId(a, b)`** gives `` `${a}~${b}` `` when `a < b` by JavaScript string comparison, and `` `${b}~${a}` `` otherwise. So `edgeId("lb", "a")` and `edgeId("a", "lb")` are both `a~lb`.

### `src/scene/timeline.ts` (new)

Export exactly these names: the six constants, `Motion`, `NodeState`, `EdgeDef`, `Flight`, `TimedStep`, `Timeline`, `PacketView`, `FrameNode`, `Frame`, `SceneError`, `compile`, `stepIndexAt`, `frameAt`, `readingTime` and `ease`.

```ts
export const SEND_MS = 800
export const LEAD_MS = 200
export const SETTLE_MS = 400
export const READ_MS_PER_WORD = 230
export const MIN_STEP_MS = 1600
export const MAX_STEP_MS = 6000

export type Motion = "full" | "reduced"

export interface NodeState {
  readonly visible: boolean
  readonly status: "up" | "down"
}

export interface EdgeDef<N extends string> {
  readonly id: EdgeId
  readonly a: N
  readonly b: N
  readonly heads: "a->b" | "b->a" | "both"
}

export interface Flight<N extends string> {
  readonly key: string
  readonly edge: EdgeId
  readonly from: N
  readonly to: N
  readonly label: string
  readonly tone: PacketTone
  readonly t0: number
  readonly t1: number
}

export interface TimedStep<N extends string, S extends string> {
  readonly id: S
  readonly index: number
  readonly caption: string
  readonly start: number
  readonly end: number
  readonly world: Readonly<Record<N, NodeState>>
  readonly entering: readonly N[]
  readonly flights: readonly Flight<N>[]
  readonly focus: readonly N[]
  readonly notes: readonly { readonly node: N; readonly text: string }[]
}

export interface Timeline<N extends string = string, S extends string = string> {
  readonly nodes: Readonly<Record<N, NodeDef>>
  readonly edges: readonly EdgeDef<N>[]
  readonly steps: readonly TimedStep<N, S>[]
  readonly duration: number
}

export interface PacketView {
  readonly key: string
  readonly edge: EdgeId
  readonly u: number
  readonly from: string
  readonly to: string
  readonly label: string
  readonly tone: PacketTone
}

export interface FrameNode extends NodeState {
  readonly focus: boolean
  readonly entering: boolean
  readonly note?: string
}

export interface Frame {
  readonly t: number
  readonly stepIndex: number
  readonly stepId: string
  readonly caption: string
  readonly nodes: Readonly<Record<string, FrameNode>>
  readonly edges: Readonly<Record<EdgeId, { readonly visible: boolean; readonly active: boolean }>>
  readonly packets: readonly PacketView[]
}

export class SceneError extends Error {}

export function compile<N extends string, S extends string>(scene: Scene<N, S>): Timeline<N, S>
export function stepIndexAt(timeline: Timeline, t: number): number
export function frameAt(timeline: Timeline, t: number, motion: Motion): Frame
export function readingTime(caption: string): number
export function ease(p: number): number
```

**`readingTime(caption)`** counts the words, `caption.split(/\s+/).filter(Boolean).length`. It returns `words * READ_MS_PER_WORD`, clamped to between `MIN_STEP_MS` and `MAX_STEP_MS`.

**`ease(p)`** is ease-in-out quadratic, `p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2`. So `ease(0)` is 0, `ease(0.5)` is 0.5 and `ease(1)` is 1.

#### `compile(scene)`

`compile` throws `SceneError` for every problem below. Each message contains the text in quotes, with the real ids filled in. Check in this order:

1. The scene has no steps: `"scene has no steps"`.
2. A node id does not match `/^[a-z][a-z0-9-]*$/`: `"bad node id <id>"`. This keeps `~` out of edge ids.
3. A step id does not match `/^[a-z][a-z0-9-]*$/`: `"bad step id <id>"`. An integer-like id such as `"1"` fails this check. That matters because JavaScript puts integer-like keys first, which would change the play order.
4. A cell is not two integers that are both 0 or more: `"bad cell for <id>"`.
5. Two nodes share a cell, hidden nodes included: `"<a> and <b> share a cell"`.

Then walk the steps in order. The world before step 0 has every node `{ visible: !hidden, status: "up" }`. For each step:

1. **Apply the persistent actions first,** in the order written, wherever they appear in the action list.
   - `show` of a node that is already visible: `"show of visible node <id> in step <step>"`.
   - `hide` of a node that is already hidden: `"hide of hidden node <id> in step <step>"`.
   - `down` of a hidden node or a node that is already down: `"down of <id> in step <step>"`.
   - `up` of a hidden node or a node that is already up: `"up of <id> in step <step>"`.
   - The result is the step's `world`. `entering` lists the nodes that are visible now but were not visible before this step, in node key order.
2. **Then the transient actions,** in the order written. Every node they name must be visible in this step's world, or throw `"<id> is not visible in step <step>"`.
   - Keep a cursor that starts at `start + LEAD_MS`.
   - A `send` from a node to itself throws `"send from <id> to itself in step <step>"`. Otherwise it adds one flight from `cursor` to `cursor + SEND_MS`, and moves the cursor forward by `SEND_MS`.
   - A `parallel` adds one flight per send, all from `cursor` to `cursor + SEND_MS`, and moves the cursor forward by `SEND_MS` once. An empty `parallel` throws `"empty parallel in step <step>"`.
   - A `focus` adds its node to `focus`, once even if repeated.
   - A `note` adds `{ node, text }` to `notes`. A second note on the same node in one step throws `"two notes on <id> in step <step>"`.
   - Each flight's `key` is `` `${stepIndex}:${n}` ``, where `n` counts the step's flights from 0. Its `edge` is `edgeId(from, to)`.
3. **Time the step.** The step's length is `max(cursor - start + SETTLE_MS, readingTime(caption))`. Its `end` is `start + length`. The next step starts at that `end`. Step 0 starts at 0.

`duration` is the last step's `end`.

`edges` has one entry per unordered node pair that any flight uses, in the order each pair is first used. `a` and `b` come from the edge id, so `a < b`. `heads` is `"a->b"` if every flight on the edge goes from `a` to `b`, `"b->a"` if every flight goes the other way, and `"both"` otherwise.

#### `stepIndexAt(timeline, t)`

It returns the index of the step whose `start <= t < end`. A `t` exactly at a step's `end` belongs to the next step. A `t` at or past `duration` gives the last index. A `t` below 0 gives 0.

#### `frameAt(timeline, t, motion)`

1. Clamp `t` to between 0 and `duration`. `NaN` becomes 0. `frame.t` is the clamped value.
2. Find the step with `stepIndexAt`. Set `stepIndex`, `stepId` and `caption` from it.
3. `nodes` has one entry per node. Each entry is the step's `world` state, plus these keys:
   - `focus` is true if the step's `focus` lists the node.
   - `entering` is true if the step's `entering` lists the node.
   - `note` is the text of the step's note on that node. The key is absent when the node has no note.
4. `packets`:
   - In `"full"` motion, it has one packet per flight of this step with `t0 <= t < t1`. Its `u` is `ease((t - t0) / (t1 - t0))`.
   - In `"reduced"` motion, it is always empty.
5. `edges` has one entry per timeline edge.
   - `visible` is true when both ends are visible in this step's world.
   - In `"full"` motion, `active` is true while a packet is on the edge at `t`.
   - In `"reduced"` motion, `active` is true for the whole step if any flight of the step uses the edge. So a reduced frame is the same for every `t` inside one step.

### `src/scene/fixtures.ts` (new)

A small scene that later steps' tests reuse. Write it exactly like this:

```ts
import { defineScene } from "./model"
import { compile } from "./timeline"

export const fixtureScene = defineScene({
  client: { kind: "client", label: "Client", at: [0, 0] },
  lb: { kind: "lb", label: "Load balancer", at: [2, 0] },
  server: { kind: "server", label: "Server", at: [4, 0], hidden: true },
}).steps((s) => ({
  ask: s.step("The client sends a request.", s.send("client", "lb", "GET /")),
  route: s.step(
    "The balancer forwards it to a new server.",
    s.show("server"),
    s.focus("lb"),
    s.send("lb", "server", "GET /"),
  ),
  answer: s.step(
    "The server answers.",
    s.send("server", "lb", "200", "response"),
    s.send("lb", "client", "200", "response"),
  ),
  fail: s.step("The server goes down.", s.down("server"), s.note("lb", "health check failed")),
}))

export const fixture = compile(fixtureScene)
```

Its timeline has these values. Test 23 checks them:

| Step | Words | start | end | Flights, as `t0` to `t1` |
| :--- | :--- | :--- | :--- | :--- |
| `ask` | 5 | 0 | 1600 | 200 to 1000 |
| `route` | 8 | 1600 | 3440 | 1800 to 2600 |
| `answer` | 3 | 3440 | 5640 | 3640 to 4440, then 4440 to 5240 |
| `fail` | 4 | 5640 | 7240 | none |

`duration` is 7240. `edges` is `client~lb` with heads `both`, then `lb~server` with heads `both`.

### `src/scene/model.typetest.ts` (new)

`tsc -b` compiles this file and nothing runs it. Write it exactly like this:

```ts
import { defineScene } from "./model"

const nodes = { client: { kind: "client", label: "C", at: [0, 0] }, lb: { kind: "lb", label: "L", at: [2, 0] } } as const

export const ok = () => defineScene(nodes).steps((s) => ({ ask: s.step("x", s.send("client", "lb")) }))

// @ts-expect-error send to an unknown node id
export const bad1 = () => defineScene(nodes).steps((s) => ({ ask: s.step("x", s.send("client", "nope")) }))

// @ts-expect-error focus on an unknown node id
export const bad2 = () => defineScene(nodes).steps((s) => ({ ask: s.step("x", s.focus("nope")) }))

// @ts-expect-error unknown node kind
export const bad3 = () => defineScene({ x: { kind: "robot", label: "X", at: [0, 0] } })
```

### `src/scene/timeline.test.ts` (new)

Vitest, node environment. Build small scenes inline with `defineScene` where a test needs one, and use `fixture` otherwise. For errors, check both `toThrow(SceneError)` and the message text. Use these exact test names:

1. `defineScene keeps step order from object keys`. A scene with steps `zeta`, `alpha` and `mid` lists them in that order.
2. `edges derived one per unordered pair`. Sends `a` to `b`, `b` to `a` and `a` to `c` give two edges, `a~b` then `a~c`.
3. `heads both when sends go both ways`. In the same scene, `a~b` has `both` and `a~c` has `a->b`. A scene with one send from `z` to `a` gives `a~z` with `b->a`.
4. `hidden node is invisible until show`. In `fixture`, `server` is not visible in step 0, and it is visible and `entering` in step 1.
5. `show of a visible node throws`.
6. `hide of a hidden node and down of a down node throw`.
7. `send from a hidden node throws`.
8. `focus or note on a hidden node throws`.
9. `send to self throws`.
10. `two notes on one node in a step throws`.
11. `two nodes in one cell throws`.
12. `integer-like step id throws`. A steps object with the key `"1"` throws `bad step id 1`.
13. `bad node id throws`. A node id `"a~b"` and a node id `"Lb"` both throw.
14. `step start/end are contiguous and duration is the sum`.
15. `step length is at least reading time`. A step with one send and a 20-word caption lasts `20 * READ_MS_PER_WORD` ms.
16. `sequential sends are SEND_MS apart`.
17. `parallel sends share t0`. Two sends in one `parallel` have the same `t0` and `t1`. A send after the `parallel` starts at that `t1`.
18. `stepIndexAt at exact boundary belongs to next step`. `stepIndexAt(fixture, 1600)` is 1.
19. `stepIndexAt at duration is the last step`. `stepIndexAt(fixture, 7240)` and `stepIndexAt(fixture, 99999)` are both 3.
20. `frameAt mid-flight gives u≈0.5`. `frameAt(fixture, 600, "full")` has one packet with `u` close to 0.5, and edge `client~lb` is active.
21. `frameAt before LEAD_MS has no packets`. `frameAt(fixture, 100, "full")` has no packets, and no edge is active.
22. `frameAt reduced has no packets and marks the step's edges active`. `frameAt(fixture, 100, "reduced")` has no packets, and `client~lb` is active.
23. `fixture timeline has the documented times`. Check every `start`, `end`, flight `t0` and `t1`, `duration` and `edges` against the table above.
24. `frameAt reduced is identical for any t inside a step`. For 20 values of `t` spread across step 2, every reduced frame equals the first one with `toEqual` after its `t` is set aside.
25. `focus and note only during their step`. `lb` has `focus` only in step 1, and `note` only in step 3. In other steps the `note` key is absent.
26. `down persists into later steps`. In an inline scene, a `down` in step 0 is followed by two steps with no `down` or `up`. The node is still `"down"` in both.
27. `frameAt clamps t < 0 and t > duration`. `frameAt(fixture, -5, "full").t` is 0, `frameAt(fixture, 1e9, "full").t` is 7240, and `frameAt(fixture, NaN, "full").t` is 0.

## Commands that must pass

Run each one from the worktree root and paste its full output in your report:

1. `pnpm install`
2. `pnpm build`
3. `pnpm test`, which shows 5 files and 83 tests passing.
4. `pnpm e2e`, which shows 4 tests passing.

## Prove the type test works

After the commands pass, in `model.typetest.ts` change `"nope"` in `bad1` to `"lb"`. Run `pnpm build`. It fails with `Unused '@ts-expect-error' directive`. Undo the change.

## Done means

- All four commands exit 0.
- `git status` shows only the four new files under `src/scene/`.
- `package.json` and `pnpm-lock.yaml` are unchanged.
- `src/scene/model.ts` has one `as` cast, and `src/scene/timeline.ts` has none other than `as const`. Neither file uses `any` or the `!` non-null assertion.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Show the first failing run of `timeline.test.ts`, from before the code existed. Paste the failing output of the type test check. Say whether you hit anything the spec did not cover, and what you did about it.
