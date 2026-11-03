# Step 14: navigation polish and accessibility

## Goal

A lesson works on a phone and with a keyboard. A reader sees:

- a breadcrumb above the lesson title, reading `Home / Edge and traffic / Load balancer`;
- an "On this page" contents list in a sticky right rail at 1024 px and wider. Clicking an entry scrolls to that heading;
- at 767 px and narrower, a menu button in the header that opens the lesson list as a sheet from the left. Picking a lesson closes the sheet;
- a period or comma right after a highlighted cue stays on the same line as the cue;
- a diagram that a screen reader announces by its current caption.

## What changes from the design

Read this before the code. The prototype behind every number here ran on a throwaway worktree off `main` at 6df5a16.

- **The player is not sticky.** The design asked for prose on the left and a sticky player on the right at 1024 px and up. The numbers rule it out. At the 1280 px test viewport the lesson column is 760 px wide (measured, `scene` box width). The diagram needs at least 448 px, because `MIN_CELL` is 64 (`src/scene/layout.ts:9`) and the load-balancer grid is 7 columns wide. That leaves 280 px for prose, which is too narrow to read. So the player stays full width above the prose. The right rail holds the contents list instead, and the prose column is 552 px (measured).
- **On a phone the diagram scrolls sideways inside its own box.** At 390 px the box is 310 px wide and the stage is 448 px. The page itself does not scroll sideways (measured `scrollWidth` 390). This was already true on `main`. Shrinking cells below 64 px would overlap the node labels. What is new is that the scrolling box becomes a focusable region, because axe flags a scrollable box a keyboard cannot reach (`scrollable-region-focusable`, serious).
- **The visible "Prev" label becomes "Previous".** axe flags `label-content-name-mismatch` (serious) on that button, because its accessible name "Previous step" does not contain its text "Prev". The other four buttons already pass. The aria-labels stay, because `e2e/quiz.spec.ts:48` looks up a page-level button named exactly `Next` and must not hit the player.
- **Focus rings already exist.** Looseleaf buttons and the slider thumb draw an ink `<g data-layer="focus">` layer when focused from the keyboard. The prototype tabbed through all six player controls and each layer was visible. This step adds only the test.
- **The caption is already `aria-live="polite"`.** Its wrapper has it (`src/scene/ScenePlayer.tsx`, the `aria-live` div). Leave it.
- **Why `inline` does not fix the stray period.** Chrome lays out a `<button>` as an inline block even with `display: inline`. A line may break after an inline block, even before a period. The fix wraps the cue and the punctuation that follows it in a `whitespace-nowrap` span and sets `whitespace-normal` back on the button, so long cue text still wraps inside the button. The prototype checked all 6 cues in the lesson that are followed by punctuation, including the `stateless` cue inside a callout.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/components/ui`, `src/lib/ink`, `src/progress`, `src/search` or `vendor`. In `src/content`, change only `src/content/index.ts`, and only by the one line below.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.
- From `src/app`, import from `@/content` and `@/scene` only through those index paths. `src/boundaries.test.ts` fails otherwise.
- Select elements in Playwright by role, `data-testid` or `data-*` attributes. Never by CSS class.

## Add the package

Run this from the repo root:

```bash
pnpm add -D @axe-core/playwright
```

It changes `package.json` and `pnpm-lock.yaml` only. The prototype got version 4.14.0 and `pnpm build` still passed.

## Files

Change exactly these 8 files:

| File | Change |
| :--- | :--- |
| `package.json` | from the add command |
| `pnpm-lock.yaml` | from the add command |
| `src/content/index.ts` | export `blockText` |
| `src/app/ProseView.tsx` | keep trailing punctuation with its cue |
| `src/app/LessonPage.tsx` | breadcrumb, contents rail, grid |
| `src/app/Shell.tsx` | menu button and sheet below 768 px |
| `src/scene/ScenePlayer.tsx` | stage `role="img"`, focusable scroll box, "Previous" |
| `e2e/a11y.spec.ts` | new, 4 tests |

There are no new unit tests.

### `src/content/index.ts`

Add this line after the `export type { Prose, Block, Inline } from "./prose"` line. Change nothing else.

```ts
export { blockText } from "./prose"
```

### `src/app/ProseView.tsx`

Add `whitespace-normal` to the `Cue` button's class list, so it reads `cursor-pointer whitespace-normal text-left [font:inherit]`.

Add `renderInlines` and use it for every inline list in the file. That covers `strong`, `em` and `link` children, `h` blocks, `p` blocks, `callout` blocks and list items. After this change the file contains no `map(renderInline)`.

```tsx
const LEADING_PUNCT = /^[.,;:!?)]+/

function renderInlines(nodes: readonly Inline[]): ReactNode[] {
  const out: ReactNode[] = []
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node === undefined) continue
    const next = nodes[i + 1]
    if (node.t === "cue" && next !== undefined && next.t === "text") {
      const punct = LEADING_PUNCT.exec(next.v)?.[0]
      if (punct !== undefined) {
        out.push(<span key={i} className="whitespace-nowrap"><Cue step={node.step} text={node.text} />{punct}</span>)
        out.push(next.v.slice(punct.length))
        i++
        continue
      }
    }
    out.push(renderInline(node, i))
  }
  return out
}
```

Import `type ReactNode` from `react`. `renderInline` keeps its `switch`. Only its `strong`, `em` and `link` cases change, to `renderInlines(node.c)`.

### `src/app/LessonPage.tsx`

Import `blockText` from `@/content`. Import `Breadcrumb`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbList`, `BreadcrumbPage` and `BreadcrumbSeparator` from `@/components/ui/breadcrumb`.

The `lesson` div becomes a grid. Its children, in this DOM order:

1. The `header`, with `className="space-y-3 lg:col-span-2"`. Above the `H1` it renders the breadcrumb. Below the `H1` the line reads `{lesson.minutes} min read`, because the breadcrumb now names the track.

   ```tsx
   <Breadcrumb data-testid="breadcrumb">
     <BreadcrumbList>
       <BreadcrumbItem><BreadcrumbLink href={href({ name: "home" })}>Home</BreadcrumbLink></BreadcrumbItem>
       <BreadcrumbSeparator />
       <BreadcrumbItem>{track?.title}</BreadcrumbItem>
       <BreadcrumbSeparator />
       <BreadcrumbItem><BreadcrumbPage>{lesson.title}</BreadcrumbPage></BreadcrumbItem>
     </BreadcrumbList>
   </Breadcrumb>
   ```

2. `<div className="lg:col-span-2"><ScenePlayer /></div>`.
3. The contents rail. It comes before the prose in the DOM so Tab reaches it first. The grid puts it on the right.

   ```tsx
   <nav data-testid="toc" aria-label="On this page" className="hidden self-start lg:sticky lg:top-6 lg:col-start-2 lg:row-start-3 lg:block">
     <p className="font-hand text-base text-pencil-text">On this page</p>
     <ul className="space-y-1 font-hand">
       {lesson.headings.map((heading) => (
         <li key={heading.id} className={heading.level === 3 ? "ps-4" : undefined}>
           <a data-toc={heading.id} href={href({ name: "lesson", slug: lesson.slug, section: heading.id })}>{blockText(heading)}</a>
         </li>
       ))}
     </ul>
   </nav>
   ```

4. The existing `min-w-0 space-y-8` div with the prose, quiz, attribution, further reading and lesson navigation. Add `lg:col-start-1 lg:row-start-3` to its classes.

The `lesson` div's class is `grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_11rem]`. Keep `data-testid="lesson"` and `data-slug`. The scroll effect stays as it is. A contents link changes the hash to the section route, and that effect scrolls the heading into view.

### `src/app/Shell.tsx`

Move the sidebar's `<Sidebar collapsible="none" className="w-full">...</Sidebar>` tree, unchanged, into a new component in the same file:

```tsx
function LessonNav({ onNavigate }: { onNavigate?: () => void }) {
  const route = useRoute()
  const { status } = useProgress()
  return (/* the Sidebar tree, with onClick={onNavigate} on each lesson <a> */)
}
```

The `aside data-testid="sidebar"` keeps `hidden md:block` and renders `<LessonNav />`.

`Shell` keeps `const [open, setOpen] = useState(false)` and no longer reads the route or progress itself. The header keeps `justify-between`. Its left side is a `div className="flex items-center gap-2"` holding the menu sheet and then the home link. Its right side is `<SearchPalette />`.

```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger asChild>
    <Button variant="outline" size="icon-sm" data-testid="menu-open" aria-label="Open lessons" className="md:hidden">
      <Icon name="menu" size={18} />
    </Button>
  </SheetTrigger>
  <SheetContent side="left" data-testid="sidebar-sheet">
    <SheetHeader><SheetTitle>Lessons</SheetTitle></SheetHeader>
    <LessonNav onNavigate={() => setOpen(false)} />
  </SheetContent>
</Sheet>
```

Close the sheet from the link's `onClick`, not from a route effect. Picking the lesson you are already on does not change the route. The prototype's route-effect version left the sheet open in that case.

### `src/scene/ScenePlayer.tsx`

- After `const paused = ...`, add `const scrolls = layout !== null && box !== null && layout.width > box.w`.
- The scrolling box (the `div ref={ref}`) gets `tabIndex={scrolls ? 0 : undefined}`, `role={scrolls ? "region" : undefined}` and `aria-label={scrolls ? "Diagram, scrolls sideways" : undefined}`. At 1280 px it does not scroll, so it adds no Tab stop there.
- The `stage` div gets `role="img"` and `aria-label={frame.caption}`.
- The Previous button's text becomes `Previous`. Its `aria-label` stays `Previous step`.

Change nothing else in the file.

### `e2e/a11y.spec.ts` (new)

Use `test`, `expect` and `gotoReady` from `./fixtures`. Import `AxeBuilder` from `@axe-core/playwright`. The lesson is `/#/learn/load-balancer`. The default viewport is 1280 by 720.

1. `axe finds no serious violations on home and lesson`. For each size in `[1280, 720]` and `[390, 844]`, and each path in `/#/` and `/#/learn/load-balancer`, set the viewport, call `gotoReady`, and run `new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()`. Collect `${size} ${path} ${id}` for every violation whose `impact` is `serious` or `critical`. After all four scans, that list equals `[]`.
2. `at 390x844 the sidebar opens from a menu button and the stage fits without horizontal page scroll`. Set the viewport to 390 by 844 and open the lesson.
   - `sidebar` and `toc` are hidden.
   - `document.documentElement.scrollWidth` is at most `clientWidth`.
   - The `scene` box has `x >= 0` and `x + width <= 390`.
   - `page.getByRole("region", { name: "Diagram, scrolls sideways" })` is visible.
   - Run this check in `page.evaluate`. For every `[data-cue]` element whose `nextSibling` is a text node starting with one of `.,;:!?)`, make a `Range` over that first character. Its `getBoundingClientRect()` must have `top >= last.top - 1` and `bottom <= last.bottom + 1`, where `last` is the cue's last `getClientRects()` entry. Return the steps that fail and the number checked. Expect no failures and at least 6 checked.
   - Click `menu-open`. `sidebar-sheet` is visible. Click its link named `Load balancer`. `sidebar-sheet` is hidden and the URL ends with `#/learn/load-balancer`.
3. `TOC link scrolls to the section`. Open the lesson at the default size.
   - In `breadcrumb`, the link `Home` has `href="#/"`. The text `Edge and traffic` is present. The element with `aria-current="page"` has the text `Load balancer`.
   - `toc` is visible. Its links' texts are exactly `["What it does", "How it picks a server", "Horizontal scaling"]`.
   - Click the `How it picks a server` link. The URL ends with `#/learn/load-balancer/how-it-picks-a-server`. `page.locator("#how-it-picks-a-server")` is in the viewport. `window.scrollY` is greater than 0. The `toc` box has `y >= 0` and `y < 720`, which only holds if it is sticky.
4. `every player control reachable by Tab with a visible focus ring`. Open `/#/learn/load-balancer/step/pick`, so First and Previous are enabled.
   - `page.getByRole("region", { name: "Diagram, scrolls sideways" })` has count 0.
   - Before any Tab, the `First step` button's `[data-layer="focus"]` is not visible. It either has count 0 or its computed `visibility` is not `visible`.
   - Focus `scene` with `locator.focus()`. Then press `Tab` once for each control, in this order: button `First step`, button `Previous step`, button `Play`, button `Next step`, button `Last step`, slider `Scrub through the diagram`. After each press that control is focused, `el.matches(":focus-visible")` is true, and its `[data-layer="focus"]` has computed `visibility` `visible` and `opacity` `1`.
   - Read the text of `caption`. `page.getByRole("img", { name: <that text>, exact: true })` is visible. Click `Next step`. `caption` now has different text, and the img with the new text as its name is visible.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run still shows 68 tests passing. The existing Vite warning about a chunk over 500 kB is expected.
3. `pnpm test` shows 186 tests passing in 14 files, the same as before.
4. `pnpm e2e` shows 45 tests passing. That is the 41 from before plus these 4. Run it 3 times in a row. All 3 runs must pass.

## Done means

- All four commands pass.
- `git status` shows only the 8 files in the Files table.
- Each of these planted bugs makes the named test fail. Check each one, then put the code back:
  - changing the button text `Previous` back to `Prev` fails e2e test 1;
  - removing `tabIndex` from the scrolling box fails e2e test 1;
  - giving the scrolling box `tabIndex={0}` always fails e2e test 4;
  - removing `role="img"` from `stage` fails e2e test 4;
  - setting the stage `aria-label` to the fixed string `Diagram` fails e2e test 4;
  - adding `tabIndex={-1}` to the Previous button fails e2e test 4;
  - changing the sidebar `aside` class from `hidden md:block` to `block` fails e2e test 2;
  - dropping `onNavigate` from the sheet's `LessonNav` fails e2e test 2;
  - rendering `callout` blocks with `block.c.map(renderInline)` fails e2e test 2;
  - removing `whitespace-normal` from the `Cue` button fails e2e test 2;
  - building the contents link with `href({ name: "lesson", slug: lesson.slug })` fails e2e test 3;
  - removing `lg:sticky` from `toc` fails e2e test 3;
  - replacing `<BreadcrumbPage>` with plain text fails e2e test 3.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4 (all three e2e runs). Paste the failing output of the thirteen planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
