# Step 12: progress

## Goal

The app remembers what a reader did, across reloads. A reader sees:

- a mark next to each lesson in the sidebar. An empty circle means not started, a circle with a dash means started, and a circle with a check means done;
- on the home page, a progress bar, "k of n lessons done", and a card that points at the next lesson to read;
- a "Reset progress" button on the home page that asks first, then clears everything.

A lesson counts as done when its quiz has been passed once. Opening a lesson makes it started. Reaching the last diagram step is recorded too, but it changes no mark.

## How progress behaves

Read this before the code.

- **One localStorage key, `sd.progress`, holds one JSON document.** `parseDoc` is the only place that reads it. Anything malformed is dropped field by field. Nothing in it can make the app throw or log an error.
- **A record is a fact, and facts only move one way.** The first time a lesson was opened is a minimum. The best quiz score is a maximum. So recording the same fact twice changes nothing, and the order facts arrive in does not matter.
- **Two tabs never erase each other.** Every write reads what is in storage first and merges it with what the tab has in memory (`join`). There is no live sync. Another tab sees new facts after a reload.
- **Done is worked out, never stored.** `statusOf` says done when the best quiz score is at least `PASS_RATIO`, the same rule `grade` uses.
- **Reset clears this tab and storage.** A second open tab still has its old facts in memory and writes them back on its next record. This is accepted. It is the price of no live sync.
- **Broken storage is not fatal.** If `localStorage` throws on read, write or access, progress keeps working in memory for this page load.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/content`, `src/lib/ink`, `vendor`, `package.json` or `pnpm-lock.yaml`. The add command below writes one file under `src/lib/ink/recipes/`. Commit it as it comes.
- Under `src/scene`, change only `ScenePlayer.tsx`, and only as the Files section says.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.
- From `src/app`, import from `@/content`, `@/scene` and `@/progress` only through those index paths. From `src/progress`, import lesson code only from `@/content`. `src/boundaries.test.ts` fails otherwise.
- Select elements in Playwright by role, `data-testid` or `data-*` attributes. Never by CSS class.

## Add the component

Run this from the repo root:

```bash
yes n | pnpm dlx shadcn@latest add @looseleaf/alert-dialog -y
```

The command prints "Updating src/index.css" but leaves it unchanged. After it runs, `git diff` on tracked files must be empty. `git status` must show exactly these 2 new files:

- `src/components/ui/alert-dialog.tsx`
- `src/lib/ink/recipes/alert-dialog-ink.ts`

Do not edit them. I ran this command on a copy of `main`, and `pnpm build` still passed with these files added.

The sidebar marks use the existing `Icon` from `@/components/ui/icon` with the names `circle`, `circle-minus` and `circle-check`. All three are in `src/lib/ink/art/icons`.

## Files

You write or change exactly these 11 files, plus the 2 generated files above:

| File | Change |
| :--- | :--- |
| `src/progress/progress.ts` | new. The document, facts, `parseDoc`, `apply`, `join`, `sameDoc`, `statusOf`, `summarize`, `memoryKV` and `createProgressStore` |
| `src/progress/progress.test.ts` | new, 16 tests |
| `src/progress/index.ts` | new. `useProgress` and re-exports |
| `src/scene/ScenePlayer.tsx` | `SceneProvider` takes an optional `onEnd` |
| `src/app/LessonPage.tsx` | record `opened` and `scene-done` |
| `src/app/QuizView.tsx` | record `quiz` on Submit |
| `src/app/HomePage.tsx` | progress summary, next-lesson card, Reset progress dialog |
| `src/app/Shell.tsx` | a status mark per lesson in the sidebar |
| `e2e/helpers.ts` | new. `solveOrder` moved here, plus `passQuiz` |
| `e2e/quiz.spec.ts` | import `solveOrder` from `./helpers` and delete the local copy. No other change |
| `e2e/progress.spec.ts` | new, 5 tests |

Nothing else changes.

### `src/progress/progress.ts` (new)

The shape is in `docs/design/sketch/progress/progress.ts`. Use these exact exports:

```ts
export const STORAGE_KEY = "sd.progress"

export interface QuizScore {
  readonly correct: number
  readonly total: number
  readonly at: number
}

export interface LessonFacts {
  readonly openedAt?: number
  readonly sceneDoneAt?: number
  readonly bestQuiz?: QuizScore
  readonly lastQuiz?: QuizScore
}

export interface ProgressDoc {
  readonly v: 1
  readonly lessons: Readonly<Record<string, LessonFacts>>
}

export type Fact =
  | { readonly kind: "opened"; readonly slug: string; readonly at: number }
  | { readonly kind: "scene-done"; readonly slug: string; readonly at: number }
  | { readonly kind: "quiz"; readonly slug: string; readonly correct: number; readonly total: number; readonly at: number }

export const EMPTY: ProgressDoc = { v: 1, lessons: {} }

export function parseDoc(raw: string | null): ProgressDoc
export function apply(doc: ProgressDoc, fact: Fact): ProgressDoc
export function join(a: ProgressDoc, b: ProgressDoc): ProgressDoc
export function sameDoc(a: ProgressDoc, b: ProgressDoc): boolean

export type LessonStatus = "new" | "started" | "done"
export function statusOf(doc: ProgressDoc, slug: string): LessonStatus

export interface ProgressSummary {
  readonly done: number
  readonly total: number
  readonly nextSlug?: string
}
export function summarize(doc: ProgressDoc, orderedSlugs: readonly string[]): ProgressSummary

export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export function memoryKV(): KV

export interface ProgressStore {
  read(): ProgressDoc
  record(fact: Fact): void
  clear(): void
  subscribe(cb: () => void): () => void
}
export function createProgressStore(kv: KV, key?: string): ProgressStore
```

**Valid values.** A time (`openedAt`, `sceneDoneAt`, `at`) is valid when it is a finite number at least 0. A `QuizScore` is valid when `total` is a whole number at least 1, `correct` is a whole number from 0 to `total`, and `at` is a valid time. Use `Number.isFinite` and `Number.isInteger`.

**`parseDoc(raw)`.**

- `null`, a string that `JSON.parse` rejects, or JSON that is not a plain object with `v === 1` gives `EMPTY`. Catch the `JSON.parse` error. Do not log anything.
- If `lessons` is not a plain object (an array or `null` counts as not), the result is `{ v: 1, lessons: {} }`.
- For each entry of `lessons`, keep each field only if its value is valid. Drop the whole entry if its value is not a plain object, or if no field survives. Ignore unknown fields.
- Build the `lessons` object with `Object.fromEntries`, never by assigning `out[slug] = ...`. A slug of `__proto__` then stays a plain key instead of changing the object's prototype.
- Read fields of unknown values with `typeof` checks and the `in` operator. No `as` casts.

**`join(a, b)`.** The result has every slug in either document. For a slug in both, each field merges like this:

| Field | Merge |
| :--- | :--- |
| `openedAt`, `sceneDoneAt` | the smaller of the two. A field present on one side only is kept |
| `bestQuiz` | the better score: higher ratio first, then earlier `at`, then larger `total` |
| `lastQuiz` | the later score: larger `at` first, then higher ratio, then larger `total` |

Compare ratios without division: `x` beats `y` when `x.correct * y.total > y.correct * x.total`. The tie breaks matter. Each one makes the order total, so `join` stays commutative when two scores tie. The property tests use small numbers so ties happen often.

**`apply(doc, fact)`** is `join(doc, single)`, where `single` is a document holding only that fact. `opened` sets `openedAt`. `scene-done` sets `sceneDoneAt`. `quiz` sets both `bestQuiz` and `lastQuiz` to `{ correct, total, at }`. If the fact's time or score is not valid, `apply` returns `doc` unchanged.

**`sameDoc(a, b)`** is true when both documents have the same slugs and every field is equal. Key order does not matter.

**`statusOf(doc, slug)`.** Look the slug up only if `Object.hasOwn(doc.lessons, slug)`, so a slug such as `toString` never reads `Object.prototype`. `done` when the slug has a `bestQuiz` with `bestQuiz.correct / bestQuiz.total >= PASS_RATIO`. Import `PASS_RATIO` from `@/content`. `started` when the slug has any field. `new` otherwise, including when the slug is not in the document.

**`summarize(doc, orderedSlugs)`.** `total` is `orderedSlugs.length`. `done` counts the slugs in `orderedSlugs` whose status is `done`. Slugs in the document but not in `orderedSlugs` count for nothing. `nextSlug` is the first slug in `orderedSlugs` that is not done. When every slug is done, leave `nextSlug` out.

**`memoryKV()`** returns a `KV` backed by a `Map`. The tests use it, and `useProgress` falls back to it when `window.localStorage` cannot be used.

**`createProgressStore(kv, key = STORAGE_KEY)`.**

- Every call to `kv` goes through a `try`/`catch`. A throwing `getItem` counts as `null`. A throwing `setItem` or `removeItem` is ignored. Nothing is logged.
- On creation, memory is `parseDoc` of what `kv` holds.
- `read()` returns the memory document. It returns the same object until memory changes, because `useSyncExternalStore` needs a stable snapshot.
- `record(fact)` works out `next = join(apply(memory, fact), parseDoc(stored))`, then writes `JSON.stringify(next)` under `key`. If `next` is not `sameDoc` with memory, memory becomes `next` and every subscriber is called.
- `clear()` sets memory to `EMPTY`, removes `key` from `kv`, and calls every subscriber.
- `subscribe(cb)` adds `cb` and returns a function that removes it.

### `src/progress/progress.test.ts` (new)

Write exactly these 16 tests with these names. Use `memoryKV()` for storage. For the property tests, write a small seeded random generator in the test file (for example mulberry32 with a fixed seed). Do not add a dependency.

The random document generator picks slugs from `["a", "b", "c"]`. Each field is present or absent at random. Times are whole numbers from 0 to 3. A score's `total` is from 1 to 4 and `correct` from 0 to `total`. These small ranges make ties common.

1. `parseDoc(null) is EMPTY`. `parseDoc(null)`, `parseDoc("")`, `parseDoc("{not json")`, `parseDoc("[]")`, `parseDoc("42")` and `parseDoc("null")` are each `sameDoc` with `EMPTY`.
2. `parseDoc drops malformed fields but keeps good ones`. Parse `{"v":1,"lessons":{"a":{"openedAt":5,"sceneDoneAt":"x","bestQuiz":{"correct":5,"total":4,"at":1},"lastQuiz":{"correct":1,"total":4,"at":2},"extra":true},"b":"nope","c":{"openedAt":-1}}}`. The result has only slug `a`, holding `openedAt` 5 and `lastQuiz` `{ correct: 1, total: 4, at: 2 }` and nothing else. Also, `{"v":1,"lessons":[]}` gives a document with no slugs.
3. `parseDoc unknown v is EMPTY`. `{"v":2,"lessons":{"a":{"openedAt":1}}}` and `{"lessons":{"a":{"openedAt":1}}}` are `sameDoc` with `EMPTY`.
4. `apply opened twice equals once`. For `f = { kind: "opened", slug: "a", at: 10 }`, `apply(apply(EMPTY, f), f)` is `sameDoc` with `apply(EMPTY, f)`. The same holds for a `quiz` fact.
5. `openedAt keeps the minimum`. Opened at 50, then 20, then 70 leaves `openedAt` 20.
6. `bestQuiz keeps the higher ratio`. Quiz 2/4 at 1, then 3/4 at 2, then 1/4 at 3 leaves `bestQuiz` `{ correct: 3, total: 4, at: 2 }`. Adding 3/4 at 9 still leaves `at` 2, the earlier of a tie.
7. `lastQuiz keeps the latest`. Quiz 3/4 at 2, then 1/4 at 3 leaves `lastQuiz` 1/4 at 3. Adding 4/4 at 1 still leaves 1/4 at 3.
8. `join is commutative`. For 200 random pairs, `join(x, y)` is `sameDoc` with `join(y, x)`.
9. `join is associative`. For 200 random triples, `join(join(x, y), z)` is `sameDoc` with `join(x, join(y, z))`.
10. `join is idempotent`. For 200 random pairs, `join(x, x)` is `sameDoc` with `x`, and `join(x, join(x, y))` is `sameDoc` with `join(x, y)`.
11. `statusOf new/started/done`. On `EMPTY`, slug `a` is `new`. After `opened`, it is `started`. After quiz 2/4 it is still `started`. After quiz 7/10 it is `done`, because 7/10 is exactly `PASS_RATIO`. A slug never recorded is `new`, and so is `toString` on `EMPTY`.
12. `summarize nextSlug skips done lessons`. With slugs `["a", "b", "c"]`, `a` done, `b` started and `c` new, the summary is `{ done: 1, total: 3, nextSlug: "b" }`. A done slug `z` that is not in the list changes nothing. With all three done, `done` is 3 and `nextSlug` is `undefined`.
13. `store.record writes join of memory and storage`. Put a document with `a.openedAt` 5 in the KV and create a store. Then write a document with `b.openedAt` 6 straight into the KV, as another tab would. Record `opened` for `c` at 7. The stored JSON parses to a document with `a`, `b` and `c`, and `read()` is `sameDoc` with it.
14. `two stores on one fake KV keep both facts after interleaved records`. Create stores A and B on one empty KV. A records `opened a`, B records quiz 3/4 for `b`, then A records `scene-done a`. The stored document has `a.openedAt`, `a.sceneDoneAt` and `b.bestQuiz`.
15. `clear empties storage and memory`. Record a fact and subscribe a counter. After `clear()`, `kv.getItem(STORAGE_KEY)` is `null`, `read()` is `sameDoc` with `EMPTY`, and the counter went up.
16. `a throwing KV keeps facts in memory`. A KV whose three methods all throw. `createProgressStore` does not throw. After recording `opened a`, `statusOf(store.read(), "a")` is `started`.

The design notes listed the three `join` laws as one test. They are three here so a failure names the law that broke.

### `src/progress/index.ts` (new)

```ts
export interface UseProgress {
  readonly doc: ProgressDoc
  readonly summary: ProgressSummary
  status(slug: string): LessonStatus
  record(fact: Fact): void
  clear(): void
}

export function useProgress(): UseProgress

export { STORAGE_KEY } from "./progress"
export type { Fact, LessonStatus, ProgressDoc, ProgressSummary } from "./progress"
```

- One store per window, created on first use and kept in a module variable. It uses `window.localStorage`. If reading `window.localStorage` throws, it uses `memoryKV()` instead.
- `doc` comes from `React.useSyncExternalStore(store.subscribe, store.read)`.
- `summary` is `summarize(doc, curriculum.flat.map((lesson) => lesson.slug))`, in a `useMemo` on `doc`.
- `record` and `clear` are the store's own methods, so they are the same function on every render. Bind them once when the store is created, not on each call to the hook. `LessonPage` puts `record` in effect dependencies and relies on this.

### `src/scene/ScenePlayer.tsx`

`SceneProvider` takes one more optional prop, `onEnd?: () => void`. Inside it:

```ts
const atEnd = state.t === timeline.duration
React.useEffect(() => {
  if (atEnd) onEnd?.()
}, [atEnd, onEnd])
```

It fires when the player reaches the end, whether by playing, Next, Last, the End key or the scrubber. Change nothing else in the file. `src/scene` still imports nothing from `@/content` or `@/progress`.

### `src/app/LessonPage.tsx`

- Call `useProgress()` at the top, before the early `return` for a missing lesson, because hooks cannot run after a conditional return.
- Record `{ kind: "opened", slug, at: Date.now() }` in an effect that depends on the lesson and `record`. Skip it when the lesson is missing.
- Build `onEnd` with `React.useCallback`, recording `{ kind: "scene-done", slug, at: Date.now() }`, with `record` and the slug as dependencies. Pass it to `SceneProvider`.

React runs effects twice in development under `StrictMode`. That is fine, because recording a fact twice changes nothing.

### `src/app/QuizView.tsx`

Call `useProgress()`. In the Submit click handler, after working out `result = grade(quiz, answers)`, call `record({ kind: "quiz", slug, correct: result.correct, total: result.total, at: Date.now() })` and then set the result state. Record in the handler, not in an effect. Change nothing else.

### `src/app/Shell.tsx`

Call `useProgress()`. Work out each lesson's status once, and pick the icon and label from one `Record<LessonStatus, { icon: string; label: string }>` table at module scope built from the table below. No nested ternaries. In each sidebar lesson link, after the title, add the mark:

```tsx
<span data-testid="lesson-status" data-slug={lesson.slug} data-status={status(lesson.slug)} className="ms-auto">
  <Icon name={...} size={16} label={...} />
</span>
```

| Status | Icon name | label |
| :--- | :--- | :--- |
| `new` | `circle` | "Not started" |
| `started` | `circle-minus` | "Started" |
| `done` | `circle-check` | "Done" |

The mark goes after the title, so the link's accessible name still starts with "Load balancer". `e2e/lesson-text.spec.ts` finds the link by that name.

### `src/app/HomePage.tsx`

Call `useProgress()`. Between the header and the first track, add a `section` with `data-testid="progress-summary"` and class `space-y-4`, holding:

- `<p data-testid="progress-count">{done} of {total} lessons done</p>`;
- a Looseleaf `Progress` with `value={done}`, `max={total}` and `aria-label="Lessons done"`;
- when `summary.nextSlug` is set, a link `<a data-testid="next-lesson" data-slug={nextSlug} data-status={status(nextSlug)} href={href({ name: "lesson", slug: nextSlug })}>`. It wraps a Looseleaf `Card` whose first line is a small label in `font-hand text-sm text-pencil-text` reading "Start here" when the status is `new`, or "Continue" when it is `started`. The second line is the lesson title from `curriculum.bySlug`, in `font-script text-2xl font-bold`, so the title reads as the heading and the label as a note above it;
- when `nextSlug` is not set, `<p data-testid="all-done">You finished every lesson.</p>`;
- the reset dialog. A Looseleaf `AlertDialog` whose `AlertDialogTrigger asChild` wraps a Looseleaf `Button` with `variant="outline"` reading "Reset progress". The content has `AlertDialogTitle` "Reset progress?", `AlertDialogDescription` "This clears every mark and quiz score saved in this browser.", `AlertDialogCancel` "Cancel", and `AlertDialogAction` "Reset" with `onClick={clear}`.

The design notes call the next-lesson card the "Continue" card. Its test id is `next-lesson` because it reads "Start here" for a new reader.

### `e2e/helpers.ts` (new)

Move `solveOrder(page)` here from `e2e/quiz.spec.ts` without changing it, and export it. Add and export `passQuiz(page)`. It assumes the load-balancer lesson is open. It answers all 4 questions right exactly as test 1 of `e2e/quiz.spec.ts` does, clicks Submit, and waits until `quiz-verdict` has `data-passed="true"`.

### `e2e/progress.spec.ts` (new)

Import `test`, `expect` and `gotoReady` from `./fixtures`, and `passQuiz` from `./helpers`. Each Playwright test gets a fresh browser context, so localStorage starts empty. Read storage with `page.evaluate(() => localStorage.getItem("sd.progress"))`. The sidebar mark for the lesson is `page.getByTestId("sidebar").locator('[data-testid="lesson-status"][data-slug="load-balancer"]')`.

Write exactly these 5 tests with these names:

1. `pass the quiz, reload, the sidebar shows a check for Load balancer`. Open `/#/learn/load-balancer`. The mark has `data-status="started"`. Call `passQuiz`. The mark has `data-status="done"`. Reload and wait for the page as `gotoReady` does. The mark still has `data-status="done"`.
2. `home Continue card points at the first not-done lesson`. Open `/#/`. `progress-count` reads "0 of 1 lessons done". `next-lesson` has `href="#/learn/load-balancer"`, `data-status="new"` and contains "Start here". Open the lesson, then go back to `/#/`. `next-lesson` has `data-status="started"` and contains "Continue". Open the lesson, call `passQuiz`, then go back to `/#/`. `next-lesson` is gone, `all-done` is visible, and `progress-count` reads "1 of 1 lessons done".
3. `Reset progress clears marks`. Open the lesson, call `passQuiz`, then open `/#/`. Click "Reset progress", then "Cancel". The mark is still `done`. Click "Reset progress", then "Reset". The mark is `new`, `progress-count` reads "0 of 1 lessons done", and storage is `null`. Reload. The mark is still `new`.
4. `corrupt localStorage value does not crash the app`. Open `/#/`. Set `sd.progress` to `{not json` with `page.evaluate`, then reload. The page shows, the mark is `new`, and `next-lesson` has `data-status="new"`. Open the lesson. The mark is `started`, and storage now parses as JSON with `v` equal to 1. The fixture fails the test on any console error.
5. `reaching the last diagram step records scene-done`. Open the lesson. Click the button named "Last step". Poll storage with `expect.poll` until `JSON.parse(value).lessons["load-balancer"].sceneDoneAt` is a number. The mark stays `started`.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run still shows 68 tests passing, because it runs `src/content` only.
3. `pnpm test` shows 173 tests passing in 13 files: the 157 from before plus the 16 progress tests.
4. `pnpm e2e` shows 37 tests passing: the 32 from before plus these 5. Run it 3 times in a row. All 3 runs must pass.

## Done means

- All four commands pass.
- `git status` shows only the 2 generated files and the 11 files in the Files table.
- Each of these planted bugs makes the named test fail. Check each one, then put the code back:
  - dropping the "earlier `at`" tie break from `bestQuiz` fails unit test `join is commutative`;
  - making `record` write `apply(memory, fact)` without joining what is stored fails unit test `two stores on one fake KV keep both facts after interleaved records`;
  - using `>` instead of `>=` against `PASS_RATIO` in `statusOf` fails unit test `statusOf new/started/done`;
  - making `clear` reset memory but not remove the key fails e2e test 3;
  - removing the `record` call from Submit in `QuizView` fails e2e test 1;
  - never calling `onEnd` in `SceneProvider` fails e2e test 5.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4 (all three e2e runs). Paste the failing output of the six planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
