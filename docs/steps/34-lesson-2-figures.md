# Step 34. Still figures for lesson 1.2

## Why

Step 33 added still figures and gave lesson 1.1 one per section. This step does the same for lesson 1.2, "Latency and throughput". It adds 10 figures, one per section. The figure in "Slow servers at Google" shows the whole case study, with a root server, its leaf servers and a hedged read. Its numbers come from the lesson text, which Opus checked against "The tail at scale" by Dean and Barroso, already in the lesson's sources. No code outside the lesson and its tests changes.

## Branch and coder rules

- Branch `step/34-lesson-2-figures` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 5 files below may change, and only by the commands in "How to do it". Do not edit any file by hand.
- Do not change the code, the lesson text, the captions or the tests. Opus wrote, unslopped and tested them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error.
- Do not commit, push or open a pull request. Opus does that after verifying.
- Do not kill processes.

## What changes

### 1. Lesson 1.2's figures

`src/content/lessons/latency-and-throughput/lesson.ts` imports `figure`, defines 10 figures above the scene and places one at the end of each section. The top scene, the text, the cues and the quiz are unchanged.

1. "Fast at noon, slow at night". A phone at noon sends straight to the feed server, noted "about 10 ms". A phone at 9 pm waits in a highlighted queue first, noted "about 1 s".
2. "Two different numbers". A phone and the feed server, noted "10 ms trip" and "100 a second".
3. "Improving one does not always improve the other". Phones split across Server A and Server B, each noted "100 a second".
4. "Averages hide the slow requests". "Most users" noted "p50 10 ms" and "1 in 100" noted "p99 300 ms", both sending to the feed server.
5. "Slow calls add up". The feed server calls Photos, Likes and Comments. Comments is highlighted and noted "300 ms".
6. "Why the queue grows". Phone, queue and server in a row, noted "waits 90 ms" and "90% busy".
7. "Little's law". "90/s" into the queue, noted "about 9 inside".
8. "When load passes capacity". "too many" into a queue noted "full", "100/s" out to the server, and a "503" back to a new request.
9. "Slow servers at Google". A user request goes to a root server. The root fans out to "Fast 95%", noted "70 ms", and to "Slow 5%", highlighted and noted "140 ms". A "hedged read" goes to "Another server".
10. "In a design review". Phones noted "p99 under 300 ms" send "7,000/s" to a load balancer, which splits across two feed servers, each noted "70% busy".

### 2. Tests

- `src/content/curriculum.test.ts`. Lesson 1.2 goes from 13 to 14 minutes, because captions count as words.
- `e2e/scene-static.spec.ts` adds "lesson 1.2 has ten still figures and the Google fan-out figure". It checks 10 figures with no buttons, tab stops or cues, 5 nodes and 2 labels in the Google figure, "140 ms" on the slow leaves, and "full" on the overloaded queue.
- `e2e/a11y.spec.ts` adds `/#/learn/latency-and-throughput` to the axe pages.

### 3. Docs

This spec is the 5th file, at `docs/steps/34-lesson-2-figures.md`.

## How to do it

Run these from the worktree root, in order.

1. Apply the patch. Save the appendix's diff, without the fence lines, to `/tmp/step34.diff`, then run `git apply /tmp/step34.diff`.
2. Copy this spec into the worktree. `cp SPEC docs/steps/34-lesson-2-figures.md`.
3. Install. `pnpm install > /tmp/install34.log 2>&1; tail -3 /tmp/install34.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b34.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b34.log`. The content step runs 101 tests.
- `pnpm test > /tmp/t34.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t34.log`. 257 tests in 16 files.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e34.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e34.log`. 74 tests.

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

- On main at 4922f27 with the patch applied, the content tests passed 101, unit passed 257 in 16 files, and e2e passed 74, axe included.
- Opus looked at all 10 figures at 1280 px and at 390 px. At 390 px the wide figures scroll sideways inside their frame, and the page's `scrollWidth` equals the window width.
- The first layout put a "waits for all 3" note on the feed server, where the arrow to Photos ran through it, so the note is gone and the caption says it. The design review figure first had the "p99 under 300 ms" note crossed by an arrow. A load balancer now takes one straight "7,000/s" arrow from the phones. The overload figure moved the queue to the middle row so its "503" arrow leaves from its side, clear of its label. Two leaf labels wrapped to two lines and were shortened to "Fast 95%" and "Slow 5%".
- The slow call in "Slow calls add up" is highlighted, not crossed out, because a crossed-out box means a stopped one.
- Opus checked every caption against the unslop skill. The first caption opened with a verbless fragment and was rewritten.

## What you see

Lesson 1.2 reads as before, with a still drawing at the end of each section and a short caption below it. The figures have no buttons and do not move. Clicking a highlighted phrase still plays the diagram at the top. In "Slow servers at Google", the figure shows a root server fanning out to fast and slow leaves, with a hedged read going to another server.

## Appendix. The patch

````diff
diff --git a/e2e/a11y.spec.ts b/e2e/a11y.spec.ts
index fcd7961..22ecc1c 100644
--- a/e2e/a11y.spec.ts
+++ b/e2e/a11y.spec.ts
@@ -6,7 +6,7 @@ for (const theme of ["light", "dark"] as const) {
     await page.addInitScript((value) => localStorage.setItem("theme", value), theme)
     const violations: string[] = []
     for (const size of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
-      for (const path of ["/#/", "/#/learn/load-balancer", "/#/learn/what-system-design-is"]) {
+      for (const path of ["/#/", "/#/learn/load-balancer", "/#/learn/what-system-design-is", "/#/learn/latency-and-throughput"]) {
         await page.setViewportSize(size)
         await gotoReady(page, path)
         await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${theme}\\b`))
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index 1980939..48adbc9 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -103,6 +103,19 @@ test("what-system-design-is shows 10 still figures that never play, and the Stac
   await expect(page.getByTestId("scene").getByText("Step 1 of 8")).toBeVisible()
 })
 
+test("lesson 1.2 has ten still figures and the Google fan-out figure", async ({ page }) => {
+  await gotoReady(page, "/#/learn/latency-and-throughput")
+  const figures = page.locator('[data-testid="prose"] [data-testid="figure"]')
+  await expect(figures).toHaveCount(10)
+  await expect(figures.locator("button, [tabindex], [data-cue]")).toHaveCount(0)
+  const google = figures.filter({ hasText: "A Google root server sends each request" })
+  await expect(google.locator("[data-scene-node]")).toHaveCount(5)
+  await expect(google.locator("[data-scene-packet]")).toHaveCount(2)
+  await expect(google.locator('[data-scene-node="slow"]').getByTestId("scene-note")).toHaveText("140 ms")
+  const overload = figures.filter({ hasText: "a new request gets a fast 503 error" })
+  await expect(overload.locator('[data-scene-node="queue"]').getByTestId("scene-note")).toHaveText("full")
+})
+
 test("nodes carry their kind and role, and the database is filled with its role color", async ({ page }) => {
   await gotoReady(page, "/#/learn/what-system-design-is")
   const scene = page.getByTestId("scene")
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 9c55063..3db5c2a 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -189,7 +189,7 @@ test("the real curriculum holds the latency-and-throughput lesson", () => {
 
   expect(lesson?.track).toBe("foundations")
   expect(lesson?.order).toBe(2)
-  expect(lesson?.minutes).toBe(13)
+  expect(lesson?.minutes).toBe(14)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
     "fast-at-noon-slow-at-night",
     "two-different-numbers",
diff --git a/src/content/lessons/latency-and-throughput/lesson.ts b/src/content/lessons/latency-and-throughput/lesson.ts
index 75789d9..457a0d9 100644
--- a/src/content/lessons/latency-and-throughput/lesson.ts
+++ b/src/content/lessons/latency-and-throughput/lesson.ts
@@ -1,4 +1,130 @@
-import { defineLesson, defineScene, md } from "@/content/author"
+import { defineLesson, defineScene, figure, md } from "@/content/author"
+
+const noonAndNight = figure({
+  noon: { kind: "mobile", label: "Phone at noon", at: [0, 0] },
+  quiet: { kind: "server", label: "Feed server", at: [4, 0] },
+  night: { kind: "mobile", label: "Phone at 9 pm", at: [0, 2] },
+  line: { kind: "queue", label: "Queue", at: [2, 2] },
+  busy: { kind: "server", label: "Feed server", at: [4, 2] },
+}, "At noon a feed request goes straight to the server. At 9 pm the same request waits in a long line first.", (s) => [
+  s.send("noon", "quiet", "GET /feed"),
+  s.send("night", "line", "GET /feed"),
+  s.send("line", "busy"),
+  s.focus("line"),
+  s.note("noon", "about 10 ms"),
+  s.note("night", "about 1 s"),
+])
+
+const twoNumbers = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  server: { kind: "server", label: "Feed server", at: [2, 0] },
+}, "Latency is how long one request takes. Throughput is how many requests the server finishes each second.", (s) => [
+  s.send("phone", "server"),
+  s.send("server", "phone"),
+  s.note("phone", "10 ms trip"),
+  s.note("server", "100 a second"),
+])
+
+const secondServer = figure({
+  phone: { kind: "mobile", label: "Phones", at: [0, 1] },
+  a: { kind: "server", label: "Server A", at: [2, 0] },
+  b: { kind: "server", label: "Server B", at: [2, 2] },
+}, "A second server doubles throughput to 200 requests a second. Each request still takes 10 ms, so latency stays the same.", (s) => [
+  s.send("phone", "a"),
+  s.send("phone", "b"),
+  s.note("a", "100 a second"),
+  s.note("b", "100 a second"),
+])
+
+const percentiles = figure({
+  most: { kind: "mobile", label: "Most users", at: [0, 0] },
+  few: { kind: "mobile", label: "1 in 100", at: [0, 2] },
+  server: { kind: "server", label: "Feed server", at: [2, 1] },
+}, "Most feed requests finish in 10 ms, and 1 in 100 takes 300 ms or longer. An average of about 15 ms hides the slow one.", (s) => [
+  s.send("most", "server"),
+  s.send("few", "server"),
+  s.note("most", "p50 10 ms"),
+  s.note("few", "p99 300 ms"),
+])
+
+const threeCalls = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 2] },
+  server: { kind: "server", label: "Feed server", at: [2, 2] },
+  photos: { kind: "service", label: "Photos", at: [5, 0] },
+  likes: { kind: "service", label: "Likes", at: [5, 2] },
+  comments: { kind: "service", label: "Comments", at: [5, 4] },
+}, "One feed screen calls three services. The screen is ready only when the slowest call comes back.", (s) => [
+  s.send("phone", "server", "GET /feed"),
+  s.send("server", "photos"),
+  s.send("server", "likes"),
+  s.send("server", "comments"),
+  s.focus("comments"),
+  s.note("comments", "300 ms"),
+])
+
+const queueWait = figure({
+  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
+  queue: { kind: "queue", label: "Queue", at: [2, 0] },
+  server: { kind: "server", label: "Feed server", at: [4, 0] },
+}, "At 90% busy, a request waits about 90 ms in line before its 10 ms of work starts.", (s) => [
+  s.send("phone", "queue", "GET /feed"),
+  s.send("queue", "server"),
+  s.note("queue", "waits 90 ms"),
+  s.note("server", "90% busy"),
+])
+
+const littlesLaw = figure({
+  phone: { kind: "mobile", label: "Phones", at: [0, 0] },
+  queue: { kind: "queue", label: "Queue", at: [2, 0] },
+  server: { kind: "server", label: "Feed server", at: [4, 0] },
+}, "With 90 requests arriving each second, and each staying inside for 0.1 s, about 9 requests are inside at any moment.", (s) => [
+  s.send("phone", "queue", "90/s"),
+  s.send("queue", "server"),
+  s.note("queue", "about 9 inside"),
+])
+
+const overload = figure({
+  phones: { kind: "mobile", label: "Phones", at: [0, 0] },
+  queue: { kind: "queue", label: "Queue", at: [2, 1] },
+  server: { kind: "server", label: "Feed server", at: [4, 1] },
+  late: { kind: "mobile", label: "New request", at: [0, 2] },
+}, "More than 100 requests arrive each second, and the server still finishes 100. With a cap on the queue, a new request gets a fast 503 error.", (s) => [
+  s.send("phones", "queue", "too many"),
+  s.send("queue", "server", "100/s"),
+  s.send("queue", "late", "503", "error"),
+  s.note("queue", "full"),
+])
+
+const fanOut = figure({
+  user: { kind: "client", label: "User request", at: [0, 2] },
+  root: { kind: "server", label: "Root server", at: [2, 2] },
+  fast: { kind: "service", label: "Fast 95%", at: [5, 0] },
+  slow: { kind: "service", label: "Slow 5%", at: [5, 2] },
+  copy: { kind: "service", label: "Another server", at: [5, 4] },
+}, "A Google root server sends each request to many leaf servers. At the p99, the fastest 95% of leaves answered within 70 ms, and waiting for every leaf took 140 ms. A hedged copy of a slow read goes to another server, and the first answer wins.", (s) => [
+  s.send("user", "root", "query"),
+  s.send("root", "fast"),
+  s.send("root", "slow"),
+  s.send("root", "copy", "hedged read", "data"),
+  s.focus("slow"),
+  s.note("fast", "70 ms"),
+  s.note("slow", "140 ms"),
+])
+
+const reviewNumbers = figure({
+  phone: { kind: "mobile", label: "Phones", at: [0, 1] },
+  lb: { kind: "lb", label: "Load balancer", at: [2, 1] },
+  a: { kind: "server", label: "Feed server", at: [4, 0] },
+  b: { kind: "server", label: "Feed server", at: [4, 2] },
+}, "State both numbers together. At the evening peak, the feed serves about 7,000 requests a second with a p99 under 300 ms, and no server runs above 70% busy.", (s) => [
+  s.send("phone", "lb", "7,000/s"),
+  s.send("lb", "a"),
+  s.send("lb", "b"),
+  s.note("phone", "p99 under 300 ms"),
+  s.note("a", "70% busy"),
+  s.note("b", "70% busy"),
+])
+
 
 const scene = defineScene({
   phone: { kind: "mobile", label: "Phone", at: [0, 1] },
@@ -117,6 +243,8 @@ export default defineLesson({
     close to full, requests spend most of their time waiting in line before
     work on them even starts.
 
+    ${noonAndNight}
+
     This lesson explains why that wait happens and how to reason about it. We only need two core measures, latency and throughput, along with
     a clear mental model of how requests queue up. Near the end, we look at
     real numbers Google published about what happens when one user request has
@@ -140,6 +268,8 @@ export default defineLesson({
     is its capacity. A real server handles several requests at once across its
     CPU cores, yet the same simple math applies to each worker.
 
+    ${twoNumbers}
+
     It helps to keep the two questions separate. Latency tells you how long
     one person waits. Throughput tells you how many people the system can
     serve each second. A design can do well on one and struggle on the
@@ -159,6 +289,8 @@ export default defineLesson({
     - **Batching.** Writing 100 analytics events to disk in one group takes far less disk time than 100 separate writes, so throughput rises. Each event now waits for its batch to fill up, so latency rises too.
     - **Servers closer to users.** Placing servers nearer to the people using the app cuts network travel time on every request. Each server still finishes the same number of requests per second.
 
+    ${secondServer}
+
     Let the problem you see guide the fix. When users wait too long while your
     servers sit half idle, focus on cutting latency. When your servers are
     running near full capacity, add throughput first. As we are about to see,
@@ -188,6 +320,8 @@ export default defineLesson({
     yet stalls for someone every few seconds. Its average might sit around
     15 ms, which looks healthy on a dashboard while real people wait.
 
+    ${percentiles}
+
     > pitfall: Avoid setting latency goals on the average. A few 5-second stalls barely nudge an average. Write your target as a percentile, such as "p99 under 300 ms", and set your alerts on that number instead.
 
     ## Slow calls add up
@@ -197,6 +331,8 @@ export default defineLesson({
     for comments. The phone can only finish drawing the screen once the
     slowest of those calls comes back.
 
+    ${threeCalls}
+
     Picture a page that makes 50 backend calls, where each call has an
     independent 1% chance of running slower than its p99. The chance that one
     call is fast is 0.99. The chance that all 50 come back fast is 0.99
@@ -220,6 +356,8 @@ export default defineLesson({
     ${cue("busy", "During the evening peak, requests arrive almost as fast as the server finishes them")},
     so new arrivals find a line waiting ahead of them.
 
+    ${queueWait}
+
     The share of time a server spends doing work is its utilization. At 50%
     utilization, a new request often finds the server free. At 90%, it almost
     always lands behind others. The surprise is how steep the wait becomes. In
@@ -254,6 +392,8 @@ export default defineLesson({
     find that ${cue("little", "about 9 requests are in the system at any moment")},
     either waiting in line or being served.
 
+    ${littlesLaw}
+
     What makes Little's law so dependable is that it holds for any steady
     system whose queue is not growing without bound, no matter how uneven the
     traffic pattern is. It is a practical tool for sizing. If our photo app
@@ -286,6 +426,8 @@ export default defineLesson({
     capacity or trim the work per request so traffic drops back below
     capacity. Chapter 8 returns to this idea under back pressure.
 
+    ${overload}
+
     ## Slow servers at Google
 
     In 2013, two Google engineers, Jeffrey Dean and Luiz André Barroso,
@@ -323,6 +465,8 @@ export default defineLesson({
     count how many of them a single request waits on. The wider the fan-out,
     the more the slowest leaf sets the user's wait.
 
+    ${fanOut}
+
     ## In a design review
 
     Ask these questions about latency and throughput in any design review.
@@ -338,6 +482,8 @@ export default defineLesson({
     evening peak, the feed serves about 7,000 requests a second, three times
     the daily average, with a p99 under 300 ms. Each server stays at or below
     70% utilization so normal bursts do not build long queues.
+
+    ${reviewNumbers}
   `,
   quiz: [
     {
````
