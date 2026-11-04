# Step 21. Fix the sidebar title wrap

## Why

The sidebar is the reader's map of the course. A lesson title that wraps to two lines spills past its row. On the live site, "design is" from "What system design is" sits on the line under its row, and "Latency and throughput" crowds it from below. Each new long title will do the same.

The cause is one fixed height. `SidebarMenuButton` gives every row `h-8`, which is 32 px. A two-line title needs about 40 px of text plus the row's padding, so the text overflows the row and its rule.

This step lets a row grow to fit its title and adds a test that fails when a wrapped title overflows. Rows with one line keep their 32 px height.

## Branch and coder rules

- Branch `step/21-sidebar-title-wrap` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Touch only the 2 files in Appendix A. Do not edit, open or read any other file. That includes `src/components/ui`, `src/lib/ink`, `vendor`, `node_modules` and `dist`.
- Do not explore the repo. Every command you need is below.
- No comments in code. No `any`, no `as` casts, no non-null `!`.
- Do not change the patch. If it does not apply, or a command fails twice, stop and report the exact error.
- Do not commit, push or open a PR. Opus does that after verifying.

## What changes

### 1. `src/app/Shell.tsx`

The sidebar's `SidebarMenuButton` gets `className="h-auto min-h-8"`. The `cn` helper merges classes with `tailwind-merge`, so `h-auto` replaces the button's `h-8`. `min-h-8` keeps a one-line row at 32 px. The app never sets `data-density`, so the button's `compact:` and `calm:` heights never apply and need no override.

### 2. `e2e/sidebar-wrap.spec.ts`

This is a new test. At 1280 px wide, it measures each sidebar row's title text with a DOM `Range`. It checks that at least one title wraps to more than one line, and that no title's bottom edge is below its row's bottom edge.

It measures the text, not `scrollHeight`. Each row's rule is an `::after` line placed 2 px below the row, so `scrollHeight` is always 2 px more than the row's height, even when nothing overflows.

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/21-sidebar-title-wrap.md > /tmp/step21.diff && git apply /tmp/step21.diff && git status --short`
   The status must list exactly `M src/app/Shell.tsx` and `?? e2e/sidebar-wrap.spec.ts`.
2. Install. `pnpm install > /tmp/install21.log 2>&1; tail -3 /tmp/install21.log`
3. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 75 tests.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 193 tests in 14 files.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used" /tmp/e.log`. 55 tests.

Other sessions on this machine sometimes use ports 4173 and 4174. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED`, that run does not count. Run it again. Report every run.

## Report

End with this report and nothing else.

```
files: <output of git status --short>
build: <count> <count> <count>
test: <count> <count> <count>
e2e: <count> <count> <count>
failures: <each failing test name and its first Error line, or none>
```

## Checks Opus ran on the prototype

- Without the `className`, the new test fails. The "What system design is" text ends at 160 px and its row at 152 px.
- With it, build passed 75, unit 193 in 14 files, and e2e 55, 3 runs each with no assertion failures. Two other runs died from port conflicts with `ERR_CONNECTION_REFUSED`.
- The active highlight covers both lines of a two-line row. One-line rows keep their height. The mobile sheet, where titles fit on one line, looks the same as before.

## What you see

In the sidebar, "What system design is" and "Latency and throughput" each sit on two lines inside their own rows, with the rule below the text. "Load balancer" stays one line high.

## Appendix A. The patch

````diff
diff --git a/e2e/sidebar-wrap.spec.ts b/e2e/sidebar-wrap.spec.ts
new file mode 100644
index 0000000..370daa2
--- /dev/null
+++ b/e2e/sidebar-wrap.spec.ts
@@ -0,0 +1,18 @@
+import { expect, test, gotoReady } from "./fixtures"
+
+test("a sidebar title that wraps to two lines stays above its row's rule", async ({ page }) => {
+  await page.setViewportSize({ width: 1280, height: 900 })
+  await gotoReady(page, "/#/learn/latency-and-throughput")
+  const rows = page.getByTestId("sidebar").locator('[data-sidebar="menu-button"]')
+  await expect(rows.first()).toBeVisible()
+  const boxes = await rows.evaluateAll((els) =>
+    els.map((el) => {
+      const range = document.createRange()
+      range.selectNodeContents(el.firstChild ?? el)
+      const lines = range.getClientRects().length
+      return { lines, text: range.getBoundingClientRect().bottom, row: el.getBoundingClientRect().bottom }
+    }),
+  )
+  expect(boxes.some((box) => box.lines > 1)).toBe(true)
+  for (const box of boxes) expect(box.text).toBeLessThanOrEqual(box.row)
+})
diff --git a/src/app/Shell.tsx b/src/app/Shell.tsx
index 082b718..d4f1b4e 100644
--- a/src/app/Shell.tsx
+++ b/src/app/Shell.tsx
@@ -40,7 +40,7 @@ function LessonNav({ onNavigate }: { onNavigate?: () => void }) {
                 const mark = STATUS_MARK[lessonStatus]
                 return (
                   <SidebarMenuItem key={lesson.slug}>
-                    <SidebarMenuButton asChild isActive={route.name === "lesson" && route.slug === lesson.slug}>
+                    <SidebarMenuButton asChild className="h-auto min-h-8" isActive={route.name === "lesson" && route.slug === lesson.slug}>
                       <a href={href({ name: "lesson", slug: lesson.slug })} onClick={onNavigate}>
                         {lesson.title}
                         <span data-testid="lesson-status" data-slug={lesson.slug} data-status={lessonStatus} className="ms-auto">
````
