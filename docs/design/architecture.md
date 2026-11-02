# Architecture: a lesson is one typed TypeScript module

## Module map

```
src/
  content/                         what a lesson is, and which lessons exist
    author.ts        the only import a lesson file may use: defineLesson, defineScene, md
    lesson.ts        LessonInput, LessonDraft, Lesson; defineLesson (validates + compiles at load), finishLesson
    prose.ts         `md` tagged template -> Prose AST (markdown subset + typed cues); blockText, slugify
    quiz.ts          Question/Quiz types, grade, shuffledOrder, checkQuiz
    sources.ts       SOURCES registry, AdaptableRepo type, SourceRef, attribution(), parseSourcesTable
    curriculum.ts    TRACKS, import.meta.glob of lessons/*/lesson.ts, buildCurriculum, neighbors
    index.ts         app-facing surface (curriculum, types, grade)
    content.test.ts  per-lesson invariants + sources.md sync; runs inside `pnpm build`
    license.typetest.ts  @ts-expect-error cases that keep the license type honest
    lessons/<slug>/lesson.ts   one file per lesson; folder name = slug = URL
  scene/                           animated diagrams; knows nothing about lessons
    model.ts         NodeDef, Action, StepDef, Scene; defineScene two-stage typed builder; edgeId
    timeline.ts      compile(scene) -> Timeline; frameAt(timeline, t, motion) -> Frame (pure)
    player.ts        PlayerState/PlayerEvent; reducePlayer (pure)
    layout.ts        grid -> px, edge clipping, pointOn, lintLayout (pure)
    ink.ts           module-scope recipes: scene-node, scene-edge, scene-packet, scene-down
    ScenePlayer.tsx  SceneProvider (reducer + rAF clock), ScenePlayer (stage + controls), useSceneCue
    index.ts         public surface
  progress/
    progress.ts      ProgressDoc (join-semilattice), Fact, apply/join/parseDoc, statusOf, summarize, createProgressStore
    index.ts         useProgress hook
  search/
    search.ts        tokenize, buildIndex, search (in-memory, from Lesson objects)
  app/
    routes.ts        Route union, parseRoute, href, useRoute (hash routing)
    App, Shell, HomePage, LessonPage, ProseView, QuizView, SearchPalette, NotFoundPage (.tsx)
  boundaries.test.ts import rules that make module internals unreachable
src/lib/ink/, src/components/ui/   existing, unchanged except Looseleaf components added via shadcn
```

Sketch files are under `docs/design/sketch/` with the same relative paths (`sketch/app/pages.tsx` stands in for the component files).

## Problem

A static, backend-free SPA that teaches system design through lesson text, a step-by-step animated ink diagram, and a quiz, with progress kept in localStorage. Constraints that shape it: the ink engine is a cached recipe-to-SVG-string pipeline, so anything that changes per frame must stay out of recipe params, and `defineRecipe` must be called at module scope. Reduced motion already zeroes `--ll-motion` and all CSS animation, and the player has to agree with it. `docs/sources.md` requires that the build fail when a lesson adapts a "Link only" repo, and that adapted lessons carry author, license link and a change notice. The code is written one spec at a time by a mid-tier model with no memory, which copies the nearest example and takes the shortest path that compiles. So the safest rules are the ones `tsc` enforces, and the next safest are the ones the build's own test step enforces. Deploy is GitHub Pages: static files, with an unknown base path.

## Usage (caller's view)

**Author, adding a lesson.** Create `src/content/lessons/<slug>/lesson.ts`; nothing else. The full example is `example-lesson/lesson.ts`. In short:

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  you: { kind: "client", label: "You", at: [0, 1] },
  lb:  { kind: "lb", label: "Load balancer", at: [2, 1] },
  a:   { kind: "server", label: "Server A", at: [4, 0] },
}).steps((s) => ({
  arrive: s.step("Your request goes to the load balancer.", s.send("you", "lb", "GET /")),
  pick:   s.step("It forwards it to a healthy server.", s.focus("lb"), s.send("lb", "a")),
}))

export default defineLesson({
  title: "Load balancer", summary: "...", track: "edge", order: 3,
  sources: [{ use: "adapted", repo: "donnemartin/system-design-primer", section: "Load balancer", anchor: "load-balancer" }],
  scene,
  body: ({ cue }) => md`
    ## What it does
    ${cue("arrive", "Clients talk to the balancer")}, and ${cue("pick", "it picks a server")}.
  `,
  quiz: [{ kind: "choice", prompt: "...", options: [{ text: "...", correct: true }, { text: "..." }], explain: "...", replay: "pick" }],
})
```

These are `tsc` errors: `s.send("you", "lbb")`, `cue("pik", ...)`, `replay: "pik"`, `track: "edges"`, `${someString}` inside `md`, and `use: "adapted"` with any repo except the primer. The build's content test catches the rest: unsupported markdown such as images, a quiz `choice` with two correct options, a step that the text never cues, an edge drawn through a node, and a duplicate order.

**Lesson page (app code):**

```tsx
const lesson = curriculum.bySlug.get(route.slug)
<SceneProvider key={lesson.slug} timeline={lesson.timeline} onFinish={() => record({ kind: "scene-done", slug, at: Date.now() })}>
  <ScenePlayer />
  <ProseView prose={lesson.body} />
  <QuizView slug={lesson.slug} quiz={lesson.quiz} />
</SceneProvider>
```

**A cue inside prose, or the quiz's "show me" button:**

```tsx
const { active, play } = useSceneCue(node.step)
<button data-cue={node.step} data-active={active || undefined} onClick={play}>{node.text}</button>
```

**Tests of scene logic, no browser:**

```ts
const tl = compile(defineScene({ ... }).steps((s) => ({ ... })))  // or lesson.timeline, already compiled
expect(frameAt(tl, tl.steps[1].start + LEAD_MS + SEND_MS / 2, "full").packets[0].u).toBeCloseTo(0.5, 1)
expect(frameAt(tl, tl.steps[1].start + 10, "reduced").packets).toEqual([])
expect(reducePlayer(tl, { mode: "paused", t: 0 }, { type: "next" })).toEqual({ mode: "stepping", t: tl.steps[0].start, stopAt: tl.steps[0].end })
```

## Shape

**A lesson is one TypeScript module, not markdown with frontmatter.** `defineLesson` takes the scene, the prose, the quiz and the sources in one call. Because `scene` is a plain value, its step-id union `S` is inferred first and then flows into `body`'s `cue` and the quiz's `replay`. The tie between caption and text is therefore a typed reference, not a string convention (per encode-lessons-in-structure). Frontmatter is just typed object fields, so there is no YAML parser and no schema validator to keep in sync with a TS type. The slug comes from the folder name through `import.meta.glob`, so no list of lessons exists anywhere. Curriculum order is `track` (a union derived from the ten-entry `TRACKS` const) plus a fractional `order`, so inserting a lesson never renumbers the others.

**Prose is a markdown subset parsed once, at module load, into an AST.** `md` accepts only `CueToken` interpolations. The parser rejects image syntax, HTML and tables. A lesson therefore cannot embed a copied source image, which `docs/sources.md` forbids, and this holds by construction. Rendering and search both read the same AST (single source of truth). Reading time, headings and the cue list are derived during the parse.

**The license rule lives in the type of `SourceRef`.** `AdaptableRepo` is computed from `SOURCES[k].rule`, so `{ use: "adapted", repo: "ByteByteGoHq/system-design-101" }` does not compile, and `pnpm build` starts with `tsc -b`. Attribution text is derived from the registry (`attribution(ref)`), so an author cannot leave out the license link or the change notice: there is no field to forget. `docs/sources.md` stays the human source. `content.test.ts` parses its table and fails the build if the registry differs, which makes the two lists fail loudly when they diverge (hand-synced list rule). `license.typetest.ts` holds `@ts-expect-error` cases, so a loosened type also breaks `tsc`. Build: `tsc -b && vitest run src/content && vite build`.

**A scene is data; time is a pure function.** `defineScene(nodes).steps(fn)` fixes node ids, then step ids. Steps are an object, so key order is play order and a duplicate id is a TS error. Edges are not authored. `compile` derives one edge per unordered node pair from the sends, with arrowheads taken from the directions used. `compile` also validates the scene and times it. Durations are derived from the number of sends and the caption's reading time; there is no timing knob. Each `TimedStep` precomputes its `world` (visibility and up/down status after persistent actions), so `frameAt(tl, t, motion)` is O(nodes). It never replays events. Play, pause, step, scrub, deep link to a step and "show me" are all "set t". The player reducer holds only `{mode, t, stopAt?}`, which cannot disagree with the timeline. Reduced motion is owned by exactly one function: `frameAt(..., "reduced")` returns no packets and a still frame for the whole step, with the step's edges marked active. The reducer and the view do not branch on motion.

**Rendering without per-frame ink.** Every node, edge, packet and "down" cross is its own small ink host. Recipe params hold only static, integer data: node kind, and edge endpoints that come from a cell size bucketed to 8 px. Each piece of ink is therefore generated once per size bucket and then served from the existing LRU. Everything that changes during playback is DOM and CSS: visibility, focus, down and active are data attributes that show or hide recipe layers; packet position is a `transform` taken from `pointOn`; a node entering the scene uses the existing `reveal()` mask with `ll-draw`, which reduced motion already zeroes. React re-renders at rAF rate only while playing, and only the packets and attributes change.

**Interface depth.** `@/scene` exposes `compile`, `SceneProvider`, `ScenePlayer` and `useSceneCue`. Behind them sit validation, timing, edge derivation, layout, interpolation, keyboard control, the clock and ink caching. Prose and quiz get only `{active, play}` for a step, so the reducer stays the single writer of player state. `@/content` exposes the built `curriculum` and `grade`. Lesson files see three functions. `boundaries.test.ts` makes internals unreachable from outside each module, and limits lesson files to `@/content/author` (importable internals rule).

**Progress is a join-semilattice in one localStorage key.** Every field moves one way only (`openedAt` min, `bestQuiz` max), and `join` is commutative and idempotent. Each tab merges at the storage boundary on write and on the `storage` event, so two tabs converge and recording a fact twice changes nothing (per separate-before-serializing-shared-state and make-operations-idempotent). "Done" is derived from `bestQuiz` and `PASS_RATIO` and never stored. `parseDoc` is the only place untrusted JSON is read (per boundary-discipline).

**Routing is a hash route union with `parseRoute` and `href`.** These are about 60 lines, total and round-trip tested. Hash routing needs no `404.html` trick on GitHub Pages and works under any base path. **Search** is an in-memory inverted index built from the same Lesson objects on first palette open. The corpus is a few hundred KB at most, so neither a build step nor a dependency would pay for itself.

What it deliberately does not do: no MDX, no YAML, no router library, no search library, no state library, no motion library, no per-question progress history, no author-tunable timing.

## Synthesis decision

Opus designed one shape and reviewed it alone, at the user's request. No second candidate or cross-model judge ran. The design was checked against `vendor/pstack/skills/architect/references/design-red-flags.md`, and the sketch was type-checked with tsc 5.7. Five deliberate typos in the example lesson each failed to compile.

The alternative shape that lost is MDX lessons with YAML frontmatter, a separate scene JSON file and a quiz YAML file (see Alternatives considered). It lost because it splits a lesson across three formats and turns the license rule and every cue link into runtime string checks.

Changes made to the first draft during review:

- Progress has no live cross-tab sync. A write merges with storage, so tabs never erase each other, and another tab sees the change on reload. This removes `receive`, the storage listener and a two-page browser test.
- A lesson has exactly one scene. A case study that needs several diagrams becomes several lessons. This closes the multi-scene open question.
- Step 7 defines the `curriculum` export, which the sketch had only as a comment.
- Step 7 adds a type test for each typo the authoring types must catch.

## Tradeoffs accepted

- We accept prose written in a template literal (code spans need `` \` `` escapes, and editors show it as a string) in exchange for typed cues and one-file lessons with no MDX toolchain.
- We accept a hand-written markdown subset parser (about 200 lines, heavily unit-tested) in exchange for an AST that forbids images and HTML by construction, and no runtime markdown dependency.
- We accept that every lesson is in the main bundle (eager glob) in exchange for synchronous lookups, instant search and no loading states. This is reconsidered only past about 1 MB of content.
- We accept grid-only layout (integer cells, straight edges) in exchange for scenes that are deterministic, lintable (an edge cannot cross a node) and cache-stable. Curved or free-placed diagrams are out of scope.
- We accept derived step durations with no override in exchange for scenes that cannot desync their timing from their content. If a step feels rushed, the fix is a longer caption or another step.
- We accept React re-rendering the stage at rAF rate while playing (a few dozen elements) in exchange for a declarative view. Ink is never regenerated during this, because no recipe param changes.
- We accept the license check being a type plus a test, which cannot catch paraphrase of a link-only source, as `docs/sources.md` already states. Human review in Phase 6 covers it.
- We accept the sources registry living twice, in `sources.md` and `sources.ts`, in exchange for compile-time enforcement. A test fails the build when they differ.

## Alternatives considered

- **MDX lessons with YAML frontmatter, a separate `scene.json` and a `quiz.yaml`.** This reads nicer for an author. But it splits one lesson across three files and three formats, needs an MDX plugin, a frontmatter schema validator and a JSON schema, and turns cue-to-step links into strings checked only at runtime. The license rule becomes a custom Vite plugin rather than a type. The interface is wider, and each piece hides less.
- **A declarative timeline with explicit keyframes per element (an animation-graph or Lottie-like shape)** gives authors full control over motion. In exchange it exposes timing and interpolation to every lesson, so reduced motion has to be handled per keyframe. It also cannot validate meaning (a send to a hidden node). The step/action vocabulary hides all of that behind about ten verbs.
- **One ink recipe per whole diagram, with step state in params** is simpler to draw. But every step change becomes a cache miss for the whole SVG, and per-node draw-on is impossible. Per-element hosts keep the cache hit rate near 100%.
- **React Router plus BrowserRouter** is familiar. It needs a GitHub Pages 404 fallback, adds a dependency, and leaks its route objects into pages. Our route union is smaller and typed.

## Open questions and risks

- Verified while sketching (tsc 5.7, sketch plus the example lesson): typos in node ids, track, `cue` and `replay` are errors, a plain string inside `md` is an error, the license type test passes, and inference still works when `scene` is written inline. `replay` needed `Quiz<NoInfer<S>>`. Without it, a `replay` typo widened `S` instead of failing. Decided: step 7 adds `authoring.typetest.ts` with one `@ts-expect-error` line per typo.
- Is a fixed grid of at most 8 x 5 cells enough for one case-study diagram? Decided: a case study splits into several lessons, so each diagram stays small.
- On narrow screens, should the grid transpose (columns become rows), or should the stage scroll horizontally? Current plan: scale cells down to `MIN_CELL`, then scroll.
- Should "done" require the scene to have been watched, or only the quiz passed? The current rule is quiz only.
- Risk: frame time on low-end mobile with many packets (for example a fan-out of 6). Step 10 adds a Playwright check that playback holds below a frame-time budget.
- Risk: fonts load remotely, so first paint in Playwright may be flaky. Wait on `document.fonts.ready` in a fixture.

## Next implementation step

Add Vitest and Playwright with one passing smoke test each, then write `parseRoute`/`href` with their round-trip tests (steps 1 and 2 in `steps.md`).
