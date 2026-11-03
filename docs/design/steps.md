# Build sequence

Each step is one spec, one fresh worktree, and one session for the coding model. Every step ends green on `pnpm build`, `pnpm test` and `pnpm e2e`. The user then approves it in the browser and it lands as one commit. File paths are under the repo root. Types and signatures come from `sketch/`. A step's spec quotes the sketch files it implements, so the coder never has to infer a shape.

The first full lesson (text, animated diagram and quiz) works end to end at step 11. Later steps add breadth: progress, search, navigation and deploy.

Conventions every spec repeats:
- Vitest runs in the `node` environment. React components are covered by Playwright, not by jsdom.
- Playwright runs against `pnpm build && pnpm preview` on port 4173, in Chromium only. One fixture waits for `document.fonts.ready`.
- Test hooks are `data-testid` and the `data-*` state attributes named in each step. Do not select by CSS class.

---

## Step 1: Test tooling

**Goal.** Vitest and Playwright are installed and wired, with one trivial test each.

**Files.** `package.json` (devDeps `vitest`, `@playwright/test`; scripts `test: vitest run`, `test:watch: vitest`, `e2e: playwright test`), `vite.config.ts` (add a `test: { environment: "node", include: ["src/**/*.test.ts"] }` block via `/// <reference types="vitest/config" />`), `playwright.config.ts`, `e2e/fixtures.ts` (a page fixture that awaits fonts), `e2e/smoke.spec.ts`, `src/smoke.test.ts`, `tsconfig.json` (include `e2e`, `playwright.config.ts`), `.gitignore` (`test-results`, `playwright-report`).

**Tests.** `smoke.test.ts`: "vitest runs". `smoke.spec.ts`: "app boots and renders a root element".

**Playwright.** Open `/`; `#root` has children; no console errors.

**User sees.** The existing playground, unchanged. `pnpm test` and `pnpm e2e` both pass in the terminal.

## Step 2: Hash router and empty shell

**Goal.** Replace the playground with an app shell, a home placeholder and a not-found page, all driven by a typed hash route.

**Files.** `src/app/routes.ts` (`Route`, `parseRoute`, `href`, `useRoute`), `src/app/routes.test.ts`, `src/app/App.tsx`, `src/app/Shell.tsx` (header with the app name, an empty sidebar slot, and a main area on a Looseleaf `Paper`), `src/app/HomePage.tsx` (heading "Learn system design"), `src/app/NotFoundPage.tsx`, `src/main.tsx` (import `@/app/App`). Delete `src/App.tsx`.

**Tests** (`routes.test.ts`): "empty hash is home", "#/ is home", "#/learn/load-balancer is lesson", "trailing slash is ignored", "#/learn/load-balancer/what-it-does sets section", "#/learn/load-balancer/step/pick sets step", "percent-encoded slug decodes", "unknown path is not-found with path", "#/learn/ with no slug is not-found", "href round-trips every route shape", "parseRoute never throws on 200 random strings".

**Playwright** (`e2e/routing.spec.ts`): "home renders heading"; "unknown hash shows not found and a link home that works"; "browser back returns to the previous route".

**User sees.** A hand-drawn paper page titled "Learn system design". `#/anything` shows a not-found note with a link home.

## Step 3: Source registry and the license type

**Goal.** Make adapting a "Link only" repo a compile error, and fail the build when `sources.ts` and `docs/sources.md` disagree.

**Files.** `src/content/sources.ts` (`SOURCES`, `AdaptableRepo`, `SourceRef`, `Sources`, `attribution`, `parseSourcesTable`), `src/content/license.typetest.ts` (exactly the cases in the sketch), `src/content/sources.test.ts`, `package.json` (`build: tsc -b && vitest run src/content && vite build`).

**Tests** (`sources.test.ts`): "registry matches docs/sources.md", "parseSourcesTable maps Adapt./Link./Link only.", "parseSourcesTable throws on an unknown rule", "every adapt repo has licenseUrl", "attribution names section, title, author, license, and the change notice", "attribution sourceUrl is repo url + #anchor". Type test: `tsc -b` passes only because each `@ts-expect-error` line is a real error.

**Playwright.** None. No UI change.

**User sees.** Nothing new in the browser. The spec's verify step asks Opus to change one `@ts-expect-error` repo to the primer and confirm that `pnpm build` then fails.

## Step 4: Prose parser

**Goal.** An `md` tagged template that produces the Prose AST, with typed cue interpolation.

**Files.** `src/content/prose.ts`, `src/content/prose.test.ts`.

**Tests:** "dedents a template indented by 4", "splits paragraphs on blank lines and joins soft-wrapped lines", "h2 and h3 with slug ids", "duplicate heading id throws", "ul and ol items", "callout note/tradeoff/pitfall", "unknown callout kind throws", "fenced code keeps content verbatim", "strong, em, code, link inline", "nested strong inside link", "cue becomes {t: cue, step, text} in position", "cues list in reading order", "image syntax throws", "raw HTML throws", "table row throws", "nested list throws", "word count counts text, cue text and code", "blockText flattens inlines", "slugify: 'Layer 7 load balancing' -> 'layer-7-load-balancing'".

**Playwright.** None.

**User sees.** Nothing new.

## Step 5: Scene model and timeline

**Goal.** Define scenes with typed ids, and compute any frame as a pure function of t.

**Files.** `src/scene/model.ts`, `src/scene/timeline.ts`, `src/scene/timeline.test.ts`, `src/scene/fixtures.ts` (a three-node scene used by later tests).

**Tests:** "defineScene keeps step order from object keys", "edges derived one per unordered pair", "heads both when sends go both ways", "hidden node is invisible until show", "show of a visible node throws", "send from a hidden node throws", "send to self throws", "two nodes in one cell throws", "integer-like step id throws", "step start/end are contiguous and duration is the sum", "step length is at least reading time", "sequential sends are SEND_MS apart", "parallel sends share t0", "stepIndexAt at exact boundary belongs to next step", "stepIndexAt at duration is the last step", "frameAt mid-flight gives u≈0.5", "frameAt before LEAD_MS has no packets", "frameAt reduced has no packets and marks the step's edges active", "frameAt reduced is identical for any t inside a step", "focus and note only during their step", "down persists into later steps", "frameAt clamps t < 0 and t > duration". Type-level checks in `timeline.test.ts` use `// @ts-expect-error` for "send to unknown node id".

**Playwright.** None.

**User sees.** Nothing new.

## Step 6: Player reducer

**Goal.** Playback state as a pure reducer.

**Files.** `src/scene/player.ts`, `src/scene/player.test.ts`.

**Tests:** "toggle from paused plays", "toggle while playing pauses", "toggle at duration restarts from 0 playing", "tick advances t only when not paused", "playing stops and pauses at duration", "stepping stops at stopAt", "next from step 1 -> stepping at step 2 start with stopAt step 2 end", "next on the last step goes to duration paused", "prev within grace goes to the previous step start", "prev after grace goes to this step's start", "prev at 0 stays at 0", "seek clamps and pauses", "seek twice equals seek once", "goto plays exactly that step", "first/last".

**Playwright.** None.

**User sees.** Nothing new.

## Step 7: Lesson pipeline and the first lesson file

**Goal.** Lessons are discovered from folders, validated and compiled. The load-balancer lesson exists and passes every content check.

**Files.** `src/content/quiz.ts` (types, `checkQuiz`, `shuffledOrder`; `grade` comes in step 11), `src/content/lesson.ts`, `src/content/curriculum.ts`, `src/content/author.ts`, `src/content/index.ts`, `src/scene/index.ts` (model and timeline exports only; step 9 adds the components), `src/scene/layout.ts` (only `lintLayout` and the grid constants; the pixel layout comes in step 9), `src/content/lessons/load-balancer/lesson.ts` (copied from `example-lesson/lesson.ts`), `src/content/authoring.typetest.ts`, `src/vite-env.d.ts` (one line, `/// <reference types="vite/client" />`, so `tsc` knows `import.meta.glob`), `src/content/content.test.ts`, `src/content/curriculum.test.ts`, `src/content/quiz.test.ts`, `src/boundaries.test.ts`.

`curriculum.ts` defines `export const curriculum = buildCurriculum(import.meta.glob("./lessons/*/lesson.ts", { eager: true }))`. The sketch only has this as a comment, and `content/index.ts` re-exports it.

**Tests.** `authoring.typetest.ts` has one `@ts-expect-error` line per typo the types must catch: an unknown node id in `send`, an unknown step in `cue`, an unknown step in `replay`, an unknown `track`, and a plain string inside `md`. `curriculum.test.ts` uses fake module maps: "slug comes from folder", "non-kebab folder throws", "tracks in TRACKS order", "lessons sorted by order, fractions allowed", "empty tracks omitted", "duplicate track+order throws", "neighbors cross track boundaries", "first lesson has no prev". `quiz.test.ts`: "checkQuiz: choice with 2 correct", "choice with 0 correct", "multi with all correct", "order with 2 items", "fewer than 3 questions", "shuffledOrder is deterministic and never identity". `content.test.ts`: as in the sketch, run per lesson. `boundaries.test.ts`: the four rules, plus "a planted bad import in a temp string is reported" (the checker is a pure function over file text).

**Playwright.** None yet. The lesson has no page.

**User sees.** Nothing new. `pnpm build` now type-checks the lesson and runs its content checks.

## Step 8: Home, lesson page text, and sidebar

**Goal.** See the curriculum and read the load-balancer lesson's text, attribution and further reading.

**Files.** `pnpm dlx shadcn@latest add @looseleaf/sidebar @looseleaf/breadcrumb @looseleaf/callout @looseleaf/highlight @looseleaf/index-card @looseleaf/typography -y`; `src/app/Shell.tsx` (sidebar listing tracks and lessons from `curriculum.tracks`, with the current lesson marked), `src/app/HomePage.tsx` (one section per track, with a lesson index-card showing title, summary and minutes), `src/app/LessonPage.tsx` (header, `ProseView`, attribution block, further reading, prev/next; the diagram slot shows a dashed placeholder), `src/app/ProseView.tsx` (renders every Block/Inline; a cue renders as a highlight span with `data-cue`, not yet interactive; headings get ids, and `route.section` scrolls to one).

**Tests.** No new unit tests. Logic is in tested modules.

**Playwright** (`e2e/lesson-text.spec.ts`): "home lists the Edge track with the Load balancer card"; "clicking the card opens #/learn/load-balancer"; "lesson shows h2 'What it does' and 8 cues"; "attribution links to the primer anchor and to the CC BY 4.0 license and says text was changed"; "deep link #/learn/load-balancer/horizontal-scaling scrolls the heading into view"; "#/learn/no-such-lesson shows not found"; "sidebar link marks current lesson with aria-current".

**User sees.** A home page of hand-drawn index cards grouped by track, and a sidebar. Clicking Load balancer opens the lesson text, with highlighted cue phrases and the primer attribution at the bottom.

## Step 9: Static diagram stage

**Goal.** Draw the lesson's scene in ink at any step, with next/prev buttons and no animation yet.

**Files.** `src/scene/layout.ts` (`layoutScene`, `pointOn`), `src/scene/layout.test.ts`, `src/scene/ink.ts` (four recipes plus `NODE_SHAPES`; db cylinder and queue composed from `loopLines`/`boxLines`/`lineLines`), `src/scene/ink.test.ts`, `src/scene/ScenePlayer.tsx` (`SceneProvider` without the clock, a `ScenePlayer` stage and caption with Prev/Next buttons, and `useSceneCue` returning `active` only), `src/scene/scene.css` (attribute-driven layer visibility: `[data-visible=false]{opacity:0}`, `[data-focus] [data-layer=focus]{display:block}`, and so on), `src/app/LessonPage.tsx` (wrap in `SceneProvider`, replace the placeholder).

**Tests.** `layout.test.ts`: "cellPx is bucketed to 8 and clamped", "same width bucket gives identical layout", "node rects are integers", "edge endpoints clipped outside both node rects", "pointOn u=0 at from, u=1 at to, reversed when from is b", "lintLayout flags an edge through a node", "lintLayout flags a node at col 9". `ink.test.ts` (calls `runRecipe` directly): "every NodeKind draws a non-empty rest layer", "scene-node is deterministic for the same seed", "scene-edge heads both draws two heads", "runCounter does not grow when the same node is rendered twice through inkFrame" (cache hit).

**Playwright** (`e2e/scene-static.spec.ts`): "stage shows 4 visible nodes at step 1 (c and sessions hidden)"; "Next four times reaches 'fail' and server A has data-down"; "Next at 'scale' makes server C visible"; "caption text matches the step"; "Prev returns to the previous caption"; "the cue for the current step has data-active".

**User sees.** A hand-drawn diagram (client, balancer, servers) beside the text, with a caption and Prev/Next. Stepping makes server A crossed out, then server C appear.

## Step 10: Playback, scrubbing, reduced motion, interactive cues

**Goal.** Requests move along the arrows, and the learner can play, pause, step, scrub, use the keyboard, and click any cue in the text to play that step.

**Files.** `pnpm dlx shadcn@latest add @looseleaf/slider @looseleaf/kbd @looseleaf/tooltip -y`; `src/scene/ScenePlayer.tsx` (rAF clock with dt capped at 100 ms; `useMotion` from `matchMedia` and the InkContext motion; packets as `ScenePacket` DOM nodes using `transform`; controls first/prev/play-pause/next/last plus a slider over `[0, duration]` with step tick marks; keyboard handling; `data-mode`, `data-step-id`, `data-motion` on the root; `onFinish`; `useSceneCue().play`), `src/app/ProseView.tsx` (cue becomes a button), `src/app/LessonPage.tsx` (`route.step` triggers `goto` on mount).

**Tests.** Logic is already covered by steps 5 and 6. Add `timeline.test.ts` "frameAt is referentially cheap: 10k calls < 50 ms" as a guard.

**Playwright** (`e2e/scene-play.spec.ts`): "Play sets data-mode=playing and a packet element appears and moves (two bounding-box reads differ)"; "Pause freezes the packet position"; "Space toggles play when the player has focus"; "ArrowRight plays one step then data-mode returns to paused at the next step"; "dragging the slider to the end shows the last caption"; "clicking the cue 'stops sending requests to unhealthy servers' sets data-step-id=fail"; "deep link #/learn/load-balancer/step/scale opens at scale"; "with emulateMedia reducedMotion=reduce: data-motion=reduced, no packet elements during Play, and captions still advance"; "frame budget: during 3 s of play, the longest rAF gap < 50 ms (performance.now sampling)"; "ink is not regenerated during play: the count of `svg[data-ink]` nodes and their innerHTML length are stable across 30 frames".

**User sees.** The first animated lesson. Press Play and hand-drawn request envelopes travel client to balancer to server and back. A dead server gets a red cross. Clicking a highlighted phrase in the text plays its step. With reduced motion on, steps change as stills.

## Step 11: Quiz

**Goal.** Answer the lesson's quiz, see results and explanations, and jump the diagram to the step that explains an answer. This completes the first full lesson.

**Files.** `pnpm dlx shadcn@latest add @looseleaf/radio-group @looseleaf/checkbox @looseleaf/progress @looseleaf/confetti -y`; `src/content/quiz.ts` (`grade`), `src/content/quiz.test.ts` (extended), `src/app/QuizView.tsx` (one question at a time with a progress bar; order questions use up/down buttons, not drag; a result card; "show me" calls `useSceneCue(replay).play` and scrolls the player into view; Retake), `src/app/LessonPage.tsx`.

**Tests** (`quiz.test.ts`): "grade choice right/wrong", "unanswered is wrong", "multi needs exact set", "order needs identity", "passed at exactly PASS_RATIO", "grade is pure (same input twice equal)".

**Playwright** (`e2e/quiz.spec.ts`): "answering all correctly shows 4/4 and passed"; "a wrong choice shows its `why`"; "'show me' on the health-check question sets the scene to step fail"; "Retake clears answers"; "Submit is disabled until the question is answered".

**User sees.** A quiz under the lesson. The full read, watch and answer loop works for Load balancer.

## Step 12: Progress

**Goal.** Remember what was opened, watched and passed, across reloads. Two open tabs never erase each other's facts. A tab sees the other tab's facts after a reload, not live.

**Files.** `src/progress/progress.ts`, `src/progress/progress.test.ts`, `src/progress/index.ts`, `src/app/LessonPage.tsx` (record `opened`, `scene-done`, `quiz`), `src/app/HomePage.tsx` ("Continue" card from `summary.nextSlug`, done/total progress bar), `src/app/Shell.tsx` (a status mark per lesson in the sidebar: empty, half or check, using the Looseleaf `circled` or check ink), and a "Reset progress" button behind a Looseleaf dialog.

**Tests** (`progress.test.ts`): "parseDoc(null) is EMPTY", "parseDoc drops malformed fields but keeps good ones", "parseDoc unknown v is EMPTY", "apply opened twice equals once", "openedAt keeps the minimum", "bestQuiz keeps the higher ratio", "lastQuiz keeps the latest", "join is commutative / associative / idempotent (property test over 200 random docs)", "statusOf new/started/done", "summarize nextSlug skips done lessons", "store.record writes join of memory and storage", "two stores on one fake KV keep both facts after interleaved records", "clear empties storage and memory".

**Playwright** (`e2e/progress.spec.ts`): "pass the quiz, reload, the sidebar shows a check for Load balancer"; "home Continue card points at the first not-done lesson"; "Reset progress clears marks"; "corrupt localStorage value does not crash the app".

**User sees.** Check marks in the sidebar and a progress bar plus a Continue card on the home page, all surviving a reload.

## Step 13: Search palette

**Goal.** Cmd-K or `/` opens a palette that finds lessons, sections and diagram steps.

**Files.** `pnpm dlx shadcn@latest add @looseleaf/command @looseleaf/dialog -y`; `src/search/search.ts`, `src/search/search.test.ts`, `src/search/index.ts`, `src/app/SearchPalette.tsx` (cmdk with `shouldFilter={false}`, index built lazily on first open, results grouped by kind, Enter navigates via `href`), `src/app/Shell.tsx` (a search button with a `kbd` hint).

**Tests** (`search.test.ts`, with a two-lesson fixture built with `defineLesson`): "tokenize lowercases and strips accents", "tokenize keeps l4 and l7", "title hit outranks body hit", "last token prefix-matches ('rou' finds round robin)", "all tokens must match", "step caption hit carries the step anchor", "section hit carries the heading id", "snippet centers on the first match", "empty query returns []", "limit respected".

**Playwright** (`e2e/search.spec.ts`): "Cmd-K opens the palette"; "typing 'health check' lists the Load balancer fail step first; Enter lands on #/learn/load-balancer/step/fail"; "typing 'layer 7' then Enter scrolls to the heading"; "Escape closes and returns focus".

**User sees.** A hand-drawn command palette that jumps straight to the paragraph or the diagram step being looked for.

## Step 14: Navigation polish and accessibility

**Goal.** Breadcrumbs, a table of contents, a mobile layout and an accessibility pass.

**Files.** `src/app/LessonPage.tsx` (breadcrumb Track > Lesson, TOC from `lesson.headings`, two columns at 1024px and up with a sticky player, stacked below that), `src/app/Shell.tsx` (sidebar becomes a Looseleaf `sheet` below 768px), `src/scene/ScenePlayer.tsx` (stage `role="img"` with an `aria-label` from the step caption, `aria-live` on the caption, visible focus rings), and `e2e/a11y.spec.ts` (adds `@axe-core/playwright`).

**Tests.** No new unit tests.

**Playwright:** "axe finds no serious violations on home and lesson"; "at 390x844 the sidebar opens from a menu button and the stage fits without horizontal page scroll"; "TOC link scrolls to the section"; "every player control reachable by Tab with a visible focus ring".

**User sees.** A lesson that works on a phone, with breadcrumbs and a contents list on desktop.

**Carried over from step 11.** At 390 px wide, a period right after a cue highlight wraps onto its own line (`src/app/ProseView.tsx`, the cue button). Step 14 fixes it and its phone test checks it.

## Step 15: Deploy

**Goal.** The app is public on GitHub Pages, built and checked in CI.

**Files.** `vite.config.ts` (`base: "./"`, which is safe because routing is by hash), `.github/workflows/deploy.yml` (pnpm install, `pnpm build`, `pnpm test`, `pnpm exec playwright install chromium`, `pnpm e2e`, upload `dist`, deploy-pages on main), `public/favicon.svg` (an ink mark), `index.html` (title, description meta).

**Tests.** `src/app/routes.test.ts` adds "href output has no leading slash path (base-independent)".

**Playwright.** The full suite runs in CI against the preview build. `e2e/deploy.spec.ts`: "app works when served under /system-design/" (the preview runs with `--base /system-design/`; assets load and a lesson opens).

**User sees.** The site at `https://<user>.github.io/system-design/`, identical to local.

---

## Lesson steps (repeat after step 11, in primer topic order)

Each lesson is one spec and one file, `src/content/lessons/<slug>/lesson.ts`, copied in shape from `load-balancer`. The spec gives: slug, track, order, the primer section and anchor, the lesson's key points, the scene's nodes on the grid, the step list with captions, and the quiz topics. The tests are the existing `content.test.ts` (it picks the lesson up through the glob), plus one Playwright line added to `e2e/lessons.spec.ts`: "<slug> opens, plays to the end, and its quiz submits". Opus reviews the text against the primer for paraphrase quality and against `docs/sources.md` for license. The user sees a new card on the home page.

Suggested batches: foundations (5), edge (DNS, CDN, reverse proxy), application (2), data (6), cache (5), async (3), communication (4), security, estimation, then case studies. A lesson has exactly one scene. A case study that needs more than one diagram becomes several lessons in the case-studies track, for example `pastebin-write` and `pastebin-read`, each with its own scene and quiz.
