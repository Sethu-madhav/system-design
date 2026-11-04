# Step 23. Number and style the sidebar chapter headings

## Why

In the sidebar, a chapter heading such as "Foundations" is 14 px muted grey text, and the lesson titles under it are 16 px dark ink. The heading is the smaller and fainter of the two, so it reads like a caption, and a reader can't see where one chapter ends and the next begins. Chapters also have no numbers, so the sidebar doesn't show the course order.

This step numbers each chapter and makes its heading bigger and blue, on a light blue band with a blue rule under it. It also adds a test that fails if the numbers go missing or the heading drops to the size of a lesson title.

## Branch and coder rules

- Branch `step/23-sidebar-chapter-headings` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Touch only the 2 files in Appendix A. Do not edit, open or read any other file. That includes `src/components/ui`, `src/lib/ink`, `vendor`, `node_modules` and `dist`.
- Do not explore the repo. Every command you need is below.
- No comments in code. No `any`, no `as` casts, no non-null `!`.
- Do not change the patch. If it does not apply, or a command fails twice, stop and report the exact error.
- Do not commit, push or open a PR. Opus does that after verifying.

## What changes

### 1. `src/app/Shell.tsx`

`LessonNav` passes each track's index to its `SidebarGroupLabel` and writes the number before the title, as in "1. Foundations". The number counts the tracks that have lessons, so the sidebar reads 1, 2, 3 with no gaps while some chapters are still empty.

The label gets these classes. `cn` merges them with `tailwind-merge`, so each one replaces the label's default for the same property.

- `h-auto py-1.5` replaces the fixed `h-8`, so a heading that wraps stays inside its band.
- `font-script text-xl font-bold tracking-normal` sets the heading in the script face that the site title uses, 20 px and bold, larger than the 16 px lesson titles.
- `text-ink-you` makes it the course's blue ink instead of `text-ink-muted`.
- `bg-ink-you/10 border-b-2 border-ink-you/40` draws the light blue band and the rule under it.
- `gap-2` puts space between the number and the title.

### 2. `e2e/sidebar-chapters.spec.ts`

This is a new test. At 1280 px wide, it checks that the sidebar's chapter headings read "1. Foundations" and "2. Edge and traffic", and that the first heading's computed font size is larger than the first lesson row's.

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/23-sidebar-chapter-headings.md > /tmp/step23.diff && git apply /tmp/step23.diff && git status --short`
   The status must list exactly `M src/app/Shell.tsx` and `?? e2e/sidebar-chapters.spec.ts`.
2. Install. `pnpm install > /tmp/install23.log 2>&1; tail -3 /tmp/install23.log`
3. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 75 tests.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 193 tests in 14 files.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used" /tmp/e.log`. 57 tests. Main has 56, and this step adds 1.

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

- Without the `Shell.tsx` change, the new test fails on `toHaveText`, because the headings have no numbers.
- With it, build passed 75, unit 193 in 14 files and e2e 57. The axe test in `e2e/a11y.spec.ts` finds no contrast problems with the blue heading on its band.
- On the 390 px mobile sheet, both headings fit on one line, and the lesson rows under them look the same as before.

## What you see

The sidebar shows "1. Foundations" and "2. Edge and traffic" in 20 px bold blue script, each on a light blue band with a blue rule under it. The lesson titles under each heading are unchanged.

## Appendix A. The patch

````diff
diff --git a/src/app/Shell.tsx b/src/app/Shell.tsx
index d4f1b4e..2495bfc 100644
--- a/src/app/Shell.tsx
+++ b/src/app/Shell.tsx
@@ -31,9 +31,12 @@ function LessonNav({ onNavigate }: { onNavigate?: () => void }) {
   return (
     <Sidebar collapsible="none" className="w-full">
       <SidebarContent>
-        {curriculum.tracks.map((track) => (
+        {curriculum.tracks.map((track, index) => (
           <SidebarGroup key={track.id}>
-            <SidebarGroupLabel>{track.title}</SidebarGroupLabel>
+            <SidebarGroupLabel className="h-auto gap-2 border-b-2 border-ink-you/40 bg-ink-you/10 py-1.5 font-script text-xl font-bold tracking-normal text-ink-you">
+              <span className="tabular-nums">{index + 1}.</span>
+              {track.title}
+            </SidebarGroupLabel>
             <SidebarMenu>
               {track.lessons.map((lesson) => {
                 const lessonStatus = status(lesson.slug)
diff --git a/e2e/sidebar-chapters.spec.ts b/e2e/sidebar-chapters.spec.ts
new file mode 100644
index 0000000..b1f4dfd
--- /dev/null
+++ b/e2e/sidebar-chapters.spec.ts
@@ -0,0 +1,12 @@
+import { expect, test, gotoReady } from "./fixtures"
+
+test("sidebar chapter headings are numbered and larger than the lesson titles under them", async ({ page }) => {
+  await page.setViewportSize({ width: 1280, height: 900 })
+  await gotoReady(page, "/#/learn/latency-and-throughput")
+  const sidebar = page.getByTestId("sidebar")
+  const labels = sidebar.locator('[data-sidebar="group-label"]')
+  await expect(labels).toHaveText([/^1\.\s*Foundations$/, /^2\.\s*Edge and traffic$/])
+  const size = (selector: string) =>
+    sidebar.locator(selector).first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
+  expect(await size('[data-sidebar="group-label"]')).toBeGreaterThan(await size('[data-sidebar="menu-button"]'))
+})
````
