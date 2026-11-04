# Step 21: "On this page" links react to hover

## Goal

The "On this page" list on a lesson looks like plain text. The only sign that an item is a link is the hand cursor. After this step, pointing at an item turns it blue (`--ll-link`, `#2c4f9e`) and underlines it, using the underline weight and offset of `LINK_CLASS`.

Keyboard focus needs no change. The global `:focus-visible` rule in `src/index.css` already draws a 2 px solid outline around a focused item. The new test checks it so a later change can't drop it.

At rest the items stay as they are: ink colored and not underlined. Step 17 left the list out because it is navigation, and a whole column of underlined links looks busy.

Out of scope: marking the section you are reading. That needs a scroll observer and can be a later step.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/components/ui`, `src/lib/ink` or `vendor`.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.

## Files

Change exactly these 3 files:

| File | Change |
| :--- | :--- |
| `src/app/link-class.ts` | add `TOC_LINK_CLASS` |
| `src/app/LessonPage.tsx` | the TOC anchor uses `TOC_LINK_CLASS` |
| `e2e/a11y.spec.ts` | 1 new test at the end |

### `src/app/link-class.ts`

Keep `LINK_CLASS` as it is. Add this line under it:

```ts
export const TOC_LINK_CLASS = "decoration-[1.5px] underline-offset-[0.28em] hover:text-link hover:underline"
```

### `src/app/LessonPage.tsx`

Change the import of `LINK_CLASS` to also import `TOC_LINK_CLASS`:

```tsx
import { LINK_CLASS, TOC_LINK_CLASS } from "@/app/link-class"
```

The TOC anchor becomes:

```tsx
                <a data-toc={heading.id} href={href({ name: "lesson", slug: lesson.slug, section: heading.id })} className={TOC_LINK_CLASS}>{blockText(heading)}</a>
```

Change nothing else in the file.

### `e2e/a11y.spec.ts`

Add this test at the end of the file. It imports nothing new.

```ts
test("TOC links turn blue on hover and show a focus outline", async ({ page }) => {
  await gotoReady(page, "/#/learn/load-balancer")
  const links = page.getByTestId("toc").locator("a")
  const first = links.nth(0)
  const second = links.nth(1)
  await expect(second).toHaveCSS("text-decoration-line", "none")
  await expect(second).not.toHaveCSS("color", "rgb(44, 79, 158)")
  await second.hover()
  await expect(second).toHaveCSS("color", "rgb(44, 79, 158)")
  await expect(second).toHaveCSS("text-decoration-line", "underline")
  await page.mouse.move(0, 0)
  await expect(second).toHaveCSS("text-decoration-line", "none")
  await first.focus()
  await page.keyboard.press("Tab")
  await expect(second).toBeFocused()
  await expect(second).toHaveCSS("outline-style", "solid")
  await expect(second).toHaveCSS("outline-width", "2px")
})
```

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content step still runs 75 tests.
3. `pnpm test` shows 193 tests passing in 14 files, the same as before.
4. `pnpm e2e` shows 55 tests passing. That is the 54 from before plus this 1. Run it 3 times in a row. All 3 runs must pass.

Write the test first and run it against the unchanged app with `pnpm e2e -g "TOC links turn blue"`. It must fail on the hover color check. Paste that output.

## Done means

- All four commands pass.
- `git status` shows only the 3 files in the Files table.
- Each of these planted bugs makes the new test fail. Check each one, then put the code back:
  - removing `className={TOC_LINK_CLASS}` from the TOC anchor;
  - removing `hover:underline` from `TOC_LINK_CLASS`;
  - changing `hover:text-link` to `hover:text-ink` in `TOC_LINK_CLASS`.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the failing output from before the fix, the output of commands 2, 3 and 4 (all three e2e runs), and the failing output of all three planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
