# Step 7: lesson pipeline and the first lesson file

## Goal

A lesson is one file, `src/content/lessons/<slug>/lesson.ts`. Its folder name is its slug and its URL. This step adds the code that finds, checks and compiles lesson files, and the first lesson, on load balancers:

- `defineLesson` takes a lesson's title, track, sources, scene, text and quiz, and compiles them when the file loads. A typo in a step id, node id or track name fails `tsc`.
- `curriculum` finds every lesson file with `import.meta.glob` and orders them by track and position. Nobody keeps a list of lessons by hand.
- `content.test.ts` runs during `pnpm build` and checks every lesson for the rules that types cannot hold.
- `boundaries.test.ts` fails `pnpm test` when code reaches into another module's internals.

Nothing changes in the browser. Step 8 adds the lesson page.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Load the tdd skill at `vendor/pstack/skills/tdd/SKILL.md` and follow it. Write each test file before the code it tests and watch it fail.
- Run `pnpm install` first.
- Create only the files listed below. Do not edit any existing file. That includes `package.json`, `src/content/prose.ts`, `src/content/sources.ts`, `src/scene/model.ts` and `src/scene/timeline.ts`.
- Do not add any dependency.
- Do not add code comments. The only exceptions are the `@ts-expect-error` text given below and the one line in `src/vite-env.d.ts`.

## Files

Create exactly these 15 files:

| File | What it holds |
| :--- | :--- |
| `src/vite-env.d.ts` | Vite's types, so `tsc` knows `import.meta.glob` |
| `src/scene/index.ts` | The only import path into `src/scene` from outside it |
| `src/scene/layout.ts` | Grid constants and `lintLayout` |
| `src/scene/layout.test.ts` | 4 tests |
| `src/content/quiz.ts` | Quiz types, `checkQuiz` and `shuffledOrder` |
| `src/content/quiz.test.ts` | 8 tests |
| `src/content/lesson.ts` | `defineLesson`, `finishLesson` and the lesson types |
| `src/content/curriculum.ts` | `TRACKS`, `buildCurriculum`, `neighbors` and `curriculum` |
| `src/content/curriculum.test.ts` | 11 tests |
| `src/content/author.ts` | The three functions a lesson file may use |
| `src/content/index.ts` | The only import path into `src/content` from outside it |
| `src/content/lessons/load-balancer/lesson.ts` | The first lesson |
| `src/content/authoring.typetest.ts` | 4 `@ts-expect-error` cases |
| `src/content/content.test.ts` | 5 tests, run once per lesson |
| `src/boundaries.test.ts` | 8 tests |

### `src/vite-env.d.ts` (new)

Exactly this one line:

```ts
/// <reference types="vite/client" />
```

### `src/scene/index.ts` (new)

Exactly this:

```ts
export { defineScene } from "./model"
export type { Scene, NodeKind, NodeDef, PacketTone } from "./model"
export { compile, SceneError } from "./timeline"
export type { Timeline } from "./timeline"
```

### `src/scene/layout.ts` (new)

Export exactly these names: `GRID_COLS`, `GRID_ROWS`, `NODE_W`, `NODE_H` and `lintLayout`. Step 9 adds the pixel layout to this file.

```ts
import type { Timeline } from "./timeline"

export const GRID_COLS = 8
export const GRID_ROWS = 5
export const NODE_W = 0.78
export const NODE_H = 0.52

export function lintLayout(timeline: Timeline): readonly string[]
```

`lintLayout` returns a list of problems, empty when the layout is fine. It works in grid units, where one cell is 1 by 1:

1. For each node in node key order, if its column is `GRID_COLS` or more, or its row is `GRID_ROWS` or more, add `"<id> is outside the grid"`.
2. Then for each edge in `timeline.edges` order, and for each other node in node key order, add `"edge <edge id> crosses <node id>"` if the edge crosses that node's box. "Other" means the node is neither end of the edge. Hidden nodes count too.
   - The edge is the straight segment between the centers of its two end nodes. A node at `[col, row]` has its center at `(col + 0.5, row + 0.5)`.
   - A node's box is `NODE_W` wide and `NODE_H` tall, centered on its center.
   - The segment crosses the box if any point of it is inside the box or on its border. Use the Liang-Barsky clipping test. Clip the segment's parameter range `[0, 1]` against the four sides of the box, and the segment crosses when the range left over is not empty.

### `src/scene/layout.test.ts` (new)

Each test builds a scene inline with `defineScene` and `compile`, imported from `./model` and `./timeline`. Use these exact test names:

1. `edge through a third node is reported`. Nodes `a` at `[0, 0]`, `m` at `[1, 0]` and `b` at `[2, 0]`, with one send from `a` to `b`, give exactly `["edge a~b crosses m"]`. Moving `m` to `[1, 1]` and `b` to `[2, 2]` gives the same result.
2. `edge that clears every node is not reported`. Nodes `a` at `[0, 0]`, `m` at `[1, 1]` and `b` at `[2, 1]`, with one send from `a` to `b`, give `[]`.
3. `node outside the 8 by 5 grid is reported`. A node `m` at `[8, 0]` gives `"m is outside the grid"`. So does a node `m` at `[0, 5]`.
4. `edge that passes near a node's center is reported`. Nodes `a` at `[0, 0]`, `m` at `[1, 0]` and `b` at `[3, 1]`, with one send from `a` to `b`, give exactly `["edge a~b crosses m"]`. The edge misses `m`'s center but passes through its box. The case fails if either box dimension is halved.

### `src/content/quiz.ts` (new)

Export exactly these names: `Option`, `Question`, `Quiz`, `checkQuiz` and `shuffledOrder`. Step 11 adds grading.

```ts
export interface Option {
  readonly text: string
  readonly correct?: true
  readonly why?: string
}

interface QuestionBase<S extends string> {
  readonly prompt: string
  readonly explain: string
  readonly replay?: S
}

export type Question<S extends string = string> =
  | (QuestionBase<S> & { readonly kind: "choice"; readonly options: readonly Option[] })
  | (QuestionBase<S> & { readonly kind: "multi"; readonly options: readonly Option[] })
  | (QuestionBase<S> & { readonly kind: "order"; readonly items: readonly string[] })

export type Quiz<S extends string = string> = readonly Question<S>[]

export function checkQuiz(quiz: Quiz): readonly string[]
export function shuffledOrder(n: number, seed: string): readonly number[]
```

The three question kinds:

- In a `choice` question, the learner picks one option, and exactly one option is right.
- In a `multi` question, the learner picks every right option.
- In an `order` question, the author writes `items` in the correct order, and the page shows them shuffled.

`replay` names the scene step that explains the answer.

**`checkQuiz(quiz)`** returns every problem, in this order, and an empty list for a good quiz. `N` is the question's position counting from 1.

1. If the quiz has fewer than 3 questions, add `"quiz needs at least 3 questions"`.
2. Then for each question in order:
   - If an earlier question has the same `prompt`, add `"question N: duplicate prompt"`.
   - For `choice` and `multi`, if there are fewer than 2 options, add `"question N: needs at least 2 options"`.
   - For `choice`, if the number of options with `correct: true` is not exactly 1, add `"question N: choice needs exactly 1 correct option"`.
   - For `multi`, if no option is correct or every option is correct, add `"question N: multi needs at least 1 correct and 1 wrong option"`.
   - For `order`, if there are fewer than 3 items, add `"question N: order needs at least 3 items"`.
   - For `order`, if two items are the same text, add `"question N: order items must be distinct"`.

**`shuffledOrder(n, seed)`** returns the order in which to show the `n` items of an `order` question. Index `i` of the result is the item shown in position `i`. The same `n` and `seed` always give the same result, so a reload shows the same puzzle. For `n` of 2 or more, it never returns `0, 1, ..., n - 1`, the correct order. Compute it like this:

1. Hash the seed with 32-bit FNV-1a over its UTF-16 code units. Start with `h = 2166136261`. For each unit, `h ^= seed.charCodeAt(i)`, then `h = Math.imul(h, 16777619) >>> 0`.
2. Let `state = (h % 2147483646) + 1`.
3. Start with `order = [0, 1, ..., n - 1]`. For `i` from `n - 1` down to 1, do `state = (state * 16807) % 2147483647`, then `j = Math.floor((state / 2147483647) * (i + 1))`, then swap `order[i]` and `order[j]`.
4. If `n >= 2` and `order` is still `0, 1, ..., n - 1`, return `[...order.slice(1), order[0]]`. Otherwise return `order`.

`shuffledOrder(0, s)` is `[]` and `shuffledOrder(1, s)` is `[0]`.

### `src/content/quiz.test.ts` (new)

Use these exact test names:

1. `checkQuiz accepts a valid quiz`. A quiz with one `choice`, one `multi` and one `order` question, each valid, gives `[]`.
2. `checkQuiz: choice with 2 correct`. It reports `"question 1: choice needs exactly 1 correct option"`.
3. `choice with 0 correct`. Same message.
4. `multi with all or no correct`. A `multi` question where every option is correct reports `"question 1: multi needs at least 1 correct and 1 wrong option"`. So does a `multi` question where no option is correct.
5. `order with 2 items`. It reports `"question 1: order needs at least 3 items"`.
6. `fewer than 3 questions`. A quiz with 2 valid questions gives exactly `["quiz needs at least 3 questions"]`.
7. `duplicate prompt, repeated item and single option are reported`. A quiz of 3 questions has:
   - a valid `choice` question;
   - a `choice` question with the same prompt as the first and only one option;
   - an `order` question with items `x`, `y` and `x`.

   The result is exactly `["question 2: duplicate prompt", "question 2: needs at least 2 options", "question 3: order items must be distinct"]`.
8. `shuffledOrder is deterministic and never identity`. For every `n` from 2 to 8 and each of the seeds `"a"`, `"b"`, `"load-balancer:3"` and `""`:
   - the result is a permutation of `0` to `n - 1`;
   - it is not `0, 1, ..., n - 1`;
   - a second call with the same arguments gives an equal result.

   Also check that `shuffledOrder(0, "a")` is `[]` and `shuffledOrder(1, "a")` is `[0]`.

### `src/content/lesson.ts` (new)

Export exactly these names: `LessonInput`, `LessonDraft`, `Lesson`, `defineLesson` and `finishLesson`.

```ts
import { compile, type Scene, type Timeline } from "@/scene"
import { makeCue, type Block, type CueFn, type Prose } from "./prose"
import { checkQuiz, type Quiz } from "./quiz"
import { attribution, type Attribution, type SourceRef, type Sources } from "./sources"
import type { TrackId } from "./curriculum"

export interface LessonInput<N extends string, S extends string> {
  readonly title: string
  readonly summary: string
  readonly track: TrackId
  readonly order: number
  readonly sources: Sources
  readonly tags?: readonly string[]
  readonly scene: Scene<N, S>
  readonly body: (kit: { readonly cue: CueFn<S> }) => Prose
  readonly quiz: Quiz<NoInfer<S>>
}

export interface LessonDraft {
  readonly title: string
  readonly summary: string
  readonly track: TrackId
  readonly order: number
  readonly tags: readonly string[]
  readonly sources: Sources
  readonly body: Prose
  readonly timeline: Timeline
  readonly quiz: Quiz
}

export interface Lesson extends LessonDraft {
  readonly slug: string
  readonly minutes: number
  readonly attributions: readonly Attribution[]
  readonly furtherReading: readonly Extract<SourceRef, { use: "link" }>[]
  readonly headings: readonly Extract<Block, { t: "h" }>[]
}

export function defineLesson<N extends string, S extends string>(input: LessonInput<N, S>): LessonDraft
export function finishLesson(slug: string, draft: LessonDraft): Lesson
```

`NoInfer` on `quiz` matters. Without it, a typo in `replay` would widen `S` instead of failing `tsc`. The type test proves this below.

**`defineLesson(input)`** does these steps in this order:

1. `timeline = compile(input.scene)`. A scene problem throws `SceneError`.
2. `body = input.body({ cue: makeCue<S>() })`.
3. `problems = checkQuiz(input.quiz)`. If there are any, throw an `Error` whose message is `` `lesson "${input.title}": ${problems.join("; ")}` ``.
4. Return a `LessonDraft` with every input field except `scene`, plus `body` and `timeline`. `tags` defaults to `[]`.

**`finishLesson(slug, draft)`** returns the draft plus these fields:

- `slug`.
- `minutes` is `Math.max(1, Math.ceil(draft.body.words / 200 + draft.timeline.duration / 60000))`. That is 200 words a minute, plus the time to play the scene once.
- `attributions` has `attribution(source)` for each source with `use: "adapted"`, in source order.
- `furtherReading` has each source with `use: "link"`, in source order.
- `headings` has each block of `draft.body.blocks` with `t: "h"`, in order.

### `src/content/curriculum.ts` (new)

Export exactly these names: `TRACKS`, `TrackId`, `Track`, `Curriculum`, `Neighbors`, `buildCurriculum`, `neighbors` and `curriculum`.

```ts
import { finishLesson, type Lesson, type LessonDraft } from "./lesson"

export const TRACKS = [
  { id: "foundations", title: "Foundations" },
  { id: "edge", title: "Edge and traffic" },
  { id: "application", title: "Application layer" },
  { id: "data", title: "Databases" },
  { id: "cache", title: "Caching" },
  { id: "async", title: "Asynchronism" },
  { id: "communication", title: "Communication" },
  { id: "security", title: "Security" },
  { id: "estimation", title: "Back of the envelope" },
  { id: "case-studies", title: "Case studies" },
] as const

export type TrackId = (typeof TRACKS)[number]["id"]

export interface Track {
  readonly id: TrackId
  readonly title: string
  readonly lessons: readonly Lesson[]
}

export interface Curriculum {
  readonly tracks: readonly Track[]
  readonly flat: readonly Lesson[]
  readonly bySlug: ReadonlyMap<string, Lesson>
}

export interface Neighbors {
  readonly prev?: Lesson
  readonly next?: Lesson
}

export function buildCurriculum(modules: Record<string, { readonly default: LessonDraft }>): Curriculum
export function neighbors(curriculum: Curriculum, slug: string): Neighbors

export const curriculum = buildCurriculum(
  import.meta.glob<{ readonly default: LessonDraft }>("./lessons/*/lesson.ts", { eager: true }),
)
```

**`buildCurriculum(modules)`** is pure, so tests can pass a fake map. Each key is a path like `"./lessons/load-balancer/lesson.ts"`.

1. For each key in order:
   - It must match `/^\.\/lessons\/([^/]+)\/lesson\.ts$/`, or throw `` `unexpected lesson path ${key}` ``.
   - The captured folder name is the slug. It must match `/^[a-z0-9]+(-[a-z0-9]+)*$/`, or throw `` `lesson folder ${slug} is not kebab-case` ``.
   - Call `finishLesson(slug, module.default)`.
2. For each track in `TRACKS` order, take its lessons sorted by `order`, smallest first. Fractions such as 2.5 are allowed, so a lesson can go between two others without renumbering. If two lessons in one track have the same `order`, throw `` `${first} and ${second} share order ${order} in track ${trackId}` ``, where `first` and `second` are the slugs in key order.
3. `tracks` lists only the tracks that have lessons, as `{ id, title, lessons }`.
4. `flat` is every lesson, in `tracks` order and then lesson order.
5. `bySlug` maps each slug to its lesson.

**`neighbors(curriculum, slug)`** finds the slug in `flat`. `prev` is the lesson before it and `next` is the lesson after it, even across a track boundary. Leave a key out when there is no lesson there. An unknown slug gives `{}`.

### `src/content/curriculum.test.ts` (new)

Build fake drafts with this helper at the top of the file:

```ts
import { defineLesson, defineScene, md } from "./author"

const baseDraft = defineLesson({
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
  quiz: [
    { kind: "choice", prompt: "One?", options: [{ text: "x", correct: true }, { text: "y" }], explain: "e" },
    { kind: "choice", prompt: "Two?", options: [{ text: "x", correct: true }, { text: "y" }], explain: "e" },
    { kind: "order", prompt: "Three?", items: ["a", "b", "c"], explain: "e" },
  ],
})

const draft = (track: TrackId, order: number) => ({ default: { ...baseDraft, track, order } })
const key = (slug: string) => `./lessons/${slug}/lesson.ts`
```

Import `buildCurriculum`, `neighbors` and `type TrackId` from `./curriculum`. Use these exact test names:

1. `slug comes from folder`. The key `./lessons/dns-basics/lesson.ts` gives a lesson whose `slug` is `dns-basics`.
2. `non-kebab folder throws`. The folders `DnsBasics`, `dns_basics` and `dns--basics` each throw `is not kebab-case`. A key outside `./lessons/` throws `unexpected lesson path`.
3. `tracks in TRACKS order`. Lessons in `data`, `foundations` and `edge`, passed in that key order, give track ids `foundations`, `edge` and `data`.
4. `lessons sorted by order, fractions allowed`. Orders 3, 1 and 2.5 in one track come out as 1, 2.5 and 3.
5. `empty tracks omitted`. One lesson in `cache` gives exactly one track.
6. `duplicate track+order throws`. Two `edge` lessons at order 2, with slugs `one` and `two`, throw `one and two share order 2 in track edge`.
7. `neighbors cross track boundaries`. A `foundations` lesson `f` at order 1 and an `edge` lesson `e` at order 1 give `neighbors(c, "f").next.slug` equal to `e`, and `neighbors(c, "e").prev.slug` equal to `f`.
8. `first lesson has no prev`. In the same curriculum, `neighbors(c, "f")` has no `prev` key and `neighbors(c, "e")` has no `next` key. Check with `not.toHaveProperty`. `neighbors(c, "nope")` equals `{}`.
9. `defineLesson throws with every quiz problem`. Call `defineLesson` with the same input as `baseDraft` and only the quiz changed. `bad` is a `choice` question with prompt `"Bad?"`, options `x` and `y`, and no correct option. Check three cases with `toThrow` and the exact message:
    - the first and third base questions only give `lesson "Fake": quiz needs at least 3 questions`;
    - the first base question, `bad` and the third base question give `lesson "Fake": question 2: choice needs exactly 1 correct option`;
    - the first base question and `bad` give `lesson "Fake": quiz needs at least 3 questions; question 2: choice needs exactly 1 correct option`.
10. `the real curriculum holds the load-balancer lesson`. Import `curriculum` from `./curriculum`. Check these:
    - `curriculum.tracks` has one track, `edge`;
    - `curriculum.bySlug.get("load-balancer")` exists, with `minutes` 2;
    - its heading ids are `what-it-does`, `how-it-picks-a-server` and `horizontal-scaling`;
    - it has one attribution, whose `text` is `Adapted from "Load balancer" in The System Design Primer by Donne Martin.`;
    - it has two `furtherReading` entries.
11. `finishLesson counts reading and scene time and defaults tags`. `buildCurriculum({ [key("a")]: { default: { ...baseDraft, body: { ...baseDraft.body, words: 200 } } } })` gives lesson `a` with `minutes` 2, because 200 words is one minute and the scene adds a fraction of one. With `words: 400` the result is 3. `baseDraft.tags` equals `[]`.

### `src/content/author.ts` (new)

Exactly this:

```ts
export { defineLesson } from "./lesson"
export { md } from "./prose"
export { defineScene } from "@/scene"
```

### `src/content/index.ts` (new)

Exactly this:

```ts
export { curriculum, neighbors, TRACKS } from "./curriculum"
export type { Curriculum, Neighbors, Track, TrackId } from "./curriculum"
export type { Lesson } from "./lesson"
export type { Prose, Block, Inline } from "./prose"
export { shuffledOrder } from "./quiz"
export type { Quiz, Question, Option } from "./quiz"
export type { Attribution, SourceRef } from "./sources"
```

### `src/content/lessons/load-balancer/lesson.ts` (new)

Copy `docs/design/example-lesson/lesson.ts` from line 7 to the end, with no changes. Line 7 is the `import` line. Lines 1 to 6 are a comment, and lesson files have no comments. Check the copy with:

```sh
diff <(sed -n '7,$p' docs/design/example-lesson/lesson.ts) src/content/lessons/load-balancer/lesson.ts
```

It prints nothing.

### `src/content/authoring.typetest.ts` (new)

`tsc -b` compiles this file and nothing runs it. Each bad case has its directive on the line just above the line with the error. Write it exactly like this:

```ts
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
```

A plain string inside `md` is not tested here. `src/content/prose.typetest.ts` from step 4 already covers it.

### `src/content/content.test.ts` (new)

`pnpm build` runs this file, because the build runs `vitest run src/content`. It checks every lesson that `curriculum` finds, so a new lesson needs no change here. Wrap the tests in `describe.each(curriculum.flat.map((lesson) => [lesson.slug, lesson] as const))("lesson %s", (_slug, lesson) => { ... })`. Import `curriculum` from `./curriculum`, `SOURCES` from `./sources` and `lintLayout` from `@/scene/layout`. Test files may import internals. Use these exact test names:

1. `adapted sources name only adapt repos`. For each source with `use: "adapted"`, `SOURCES[source.repo].rule` is `adapt`. This checks again at runtime, in case a cast got past `tsc`.
2. `link sources with a repo point inside that repo's url`. For each source with `use: "link"` and a `repo`, `source.url` starts with `SOURCES[source.repo].url`.
3. `scene layout: no edge crosses a node, all nodes on the grid`. `lintLayout(lesson.timeline)` equals `[]`.
4. `every scene step except the first is cued in the text`. Every step id in `lesson.timeline.steps`, except the first, is in `lesson.body.cues`.
5. `has a summary under 160 chars and at least 3 quiz questions`. `lesson.summary.length` is less than 160, and `lesson.quiz.length` is at least 3.

### `src/boundaries.test.ts` (new)

TypeScript cannot hide a file, so this test scans imports instead. Write a pure function in this file, `findViolations(files: readonly { readonly path: string; readonly text: string }[]): string[]`. Do not export it. Each `path` is relative to the repo root, such as `src/app/App.tsx`.

The modules are `content`, `scene`, `progress` and `search`. A path is in module `m` when it is exactly `src/m` or starts with `src/m/`. A test file is a path that ends in `.test.ts`.

Find import specifiers with `/\b(?:from|import)\s*\(?\s*["']([^"']+)["']/g`. That matches `from "x"`, `import "x"` and `import("x")`. Resolve each specifier to a target path:

- `@/rest` resolves to `src/rest`.
- `./x` or `../x` resolves against the file's folder with `path.posix.join(path.posix.dirname(file), spec)`.
- Anything else is a package and has no target path.

Then drop a trailing `.ts` or `.tsx`, and then a trailing `/index`, from the target.

Check these four rules. Go through the files in order. In each file, go through its imports in order and check rules 1, 2 and 3 on each one. Then go through its lines in order and check rule 4. Report every violation in that order.

1. **No deep imports.** The file is not a test file. The target is in module `m`, the file is not in module `m`, and the target is not exactly `src/m`. Report `` `${path} imports ${spec}, use @/${m}` ``.
2. **Lessons import only the authoring kit.** The file starts with `src/content/lessons/`, and the specifier is not exactly `@/content/author`. Report `` `${path} is a lesson and may only import @/content/author, not ${spec}` ``. This rule applies to package imports too.
3. **Scene does not know about lessons.** The file is in module `scene`, it is not a test file, and the target is in module `content`. Report `` `${path} is in src/scene and imports ${spec} from src/content` ``.
4. **Recipes are defined once, at the top level.** The file is not a test file, and a line matches `/\bdefineRecipe\s*[<(]/` and does not contain `function defineRecipe`. It is a violation unless both of these hold:
   - the path is `src/scene/ink.ts` or matches `/^src\/lib\/ink\/recipes\/[^/]+\.ts$/`;
   - the line matches `/^(export )?const \w+ = defineRecipe\b/`.

   Report `` `${path} calls defineRecipe outside a top-level ink recipe` ``.

Use these exact test names:

1. `module boundaries hold`. Read every `.ts` and `.tsx` file under `src` with `readdirSync("src", { recursive: true, encoding: "utf8" })` and `readFileSync`. Pass them with paths that start with `src/`, and expect `[]`.
2. `a planted bad import in a temp string is reported`. `src/app/x.tsx` with `import { compile } from "@/scene/timeline"` reports `src/app/x.tsx imports @/scene/timeline, use @/scene`.
3. `relative import into another module is reported`. `src/app/x.tsx` with `import { md } from "../content/prose"` reports `src/app/x.tsx imports ../content/prose, use @/content`.
4. `index imports and test files are allowed`. These two files report nothing:
   - `src/app/x.tsx` importing `@/content`, `@/scene` and `../scene/index`;
   - `src/app/x.test.ts` importing `@/scene/timeline`.
5. `lesson file importing anything but @/content/author is reported`. `src/content/lessons/x/lesson.ts` importing `@/content/author` and `react` reports only the `react` line.
6. `scene importing content is reported`. `src/scene/x.ts` with `import { md } from "@/content"` reports `src/scene/x.ts is in src/scene and imports @/content from src/content`.
7. `defineRecipe outside a top-level ink recipe is reported`. Three cases, checked with `toEqual`:
   - `src/lib/ink/recipes/x.ts` with `export const r = defineRecipe({` reports nothing;
   - the same path with `  const r = defineRecipe({`, indented, reports one violation;
   - `src/app/x.tsx` with `const r = defineRecipe({` reports one violation.
8. `one import can break two rules`. `src/content/lessons/x/lesson.ts` importing `@/scene/model` reports exactly two messages. The first is `src/content/lessons/x/lesson.ts imports @/scene/model, use @/scene`. The second is `src/content/lessons/x/lesson.ts is a lesson and may only import @/content/author, not @/scene/model`.

## Commands that must pass

Run each one from the worktree root and paste its full output in your report:

1. `pnpm install`
2. `pnpm build`. Its Vitest run of `src/content` shows 62 tests before the Vite build.
3. `pnpm test`, which shows 11 files and 141 tests passing.
4. `pnpm e2e`, which shows 4 tests passing.

## Prove the type test works

Do these checks after the commands pass, and undo each change afterwards:

1. In `bad1`, change `s.send("a", "nope")` to `s.send("a", "a")`. Run `pnpm build`. It fails with `Unused '@ts-expect-error' directive`. Undo the change.
2. In `bad2`, change `cue("nope", "x")` to `cue("ask", "x")`. Run `pnpm build`. It fails the same way. Undo the change.
3. In `bad3`, change `replay: "nope"` to `replay: "ask"`. Run `pnpm build`. It fails the same way. Undo the change.
4. In `bad4`, change `track: "nope"` to `track: "data"`. Run `pnpm build`. It fails the same way. Undo the change.
5. In `src/content/lesson.ts`, change `Quiz<NoInfer<S>>` to `Quiz<S>`. Run `pnpm build`. It fails with `Unused '@ts-expect-error' directive` on the `bad3` line, because the typo in `replay` now widens `S` instead of failing. Undo the change.
6. In the lesson file, change `cue("fail",` to `cue("fial",`. Run `pnpm build`. It fails in `tsc`. Undo the change.

## Done means

- All four commands exit 0.
- `git status` shows only the 15 new files.
- `package.json` and `pnpm-lock.yaml` are unchanged.
- The `diff` check for the lesson file prints nothing.
- There is no `any` and no `!` non-null assertion in any new file. The only `as` casts are `as const`.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Show one failing test run from before the code existed. Paste the failing output of the six checks in "Prove the type test works". Say whether you hit anything the spec did not cover, and what you did about it.
