# Step 35. Still figures for lesson 1.3

## Why

Steps 33 and 34 gave lessons 1.1 and 1.2 one still figure per section. This step does the same for lesson 1.3, "Scaling up and scaling out". It adds 9 figures, one per section. The figure in "How Figma scaled its database" shows the whole case study. App servers reach Postgres through a connection pooler. The main database runs on the largest machine and copies to read replicas, groups of tables live on databases of their own, and one table is split across shards. Every fact in it comes from the lesson text, which follows Figma's two engineering posts already in the lesson's sources. No code outside the lesson and its tests changes.

## Branch and coder rules

- Branch `step/35-lesson-3-figures` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 5 files below may change, and only by the commands in "How to do it". Do not edit any file by hand.
- Do not change the code, the lesson text, the captions or the tests. Opus wrote, unslopped and tested them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error.
- Do not commit, push or open a pull request. Opus does that after verifying.
- Do not kill processes.

## What changes

### 1. Lesson 1.3's figures

`src/content/lessons/scaling-up-and-out/lesson.ts` imports `figure`, defines 9 figures above the scene and places one in each section. The top scene, the text, the cues and the quiz are unchanged.

1. "Slow every evening". Phone, app server and database. The server is highlighted and noted "CPU 95%".
2. "Slow for one user or slow for many". "1 user at 4 am" reaches a server noted "80 ms". "Everyone at 9 pm" reaches a server noted "CPU 95%".
3. "Scaling up". Phone, "Bigger server" noted "4x cores, 25%", and the database.
4. "Scaling out". Phone to a load balancer, which splits across Servers 1, 2 and 3, each noted "32%".
5. "What makes scaling out hard". Servers 1, 2 and 3 all read from one "Shared sessions" cache. It sits after the database paragraph, at the end of the section.
6. "When a server fails". Server 1 is crossed out and noted "failed". The load balancer sends to Servers 2 and 3, each noted "48%".
7. "The bottleneck moves". Servers 1, 2 and 3 all query one database, highlighted and noted "CPU 90%".
8. "How Figma scaled its database". App servers, a pooler, and the main Postgres noted "largest machine" with a "copy" arrow to read replicas. The pooler also reaches "Table groups" and "Sharded tables". The read replicas sit to the left of the main database so the figure fits in 6 columns and does not scroll on desktop.
9. "In a design review". Feed 1, 2 and 3 all reach a "Larger database" noted "copies before 70%".

### 2. Tests

- `src/content/curriculum.test.ts`. Lesson 1.3 goes from 11 to 13 minutes, because captions count as words. Only the `scaling-up-and-out` test changes. Two other tests also expect 11 and stay as they are.
- `e2e/scene-static.spec.ts` adds "lesson 1.3 has nine still figures and the Figma database figure". It checks 9 figures with no buttons, tab stops or cues, 6 nodes in the Figma figure, "largest machine" on the main database, and the crossed-out Server 1 in the failure figure.
- `e2e/a11y.spec.ts` adds `/#/learn/scaling-up-and-out` to the axe pages.

### 3. Docs

This spec is the 5th file, at `docs/steps/35-lesson-3-figures.md`.

## How to do it

Run these from the worktree root, in order.

1. Apply the patch. Save the appendix's diff, without the fence lines, to `/tmp/step35.diff`, then run `git apply /tmp/step35.diff`.
2. Copy this spec into the worktree. `cp SPEC docs/steps/35-lesson-3-figures.md`.
3. Install. `pnpm install > /tmp/install35.log 2>&1; tail -3 /tmp/install35.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b35.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b35.log`. The content step runs 101 tests.
- `pnpm test > /tmp/t35.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t35.log`. 257 tests in 16 files.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e35.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e35.log`. 75 tests.

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

- On main at adc9e62 with the patch applied, the content tests passed 101, unit passed 257 in 16 files, and e2e passed 75, axe included.
- Opus looked at all 9 figures at 1280 px and at 390 px. At 390 px the wide figures scroll sideways inside their frame, the same as the top diagram.
- The first prototype drew a load balancer, 3 servers and a shared box across 7 columns. The cells shrank, arrows landed on the server labels, and an arrow crossed the note above the shared box. Those three figures now stack the servers in one column and point them at the shared box.
- The first Figma figure was 8 columns wide, so it scrolled even on desktop and picked up a tab stop. A 7-column version with stacked databases was too cramped. The final version keeps rows 0, 2 and 4 and moves the read replicas to the left of the main database.
- Opus checked every caption against the unslop skill. Each caption is a full sentence, with no em dashes and no colon connectors.

## What you see

Lesson 1.3 reads as before, with a still drawing in each section and a short caption below it. The figures have no buttons and do not move. Clicking a highlighted phrase still plays the diagram at the top. In "How Figma scaled its database", the figure shows the pooler in front of the main database, the table groups and the sharded tables, with read replicas copied from the main database.

## Appendix. The patch

````diff
diff --git a/e2e/a11y.spec.ts b/e2e/a11y.spec.ts
index 22ecc1c..d185804 100644
--- a/e2e/a11y.spec.ts
+++ b/e2e/a11y.spec.ts
@@ -6,7 +6,7 @@ for (const theme of ["light", "dark"] as const) {
     await page.addInitScript((value) => localStorage.setItem("theme", value), theme)
     const violations: string[] = []
     for (const size of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
-      for (const path of ["/#/", "/#/learn/load-balancer", "/#/learn/what-system-design-is", "/#/learn/latency-and-throughput"]) {
+      for (const path of ["/#/", "/#/learn/load-balancer", "/#/learn/what-system-design-is", "/#/learn/latency-and-throughput", "/#/learn/scaling-up-and-out"]) {
         await page.setViewportSize(size)
         await gotoReady(page, path)
         await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`))
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index 48adbc9..fe97b2a 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -116,6 +116,18 @@ test("lesson 1.2 has ten still figures and the Google fan-out figure", async ({
   await expect(overload.locator('[data-scene-node="queue"]').getByTestId("scene-note")).toHaveText("full")
 })
 
+test("lesson 1.3 has nine still figures and the Figma database figure", async ({ page }) => {
+  await gotoReady(page, "/#/learn/scaling-up-and-out")
+  const figures = page.locator('[data-testid="prose"] [data-testid="figure"]')
+  await expect(figures).toHaveCount(9)
+  await expect(figures.locator("button, [tabindex], [data-cue]")).toHaveCount(0)
+  const figma = figures.filter({ hasText: "Figma's database changed shape between 2020 and 2023" })
+  await expect(figma.locator("[data-scene-node]")).toHaveCount(6)
+  await expect(figma.locator('[data-scene-node="main"]').getByTestId("scene-note")).toHaveText("largest machine")
+  const fails = figures.filter({ hasText: "When Server 1 fails" })
+  await expect(fails.locator('[data-scene-node="one"]')).toHaveAttribute("data-down", "")
+})
+
 test("nodes carry their kind and role, and the database is filled with its role color", async ({ page }) => {
   await gotoReady(page, "/#/learn/what-system-design-is")
   const scene = page.getByTestId("scene")
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 3db5c2a..a97162e 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -220,7 +220,7 @@ test("the real curriculum holds the scaling-up-and-out lesson", () => {
 
   expect(lesson?.track).toBe("foundations")
   expect(lesson?.order).toBe(3)
-  expect(lesson?.minutes).toBe(11)
+  expect(lesson?.minutes).toBe(13)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
     "slow-every-evening",
     "slow-for-one-user-or-slow-for-many",
diff --git a/src/content/lessons/scaling-up-and-out/lesson.ts b/src/content/lessons/scaling-up-and-out/lesson.ts
index 3aee076..5f161ca 100644
--- a/src/content/lessons/scaling-up-and-out/lesson.ts
+++ b/src/content/lessons/scaling-up-and-out/lesson.ts
@@ -1,4 +1,120 @@
-import { defineLesson, defineScene, md } from "@/content/author"
+import { defineLesson, defineScene, figure, md } from "@/content/author"
+
+const slowEvening = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  server: { kind: "server", label: "App server", at: [2, 0] },
+  db: { kind: "db", label: "Database", at: [4, 0] },
+}, "The photo app runs on one app server and one database. Every evening the server reaches 95% CPU, and feeds take seconds to load.", (s) => [
+  s.send("phone", "server", "GET /feed"),
+  s.send("server", "db", "query", "data"),
+  s.focus("server"),
+  s.note("server", "CPU 95%"),
+])
+
+const quietOrBusy = figure({
+  quiet: { kind: "mobile", label: "1 user at 4 am", at: [0, 0] },
+  calm: { kind: "server", label: "App server", at: [2, 0] },
+  busy: { kind: "mobile", label: "Everyone at 9 pm", at: [0, 2] },
+  full: { kind: "server", label: "App server", at: [2, 2] },
+}, "The feed loads in 80 ms at 4 am and slows down only at 9 pm. Each request is lean, so the app has a scalability problem.", (s) => [
+  s.send("quiet", "calm"),
+  s.send("busy", "full"),
+  s.note("calm", "80 ms"),
+  s.note("full", "CPU 95%"),
+])
+
+const scaleUp = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  server: { kind: "server", label: "Bigger server", at: [2, 0] },
+  db: { kind: "db", label: "Database", at: [4, 0] },
+}, "Scaling up moves the same app onto a machine with 4 times the cores. Evening CPU drops from 95% to about 25%, and the code does not change.", (s) => [
+  s.send("phone", "server", "GET /feed"),
+  s.send("server", "db"),
+  s.note("server", "4x cores, 25%"),
+])
+
+const scaleOut = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 2] },
+  lb: { kind: "lb", label: "Load balancer", at: [2, 2] },
+  one: { kind: "server", label: "Server 1", at: [5, 0] },
+  two: { kind: "server", label: "Server 2", at: [5, 2] },
+  three: { kind: "server", label: "Server 3", at: [5, 4] },
+}, "Scaling out runs the same app on 3 servers behind a load balancer. Each server gets about a third of the requests and sits near 32% CPU.", (s) => [
+  s.send("phone", "lb", "GET /feed"),
+  s.send("lb", "one"),
+  s.send("lb", "two"),
+  s.send("lb", "three"),
+  s.note("one", "32%"),
+  s.note("two", "32%"),
+  s.note("three", "32%"),
+])
+
+const stateless = figure({
+  one: { kind: "server", label: "Server 1", at: [0, 0] },
+  two: { kind: "server", label: "Server 2", at: [0, 1] },
+  three: { kind: "server", label: "Server 3", at: [0, 2] },
+  sessions: { kind: "cache", label: "Shared sessions", at: [3, 1] },
+}, "Stateless servers keep no sessions of their own. Every server reads sessions from one shared store, so any server can answer any user.", (s) => [
+  s.send("one", "sessions"),
+  s.send("two", "sessions"),
+  s.send("three", "sessions"),
+])
+
+const oneFails = figure({
+  lb: { kind: "lb", label: "Load balancer", at: [0, 2] },
+  one: { kind: "server", label: "Server 1", at: [3, 0] },
+  two: { kind: "server", label: "Server 2", at: [3, 2] },
+  three: { kind: "server", label: "Server 3", at: [3, 4] },
+}, "When Server 1 fails, the load balancer stops sending it traffic. The other two servers climb from 32% to about 48% CPU, and users notice nothing.", (s) => [
+  s.down("one"),
+  s.note("one", "failed"),
+  s.send("lb", "two"),
+  s.send("lb", "three"),
+  s.note("two", "48%"),
+  s.note("three", "48%"),
+])
+
+const bottleneck = figure({
+  one: { kind: "server", label: "Server 1", at: [0, 0] },
+  two: { kind: "server", label: "Server 2", at: [0, 1] },
+  three: { kind: "server", label: "Server 3", at: [0, 2] },
+  db: { kind: "db", label: "Database", at: [3, 1] },
+}, "All 3 servers still query one shared database. It took the whole 4x rise in traffic, so its CPU is now at 90%.", (s) => [
+  s.send("one", "db"),
+  s.send("two", "db"),
+  s.send("three", "db"),
+  s.focus("db"),
+  s.note("db", "CPU 90%"),
+])
+
+const figma = figure({
+  app: { kind: "server", label: "App servers", at: [0, 2] },
+  pooler: { kind: "proxy", label: "Pooler", at: [2, 2] },
+  replica: { kind: "db", label: "Read replicas", at: [3, 0] },
+  main: { kind: "db", label: "Main Postgres", at: [5, 0] },
+  parts: { kind: "db", label: "Table groups", at: [5, 2] },
+  shards: { kind: "db", label: "Sharded tables", at: [5, 4] },
+}, "Figma's database changed shape between 2020 and 2023. Thousands of stateless app servers reach Postgres through a connection pooler. The main database moved to the largest machine and gained read replicas. Groups of tables then moved to about a dozen databases of their own, and in September 2023 the first table was split across shards.", (s) => [
+  s.send("app", "pooler"),
+  s.send("pooler", "main"),
+  s.send("pooler", "parts"),
+  s.send("pooler", "shards"),
+  s.send("main", "replica", "copy"),
+  s.note("main", "largest machine"),
+])
+
+const reviewPlan = figure({
+  one: { kind: "server", label: "Feed 1", at: [0, 0] },
+  two: { kind: "server", label: "Feed 2", at: [0, 1] },
+  three: { kind: "server", label: "Feed 3", at: [0, 2] },
+  db: { kind: "db", label: "Larger database", at: [3, 1] },
+}, "The plan runs at least 3 stateless feed servers, so one can fail at peak hour. The database stays on a larger machine and gets read copies before its CPU passes 70%.", (s) => [
+  s.send("one", "db"),
+  s.send("two", "db"),
+  s.send("three", "db"),
+  s.note("db", "copies before 70%"),
+])
+
 
 const scene = defineScene({
   phone: { kind: "mobile", label: "Phone", at: [0, 1] },
@@ -130,6 +246,8 @@ export default defineLesson({
     why. Once a server sits near 100% busy, every new request waits in a
     growing queue.
 
+    ${slowEvening}
+
     At this point, the team has two ways to add room. They can move the app
     onto a larger machine, known as scaling up. Or they can run the app on
     several machines at once, known as scaling out. This lesson walks through
@@ -149,6 +267,8 @@ export default defineLesson({
     Our photo app loads a feed in 80 ms at 4 am, so the team knows they are
     dealing with a scalability problem.
 
+    ${quietOrBusy}
+
     > pitfall: Adding servers to solve a performance problem raises your bill without helping the user. Time a single request on a quiet machine before you add hardware.
 
     ## Scaling up
@@ -160,6 +280,8 @@ export default defineLesson({
     ${cue("up", "The team moves the photo app to a machine with 4 times the cores")},
     and the same evening traffic drops from 95% CPU down to about 25%.
 
+    ${scaleUp}
+
     When a bigger machine is available, scaling up is the fastest and calmest
     fix you can make. Still, it comes with four real limits.
 
@@ -192,6 +314,8 @@ export default defineLesson({
     CPU crosses a mark like 70%, so the new server boots before queues grow,
     and turns spare machines off during quiet overnight hours.
 
+    ${scaleOut}
+
     Horizontal scaling supports much higher growth, though it adds three
     ongoing responsibilities.
 
@@ -224,6 +348,8 @@ export default defineLesson({
     data and keep it safe. That is why scaling out a database is far harder
     than scaling out app servers, and why all of chapter 6 focuses on data.
 
+    ${stateless}
+
     ## When a server fails
 
     A single server is always a single point of failure. No matter how many
@@ -245,6 +371,8 @@ export default defineLesson({
     enough to build queues yet still able to stay up, and keeping even more
     headroom keeps latency calm during a failure.
 
+    ${oneFails}
+
     ## The bottleneck moves
 
     Adding app servers does not add any capacity to the parts those servers
@@ -261,6 +389,8 @@ export default defineLesson({
     app, the next relief comes from putting a cache in front of the database
     for popular feeds and adding read copies of the database.
 
+    ${bottleneck}
+
     ## How Figma scaled its database
 
     Figma is a browser-based design tool where teams edit the same files
@@ -312,6 +442,8 @@ export default defineLesson({
     bought valuable time before hitting a hard ceiling, while scaling out the
     stateful database took years of careful engineering.
 
+    ${figma}
+
     ## In a design review
 
     A few practical questions keep scaling discussions grounded in any review.
@@ -327,6 +459,8 @@ export default defineLesson({
     stateless and run at least 3 of them so any single machine can fail at
     peak hour. Keep the database on a larger machine for now because it takes
     every write, and add read copies before its CPU climbs past 70%.
+
+    ${reviewPlan}
   `,
   quiz: [
     {
````
