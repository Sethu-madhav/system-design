# Step 13: search palette

## Goal

A reader can jump anywhere from the keyboard. A reader sees:

- a "Search" button in the page header with a `⌘K` key hint;
- a palette that opens on Cmd-K, Ctrl-K, the `/` key or a click on that button;
- results as they type, in three groups. "Lessons" come first, then "Sections", then "Diagram steps". Each result shows its title, the lesson it belongs to and a short snippet with the matched word in bold;
- Enter on a result goes there. A lesson opens at the top. A section opens with its heading scrolled into view. A diagram step opens with the diagram on that step.

## How search behaves

Read this before the code.

- **There is no search library.** `buildIndex` reads the same `Lesson` objects the pages render and builds an inverted index in memory. The palette builds it once, the first time it opens.
- **There are three kinds of document.** One per lesson, one per h2 or h3 heading, and one per diagram step. Text before a lesson's first heading belongs to no section and is not indexed. Quiz text is not indexed.
- **Words are tokens.** `tokenize` strips accents, lowercases, splits on anything that is not `a-z` or `0-9`, and drops tokens shorter than 2 characters. So `L7` becomes `l7`, and `layer 7` becomes just `layer`.
- **Every query token must match.** A document that misses one token is not a hit.
- **Only the last token may match a prefix.** While a reader types `rou`, it finds `round`. Earlier tokens must match whole words.
- **A whole word beats a prefix, and a title beats body text.** Each field has a weight. A whole-word match scores the weight times 2. A prefix match scores the weight times 1.
- **The palette does not reorder.** `cmdk` filtering is off (`shouldFilter={false}`). The groups keep `search`'s order inside each group.

### A known ranking result

The design said "health check" would list the load-balancer `fail` step first. It does not. The lesson's tags include `health check`, so the lesson document scores 12 and the `fail` step scores 6. The step is the second result, in the "Diagram steps" group. The e2e test below checks that order and reaches the step with one Down arrow. Ranking a tag hit above a caption hit is the right result for a reader looking for a topic.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/content`, `src/scene`, `src/progress`, `src/lib/ink` or `vendor`. The add command below changes `package.json` and `pnpm-lock.yaml` and writes new files under `src/lib/ink`. Commit those as they come and edit none of them.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.
- From `src/app`, import from `@/content` and `@/search` only through those index paths. `src/search/search.ts` imports lesson code only as `import type { Block, Inline, Lesson } from "@/content"`. `src/boundaries.test.ts` fails otherwise.
- Select elements in Playwright by role, `data-testid` or `data-*` attributes. Never by CSS class.

## Add the components

Run this from the repo root:

```bash
yes n | pnpm dlx shadcn@latest add @looseleaf/command @looseleaf/dialog -y
```

The command prints "Updating src/index.css" but leaves it unchanged. After it runs, `git diff --stat` shows exactly 2 changed tracked files:

- `package.json`, which gains `"cmdk": "^1.1.1"`;
- `pnpm-lock.yaml`.

`git status` shows exactly these 10 new files:

- `src/components/ui/command.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/mascot.tsx`
- `src/components/ui/spinner.tsx`
- `src/lib/ink/art/mascots/body.ts`
- `src/lib/ink/art/mascots/index.ts`
- `src/lib/ink/art/mascots/poses.ts`
- `src/lib/ink/art/mascots/props.ts`
- `src/lib/ink/recipes/command-ink.ts`
- `src/lib/ink/recipes/spinner-ink.ts`

Do not edit them. I ran this command on a detached copy of `main`, and `pnpm build` still passed with these files added.

What you need from them:

- `CommandDialog` takes `open`, `onOpenChange`, `title`, `description` and `commandProps`. It renders the title and description as screen-reader text, so Radix logs no missing-title error. When it closes, it returns focus to whatever had focus before it opened, with `preventScroll`.
- `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup` and `CommandItem` wrap the `cmdk` parts of the same name. `CommandEmpty` shows a mascot by default. Keep the default.
- `Kbd` already exists at `src/components/ui/kbd.tsx`. `Button` exists at `src/components/ui/button.tsx` with an `outline` variant and an `sm` size.

## Files

You write or change exactly these 6 files, plus the 12 from the add command above:

| File | Change |
| :--- | :--- |
| `src/search/search.ts` | new. Types, `tokenize`, `buildIndex` and `search` |
| `src/search/search.test.ts` | new, 13 tests |
| `src/search/index.ts` | new. Re-exports |
| `src/app/SearchPalette.tsx` | new. The button, the shortcut listener and the dialog |
| `src/app/Shell.tsx` | renders `<SearchPalette />` in the header |
| `e2e/search.spec.ts` | new, 4 tests |

`App.tsx` does not change. The palette owns its own open state, so nothing above it needs to know.

### `src/search/search.ts` (new)

```ts
import type { Block, Inline, Lesson } from "@/content"

interface DocBase {
  readonly slug: string
  readonly lessonTitle: string
  readonly title: string
  readonly text: string
}

export type SearchDoc =
  | (DocBase & { readonly kind: "lesson" })
  | (DocBase & { readonly kind: "section"; readonly anchor: string })
  | (DocBase & { readonly kind: "step"; readonly anchor: string })

export type DocKind = SearchDoc["kind"]

export interface Posting {
  readonly doc: number
  readonly weight: number
}

export interface SearchIndex {
  readonly docs: readonly SearchDoc[]
  readonly postings: ReadonlyMap<string, readonly Posting[]>
}

export interface Snippet {
  readonly before: string
  readonly match: string
  readonly after: string
}

export interface Hit {
  readonly doc: SearchDoc
  readonly score: number
  readonly snippet: Snippet
}

export const DEFAULT_LIMIT = 20

export function tokenize(text: string): readonly string[]
export function buildIndex(lessons: readonly Lesson[]): SearchIndex
export function search(index: SearchIndex, query: string, limit?: number): readonly Hit[]
```

**`tokenize`.** Run `text.normalize("NFKD")`, remove the characters in `̀-ͯ`, lowercase, split on `/[^a-z0-9]+/`, and keep tokens with length at least 2. Keep duplicates and order.

**`buildIndex`.** Walk the lessons in the order given. For each lesson, push its documents in this order:

1. The lesson document.
2. One section document per heading block (`t: "h"`, level 2 or 3), in body order.
3. One step document per `lesson.timeline.steps` entry, in timeline order.

The fields and their weights:

| Kind | `title` | `text` | `anchor` | Indexed fields and weights |
| :--- | :--- | :--- | :--- | :--- |
| lesson | `lesson.title` | `lesson.summary` | none | title 5, each tag 3, text 1 |
| section | the heading's plain text | plain text of the blocks after the heading, up to the next heading of any level | the heading's `id` | title 3, text 1 |
| step | `` `Step ${step.index + 1}` `` | `step.caption` | `step.id` | text 2 |

`lessonTitle` is always `lesson.title`, and `slug` is `lesson.slug`. A step's title is not indexed. That makes the step weight the design's "caption 2", the section title weight its "heading 3", and the section text its "body 1".

The plain text of inlines joins: `text` and `code` give `v`, `cue` gives `text`, and `strong`, `em` and `link` give the plain text of `c`. Blocks join with one space. `p` and `callout` give their inlines, `ul` and `ol` give each item joined by one space, and `code` gives `v`. Write these as two small local functions in `search.ts` over the `Block` and `Inline` types from `@/content`, with a `switch` on `t`. Do not copy those types into `search.ts`. `inlineText` in `src/content/prose.ts` is not exported, and you may not edit `src/content`.

There is one posting per (token, document) pair. Its `weight` is the largest weight of any field of that document that contains the token. Build each document's token weights in a `Map<string, number>` first, then push one posting per entry. Do not search a postings array to update it.

**`search`.**

1. Tokenize the query and remove duplicate tokens, keeping first positions. If there are no tokens, return `[]`.
2. For each query token, the candidate keys are the token itself if it is a key in `postings`. For the last token only, they also include every other key that starts with it. Work out each token's candidate keys once per query, not once per document.
3. A document's score for one token is the largest `posting.weight × (key === token ? 2 : 1)` over the candidate keys that have a posting for that document. Get it by walking the postings of the candidate keys into a `Map<number, number>` from document position to score. Do not loop over every document. A document with no score for some token is dropped.
4. A document's score is the sum of its token scores. The work per query grows with the number of keys and matching postings, not with documents times keys.
5. Sort by score, highest first. Break ties by document position in `docs`, lowest first. Return the first `limit` hits. `limit` defaults to `DEFAULT_LIMIT`.

**The snippet** comes from `doc.text` only:

1. Let `lower` be `doc.text.toLowerCase()`. Find the smallest index `i` where some query token starts in `lower` at a word start, meaning `i === 0` or `lower[i - 1]` is not `a-z` or `0-9`. For a token other than the last, the character after the token must also not be `a-z` or `0-9`.
2. If there is no such index, return `{ before: "", match: "", after }`. `after` is the first 120 characters of `doc.text`, followed by `…` when the text is longer.
3. Otherwise `end` is the end of the run of `a-z0-9` characters in `lower` that starts at `i`. `match` is `doc.text.slice(i, end)`. `before` is `doc.text.slice(Math.max(0, i - 60), i)`, with a leading `…` when `i > 60`. `after` is `doc.text.slice(end, end + 60)`, with a trailing `…` when `end + 60 < doc.text.length`.

### `src/search/search.test.ts` (new)

Build two fixture lessons with `defineLesson`, `defineScene` and `md` from `@/content/author`, then `finishLesson` from `@/content/lesson`. Test files may import across modules. Copy the three-question `baseQuiz` and the one-link `sources` from `src/content/curriculum.test.ts`. Use track `"edge"`.

Lesson `caching`, order 1:

- title `Caching`, summary `Keep hot data close to the reader.`, tags `["cdn"]`;
- nodes `app` (client, `[0, 0]`) and `db` (server, `[2, 0]`);
- steps `miss` with caption `The cache misses, so the app reads the database.` and `fill` with caption `The app stores the answer in the cache for next time.`, each with one `s.send("app", "db")`;
- body, with each paragraph on one line:

```
## Write through

The app writes to the cache and the database together. Round robin has nothing to do with it.

### Eviction

When the cache is full, the least recently used entry goes first.
```

Lesson `queues`, order 2:

- title `Queues`, summary `Hand work to a worker and answer the caller right away.`, tags `["async"]`;
- the same two nodes;
- one step `push` with caption `The app pushes a job onto the queue.`;
- body:

```
## Why queue

A queue absorbs bursts. Workers drain it at their own pace, and caching results is a separate concern.
```

Write exactly these 13 tests. Each one names what it checks:

1. `tokenize lowercases and strips accents`. `tokenize("Café, ÉCOLE!")` equals `["cafe", "ecole"]`.
2. `tokenize keeps l4 and l7`. `tokenize("L4 vs L7 at a 7")` equals `["l4", "vs", "l7", "at"]`.
3. `title hit outranks body hit`. `caching` returns exactly 2 hits. They are the `caching` lesson document and then the `why-queue` section.
4. `exact word outranks a prefix match`. `queue` returns the `why-queue` section (score 6), then the `queues` lesson (score 5), then the `push` step (score 4).
5. `last token prefix-matches ('rou' finds round robin)`. `rou` returns exactly the `write-through` section. `rou robin` returns `[]`.
6. `all tokens must match`. `cache database` returns exactly the `miss` step (score 8) and then the `write-through` section (score 4).
7. `step caption hit carries the step anchor`. `misses` returns one hit with kind `step`, slug `caching`, anchor `miss`, title `Step 1` and lessonTitle `Caching`.
8. `section hit carries the heading id`. `eviction` returns one hit with kind `section`, anchor `eviction` and title `Eviction`. Its snippet is `{ before: "", match: "", after: "When the cache is full, the least recently used entry goes first." }`.
9. `snippet centers on the first match`. For `drain`, the snippet's `before` is `A queue absorbs bursts. Workers `, its `match` is `drain`, and its `after` starts with ` it at their own pace`, ends with `…` and has length 61. For `concern`, `before` starts with `…` and has length 61, `match` is `concern` and `after` is `.`.
10. `empty query returns []`. `""`, `"   "` and `"a 7"` all return `[]`.
11. `limit respected`. `search(index, "the", 2)` has length 2. `search(index, "the")` has more than 2 hits.
12. `tag hit scores weight 3`. `cdn` returns exactly the `caching` lesson document with score 6.
13. `ties keep document order`. `app` returns the `miss`, `fill` and `push` steps, each with score 4, in that order, then the `write-through` section with score 2.

Tests 4, 12 and 13 are new and were not in the design. Test 4 is the only test that fails when the whole-word bonus is removed. Tests 12 and 13 cover the tag weight and the tie break, which the e2e tests cannot see because the palette always shows lessons first.

### `src/search/index.ts` (new)

```ts
export { buildIndex, DEFAULT_LIMIT, search, tokenize } from "./search"
export type { DocKind, Hit, Posting, SearchDoc, SearchIndex, Snippet } from "./search"
```

### `src/app/SearchPalette.tsx` (new)

```ts
export function SearchPalette()
```

It renders a trigger button and the dialog.

**State.** `open` and `query` in `useState`. When `onOpenChange(false)` runs, set `open` to false and `query` to `""`.

**The index.** A module-level `let cached: SearchIndex | undefined` and a function `lessonIndex()` that does `cached ??= buildIndex(curriculum.flat)` and returns it. The hits come from `useMemo(() => (open ? search(lessonIndex(), query) : []), [open, query])`. The index is built on the first open and never before.

**The shortcuts.** One `keydown` listener on `window`, added in a `useEffect` with `[]` dependencies and removed in its cleanup:

- if `event.metaKey || event.ctrlKey` and `event.key.toLowerCase() === "k"`, call `preventDefault`, toggle `open` and set `query` to `""`. Closing by Cmd-K must clear the query just like Escape does;
- if `event.key === "/"` with no meta, ctrl or alt key, and the event target is not editable, call `preventDefault` and set `open` to true.

A target is editable when it is an `HTMLElement` that `isContentEditable`, or that has `closest("input, textarea, select")`. Without this check, typing `/` in the palette's own input would be swallowed.

**The trigger.** `<Button variant="outline" size="sm" data-testid="search-open" onClick={() => setOpen(true)}>` containing the text `Search` and `<Kbd>⌘K</Kbd>`.

**The dialog.** It has this shape:

```tsx
<CommandDialog
  open={open}
  onOpenChange={onOpenChange}
  title="Search lessons"
  description="Find a lesson, a section or a diagram step."
  commandProps={{ shouldFilter: false }}
>
  <CommandInput data-testid="search-input" placeholder="Search lessons, sections and steps" value={query} onValueChange={setQuery} />
  <CommandList data-testid="search-results">
    {/* hint when query.trim() is "", otherwise <CommandEmpty>No matches.</CommandEmpty> */}
    {/* one CommandGroup per non-empty kind, in GROUPS order */}
  </CommandList>
</CommandDialog>
```

- The hint is `<p data-testid="search-hint" className="px-2 py-3 font-hand text-base text-pencil-text">Type to find a lesson, a section or a diagram step.</p>`. Render it only when `query.trim() === ""`, and render `CommandEmpty` only otherwise.
- `const GROUPS: readonly { readonly kind: DocKind; readonly heading: string }[]` is `lesson` with "Lessons", then `section` with "Sections", then `step` with "Diagram steps". Each group renders the hits of its kind in the order `search` returned them. Skip a group with no hits.
- A local `function target(doc: SearchDoc): string` returns `href({ name: "lesson", slug })` for a lesson, `href({ name: "lesson", slug, section: doc.anchor })` for a section, and `href({ name: "lesson", slug, step: doc.anchor })` for a step. Switch on `doc.kind`. TypeScript then knows `anchor` exists.
- Each hit is `<CommandItem key={t} value={t} data-testid="search-result" data-kind={hit.doc.kind} data-href={t} onSelect={() => go(t)}>`, where `t = target(hit.doc)`. Inside, put a `div` with `className="min-w-0"` that holds two lines:
  - first line, `<span className="font-bold">{hit.doc.title}</span>`, and for a section or step also ` · {hit.doc.lessonTitle}` in `text-pencil-text`;
  - second line, a `<span className="block truncate text-sm text-pencil-text">` with `before`, then `<strong className="text-ink">{match}</strong>`, then `after`.
  - The wrapper `div` must be able to shrink to the item's width, for example `min-w-0 flex-1`. A long snippet is cut with an ellipsis inside the dialog. It never widens the item, the list or the dialog.
- `go(t)` sets `window.location.hash = t`, then calls `onOpenChange(false)`.

### `src/app/Shell.tsx`

Give the header `justify-between` and render `<SearchPalette />` after the home link. Import it from `@/app/SearchPalette`. Change nothing else.

### `e2e/search.spec.ts` (new)

Use `test`, `expect` and `gotoReady` from `./fixtures`. Every test starts with `gotoReady(page, "/#/")`. The palette dialog is `page.getByRole("dialog")`.

1. `Cmd-K opens the palette`. Press `Meta+k`. The dialog is visible and `search-input` is focused. `search-hint` is visible. Press `Escape`, and the dialog is hidden. Press `/`. The dialog is visible again. Type `l4/l7` into the input with `pressSequentially`. The input's value is `l4/l7`. Press `Meta+k`, and the dialog is hidden. Press `Meta+k` again. The dialog is visible and the input's value is `""`.
2. `typing 'health check' lists the Load balancer lesson then the fail step; Down and Enter land on #/learn/load-balancer/step/fail`. Press `Meta+k` and type `health check`. There are exactly 2 `search-result` items. The first has `data-kind="lesson"` and contains `Load balancer`. The second has `data-kind="step"` and `data-href="#/learn/load-balancer/step/fail"`. The first result's bounding box ends at or before the dialog's right edge, because the lesson summary snippet is longer than the dialog is wide. Press `ArrowDown`, then `Enter`. The URL ends with `#/learn/load-balancer/step/fail`, the dialog is hidden, and `scene` has `data-step-id="fail"`.
3. `typing 'layer 7' then Enter scrolls to the heading`. Press `Meta+k` and type `layer 7`. There is exactly 1 `search-result` item, with `data-kind="section"` and `data-href="#/learn/load-balancer/how-it-picks-a-server"`. Press `Enter`. The URL ends with `#/learn/load-balancer/how-it-picks-a-server`. `page.locator("#how-it-picks-a-server")` is in the viewport, and `window.scrollY` is greater than 0.
4. `Escape closes and returns focus`. Click `search-open`. The dialog is visible. Press `Escape`. The dialog is hidden and `search-open` is focused.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run still shows 68 tests passing, because it runs `src/content` only. The existing Vite warning about a chunk over 500 kB is expected.
3. `pnpm test` shows 186 tests passing in 14 files. That is the 173 from before plus the 13 search tests.
4. `pnpm e2e` shows 41 tests passing. That is the 37 from before plus these 4. Run it 3 times in a row. All 3 runs must pass.

## Done means

- All four commands pass.
- `git status` shows only the 12 files from the add command and the 6 files in the Files table.
- Each of these planted bugs makes the named test fail. Check each one, then put the code back:
  - removing the accent strip from `tokenize` fails unit test `tokenize lowercases and strips accents`;
  - scoring a whole-word match the same as a prefix match fails unit test `exact word outranks a prefix match`;
  - letting every token match a prefix, not only the last, fails unit test `last token prefix-matches ('rou' finds round robin)`;
  - keeping a document that matches any one token fails unit test `all tokens must match`;
  - taking `before` from `i - 30` instead of `i - 60` fails unit test `snippet centers on the first match`;
  - removing `shouldFilter: false` fails e2e test 2;
  - making `target` return the lesson href for a section fails e2e test 3;
  - dropping the editable-target check from the `/` shortcut fails e2e test 1;
  - not clearing `query` in the Cmd-K branch fails e2e test 1;
  - removing `flex-1` and `min-w-0` from the result wrapper fails e2e test 2;
  - giving tags weight 1 instead of 3 fails unit test `tag hit scores weight 3`;
  - reversing the position tie break fails unit test `ties keep document order`.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4 (all three e2e runs). Paste the failing output of the twelve planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
