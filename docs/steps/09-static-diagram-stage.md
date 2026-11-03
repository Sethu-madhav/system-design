# Step 9: static diagram stage

## Goal

The lesson page draws the lesson's scene as a hand-drawn diagram. A reader steps through it with Prev and Next buttons. There is no animation yet.

- The stage sits above the lesson text, full width, and replaces the dashed placeholder from step 8.
- Each step shows its caption and "Step i of n".
- Stepping through the load-balancer lesson crosses out server A at step 5 ("fail") and shows server C at step 7 ("scale").
- The text cue for the current step gets a `data-active` attribute and turns bold.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/content`, `src/lib`, `src/components`, `vendor`, `package.json` or `pnpm-lock.yaml`. Add no dependency.
- Do not add code comments. Do not use `any` or non-null assertions (`!`) in the files you write. The only `as` casts allowed are `as const` and the one `Object.keys(NODE_SHAPES) as NodeKind[]` in `ink.test.ts`.
- `src/scene` must not import `@/content`. `src/app` imports the scene only from `@/scene`. `src/boundaries.test.ts` fails otherwise.
- `defineRecipe` calls must be top-level `export const x = defineRecipe(...)` in `src/scene/ink.ts`. The boundaries test enforces this.
- Select elements in Playwright by role, `data-testid` or `data-*` attributes. Never by CSS class.

## Files

You write or change exactly these 10 files:

| File | Change |
| :--- | :--- |
| `src/scene/layout.ts` | add `gridOf`, `layoutScene`, `pointOn` and their types |
| `src/scene/layout.test.ts` | add 5 tests |
| `src/scene/ink.ts` | new. `NODE_SHAPES` and two recipes |
| `src/scene/ink.test.ts` | new, 4 tests |
| `src/scene/ScenePlayer.tsx` | new. `SceneProvider`, `ScenePlayer`, `useSceneCue` |
| `src/scene/scene.css` | new |
| `src/scene/index.ts` | export the three names from `ScenePlayer.tsx` |
| `src/app/LessonPage.tsx` | wrap in `SceneProvider`, replace the placeholder with `ScenePlayer` |
| `src/app/ProseView.tsx` | cues read `useSceneCue` |
| `e2e/scene-static.spec.ts` | new, 6 tests |

Nothing else changes.

### `src/scene/layout.ts`

Keep everything that is there. Add these exports.

```ts
export const CELL_STEP = 8
export const MIN_CELL = 64
export const MAX_CELL = 128
export const EDGE_GAP = 6
export const EDGE_PAD = 8

export interface Rect { readonly x: number; readonly y: number; readonly w: number; readonly h: number }
export interface EdgeGeom { readonly id: EdgeId; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number; readonly host: Rect }
export interface Layout {
  readonly cellPx: number
  readonly width: number
  readonly height: number
  readonly nodes: Readonly<Record<string, Rect>>
  readonly edges: Readonly<Record<EdgeId, EdgeGeom>>
}

export function gridOf(timeline: Timeline): { readonly cols: number; readonly rows: number }
export function layoutScene(timeline: Timeline, width: number): Layout
export function pointOn(g: EdgeGeom, fromIsA: boolean, u: number): readonly [number, number]
```

Import `EdgeId` with `import type { EdgeId } from "./model"`.

`gridOf`. `cols` is the largest `at[0]` over all nodes plus 1. `rows` is the largest `at[1]` plus 1. Hidden nodes count.

`layoutScene`. Every number it returns is an integer. That keeps ink cache keys stable.

1. `cellPx` is `Math.floor(width / cols / CELL_STEP) * CELL_STEP`, then clamped to `[MIN_CELL, MAX_CELL]`.
2. All nodes share one size. `w` is `NODE_W * cellPx` rounded to the nearest multiple of 4. `h` is `NODE_H * cellPx` rounded to the nearest multiple of 2. The ink engine buckets a host box to multiples of 4 by 2, so these sizes make the drawing box equal the host box.
3. A node at `[col, row]` has `x = col * cellPx + (cellPx - w) / 2` and `y = row * cellPx + (cellPx - h) / 2`. Both come out as integers because of step 2.
4. For each edge, take the line from the center of node `a` to the center of node `b`. Clip it where it leaves each node's rect, then move each end a further `EDGE_GAP` pixels outward along the line. Round `x1, y1` (the `a` end) and `x2, y2` (the `b` end).
5. The edge `host` is the bounding box of the two ends grown by `EDGE_PAD` on every side. Round `w` up to a multiple of 4 and `h` up to a multiple of 2. A flat edge needs this padding. The ink host ignores a box with zero height and draws nothing.
6. `width` is `cols * cellPx`. `height` is `rows * cellPx`.

`pointOn` returns the point at fraction `u` along the edge. With `fromIsA` it runs from `(x1, y1)` to `(x2, y2)`. Without it, it runs the other way. Step 10 uses it for packets.

### `src/scene/layout.test.ts`

Keep the 4 tests that are there. They already cover the two `lintLayout` checks the design listed, so do not add those again. Add one shared timeline at the top level and these 5 tests:

```ts
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
```

1. `cellPx is bucketed to 8 and clamped`. Widths 500, 100 and 5000 give 96, 64 and 128.
2. `same width bucket gives identical layout`. `layoutScene(lb, 481)` deep-equals `layoutScene(lb, 519)`.
3. `node rects are integers`. For widths 300, 517, 733 and 1200, every node's `x, y, w, h` is an integer, `w % 4` is 0 and `h % 2` is 0.
4. `edge endpoints clipped outside both node rects`. At width 517, for every edge, neither end lies inside or on the rect of node `a` or node `b`. Use `>=` and `<=` in the inside check, so an end exactly on the border fails.
5. `pointOn u=0 at from, u=1 at to, reversed when from is b`. Use edge `"lb~you"` at width 517.

### `src/scene/ink.ts` (new)

Import from `@/lib/ink` only: the shape functions, `defineRecipe`, and the types `Box` and `Ink`. Here `Ink` is the drawing class, not the React component.

`export const NODE_SHAPES: Readonly<Record<NodeKind, (ink: Ink, b: Box) => void>>`. One drawing per kind, inset 3px from the box edge. Use the drawing helpers `box`, `loop`, `line`, `cloud`, `dashedBox`, `squiggle` and `asterisk`. Keep the main outline in the default pen and inner details in `"pencil"`.

| Kind | Drawing |
| :--- | :--- |
| client | a box on the top three quarters, and a short base line under it |
| internet | a cloud |
| dns | a box with a small tab box on its top left |
| cdn | a cloud with a smaller pencil cloud inside |
| lb | a loop (ellipse) with a short pencil line across the middle |
| proxy | a dashed box with rounded corners (`r: h / 3`) |
| server | a box with two pencil rack lines at one third and two thirds of the height |
| service | a box with `corner: h / 4` |
| cache | a box with an orange squiggle across the middle |
| db | a cylinder. A full loop on top, a half loop at the bottom (`turns: 0.5, a0: 0`), and two side lines |
| queue | a box with three pencil divider lines |
| worker | a box with an asterisk in the middle |
| storage | a bucket. A loop on top, two slanted sides and a bottom line |

Two recipes:

```ts
export const sceneNodeRecipe = defineRecipe<{ kind: NodeKind }>({
  id: "scene-node",
  layers: ["rest", "focus", "invalid"],
  pad: 14,
  draw(ink, b, { kind }) {
    ink.layer("rest", () => NODE_SHAPES[kind](ink, b))
    ink.layer("focus", () => focusRing(ink, 0, 0, b.w, b.h, { gap: 5 }))
    ink.layer("invalid", () => {
      const s = Math.min(b.w, b.h) * 0.8
      cross(ink, (b.w - s) / 2, (b.h - s) / 2, s)
    })
  },
})
```

The `invalid` layer is the red cross for a node that is down. The design listed a separate `scene-down` recipe. A layer on the node recipe does the same job with one fewer host.

`export interface EdgeParams { x1: number; y1: number; x2: number; y2: number; heads: EdgeDef<string>["heads"] }`. Import `EdgeDef` with `import type { EdgeDef } from "./timeline"`.

`sceneEdgeRecipe` has id `"scene-edge"`, layers `["rest", "checked"]` and pad 10. The `rest` layer draws the edge in `"pencil"`. The `checked` layer draws the same edge in `"blue"`, for an edge that carries traffic in this step. Draw with `arrow(..., { pen, curve: 0 })`:

- `"a->b"`. One arrow from `(x1, y1)` to `(x2, y2)`.
- `"b->a"`. One arrow from `(x2, y2)` to `(x1, y1)`.
- `"both"`. Two arrows from the midpoint, one to each end. The two halves read as one line with a head at each end.

The design also listed `scene-packet`. Leave it to step 10, which is the first step that draws packets.

### `src/scene/ink.test.ts` (new)

Call `runRecipe` directly. Each stroke adds one `M` command to the SVG path data, so count `M` to count strokes:

```ts
const subpaths = (svg: string | undefined) => (svg ?? "").match(/M/g)?.length ?? 0
```

Use `{ seed, tier: "lo", density: "comfortable", dir: "ltr", knobs: DEFAULT_KNOBS }` as the base request. Node boxes are `{ w: 76, h: 50 }`. The edge box is `{ w: 120, h: 16 }` with params `{ x1: 8, y1: 8, x2: 112, y2: 8 }`.

1. `every NodeKind draws a non-empty rest layer`. `Object.keys(NODE_SHAPES)` has 13 entries. Each kind's `parts.rest` has at least one subpath.
2. `scene-node is deterministic for the same seed`. Two runs with seed `"a"` and kind `"db"` are deep-equal. Seed `"b"` gives a different `parts.rest`.
3. `scene-edge heads both draws two heads`. The `"both"` rest layer has exactly twice the subpaths of the `"a->b"` rest layer. Today that is 12 against 6.
4. `runCounter does not grow when the same node is rendered twice through inkFrame`. Call `inkFrame` twice with one request. `runCounter.runs` is the same after the second call.

### `src/scene/ScenePlayer.tsx` (new)

**Context.** A private `SceneContext` holds `{ timeline, state, frame, dispatch }`, with a default of `null`. A private `useScene()` throws `new Error("scene hooks must be used inside SceneProvider")` when the context is `null`.

**`SceneProvider({ timeline, children })`.**
- `useReducer` with `(current, event) => reducePlayer(timeline, current, event)` and `initialPlayer`.
- `frame` is `frameAt(timeline, state.t, "reduced")`. Reduced motion has no packets, and it marks every edge that carries a send in the current step as active. That is the static view this step wants.
- No clock and no `requestAnimationFrame`. Step 10 adds them.
- Wrap the context value in `React.useMemo` keyed on `[timeline, state, frame]`, and compute `frame` in a `useMemo` keyed on `[timeline, state.t]`. Every cue reads this context, so a new object on each render re-renders every cue.

**`useSceneCue(stepId)`** returns `{ active: frame.stepId === stepId }`.

**Prev and Next dispatch `goto`.** Next sends `{ type: "goto", step: frame.stepIndex + 1 }` and Prev sends `{ type: "goto", step: frame.stepIndex - 1 }`. Do not dispatch `next`. With no clock, `next` at a step's start time targets that same step, so the button would never move. The prototype hit this, and planted-bug runs fail 5 of the 6 e2e tests with it.

**`ScenePlayer()`** renders:

```
figure data-testid="scene" data-step-id={frame.stepId}
  div (measure wrapper)            ref from useInkBox()
    div data-testid="stage"        relative, mx-auto, width × height from layoutScene
      one div per edge, then one div per node
  figcaption
    Button "Prev"  aria-label="Previous step"  disabled on the first step
    div aria-live="polite"
      p data-testid="step-count"   "Step {index + 1} of {count}"
      p data-testid="caption"      frame.caption
    Button "Next"  aria-label="Next step"      disabled on the last step
```

- **Measuring.** Call `useInkBox()` from `@/lib/ink` and put its `ref` on the measure wrapper. Render the stage only when `box` is set, with `layoutScene(timeline, box.w - 2)`. `useInkBox` rounds the width to the nearest multiple of 4, so the real width can be up to 2px less than `box.w`. Without the `- 2`, a 727px wrapper lays out a 728px stage and shows a 1px scrollbar.
- **The wrapper reserves its height in CSS before anything is measured.** Use `className="w-full overflow-x-auto overflow-y-hidden"` and `style={{ boxSizing: "content-box", paddingTop: 24, paddingBottom: 24, aspectRatio: \`${cols} / ${rows}\`, minHeight: rows * MIN_CELL, maxHeight: rows * MAX_CELL }}`, with `cols` and `rows` from `gridOf(timeline)`. This does two things. The ink box ignores a host with zero height, so an empty wrapper would never measure. And the page does not jump when the stage appears, so step 8's deep-link scroll test keeps passing. The 24px top padding is room for a note on a top-row node. The 24px bottom padding is room for the bottom row's labels. Below `cols * 64` pixels wide the stage scrolls sideways.
- **Edge hosts.** `data-scene-edge={edge.id}`, `data-visible={view.visible}`, `data-active` set to `""` when `view.active` and left off otherwise. Absolute position at `g.host`. Inside, `<InkLayer recipe={sceneEdgeRecipe} seed={edge.id} params={...} />` with the ends made relative to the host (`g.x1 - g.host.x` and so on) and `heads: edge.heads`. `InkLayer` is the React component exported from `@/lib/ink`.
- **Node hosts.** `data-scene-node={id}`, `data-kind={def.kind}`, `data-visible={view.visible}`, `aria-hidden={!view.visible}`, `data-focus` and `data-down` as `""` or left off (`data-down` when `view.status === "down"`). Absolute position at the node rect. Inside, `<InkLayer recipe={sceneNodeRecipe} seed={id} params={{ kind: def.kind }} />`.
  - The label is a `span` under the node (`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[calc(100%+1.5rem)] text-center font-hand text-sm leading-tight`). The `max-w` makes a long label like "Load balancer" wrap instead of running into the next node's label at small cell sizes.
  - When `view.note` is set, add a `span data-testid="scene-note"` above the node (`absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max bg-paper px-1 font-hand text-sm text-red`). The `mb-1` keeps the note off the node outline. The `bg-paper` hides any arrow that passes behind the note, since edges render before nodes.
- Edge hosts also get `aria-hidden={!view.visible}`. Hidden nodes and edges are only transparent, so without it a screen reader reads "Server C" at step 1.
- Import `Button` from `@/components/ui/button` with `variant="outline" size="sm"`.
- Import `./scene.css` at the top of the file.

### `src/scene/scene.css` (new)

The Looseleaf stylesheet hides every ink layer except `rest`. This file turns layers on from host attributes. Copy it as written:

```css
[data-scene-node],
[data-scene-edge] {
  transition: opacity 200ms ease-out;
}

[data-scene-node][data-visible="false"],
[data-scene-edge][data-visible="false"] {
  opacity: 0;
}

[data-scene-node][data-focus] svg[data-ink] [data-layer="focus"],
[data-scene-node][data-down] svg[data-ink] [data-layer="invalid"],
[data-scene-edge][data-active] svg[data-ink] [data-layer="checked"] {
  opacity: 1;
  visibility: visible;
  scale: none;
  rotate: none;
}

[data-scene-edge][data-active] svg[data-ink] [data-layer="rest"] {
  opacity: 0;
}

[data-cue][data-active] {
  font-weight: 700;
}
```

### `src/scene/index.ts`

Add `export { SceneProvider, ScenePlayer, useSceneCue } from "./ScenePlayer"`.

### `src/app/LessonPage.tsx`

- Import `SceneProvider` and `ScenePlayer` from `@/scene`.
- Wrap the returned lesson in `<SceneProvider key={lesson.slug} timeline={lesson.timeline}>`. The key resets the player when the lesson changes. Re-indent everything inside it by one level.
- Remove the two-column grid and the `diagram-slot` div. The order becomes: header, `<ScenePlayer />`, then one `div className="min-w-0 space-y-8"` holding the prose, attribution, further reading and the prev/next nav.
- The not-found branch and the scroll effect stay as they are.

### `src/app/ProseView.tsx`

Add a private component and use it for the `cue` case:

```tsx
function Cue({ step, text }: { step: string; text: string }) {
  const { active } = useSceneCue(step)
  return <Highlight data-cue={step} data-active={active ? "" : undefined} seed={step}>{text}</Highlight>
}
```

The `cue` case becomes `return <Cue key={index} step={node.step} text={node.text} />`. Import `useSceneCue` from `@/scene`.

### `e2e/scene-static.spec.ts` (new)

Import `test`, `expect` and `gotoReady` from `./fixtures`. Every test opens `/#/learn/load-balancer`. Write exactly these 6 tests:

1. `stage shows 4 visible nodes at step 1 (c and sessions hidden)`. Inside `data-testid="scene"`, `[data-scene-node][data-visible="true"]` has count 4. Nodes `c` and `sessions` have `data-visible="false"`. Node `you` has at least one `path` under `svg[data-ink] [data-layer="rest"]`, which proves the ink drew.
2. `Next four times reaches 'fail' and server A has data-down`. Before clicking, node `a` has no `data-down`. After four clicks on the "Next step" button, the scene has `data-step-id="fail"` and node `a` has `data-down=""`.
3. `Next at 'scale' makes server C visible`. After five clicks the step is `reroute` and node `c` has `data-visible="false"`. One more click gives `scale` and `data-visible="true"`.
4. `caption text matches the step`. At load, `step-count` reads `Step 1 of 8` and `caption` reads `Your request goes to the load balancer, not to a server.` After one Next, `Step 2 of 8` and `The balancer picks a healthy server, here by round robin, and forwards the request.`
5. `Prev returns to the previous caption`. The "Previous step" button is disabled at load. After Next twice and Prev once, the caption is the `pick` caption from test 4.
6. `the cue for the current step has data-active`. At load, exactly one `[data-cue][data-active]` exists in `data-testid="prose"`, and it is `[data-cue="arrive"]`. After one Next, `[data-cue="pick"]` has `data-active` and `arrive` does not.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run still shows 62 tests passing.
3. `pnpm test` shows 150 tests passing in 12 files. That is 141 today, plus 5 layout tests, plus 4 ink tests.
4. `pnpm e2e` shows 17 tests passing. That is the 11 that exist today plus these 6.

## Done means

- All four commands pass.
- `git status` shows only the files in the Files table.
- These planted bugs each make tests fail. Check each one, then put the code back:
  - Next dispatches `{ type: "next" }`. Five e2e tests fail.
  - `useSceneCue` always returns `active: false`. E2e test 6 fails.
  - The `"both"` branch draws a single arrow. Ink test 3 fails.
  - Node `w` is `NODE_W * cellPx` without rounding. Layout test 3 fails.
- No comments, `any` or `!` assertions in the files you wrote, and no `as` casts beyond the two allowed above.
- At 1280 by 900, the stage is about 728px wide and shows You, Load balancer, Server A and Server B with arrows between them.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Paste the failing output of the four planted-bug checks. Say whether you hit anything the spec did not cover, and what you did about it.
