# Step 17: text links are blue and underlined

## Goal

A reader should be able to tell a link from plain text without hovering over it. After this step every text link is blue (`--ll-link`, `#2c4f9e`) with an underline, and turns a darker blue (`--ll-link-hover`, `#1f3b7a`) on hover. Today the attribution, further reading, lesson prev/next and prose links are plain ink with no underline.

Text links in scope:

- links inside lesson prose (`ProseView`)
- the two attribution links
- the further reading links
- the previous and next lesson links at the bottom of a lesson
- "Back to home" on the not-found page, which already has `text-link underline` and now uses the shared class

Out of scope, since they are navigation and already look clickable: the sidebar lesson list, the "On this page" contents list, the home page lesson cards and Continue card, the brand link in the header, and the breadcrumb.

The style copies Looseleaf's prose link rule (`src/components/ui/typography.tsx:171`), without its bold weight: 1.5 px underline at 0.28em offset, 2.5 px on hover.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/components/ui`, `src/lib/ink` or `vendor`.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.

## Files

Change exactly these 5 files:

| File | Change |
| :--- | :--- |
| `src/app/link-class.ts` | new, exports `LINK_CLASS` |
| `src/app/ProseView.tsx` | prose link uses `LINK_CLASS` |
| `src/app/LessonPage.tsx` | attribution, further reading and prev/next links use `LINK_CLASS`; `data-testid="lesson-nav"` on the lesson nav |
| `src/app/NotFoundPage.tsx` | link uses `LINK_CLASS`; `data-testid="not-found"` on the wrapper |
| `e2e/lesson-text.spec.ts` | 1 new test at the end |

### `src/app/link-class.ts`

```ts
export const LINK_CLASS = "text-link underline decoration-[1.5px] underline-offset-[0.28em] hover:text-link-hover hover:decoration-[2.5px]"
```

### `src/app/ProseView.tsx`

Import `LINK_CLASS` from `@/app/link-class`. In `renderInline`, the `link` case becomes:

```tsx
      return <a key={index} href={node.href} className={LINK_CLASS}>{node.c.map(renderInline)}</a>
```

### `src/app/LessonPage.tsx`

Import `LINK_CLASS` from `@/app/link-class`. Add `className={LINK_CLASS}` to these 5 anchors and change nothing else about them:

- `<a href={item.sourceUrl}>`
- `<a href={item.licenseUrl}>`
- `<a href={item.url}>` in further reading
- the `lessonNeighbors.prev` anchor
- the `lessonNeighbors.next` anchor

Add `data-testid="lesson-nav"` as the first attribute of `<nav aria-label="Lesson navigation" ...>`. Do not touch the TOC anchors, the breadcrumb or anything else.

### `src/app/NotFoundPage.tsx`

Import `LINK_CLASS` from `@/app/link-class` and `cn` from `@/lib/utils`. Then:

- the wrapper becomes `<div data-testid="not-found" className="space-y-4">`
- the link's `className` becomes `{cn("font-hand text-lg", LINK_CLASS)}`

### `e2e/lesson-text.spec.ts`

Add this test at the end of the file. It imports nothing new.

```ts
test("text links are blue and underlined", async ({ page }) => {
  const blue = "rgb(44, 79, 158)"
  const pages: [string, string][] = [
    ["/#/learn/load-balancer", '[data-testid="attribution"] a, [data-testid="further-reading"] a, [data-testid="lesson-nav"] a, [data-testid="prose"] a'],
    ["/#/nowhere", '[data-testid="not-found"] a'],
  ]
  for (const [path, selector] of pages) {
    await gotoReady(page, path)
    const links = page.locator(selector)
    expect(await links.count(), `${path} has text links`).toBeGreaterThanOrEqual(1)
    for (const link of await links.all()) {
      await expect(link).toHaveCSS("color", blue)
      await expect(link).toHaveCSS("text-decoration-line", "underline")
    }
  }
})
```

The load balancer lesson has no prose links and no neighbors today, so on that page the test checks the 2 attribution links and 2 further reading links. The prose and lesson-nav selectors are there for the lessons that come later.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run still shows 68 tests passing.
3. `pnpm test` shows 186 tests passing in 14 files, the same as before.
4. `pnpm e2e` shows 48 tests passing. That is the 47 from before plus this 1. Run it 3 times in a row. All 3 runs must pass.

Write the test first and run it against the unchanged app. It must fail on the color check. Paste that output.

## Done means

- All four commands pass.
- `git status` shows only the 5 files in the Files table.
- Each of these planted bugs makes the new test fail. Check each one, then put the code back:
  - removing `className={LINK_CLASS}` from the further reading anchor;
  - changing `text-link` to `text-ink` in `LINK_CLASS`;
  - removing `underline` from `LINK_CLASS`.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the failing output from before the fix, the output of commands 2, 3 and 4 (all three e2e runs), and the failing output of all three planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
