# Step 33. Still figures, starting with lesson 1.1

## Why

Each lesson has one animated diagram at the top. A long lesson moves through several ideas, and readers lose the picture by the third section. This step lets a lesson put one still figure in each section, drawn by the same ink engine as the top diagram. The top diagram stays the only interactive one. Its cues and the quiz's "show me" still play it.

Lesson 1.1, "What system design is", gets 10 figures, one per section. The figure in "Stack Overflow in 2016" shows the whole 2016 setup. Opus checked its counts against Nick Craver's post, which is already in the lesson's sources. The post lists 4 HAProxy load balancers, 9 primary IIS web servers, 4 SQL Servers in 2 clusters, 2 Redis servers, 3 Elasticsearch servers and 3 tag engine servers. It says "All servers and services are doubly redundant via another data center (Colorado)", and "we're down to needing only 1 web server". The other lessons get their figures in later steps.

## Branch and coder rules

- Branch `step/33-lesson-figures` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 17 files below may change, and only by the commands in "How to do it". Do not edit any file by hand.
- Do not change the code, the lesson text, the captions or the tests. Opus wrote, unslopped and tested them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error.
- Do not commit, push or open a pull request. Opus does that after verifying.
- Do not kill processes.

## What changes

### 1. The figure, in the content and scene modules

- `src/content/prose.ts` adds `figure(nodes, caption, draw)`. It builds a one-step scene from the nodes and the actions that `draw` returns, compiles it, and returns a token. The node and action types are the same as in `defineScene`, so a send to an unknown node fails the type check, and two nodes in one cell throw.
- `md` accepts figure tokens next to cue tokens. A figure must stand on its own line. It becomes a `{ t: "figure", caption, timeline }` block. A figure inside a line, a heading, a code span, a code fence or a link url throws, and so does a figure with an empty caption, since the caption is its only text for screen readers.
- `blockText` returns a figure's caption, so captions count toward reading time and search finds them. Lesson 1.1 goes from 12 to 14 minutes.
- `src/content/author.ts` exports `figure`. `src/scene/index.ts` exports `SceneFigure` and the `Action` and `StepKit` types.
- `src/scene/timeline.ts` adds `stillFrame(timeline)`. It returns the first step's frame with every labeled send as a resting label on its edge. Two labels on one edge sit at a third and two thirds of its length. A send with an empty label draws its arrow and no label. No edge is marked active.
- `src/scene/layout.ts` adds `FIGURE_MAX_CELL = 96` and lets `layoutScene` take a maximum cell size. Figures use 96 px cells at most, so they stay smaller than the top diagram's 128.
- `src/scene/ScenePlayer.tsx` moves the drawing into a shared `Stage` component. `ScenePlayer` renders it as before. `SceneFigure` renders it inside `<figure data-testid="figure">` with the caption in a `<figcaption>`. A figure has no buttons and no cues. It gets a tab stop only when it is wider than the screen, so a keyboard can scroll it, the same as the top diagram. Its drawing is `aria-hidden`, and the caption carries its meaning.
- A figure keeps 32 px of space on each side and 44 px below its drawing. Without that, a label wider than its cell in the first or last column was cut off at 390 px, and a 3-line label in the bottom row was cut off below.
- Node labels get the paper background that notes already have, in figures and in the top diagram. An arrow that leaves a box downward then passes behind the label instead of through its letters.
- `src/app/ProseView.tsx` renders a figure block with `SceneFigure`. `src/search/search.ts` indexes its caption.

### 2. Lesson 1.1's figures

`src/content/lessons/what-system-design-is/lesson.ts` defines 10 figures above the scene and places one in each section. The top scene, the text, the cues and the quiz are unchanged.

1. "A one-line idea is not a design". The school's single server next to a fleet with load balancers and databases on 3 continents.
2. "The smallest real system". The phone, the app server and the database.
3. "What the product does". Four phones labeled "Post", "Follow", "Feed" and "Comment", and a crossed-out box for messages, search and video, noted "not now". One-word labels keep the stacked phones from running into each other at 390 px.
4. "How well it must do it". The three boxes noted "10 million a day", "under 0.5 s" and "keeps every photo".
5. "Ask before you draw". The three boxes noted "who uses it?", "busiest hour?" and "tools? later".
6. "A method in six steps". "2,300/s" on the way in, and the database noted "runs out first".
7. "When one part fails". The database crossed out and noted "stopped", and a standby copy that answers instead. The server sits in the middle row so its arrows leave from its sides, clear of its label.
8. "No design is best in general". A photo app that reads from a cache noted "seconds old is fine", and a bank app that reads from a primary database noted "always the latest".
9. "Stack Overflow in 2016". Visitors, 4 HAProxy load balancers, 9 web servers noted "1 could carry it", and 4 SQL Servers on the top row. Elasticsearch, Redis, the tag engine and the Colorado copy sit on the row below.
10. "In a design review". The app server writes new photos to the database and reads the feed from a cache noted "a few seconds old". The phone's arrow has no label, because it carries both reads and writes.

### 3. Docs

`docs/plan.md` said "A lesson has exactly one diagram". It now says a lesson has one animated diagram at the top, and each section can also hold one still figure.

### 4. Tests

- `src/content/prose.test.ts`. A figure between two paragraphs becomes a figure block, with its caption, its edge, its word count and no cue. A figure inside a line, a heading, a code fence, a code span, a fence's opening line or a link url throws. A figure with an empty caption throws, and so does one with two nodes in one cell.
- `src/scene/timeline.test.ts`. `stillFrame` places two labels on one edge, skips the unlabeled send, marks no edge active, and keeps the note and the down state.
- `src/content/content.test.ts`. Every lesson's figures pass `lintLayout`, the same check as the top scene.
- `src/content/curriculum.test.ts`. Lesson 1.1 is now 14 minutes.
- `e2e/scene-static.spec.ts`. Lesson 1.1 shows 10 figures with no buttons, tab stops or cues. The Stack Overflow figure has 8 boxes, 7 labels and the note "1 could carry it". The standby figure crosses out the database. The top diagram still reads "Step 1 of 8".
- `e2e/a11y.spec.ts`. The axe check also runs on lesson 1.1, in both themes, at 1280 by 720 and at 390 by 844.

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' SPEC > /tmp/step33.diff && git apply /tmp/step33.diff && git status --short`
   Replace `SPEC` with the spec's absolute path from your brief. It must apply cleanly. If it does not, stop and report the error. The status must list exactly these 16 lines, in any order.
   `M docs/plan.md`, `M e2e/a11y.spec.ts`, `M e2e/scene-static.spec.ts`, `M src/app/ProseView.tsx`, `M src/content/author.ts`, `M src/content/content.test.ts`, `M src/content/curriculum.test.ts`, `M src/content/lessons/what-system-design-is/lesson.ts`, `M src/content/prose.test.ts`, `M src/content/prose.ts`, `M src/scene/ScenePlayer.tsx`, `M src/scene/index.ts`, `M src/scene/layout.ts`, `M src/scene/timeline.test.ts`, `M src/scene/timeline.ts` and `M src/search/search.ts`.
2. Copy this spec into the worktree as `docs/steps/33-lesson-figures.md`. `cp SPEC docs/steps/33-lesson-figures.md`. That is the 17th file.
3. Install. `pnpm install > /tmp/install33.log 2>&1; tail -3 /tmp/install33.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b33.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b33.log`. The content step runs 99 tests.
- `pnpm test > /tmp/t33.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t33.log`. 257 tests in 16 files.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e33.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e33.log`. 73 tests.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run, including the ones that do not count. If the ports are still busy after 10 minutes, stop waiting and report it.

The test "Play sets data-mode=playing and a packet moves" in `e2e/scene-play.spec.ts` can fail with "packet has no box" when the machine is busy. If it is the only failure in a run, that run does not count. Run it again, as above.

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

- On main at e56e07a with the patch applied, build passed 99, unit passed 257 in 16 files, and e2e passed 73, axe included.
- A review of the first prototype found labels cut off at 390 px, arrowheads landing on labels, an arrow struck through two labels, a "2,300 a second" label that hid its arrow, and a "GET /feed" label on an arrow that also wrote photos. This patch fixes each one. After the fix, a script found no node label outside its figure's frame at 1280 px or at 390 px. Opus looked at all 10 figures at both widths and the Stack Overflow figure in the dark theme.
- The first Stack Overflow layout stacked 4 services in one column. At the prose width of about 550 px their labels overlapped, so the figure now uses two rows of 4. It also drew CloudFlare DNS, which the lesson text never mentions, so that box is gone.
- Two labels on one short edge, such as "GET /feed" and "200", overlapped. Each short edge in the figures now carries one label.
- At 1280 px and at 390 px, the page's `scrollWidth` equals the window width. At 390 px the wide figures scroll sideways inside their frame, the same as the top diagram.
- Opus checked every caption against the unslop skill. Two captions opened with a verbless fragment and were rewritten.

## What you see

Lesson 1.1 reads as before, with a still drawing in each section. Each has the same ink boxes as the top diagram and a short caption below it. The figures have no buttons and do not move. Clicking a highlighted phrase still plays the diagram at the top. In "Stack Overflow in 2016", the figure shows the path from visitors through 4 load balancers and 9 web servers to SQL Server. Elasticsearch, Redis, the tag engine and the Colorado copy sit on the row below.

## Appendix. The patch

````diff
diff --git a/docs/plan.md b/docs/plan.md
index f815f4f..27fc78b 100644
--- a/docs/plan.md
+++ b/docs/plan.md
@@ -53,7 +53,7 @@ Steps 3 to 7 change nothing in the browser. You check them by reading the test n
 
 Each lesson is one spec and one file, `src/content/lessons/<slug>/lesson.ts`, in the same shape as the load-balancer lesson. Opus writes the lesson text, scene and quiz in the spec. The coder adds the file and one Playwright line. Opus then checks that the text does not follow any source in `docs/sources.md`. Whoever writes lesson or curriculum text runs the unslop skill (`.agents/skills/unslop/SKILL.md`) on it before it goes into a spec or a file, and Opus checks the result against that skill during verification.
 
-Lessons follow `docs/curriculum.md`, which lists our own 12 chapters and 69 lessons in reading order. A lesson has exactly one diagram. A case study that needs several diagrams becomes several lessons, such as making a short link and following one in the URL shortener.
+Lessons follow `docs/curriculum.md`, which lists our own 12 chapters and 69 lessons in reading order. A lesson has exactly one animated diagram, at the top, and the cues in its text play it. A case study that needs several animated diagrams becomes several lessons, such as making a short link and following one in the URL shortener. Each section can also hold one still figure, written with `figure()` in the lesson file and placed on its own line in the text. A figure has no controls and no cues. The case study section's figure shows the whole system.
 
 ## Verification rules
 
diff --git a/e2e/a11y.spec.ts b/e2e/a11y.spec.ts
index 7854173..fcd7961 100644
--- a/e2e/a11y.spec.ts
+++ b/e2e/a11y.spec.ts
@@ -6,7 +6,7 @@ for (const theme of ["light", "dark"] as const) {
     await page.addInitScript((value) => localStorage.setItem("theme", value), theme)
     const violations: string[] = []
     for (const size of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
-      for (const path of ["/#/", "/#/learn/load-balancer"]) {
+      for (const path of ["/#/", "/#/learn/load-balancer", "/#/learn/what-system-design-is"]) {
         await page.setViewportSize(size)
         await gotoReady(page, path)
         await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`))
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index d4ff084..1980939 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -87,6 +87,22 @@ test("what-system-design-is shows 8 cues, 'dies' crosses out the database and 'b
   await expect(db.getByTestId("scene-note")).toHaveText("runs out first")
 })
 
+test("what-system-design-is shows 10 still figures that never play, and the Stack Overflow figure draws the 2016 setup", async ({ page }) => {
+  await gotoReady(page, "/#/learn/what-system-design-is")
+  const figures = page.locator('[data-testid="prose"] [data-testid="figure"]')
+  await expect(figures).toHaveCount(10)
+  await expect(figures.locator("button, [tabindex], [data-cue]")).toHaveCount(0)
+  await expect(figures.locator('[data-testid="stage"]')).toHaveCount(0)
+  const stack = figures.filter({ hasText: "Stack Overflow ran this setup in February 2016" })
+  await expect(stack.locator("[data-scene-node]")).toHaveCount(8)
+  await expect(stack.locator("[data-scene-packet]")).toHaveCount(7)
+  await expect(stack.locator('[data-scene-node="web"]').getByTestId("scene-note")).toHaveText("1 could carry it")
+  await expect(stack.locator('[data-scene-node="sql"] svg[data-ink]')).toBeAttached()
+  const standby = figures.filter({ hasText: "a standby copy takes over" })
+  await expect(standby.locator('[data-scene-node="db"]')).toHaveAttribute("data-down", "")
+  await expect(page.getByTestId("scene").getByText("Step 1 of 8")).toBeVisible()
+})
+
 test("nodes carry their kind and role, and the database is filled with its role color", async ({ page }) => {
   await gotoReady(page, "/#/learn/what-system-design-is")
   const scene = page.getByTestId("scene")
diff --git a/src/app/ProseView.tsx b/src/app/ProseView.tsx
index fea82b6..6d6ea34 100644
--- a/src/app/ProseView.tsx
+++ b/src/app/ProseView.tsx
@@ -1,7 +1,7 @@
 import { Blockquote, H2, H3, InlineCode, List, P } from "@/components/ui/typography"
 import { Highlight } from "@/components/ui/highlight"
 import { LINK_CLASS } from "@/app/link-class"
-import { useSceneCue } from "@/scene"
+import { SceneFigure, useSceneCue } from "@/scene"
 import type { Block, Inline, Prose } from "@/content"
 import type { KeyboardEvent, ReactNode } from "react"
 
@@ -55,6 +55,8 @@ function renderBlock(block: Block, index: number) {
       return <Blockquote key={index} data-callout={block.kind}>{block.c.map(renderInline)}</Blockquote>
     case "code":
       return <pre key={index} data-lang={block.lang}><code>{block.v}</code></pre>
+    case "figure":
+      return <SceneFigure key={index} timeline={block.timeline} />
   }
 }
 
diff --git a/src/content/author.ts b/src/content/author.ts
index e62a131..ebecac4 100644
--- a/src/content/author.ts
+++ b/src/content/author.ts
@@ -1,3 +1,3 @@
 export { defineLesson } from "./lesson"
-export { md } from "./prose"
+export { figure, md } from "./prose"
 export { defineScene } from "@/scene"
diff --git a/src/content/content.test.ts b/src/content/content.test.ts
index b220423..39d063f 100644
--- a/src/content/content.test.ts
+++ b/src/content/content.test.ts
@@ -18,6 +18,12 @@ describe.each(curriculum.flat.map((lesson) => [lesson.slug, lesson] as const))(
       expect(lintLayout(lesson.timeline)).toEqual([])
     })
 
+    test("figure layouts: no edge crosses a node, all nodes on the grid", () => {
+      for (const block of lesson.body.blocks) {
+        if (block.t === "figure") expect(lintLayout(block.timeline)).toEqual([])
+      }
+    })
+
     test("every scene step except the first is cued in the text", () => {
       for (const step of lesson.timeline.steps.slice(1)) {
         expect(lesson.body.cues).toContain(step.id)
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index c30d173..9c55063 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -158,7 +158,7 @@ test("the real curriculum holds the what-system-design-is lesson", () => {
 
   expect(lesson?.track).toBe("foundations")
   expect(lesson?.order).toBe(1)
-  expect(lesson?.minutes).toBe(12)
+  expect(lesson?.minutes).toBe(14)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
     "a-one-line-idea-is-not-a-design",
     "the-smallest-real-system",
diff --git a/src/content/lessons/what-system-design-is/lesson.ts b/src/content/lessons/what-system-design-is/lesson.ts
index c34d645..8d683fe 100644
--- a/src/content/lessons/what-system-design-is/lesson.ts
+++ b/src/content/lessons/what-system-design-is/lesson.ts
@@ -1,4 +1,145 @@
-import { defineLesson, defineScene, md } from "@/content/author"
+import { defineLesson, defineScene, figure, md } from "@/content/author"
+
+const twoSystems = figure({
+  students: { kind: "client", label: "500 students", at: [0, 0] },
+  box: { kind: "server", label: "One server", at: [2, 0] },
+  people: { kind: "internet", label: "10 million a day", at: [0, 2] },
+  lbs: { kind: "lb", label: "Load balancers", at: [2, 2] },
+  fleet: { kind: "server", label: "Web servers", at: [4, 2] },
+  dbs: { kind: "db", label: "Databases on 3 continents", at: [6, 2] },
+}, "The same one-line idea can lead to two systems. The school app runs on a single server, and the big app spreads 10 million daily users across a fleet of servers.", (s) => [
+  s.send("students", "box"),
+  s.send("people", "lbs"),
+  s.send("lbs", "fleet"),
+  s.send("fleet", "dbs"),
+])
+
+const threeBoxes = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  server: { kind: "server", label: "App server", at: [2, 0] },
+  db: { kind: "db", label: "Database", at: [4, 0] },
+}, "The smallest real system has a phone, one app server and one database.", (s) => [
+  s.send("phone", "server", "GET /feed"),
+  s.send("server", "db", "query", "data"),
+  s.send("db", "server"),
+  s.send("server", "phone"),
+])
+
+const fourActions = figure({
+  post: { kind: "mobile", label: "Post", at: [0, 0] },
+  follow: { kind: "mobile", label: "Follow", at: [0, 1] },
+  feed: { kind: "mobile", label: "Feed", at: [0, 2] },
+  comment: { kind: "mobile", label: "Comment", at: [0, 3] },
+  server: { kind: "server", label: "App server", at: [2, 2] },
+  db: { kind: "db", label: "Database", at: [4, 2] },
+  later: { kind: "service", label: "Messages, search, video", at: [4, 0] },
+}, "The first version has four user actions. Messages, search and video come in a later version.", (s) => [
+  s.send("post", "server"),
+  s.send("follow", "server"),
+  s.send("feed", "server"),
+  s.send("comment", "server"),
+  s.send("server", "db"),
+  s.down("later"),
+  s.note("later", "not now"),
+])
+
+const targets = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  server: { kind: "server", label: "App server", at: [2, 0] },
+  db: { kind: "db", label: "Database", at: [4, 0] },
+}, "Each box gets a number. The app has 10 million daily users, the feed loads in under half a second, and every photo stays as long as the account does.", (s) => [
+  s.send("phone", "server"),
+  s.send("server", "db"),
+  s.note("phone", "10 million a day"),
+  s.note("server", "under 0.5 s"),
+  s.note("db", "keeps every photo"),
+])
+
+const questions = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  server: { kind: "server", label: "App server", at: [2, 0] },
+  db: { kind: "db", label: "Database", at: [4, 0] },
+}, "Ask about the people and the traffic first. Which database to use can wait until you know the data.", (s) => [
+  s.send("phone", "server"),
+  s.send("server", "db"),
+  s.note("phone", "who uses it?"),
+  s.note("server", "busiest hour?"),
+  s.note("db", "tools? later"),
+])
+
+const roughNumbers = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  server: { kind: "server", label: "App server", at: [2, 0] },
+  db: { kind: "db", label: "Database", at: [4, 0] },
+}, "Trace the rough numbers through the first design. About 2,300 feed requests a second all end at the database, so it runs out of room first.", (s) => [
+  s.send("phone", "server", "2,300/s"),
+  s.send("server", "db", "query", "data"),
+  s.focus("db"),
+  s.note("db", "runs out first"),
+])
+
+const standby = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
+  server: { kind: "server", label: "App server", at: [2, 1] },
+  db: { kind: "db", label: "Database", at: [4, 0] },
+  spare: { kind: "db", label: "Standby copy", at: [4, 2] },
+}, "When the main database stops, a standby copy takes over, and the feed keeps working.", (s) => [
+  s.down("db"),
+  s.note("db", "stopped"),
+  s.send("phone", "server", "GET /feed"),
+  s.send("server", "spare", "query", "data"),
+  s.send("spare", "server"),
+  s.send("server", "phone"),
+])
+
+const twoProducts = figure({
+  phone: { kind: "mobile", label: "Photo app", at: [0, 0] },
+  feed: { kind: "server", label: "Feed server", at: [2, 0] },
+  cache: { kind: "cache", label: "Cache", at: [4, 0] },
+  bank: { kind: "client", label: "Bank app", at: [0, 2] },
+  payments: { kind: "server", label: "Payments server", at: [2, 2] },
+  primary: { kind: "db", label: "Primary database", at: [4, 2] },
+}, "The photo feed can read from a cache that is a few seconds old. A bank balance has to come from the primary database every time.", (s) => [
+  s.send("phone", "feed", "feed"),
+  s.send("feed", "cache", "read", "data"),
+  s.send("bank", "payments", "balance"),
+  s.send("payments", "primary", "read", "data"),
+  s.note("cache", "seconds old is fine"),
+  s.note("primary", "always the latest"),
+])
+
+const stackOverflow = figure({
+  visitors: { kind: "internet", label: "Visitors", at: [0, 0] },
+  lbs: { kind: "lb", label: "4 HAProxy", at: [2, 0] },
+  web: { kind: "server", label: "9 web servers", at: [4, 0] },
+  sql: { kind: "db", label: "4 SQL Servers", at: [6, 0] },
+  search: { kind: "nosql", label: "3 Elasticsearch", at: [0, 2] },
+  redis: { kind: "cache", label: "2 Redis", at: [2, 2] },
+  tags: { kind: "service", label: "3 tag engine", at: [4, 2] },
+  colorado: { kind: "db", label: "Colorado copy", at: [6, 2] },
+}, "Stack Overflow ran this setup in February 2016. Visitors reach 4 HAProxy load balancers, then 9 web servers that read from SQL Server, Redis, Elasticsearch and the tag engine. A second data center in Colorado keeps copies and can take over.", (s) => [
+  s.send("visitors", "lbs", "HTTPS"),
+  s.send("lbs", "web", "request"),
+  s.send("web", "sql", "query", "data"),
+  s.send("web", "redis", "cache", "data"),
+  s.send("web", "tags", "tags", "data"),
+  s.send("web", "search", "search", "data"),
+  s.send("sql", "colorado", "copy", "data"),
+  s.note("web", "1 could carry it"),
+])
+
+const tradeOff = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
+  server: { kind: "server", label: "App server", at: [2, 1] },
+  cache: { kind: "cache", label: "Cache", at: [4, 0] },
+  db: { kind: "db", label: "Database", at: [4, 2] },
+}, "In the photo app, a new photo may reach followers a few seconds late. In return, most feed reads can come from a cache.", (s) => [
+  s.send("phone", "server"),
+  s.send("server", "cache", "feed", "data"),
+  s.send("server", "db", "new photo", "data"),
+  s.note("cache", "a few seconds old"),
+])
+
 
 const scene = defineScene({
   phone: { kind: "mobile", label: "Phone", at: [0, 0] },
@@ -103,6 +244,8 @@ export default defineLesson({
     builds a fleet spread across data centers on three continents for 10
     million people every day. Both teams built what they were asked to build.
 
+    ${twoSystems}
+
     The gap between those two systems comes from everything that one sentence
     left unsaid. It never mentioned how many people will open the app, how
     fast a screen needs to load, or what should happen when a hard drive gives
@@ -125,6 +268,8 @@ export default defineLesson({
     does not erase anyone's photos. Then
     ${cue("answer", "the rows come back, and the server sends the feed to the phone")}.
 
+    ${threeBoxes}
+
     There is nothing wrong with staying right here for a long time. One app
     server and one database can serve thousands of active users with room to
     spare. Later in this course, we place extra boxes into this drawing, like
@@ -145,6 +290,8 @@ export default defineLesson({
     - Users can open a feed of recent photos from people they follow.
     - Users can leave a comment on a photo.
 
+    ${fourActions}
+
     Once that list is on the page, take a moment to trim it. Whether you are
     working through an hour-long design conversation or scoping a first
     version for your team, you cannot design every corner of an app at once.
@@ -166,6 +313,8 @@ export default defineLesson({
     - **Availability.** What share of the year must the app stay reachable? An app that is up 99.9% of the time can be down for roughly 9 hours over a full year.
     - **Consistency.** After someone posts something new, how soon must everyone else see it? A friend can wait a few seconds for a new photo to appear in their feed, whereas a bank balance has to be exact on every read.
 
+    ${targets}
+
     Tightening any of these five numbers has a real cost in machines,
     complexity, or both. A good design does not chase the strictest number on
     the page. It meets what the product needs, and stops there.
@@ -182,6 +331,8 @@ export default defineLesson({
     evening? Would anyone mind if a new post took a few seconds to appear for
     followers?
 
+    ${questions}
+
     Questions about specific tools belong later in the conversation. Asking
     "should we use a SQL database?" before you know what the data looks like
     or how the app reads it leaves you with no grounded way to answer. You end
@@ -208,6 +359,8 @@ export default defineLesson({
     bottleneck only shows up once you test your numbers against a concrete
     first design.
 
+    ${roughNumbers}
+
     In our photo app,
     ${cue("bottleneck", "the database is the first part to run out")}.
     Every feed load asks the database for fresh rows, and people scroll
@@ -225,6 +378,8 @@ export default defineLesson({
     needs stored data comes back as an error. Nothing else can step in,
     because there is only one database holding the rows.
 
+    ${standby}
+
     Any piece whose failure stops the whole product is a single point of
     failure. The usual fix is to run a second copy that can take over. Still,
     removing every single point of failure costs money and engineering time,
@@ -243,6 +398,8 @@ export default defineLesson({
     pays the extra cost of making every read see the latest write. Hand the
     same design to both products, and it fits one and fails the other.
 
+    ${twoProducts}
+
     That is also why stopping at "it depends" is not enough. Whenever a choice
     depends on the situation, name the exact factor it depends on, such as the
     read-to-write ratio or how many seconds of delay users will accept. Once
@@ -269,6 +426,8 @@ export default defineLesson({
     three more ran a tag engine. Every machine had a spare, and a second data
     center in Colorado could take over from New York.
 
+    ${stackOverflow}
+
     On average, a question page rendered in about 23 ms. Craver also wrote
     that the whole site could run on a single web server, and had done so by
     accident a few times. The other 8 web servers were not there because
@@ -296,6 +455,8 @@ export default defineLesson({
     put it like this. The feed may show a new photo a few seconds after it is
     posted, and in return we can serve reads from caches and copies, so the
     feed stays fast during the evening rush.
+
+    ${tradeOff}
   `,
   quiz: [
     {
diff --git a/src/content/prose.test.ts b/src/content/prose.test.ts
index eccfbea..1b242d4 100644
--- a/src/content/prose.test.ts
+++ b/src/content/prose.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, test } from "vitest"
-import { blockText, makeCue, md, slugify, type CueToken } from "./prose"
+import { blockText, figure, makeCue, md, slugify, type CueToken } from "./prose"
 
 const cue = makeCue<string>()
 
@@ -412,4 +412,56 @@ A **bold** *em* \`code\` [link](https://example.com) ${cue("go", "cue text")}.
     ])
     expect(() => md`*a **b** c*`).toThrow("unclosed emphasis")
   })
+
+  test("a figure on its own line becomes a figure block between paragraphs", () => {
+    const pair = figure({
+      a: { kind: "client", label: "A", at: [0, 0] },
+      b: { kind: "server", label: "B", at: [2, 0] },
+    }, "A asks B.", (s) => [s.send("a", "b", "hi")])
+    const prose = md`
+      One ${cue("x", "two")}.
+      ${pair}
+      Three.
+    `
+    expect(prose.blocks.map((block) => block.t)).toEqual(["p", "figure", "p"])
+    const block = prose.blocks[1]
+    expect(block.t === "figure" && block.caption).toBe("A asks B.")
+    expect(block.t === "figure" && block.timeline.edges.map((edge) => edge.id)).toEqual(["a~b"])
+    expect(blockText(block)).toBe("A asks B.")
+    expect(prose.cues).toEqual(["x"])
+    expect(prose.words).toBe(6)
+  })
+
+  test("a figure inside a line, a heading or a code fence throws", () => {
+    const one = figure({ a: { kind: "client", label: "A", at: [0, 0] } }, "A.", () => [])
+    expect(() => md`See ${one} here.`).toThrow("a figure must stand on its own line")
+    expect(() => md`## Title ${one}`).toThrow("a figure must stand on its own line")
+    expect(() => md`
+      \`\`\`
+      ${one}
+      \`\`\`
+    `).toThrow("figure inside code")
+  })
+
+  test("a figure in a code span, a fence line or a link url throws", () => {
+    const one = figure({ a: { kind: "client", label: "A", at: [0, 0] } }, "A.", () => [])
+    expect(() => md`See \`${one}\` here.`).toThrow("figure inside code")
+    expect(() => md`
+      \`\`\`${one}
+      x
+      \`\`\`
+    `).toThrow("figure inside code")
+    expect(() => md`[a](https://x.com/${one}) b`).toThrow("figure inside link url")
+  })
+
+  test("a figure with an empty caption throws", () => {
+    expect(() => figure({ a: { kind: "client", label: "A", at: [0, 0] } }, " ", () => [])).toThrow("a figure needs a caption")
+  })
+
+  test("a figure with a bad scene throws when defined", () => {
+    expect(() => figure({
+      a: { kind: "client", label: "A", at: [0, 0] },
+      b: { kind: "server", label: "B", at: [0, 0] },
+    }, "A.", () => [])).toThrow("a and b share a cell")
+  })
 })
diff --git a/src/content/prose.ts b/src/content/prose.ts
index ce42263..8710323 100644
--- a/src/content/prose.ts
+++ b/src/content/prose.ts
@@ -1,4 +1,7 @@
+import { compile, defineScene, type Action, type NodeDef, type StepKit, type Timeline } from "@/scene"
+
 const CUE = "\uE000"
+const FIGURE = "\uE001"
 
 interface CueRecord {
   readonly step: string
@@ -15,6 +18,26 @@ export interface CueToken<S extends string = string> {
 
 export type CueFn<S extends string> = (step: S, text: string) => CueToken<S>
 
+declare const figureBrand: unique symbol
+
+export interface FigureToken {
+  readonly [figureBrand]: true
+}
+
+const figureData = new WeakMap<object, Timeline>()
+
+export function figure<const T extends Record<string, NodeDef>>(
+  nodes: T,
+  caption: string,
+  draw: (s: StepKit<Extract<keyof T, string>>) => Action<Extract<keyof T, string>>[],
+): FigureToken {
+  if (caption.trim() === "") fail("a figure needs a caption")
+  const timeline = compile(defineScene(nodes).steps((s) => ({ still: s.step(caption, ...draw(s)) })))
+  const token = Object.freeze({}) as FigureToken
+  figureData.set(token, timeline)
+  return token
+}
+
 export type Inline =
   | { readonly t: "text"; readonly v: string }
   | { readonly t: "strong"; readonly c: readonly Inline[] }
@@ -31,6 +54,7 @@ export type Block =
   | { readonly t: "ul" | "ol"; readonly items: readonly (readonly Inline[])[] }
   | { readonly t: "callout"; readonly kind: CalloutKind; readonly c: readonly Inline[] }
   | { readonly t: "code"; readonly lang: string; readonly v: string }
+  | { readonly t: "figure"; readonly caption: string; readonly timeline: Timeline }
 
 export interface Prose {
   readonly blocks: readonly Block[]
@@ -43,9 +67,12 @@ interface ParseState {
   next: number
 }
 
+type Part = CueToken | FigureToken
+
 type Segment =
   | { readonly kind: "group"; readonly lines: readonly string[] }
   | { readonly kind: "code"; readonly lang: string; readonly v: string }
+  | { readonly kind: "figure" }
 
 function fail(message: string): never {
   throw new Error(`prose: ${message}`)
@@ -118,6 +145,8 @@ export function blockText(block: Block): string {
       return block.items.map((item) => inlineText(item)).join("\n")
     case "code":
       return block.v
+    case "figure":
+      return block.caption
   }
 }
 
@@ -135,6 +164,7 @@ function parseInlines(src: string, line: string, state: ParseState): Inline[] {
 
   while (i < src.length) {
     const ch = src[i]
+    if (ch === FIGURE) fail("a figure must stand on its own line")
     if (ch === CUE) {
       flush()
       const record = state.records[state.next]
@@ -150,6 +180,7 @@ function parseInlines(src: string, line: string, state: ParseState): Inline[] {
       if (end === -1) fail("unclosed code span")
       const v = src.slice(i + 1, end)
       if (v.includes(CUE)) fail("cue inside code")
+      if (v.includes(FIGURE)) fail("figure inside code")
       out.push({ t: "code", v })
       i = end + 1
       continue
@@ -178,6 +209,7 @@ function parseInlines(src: string, line: string, state: ParseState): Inline[] {
       if (paren === -1) fail(`unsupported syntax "${line}"`)
       const href = src.slice(close + 2, paren)
       if (href.includes(CUE)) fail("cue inside link url")
+      if (href.includes(FIGURE)) fail("figure inside link url")
       if (/[\s(]/.test(href)) fail(`link url has a space or parenthesis "${href}"`)
       if (!href.startsWith("https://") && !href.startsWith("#/")) {
         fail("link must start with https:// or #/")
@@ -222,12 +254,14 @@ function scanSegments(lines: readonly string[]): Segment[] {
     const line = lines[i]
     if (line.startsWith("```")) {
       if (line.includes(CUE)) fail("cue inside code")
+      if (line.includes(FIGURE)) fail("figure inside code")
       const lang = line.slice(3).trim()
       let end = i + 1
       while (end < lines.length && lines[end] !== "```") end += 1
       if (end >= lines.length) fail("unclosed code fence")
       const content = lines.slice(i + 1, end)
       if (content.some((inner) => inner.includes(CUE))) fail("cue inside code")
+      if (content.some((inner) => inner.includes(FIGURE))) fail("figure inside code")
       segments.push({ kind: "code", lang, v: content.join("\n") })
       i = end + 1
       continue
@@ -241,11 +275,16 @@ function scanSegments(lines: readonly string[]): Segment[] {
       i += 1
       continue
     }
+    if (line === FIGURE) {
+      segments.push({ kind: "figure" })
+      i += 1
+      continue
+    }
 
     const group: string[] = []
     while (i < lines.length) {
       const current = lines[i]
-      if (isBlank(current) || current.startsWith("```") || isHeading(current)) break
+      if (isBlank(current) || current.startsWith("```") || isHeading(current) || current === FIGURE) break
       group.push(current)
       i += 1
     }
@@ -356,23 +395,33 @@ function unescapeRaw(raw: string): string {
   return raw.replace(/\\([`$\\])/g, "$1")
 }
 
-export function md(template: TemplateStringsArray, ...cues: CueToken[]): Prose {
+export function md(template: TemplateStringsArray, ...parts: Part[]): Prose {
   const strings = template.raw.map(unescapeRaw)
   for (const part of strings) {
-    if (part.includes(CUE)) fail("reserved character in text")
+    if (part.includes(CUE) || part.includes(FIGURE)) fail("reserved character in text")
   }
 
   const records: CueRecord[] = []
-  for (const token of cues) {
+  const figures: Timeline[] = []
+  const marks: string[] = []
+  for (const token of parts) {
     const record = cueData.get(token)
-    if (record === undefined) fail("interpolation is not a cue")
-    records.push(record)
+    const timeline = figureData.get(token)
+    if (record !== undefined) {
+      records.push(record)
+      marks.push(CUE)
+    } else if (timeline !== undefined) {
+      figures.push(timeline)
+      marks.push(FIGURE)
+    } else {
+      fail("interpolation is not a cue or a figure")
+    }
   }
 
   let text = ""
   for (let i = 0; i < strings.length; i += 1) {
     text += strings[i]
-    if (i < cues.length) text += CUE
+    if (i < marks.length) text += marks[i]
   }
 
   const segments = scanSegments(dedent(text))
@@ -381,15 +430,21 @@ export function md(template: TemplateStringsArray, ...cues: CueToken[]): Prose {
   const state: ParseState = { records, next: 0 }
   const ids = new Set<string>()
   const blocks: Block[] = []
+  let nextFigure = 0
   for (const segment of segments) {
     if (segment.kind === "code") {
       blocks.push({ t: "code", lang: segment.lang, v: segment.v })
+    } else if (segment.kind === "figure") {
+      const timeline = figures[nextFigure]
+      nextFigure += 1
+      blocks.push({ t: "figure", caption: timeline.steps[0].caption, timeline })
     } else {
       blocks.push(parseGroup(segment.lines, state, ids))
     }
   }
 
   if (state.next !== records.length) fail("cue was not placed in the text")
+  if (nextFigure !== figures.length) fail("figure was not placed in the text")
 
   let words = 0
   for (const block of blocks) {
diff --git a/src/scene/ScenePlayer.tsx b/src/scene/ScenePlayer.tsx
index 7cdac3d..748fb09 100644
--- a/src/scene/ScenePlayer.tsx
+++ b/src/scene/ScenePlayer.tsx
@@ -3,15 +3,16 @@ import { Button } from "@/components/ui/button"
 import { Kbd } from "@/components/ui/kbd"
 import { Slider } from "@/components/ui/slider"
 import { InkLayer, useInkBox, useInkContext } from "@/lib/ink"
-import { frameAt, type Frame, type Motion, type Timeline } from "./timeline"
+import { frameAt, stillFrame, type Frame, type Motion, type Timeline } from "./timeline"
 import { initialPlayer, reducePlayer, type PlayerEvent, type PlayerState } from "./player"
-import { gridOf, layoutScene, MAX_CELL, MIN_CELL, pointOn } from "./layout"
+import { FIGURE_MAX_CELL, gridOf, layoutScene, MAX_CELL, MIN_CELL, pointOn, type Layout } from "./layout"
 import { NODE_ROLE, type PacketTone } from "./model"
 import { sceneEdgeRecipe, sceneNodeRecipe } from "./ink"
 import "./scene.css"
 
 const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
 const MAX_TICK_MS = 100
+const FIGURE_GUTTER = 32
 
 const TONE_CLASS: Readonly<Record<PacketTone, string>> = {
   request: "bg-sticky-yellow",
@@ -120,6 +121,46 @@ export function useSceneCue(stepId: string): { active: boolean; play: () => void
   return { active: ctx.stepId === stepId, play: () => ctx.play(stepId) }
 }
 
+function Stage({ timeline, frame, layout, still = false }: { timeline: Timeline; frame: Frame; layout: Layout; still?: boolean }) {
+  return (
+    <div data-testid={still ? "figure-stage" : "stage"} role={still ? undefined : "img"} aria-label={still ? undefined : frame.caption} aria-hidden={still ? true : undefined} className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
+      {timeline.edges.map((edge) => {
+        const g = layout.edges[edge.id]
+        const view = frame.edges[edge.id]
+        return <div key={edge.id} data-scene-edge={edge.id} data-visible={String(view.visible)} aria-hidden={!view.visible} data-active={view.active ? "" : undefined} className="absolute" style={{ left: g.host.x, top: g.host.y, width: g.host.w, height: g.host.h }}>
+          <InkLayer recipe={sceneEdgeRecipe} seed={edge.id} params={{ x1: g.x1 - g.host.x, y1: g.y1 - g.host.y, x2: g.x2 - g.host.x, y2: g.y2 - g.host.y, heads: edge.heads }} />
+        </div>
+      })}
+      {Object.entries(timeline.nodes).map(([id, def]) => {
+        const rect = layout.nodes[id]
+        const view = frame.nodes[id]
+        return <div key={id} data-scene-node={id} data-kind={def.kind} data-role={NODE_ROLE[def.kind]} data-visible={String(view.visible)} aria-hidden={!view.visible} data-focus={view.focus ? "" : undefined} data-down={view.status === "down" ? "" : undefined} className="absolute" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
+          <InkLayer recipe={sceneNodeRecipe} seed={id} params={{ kind: def.kind }} />
+          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[calc(100%+1.5rem)] bg-paper px-1 text-center font-hand text-sm leading-tight">{def.label}</span>
+          {view.note ? <span data-testid="scene-note" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max bg-paper px-1 font-hand text-sm text-red">{view.note}</span> : null}
+        </div>
+      })}
+      {frame.packets.map((packet) => {
+        const edge = timeline.edges.find((entry) => entry.id === packet.edge)
+        if (edge === undefined) return null
+        const [x, y] = pointOn(layout.edges[packet.edge], edge.a === packet.from, packet.u)
+        return (
+          <div
+            key={packet.key}
+            data-scene-packet={packet.key}
+            data-tone={packet.tone}
+            aria-hidden
+            className={`pointer-events-none absolute left-0 top-0 min-w-4 whitespace-nowrap rounded-sm border border-ink px-1 text-center font-hand text-xs leading-tight shadow-sm ${TONE_CLASS[packet.tone]}`}
+            style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
+          >
+            {packet.label}
+          </div>
+        )
+      })}
+    </div>
+  )
+}
+
 export function ScenePlayer() {
   const { timeline, motion, state, frame, dispatch, stage } = useScene()
   const { ref, box } = useInkBox()
@@ -151,41 +192,7 @@ export function ScenePlayer() {
     >
       <div ref={ref} tabIndex={scrolls ? 0 : undefined} role={scrolls ? "region" : undefined} aria-label={scrolls ? "Diagram, scrolls sideways" : undefined} className="w-full overflow-x-auto overflow-y-hidden" style={{ boxSizing: "content-box", paddingTop: 24, paddingBottom: 24, aspectRatio: `${cols} / ${rows}`, minHeight: rows * MIN_CELL, maxHeight: rows * MAX_CELL }}>
         {layout ? (
-          <div data-testid="stage" role="img" aria-label={frame.caption} className="relative mx-auto" style={{ width: layout.width, height: layout.height }}>
-            {timeline.edges.map((edge) => {
-              const g = layout.edges[edge.id]
-              const view = frame.edges[edge.id]
-              return <div key={edge.id} data-scene-edge={edge.id} data-visible={String(view.visible)} aria-hidden={!view.visible} data-active={view.active ? "" : undefined} className="absolute" style={{ left: g.host.x, top: g.host.y, width: g.host.w, height: g.host.h }}>
-                <InkLayer recipe={sceneEdgeRecipe} seed={edge.id} params={{ x1: g.x1 - g.host.x, y1: g.y1 - g.host.y, x2: g.x2 - g.host.x, y2: g.y2 - g.host.y, heads: edge.heads }} />
-              </div>
-            })}
-            {Object.entries(timeline.nodes).map(([id, def]) => {
-              const rect = layout.nodes[id]
-              const view = frame.nodes[id]
-              return <div key={id} data-scene-node={id} data-kind={def.kind} data-role={NODE_ROLE[def.kind]} data-visible={String(view.visible)} aria-hidden={!view.visible} data-focus={view.focus ? "" : undefined} data-down={view.status === "down" ? "" : undefined} className="absolute" style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}>
-                <InkLayer recipe={sceneNodeRecipe} seed={id} params={{ kind: def.kind }} />
-                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-max max-w-[calc(100%+1.5rem)] text-center font-hand text-sm leading-tight">{def.label}</span>
-                {view.note ? <span data-testid="scene-note" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-max bg-paper px-1 font-hand text-sm text-red">{view.note}</span> : null}
-              </div>
-            })}
-            {frame.packets.map((packet) => {
-              const edge = timeline.edges.find((entry) => entry.id === packet.edge)
-              if (edge === undefined) return null
-              const [x, y] = pointOn(layout.edges[packet.edge], edge.a === packet.from, packet.u)
-              return (
-                <div
-                  key={packet.key}
-                  data-scene-packet={packet.key}
-                  data-tone={packet.tone}
-                  aria-hidden
-                  className={`pointer-events-none absolute left-0 top-0 min-w-4 whitespace-nowrap rounded-sm border border-ink px-1 text-center font-hand text-xs leading-tight shadow-sm ${TONE_CLASS[packet.tone]}`}
-                  style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}
-                >
-                  {packet.label}
-                </div>
-              )
-            })}
-          </div>
+          <Stage timeline={timeline} frame={frame} layout={layout} />
         ) : null}
       </div>
       <div aria-live="polite" className="text-center">
@@ -209,3 +216,20 @@ export function ScenePlayer() {
     </figure>
   )
 }
+
+export function SceneFigure({ timeline }: { timeline: Timeline }) {
+  const { ref, box } = useInkBox()
+  const { cols, rows } = gridOf(timeline)
+  const layout = React.useMemo(() => box ? layoutScene(timeline, box.w - 2 - 2 * FIGURE_GUTTER, FIGURE_MAX_CELL) : null, [timeline, box?.w])
+  const frame = React.useMemo(() => stillFrame(timeline), [timeline])
+  const scrolls = layout !== null && box !== null && layout.width + 2 * FIGURE_GUTTER > box.w
+
+  return (
+    <figure data-testid="figure" className="space-y-2">
+      <div ref={ref} tabIndex={scrolls ? 0 : undefined} role={scrolls ? "region" : undefined} aria-label={scrolls ? "Diagram, scrolls sideways" : undefined} className="w-full overflow-x-auto overflow-y-hidden" style={{ boxSizing: "content-box", paddingTop: 24, paddingBottom: 44, aspectRatio: `${cols} / ${rows}`, minHeight: rows * MIN_CELL, maxHeight: rows * FIGURE_MAX_CELL }}>
+        {layout ? <div className="min-w-full w-max" style={{ paddingInline: FIGURE_GUTTER }}><Stage timeline={timeline} frame={frame} layout={layout} still /></div> : null}
+      </div>
+      <figcaption className="text-center text-pencil-text">{frame.caption}</figcaption>
+    </figure>
+  )
+}
diff --git a/src/scene/index.ts b/src/scene/index.ts
index 1c36c0e..cab4108 100644
--- a/src/scene/index.ts
+++ b/src/scene/index.ts
@@ -1,5 +1,5 @@
 export { defineScene } from "./model"
-export type { Scene, NodeKind, NodeDef, PacketTone } from "./model"
+export type { Action, Scene, NodeKind, NodeDef, PacketTone, StepKit } from "./model"
 export { compile, SceneError } from "./timeline"
 export type { Timeline } from "./timeline"
-export { SceneProvider, ScenePlayer, useSceneCue } from "./ScenePlayer"
+export { SceneFigure, SceneProvider, ScenePlayer, useSceneCue } from "./ScenePlayer"
diff --git a/src/scene/layout.ts b/src/scene/layout.ts
index d867b06..ecf9742 100644
--- a/src/scene/layout.ts
+++ b/src/scene/layout.ts
@@ -8,6 +8,7 @@ export const NODE_H = 0.52
 export const CELL_STEP = 8
 export const MIN_CELL = 64
 export const MAX_CELL = 128
+export const FIGURE_MAX_CELL = 96
 export const EDGE_GAP = 6
 export const EDGE_PAD = 8
 
@@ -28,9 +29,9 @@ export function gridOf(timeline: Timeline): { readonly cols: number; readonly ro
   }), { cols: 0, rows: 0 })
 }
 
-export function layoutScene(timeline: Timeline, width: number): Layout {
+export function layoutScene(timeline: Timeline, width: number, maxCell = MAX_CELL): Layout {
   const { cols, rows } = gridOf(timeline)
-  const cellPx = Math.min(MAX_CELL, Math.max(MIN_CELL, Math.floor(width / cols / CELL_STEP) * CELL_STEP))
+  const cellPx = Math.min(maxCell, Math.max(MIN_CELL, Math.floor(width / cols / CELL_STEP) * CELL_STEP))
   const w = Math.round(NODE_W * cellPx / 4) * 4
   const h = Math.round(NODE_H * cellPx / 2) * 2
   const nodes: Record<string, Rect> = {}
diff --git a/src/scene/timeline.test.ts b/src/scene/timeline.test.ts
index 8bc98f0..1110df3 100644
--- a/src/scene/timeline.test.ts
+++ b/src/scene/timeline.test.ts
@@ -10,6 +10,7 @@ import {
   frameAt,
   readingTime,
   stepIndexAt,
+  stillFrame,
 } from "./timeline"
 
 test("defineScene keeps step order from object keys", () => {
@@ -407,3 +408,23 @@ test("frameAt is referentially cheap: 10k calls < 50 ms", () => {
 
   expect(performance.now() - started).toBeLessThan(50)
 })
+
+test("stillFrame shows every labeled send of the first step at rest, spread along its edge", () => {
+  const timeline = compile(defineScene({
+    a: { kind: "client", label: "A", at: [0, 0] },
+    b: { kind: "server", label: "B", at: [2, 0] },
+    c: { kind: "db", label: "C", at: [4, 0] },
+  }).steps((s) => ({
+    still: s.step("x", s.send("a", "b", "ask"), s.send("b", "a", "reply", "response"), s.send("b", "c"), s.down("c"), s.note("b", "busy")),
+  })))
+  const frame = stillFrame(timeline)
+  expect(frame.packets.map((packet) => [packet.label, packet.edge, packet.u])).toEqual([
+    ["ask", "a~b", 1 / 3],
+    ["reply", "a~b", 1 - 2 / 3],
+  ])
+  expect(frame.edges["a~b"]).toEqual({ visible: true, active: false })
+  expect(frame.edges["b~c"]).toEqual({ visible: true, active: false })
+  expect(frame.nodes.b.note).toBe("busy")
+  expect(frame.nodes.c.status).toBe("down")
+  expect(frame.caption).toBe("x")
+})
diff --git a/src/scene/timeline.ts b/src/scene/timeline.ts
index 328034b..5e37e9e 100644
--- a/src/scene/timeline.ts
+++ b/src/scene/timeline.ts
@@ -351,3 +351,33 @@ export function readingTime(caption: string): number {
 export function ease(p: number): number {
   return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
 }
+
+export function stillFrame(timeline: Timeline): Frame {
+  const step = timeline.steps[0]
+  const counts = new Map<EdgeId, number>()
+  for (const flight of step.flights) {
+    if (flight.label !== "") counts.set(flight.edge, (counts.get(flight.edge) ?? 0) + 1)
+  }
+  const seen = new Map<EdgeId, number>()
+  const packets: PacketView[] = []
+  for (const flight of step.flights) {
+    if (flight.label === "") continue
+    const index = seen.get(flight.edge) ?? 0
+    seen.set(flight.edge, index + 1)
+    const along = (index + 1) / ((counts.get(flight.edge) ?? 1) + 1)
+    const fromIsA = flight.edge.startsWith(`${flight.from}~`)
+    packets.push({
+      key: flight.key,
+      edge: flight.edge,
+      u: fromIsA ? along : 1 - along,
+      from: flight.from,
+      to: flight.to,
+      label: flight.label,
+      tone: flight.tone,
+    })
+  }
+  const frame = frameAt(timeline, 0, "reduced")
+  const edges: Record<EdgeId, { readonly visible: boolean; readonly active: boolean }> = {}
+  for (const edge of timeline.edges) edges[edge.id] = { visible: frame.edges[edge.id].visible, active: false }
+  return { ...frame, edges, packets }
+}
diff --git a/src/search/search.ts b/src/search/search.ts
index 01c5fc1..827ce93 100644
--- a/src/search/search.ts
+++ b/src/search/search.ts
@@ -69,6 +69,8 @@ function blockText(block: Block): string {
       return block.items.map(inlineText).join(" ")
     case "code":
       return block.v
+    case "figure":
+      return block.caption
   }
 }
 
````
