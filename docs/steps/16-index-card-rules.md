# Step 16: lesson card text sits on its ruled lines

## Goal

On the home page, each lesson card is a ruled index card. Today the ruled lines run through the middle of the words. After this step the title sits on the red line, each summary line sits on a blue line, and "2 min" sits on the bottom line.

## The cause

`IndexCard` draws a red rule 41 px from the top, then a blue rule every 30 px (`background-size: 100% 41px, 100% 30px`, measured on `[data-slot="paper-rules"]`). The card's text uses a 30 px line height to match. The title is meant to sit inside `IndexCardHeader`, a 49 px row that aligns to the bottom (`src/components/ui/index-card.tsx:46`). `src/app/HomePage.tsx:71` puts `IndexCardTitle` straight into the card with no header. The title then takes 26 px instead of 49 px, so every line below it starts about 23 px too high.

Measured at 1280 px, from the top of the rules. Each number is the bottom of a line box.

| Line | Today | With the header | Rule just above |
| :--- | ---: | ---: | ---: |
| title | 29.0 | 45.6 | 41 |
| summary line 1 | 54.4 | 77.0 | 71 |
| summary line 2 | 84.4 | 107.0 | 101 |
| summary line 3 | 114.4 | 137.0 | 131 |
| footer | 195.0 | 195.0 | 191 |

With the header, every line box ends 4 to 6 px below a rule. That gap is the space under the letters, so the letters sit on the rule. The prototype's 2x screenshot showed this for every line.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/components/ui`, `src/lib/ink` or `vendor`.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.

## Files

Change exactly these 2 files:

| File | Change |
| :--- | :--- |
| `src/app/HomePage.tsx` | wrap the card title in `IndexCardHeader` |
| `e2e/lesson-text.spec.ts` | 1 new test at the end |

### `src/app/HomePage.tsx`

Add `IndexCardHeader` to the existing `@/components/ui/index-card` import. Then replace the title line in the lesson card with this. Change nothing else.

```tsx
                  <IndexCardHeader>
                    <IndexCardTitle>{lesson.title}</IndexCardTitle>
                  </IndexCardHeader>
```

### `e2e/lesson-text.spec.ts`

Add this test at the end of the file. It imports nothing new.

```ts
test("every text line on a lesson card sits just above a ruled line", async ({ page }) => {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await gotoReady(page, "/#/")
    const card = page.getByTestId("lesson-card").first().locator('[data-slot="index-card"]')
    const gaps = await card.evaluate((el) => {
      const rules = el.querySelector('[data-slot="paper-rules"]')
      if (rules === null) return []
      const [header, pitch] = getComputedStyle(rules).backgroundSize.split(",").map((layer) => Number.parseFloat(layer.trim().split(" ")[1] ?? ""))
      if (header === undefined || pitch === undefined) return []
      const top = rules.getBoundingClientRect().top
      const found: number[] = []
      for (const slot of ["index-card-title", "index-card-content", "index-card-footer"]) {
        const node = el.querySelector(`[data-slot="${slot}"]`)
        if (node === null) continue
        const range = document.createRange()
        range.selectNodeContents(node)
        for (const rect of range.getClientRects()) {
          const bottom = rect.bottom - top
          const rule = bottom < header ? Number.NEGATIVE_INFINITY : header + Math.floor((bottom - header) / pitch) * pitch
          found.push(bottom - rule)
        }
      }
      return found
    })
    expect(gaps.length, `${width} px has text lines`).toBeGreaterThanOrEqual(5)
    for (const gap of gaps) {
      expect(gap, `${width} px line gap ${gap}`).toBeGreaterThanOrEqual(2)
      expect(gap, `${width} px line gap ${gap}`).toBeLessThanOrEqual(9)
    }
  }
})
```

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run still shows 68 tests passing.
3. `pnpm test` shows 186 tests passing in 14 files, the same as before.
4. `pnpm e2e` shows 47 tests passing. That is the 46 from before plus this 1. Run it 3 times in a row. All 3 runs must pass.

Write the test first and run it against the unchanged `HomePage.tsx`. It must fail. Paste that output.

## Done means

- All four commands pass.
- `git status` shows only the 2 files in the Files table.
- Each of these planted bugs makes the new test fail. Check each one, then put the code back:
  - removing the `IndexCardHeader` wrapper (the state on `main`);
  - adding `className="h-[30px]"` to the `IndexCardHeader`.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the failing output from before the fix, the output of commands 2, 3 and 4 (all three e2e runs), and the failing output of both planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
