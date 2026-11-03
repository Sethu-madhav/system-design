# Step 8: home, lesson page text, and sidebar

## Goal

A reader can see the curriculum and read the load-balancer lesson. This step adds:

- a home page with one section per track, holding one index card per lesson;
- a sidebar listing every track and lesson, with the current lesson marked;
- a lesson page with the lesson's header, text, attribution, further reading and prev/next links;
- a dashed placeholder where the diagram will go in step 9.

Cue phrases in the text render as highlights with a `data-cue` attribute. They do nothing yet.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/content`, `src/scene`, `src/lib/ink/react*`, `vendor`, `package.json` or `pnpm-lock.yaml`.
- Do not add any dependency beyond what the add command below brings.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.
- From `src/app`, import lesson data only from `@/content` and routing only from `@/app/routes`. Never import `@/content/<file>`. `src/boundaries.test.ts` fails on that.
- Select elements in Playwright by role, `data-testid` or `data-*` attributes. Never by CSS class.
- No new unit tests. The logic lives in modules that already have tests.

## Add the components

Run this from the repo root:

```bash
yes n | pnpm dlx shadcn@latest add @looseleaf/sidebar @looseleaf/breadcrumb @looseleaf/callout @looseleaf/highlight @looseleaf/index-card @looseleaf/typography -y
```

`yes n |` answers "no" when shadcn asks to overwrite a file that already exists, such as `input.tsx`. Without it the command stops and waits. Do not overwrite any existing file.

After it runs, `git diff` on tracked files must be empty. `git status` must show exactly these new files:

- `src/components/ui/` arrow, breadcrumb, callout, handwritten, highlight, icon, index-card, separator, sheet, sidebar, skeleton, tooltip, typography (each `.tsx`);
- `src/hooks/use-mark-ink.tsx`, `src/hooks/use-mobile.ts`, `src/hooks/use-paper-object.ts`;
- `src/lib/ink/art-draw.ts` and the folder `src/lib/ink/art/`;
- `src/lib/ink/recipes/` arrow, breadcrumb, highlight, index-card, separator, sheet, sidebar, skeleton (each `-ink.ts`);
- `src/lib/ink/typography-tiles.generated.ts`.

Do not edit the generated files. Commit them as they come.

## Files

You write or change exactly these 6 files:

| File | Change |
| :--- | :--- |
| `src/app/ProseView.tsx` | new |
| `src/app/LessonPage.tsx` | new |
| `src/app/HomePage.tsx` | rewrite |
| `src/app/Shell.tsx` | rewrite |
| `src/app/App.tsx` | the lesson route renders `LessonPage` |
| `e2e/lesson-text.spec.ts` | new, 7 tests |

Nothing else changes.

### `src/app/ProseView.tsx` (new)

Exports `ProseView({ prose }: { prose: Prose })`. The root element has `data-testid="prose"`.

It renders every `Block` and every `Inline` from `src/content/prose.ts`, using a `switch` on `t` with no `default` branch, so a new variant fails `tsc`:

| Node | Renders as |
| :--- | :--- |
| `h` level 2 | Looseleaf `H2` with `id={block.id}` |
| `h` level 3 | Looseleaf `H3` with `id={block.id}` |
| `p` | Looseleaf `P` |
| `ul`, `ol` | Looseleaf `List` (`ordered` for `ol`), one `li` per item |
| `callout` | Looseleaf `Blockquote` with `data-callout={block.kind}` |
| `code` block | `pre` with `data-lang={block.lang}` around `code` |
| `text` | the string |
| `strong`, `em` | `strong`, `em` |
| `code` inline | Looseleaf `InlineCode` |
| `link` | `a` with `href` |
| `cue` | Looseleaf `Highlight` with `data-cue={node.step}` and `seed={node.step}`, showing `node.text` |

Import `Prose`, `Block` and `Inline` from `@/content`.

### `src/app/LessonPage.tsx` (new)

Exports `LessonPage({ route }: { route: LessonRoute })`. `LessonRoute` comes from `@/app/routes`.

- Look up the lesson with `curriculum.bySlug.get(route.slug)`. If there is none, return `<NotFoundPage path={href(route).slice(1)} />`.
- The root element has `data-testid="lesson"` and `data-slug={lesson.slug}`.
- Header. Looseleaf `H1` with the title, then the track title and `{minutes} min`.
- Diagram slot. A `div` with `data-testid="diagram-slot"` and a dashed border. On screens 1024px and wider, the prose sits in the left column and the slot in a sticky right column. Below 1024px, the slot sits above the prose.
- `ProseView` with `lesson.body`.
- Attribution. A `section` with `data-testid="attribution"`. For each item in `lesson.attributions`, show `text` as a link to `sourceUrl`, `license` as a link to `licenseUrl`, and the `changed` text.
- Further reading. A `section` with `data-testid="further-reading"`, one link per `lesson.furtherReading` item, showing `title` and linking to `url`.
- Prev/next. A `nav` with `aria-label="Lesson navigation"`. Links come from `neighbors(curriculum, lesson.slug)` and point at `href({ name: "lesson", slug })`. Leave out a link when its neighbor is missing.
- Scroll. A `useEffect` keyed on `route.section` and the lesson calls `document.getElementById(route.section)?.scrollIntoView()` when `route.section` is set. An unknown section id does nothing.

### `src/app/HomePage.tsx` (rewrite)

- Keep the `h1` "Learn system design". The existing e2e test needs it.
- For each track in `curriculum.tracks`, a `section` with `data-testid="track"`, `data-track={track.id}`, and an `h2` with the track title.
- For each lesson in the track, an `a` with `href={href({ name: "lesson", slug })}`, `data-testid="lesson-card"` and `data-slug={lesson.slug}`. Inside it, a Looseleaf `IndexCard` with the title in `IndexCardTitle`, the summary in `IndexCardContent`, and `{minutes} min` in `IndexCardFooter`.

`curriculum.tracks` holds only tracks that have lessons, so today the home page shows one section, "Edge and traffic".

### `src/app/Shell.tsx` (rewrite)

- Wrap the page in `SidebarProvider`. Keep the header link "System design" and the `main` with `data-testid="page"` around `<Paper stock="paper" as="article">`.
- Keep `<aside data-testid="sidebar" aria-label="Lessons">`, hidden below the `md` breakpoint. Inside it, a Looseleaf `Sidebar` with `collapsible="none"`. Do not use the fixed or off-canvas modes in this step.
- For each track, a `SidebarGroup` with `SidebarGroupLabel` set to the track title, then a `SidebarMenu` with one `SidebarMenuItem` per lesson.
- Each lesson is `<SidebarMenuButton asChild isActive={...}><a href=...>{title}</a></SidebarMenuButton>`. `isActive` is true when `useRoute()` is a lesson route with that slug. With `asChild`, Looseleaf sets `aria-current="page"` on the link.

### `src/app/App.tsx`

The `lesson` case returns `<LessonPage route={route} />`. Remove the `href` import if nothing else uses it.

### `e2e/lesson-text.spec.ts` (new)

Import `test`, `expect` and `gotoReady` from `./fixtures`. The fixture fails any test that logs a console error. Write exactly these 7 tests with these names:

1. `home lists the Edge track with the Load balancer card`. On `/`, the `[data-testid="track"][data-track="edge"]` section has an h2 "Edge and traffic". Its `[data-testid="lesson-card"][data-slug="load-balancer"]` contains "Load balancer" and "2 min".
2. `clicking the card opens #/learn/load-balancer`. Click that card. The URL ends with `#/learn/load-balancer` and an h1 "Load balancer" is visible.
3. `lesson shows h2 'What it does' and 8 cues`. On `/#/learn/load-balancer`, the h2 "What it does" has `id="what-it-does"`, and `[data-testid="prose"] [data-cue]` has count 8.
4. `attribution links to the primer anchor and to the CC BY 4.0 license and says text was changed`. Inside `data-testid="attribution"` there is a visible link to `https://github.com/donnemartin/system-design-primer#load-balancer`, a visible link to `https://creativecommons.org/licenses/by/4.0/`, and the text `Text paraphrased and shortened. Diagrams are original.`
5. `deep link #/learn/load-balancer/horizontal-scaling scrolls the heading into view`. Set the viewport to 1280 by 500 before loading. Then `#horizontal-scaling` is in the viewport and the h1 "Load balancer" is not.
6. `#/learn/no-such-lesson shows not found`. The h1 "Page not found" and the text `/learn/no-such-lesson` are visible.
7. `sidebar link marks current lesson with aria-current`. On `/`, the "Load balancer" link inside `data-testid="sidebar"` has no `aria-current`. After clicking it, it has `aria-current="page"`.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run shows 62 tests passing.
3. `pnpm test` shows 141 tests passing in 11 files. The count does not change in this step.
4. `pnpm e2e` shows 11 tests passing: the 4 that exist today plus these 7.

## Done means

- All four commands pass.
- `git status` shows only the generated files listed above and the 6 files in the Files table.
- Removing the `scrollIntoView` call makes test 5 fail. Removing `isActive` makes test 7 fail. Check both and put the code back.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Paste the failing output of the two checks in "Done means". Say whether you hit anything the spec did not cover, and what you did about it.
