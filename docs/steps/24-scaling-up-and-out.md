# Step 24. Lesson 1.3, scaling up and scaling out

## Why

The course follows `docs/curriculum.md` in chapter order, and lesson 1.3 comes next. It shows the two ways to add capacity, a bigger machine or more machines. It explains what each costs, why servers must be stateless before you add more, how many servers survive a failure, and why the database becomes the next bottleneck. The load balancer, caching and database chapters build on it.

This step adds one lesson file and the tests that a fourth lesson needs. It changes no app code. Step 23 (numbered sidebar chapter headings) touches different files, so the two steps can merge in either order.

## Branch and coder rules

- Branch `step/24-scaling-up-and-out` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 6 files below may change, and only by the 2 commands in "How to do it". Do not edit any other file.
- Do not change the lesson text, captions, quiz or tests. Opus wrote and unslopped them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the content to make it pass.
- Do not kill processes. Do not commit, push or open a PR. Opus does those after review.

## What changes

### 1. The lesson

`src/content/lessons/scaling-up-and-out/lesson.ts` is a new file, given in Appendix A byte for byte. Its fields:

- Chapter `foundations`, order 3, 7 minutes, 1,232 words.
- 8 sections. These are "Slow every evening", "Slow for one user or slow for many", "Scaling up", "Scaling out", "What makes scaling out hard", "When a server fails", "The bottleneck moves" and "In a design review".
- The diagram has a phone, a load balancer, 3 servers in a column and a database. The load balancer and Servers 2 and 3 start hidden. It has 9 steps, `arrive`, `peak`, `up`, `grow`, `out`, `spread`, `lost`, `shared` and `db`. The text cues each step once.
- 8 quiz questions. Q1 tests performance against scalability, Q2 and Q6 test when to scale up, Q3 tests statelessness, Q4 tests where the bottleneck moves, Q5 is a failure calculation, Q7 tests the single point of failure, and Q8 orders the move from one server to three.
- 5 further-reading links. All 5 returned 200 on 2026-11-03.

The numbers come from one model. One server runs at 95% at the peak. A machine with 4 times the cores runs the same load at about 25%. Traffic then grows 4 times, so the big machine is back at 95%. Three of those machines each run at about 95% ÷ 3 ≈ 32%. If one fails, the other two run at 32% × 3 ÷ 2 = 48%. In Q5, 3 servers at 60% put 180% of one server's load on 2 servers, which is 90% each.

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. A new test checks the new lesson's chapter, order, minutes, heading ids, step ids, quiz length and source URLs.
- `e2e/helpers.ts`. A new `SCALING_CORRECT` list holds the right answers to the new quiz.
- `e2e/quiz.spec.ts`. A new test answers the new quiz with `SCALING_CORRECT` and expects 8/8. The pass mark is 70%, so a key with one wrong answer still passes the quiz. Only this test catches it.
- `e2e/progress.spec.ts`. The Continue card test now walks 4 lessons in reading order. After the latency quiz passes, the count is 2 of 4 and the card points at the new lesson. After the new quiz passes, the count is 3 of 4 and the card points at the load balancer. After that quiz, the count is 4 of 4. The reset test expects "0 of 4 lessons done".
- `e2e/scene-static.spec.ts`. A new test opens the lesson and checks its first heading, 9 cues, 3 visible boxes and "Step 1 of 9". At `lost`, Server 3 is visible and has the note "who is this?". At `db`, the database has the note "CPU 90%".

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/24-scaling-up-and-out.md > /tmp/step24.diff && git apply /tmp/step24.diff`
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A.
   `mkdir -p src/content/lessons/scaling-up-and-out && awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/24-scaling-up-and-out.md > src/content/lessons/scaling-up-and-out/lesson.ts && git status --short`
   The status must list exactly these 6 lines, in any order.
   `M e2e/helpers.ts`, `M e2e/progress.spec.ts`, `M e2e/quiz.spec.ts`, `M e2e/scene-static.spec.ts`, `M src/content/curriculum.test.ts` and `?? src/content/lessons/scaling-up-and-out/`.
3. Install. `pnpm install > /tmp/install24.log 2>&1; tail -3 /tmp/install24.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 80 tests.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 198 tests in 14 files.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used" /tmp/e.log`. Main has 56 tests and this step adds 2, so 58. If step 23 merged first, main has 57 and the count is 59.

Other sessions on this machine sometimes use ports 4173 and 4174. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED`, that run does not count. Run it again, up to 3 extra times. Report every run.

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

- Removing the `db` cue from the text fails the build's content check "every scene step except the first is cued in the text".
- Moving Server 3 to Server 2's cell fails the build with "two and three share a cell".
- Changing the Q5 answer in `SCALING_CORRECT` to "About 120%" fails the new quiz.spec test with 7/8.
- With all of it in place, build passed 80, unit 198 in 14 files and e2e 58, 3 times each.
- At 390 px wide, the page's `scrollWidth` is 390. The diagram scrolls sideways inside its frame, the same as the load balancer lesson.

## Originality

Opus wrote the lesson, then read the primer's "Performance vs scalability" section (README lines 412 to 425) and its "Horizontal scaling" section (lines 703 to 711). The lesson shares only the standard ideas. A performance problem is slow for one user, and a scalability problem is slow under load. Servers that scale out must be stateless, with sessions in a shared store. The 4 am test, the Inkwell numbers, the failure sizing, the sticky routing tradeoff, the moving bottleneck and the quiz are not in those sections.

## What you see

The home page lists Foundations with 3 cards, "What system design is", "Latency and throughput" and then "Scaling up and scaling out" at 7 min. The lesson's diagram starts with a phone, one server and a database. The server's CPU fills, a bigger machine empties it, and growth fills it again. Then a load balancer and 2 more servers appear and split the requests. A request for a signed-in user reaches Server 3, which does not know the session and returns a 401. Sessions move to the database, and the database's CPU climbs to 90%.

## Appendix A. `src/content/lessons/scaling-up-and-out/lesson.ts`

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "client", label: "Phone", at: [0, 1] },
  lb: { kind: "lb", label: "Load balancer", at: [2, 1], hidden: true },
  one: { kind: "server", label: "Server 1", at: [4, 0] },
  two: { kind: "server", label: "Server 2", at: [4, 1], hidden: true },
  three: { kind: "server", label: "Server 3", at: [4, 2], hidden: true },
  db: { kind: "db", label: "Database", at: [6, 1] },
}).steps((s) => ({
  arrive: s.step(
    "Inkwell runs on one server and one database. The server reads the feed from the database and sends it back.",
    s.send("phone", "one", "GET /feed"),
    s.send("one", "db", "SELECT"),
    s.send("db", "one", "rows", "data"),
    s.send("one", "phone", "200", "response"),
  ),
  peak: s.step(
    "At the evening peak, the server's CPU reaches 95%, and feeds load slowly.",
    s.parallel(s.send("phone", "one", "GET /feed"), s.send("phone", "one", "GET /feed")),
    s.focus("one"),
    s.note("one", "CPU 95%"),
  ),
  up: s.step(
    "The team moves the app to a machine with 4 times the cores. The same load now uses about a quarter of it.",
    s.focus("one"),
    s.note("one", "4x cores, CPU 25%"),
  ),
  grow: s.step(
    "A year later, traffic is 4 times higher, and the big machine is back at 95%. The next size up is the largest one sold.",
    s.parallel(s.send("phone", "one", "GET /feed"), s.send("phone", "one", "GET /feed")),
    s.note("one", "CPU 95% again"),
  ),
  out: s.step(
    "Two more servers start beside it, and a load balancer in front splits the requests between all three.",
    s.show("lb"),
    s.show("two"),
    s.show("three"),
    s.send("phone", "lb", "GET /feed"),
    s.send("lb", "two", "GET /feed"),
  ),
  spread: s.step(
    "Each server gets about a third of the requests and runs at about 32%.",
    s.parallel(s.send("lb", "one", "GET /feed"), s.send("lb", "two", "GET /feed"), s.send("lb", "three", "GET /feed")),
    s.note("lb", "a third each"),
  ),
  lost: s.step(
    "A user signed in on Server 1, which kept the session in its memory. The next request lands on Server 3, which has no record of it.",
    s.send("phone", "lb", "GET /feed"),
    s.send("lb", "three", "GET /feed"),
    s.note("three", "who is this?"),
    s.send("three", "lb", "401", "error"),
    s.send("lb", "phone", "401", "error"),
  ),
  shared: s.step(
    "The servers stop keeping user data in memory. Sessions live in the database, so any server can answer any request.",
    s.parallel(s.send("one", "db", "SELECT"), s.send("two", "db", "SELECT"), s.send("three", "db", "SELECT")),
    s.note("db", "sessions here"),
  ),
  db: s.step(
    "All three servers use the one database. It took the whole 4 times growth, and its CPU is now at 90%.",
    s.focus("db"),
    s.note("db", "CPU 90%"),
  ),
}))

export default defineLesson({
  title: "Scaling up and scaling out",
  summary: "When one server is not enough, buy a bigger one or add more. What each costs, why state makes adding servers hard, and where the load goes next.",
  track: "foundations",
  order: 3,
  tags: [
    "scaling",
    "scalability",
    "vertical scaling",
    "horizontal scaling",
    "scale up",
    "scale out",
    "stateless",
    "bottleneck",
  ],
  sources: [
    {
      use: "link",
      repo: "donnemartin/system-design-primer",
      title: "The System Design Primer: performance vs scalability",
      url: "https://github.com/donnemartin/system-design-primer#performance-vs-scalability",
    },
    {
      use: "link",
      title: "Werner Vogels: A word on scalability",
      url: "https://www.allthingsdistributed.com/2006/03/a_word_on_scalability.html",
    },
    {
      use: "link",
      title: "The Twelve-Factor App: Processes",
      url: "https://12factor.net/processes",
    },
    {
      use: "link",
      title: "AWS Well-Architected: Make systems stateless where possible",
      url: "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_stateless.html",
    },
    {
      use: "link",
      title: "Azure Architecture Center: Autoscaling",
      url: "https://learn.microsoft.com/en-us/azure/architecture/best-practices/auto-scaling",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## Slow every evening

    ${cue("arrive", "Inkwell started on one server and one database")}. The
    server runs the app, and the database holds the photos, users and
    follows. For a year that was enough. Now
    ${cue("peak", "the server's CPU reaches 95% every evening")}, and the
    feed takes seconds to load. The previous lesson showed why. A server
    that busy makes every request wait in its queue.

    The team has two ways to add capacity. It can move the app to a bigger
    machine, which is scaling up. Or it can run the app on more machines,
    which is scaling out. This lesson compares the two and the changes each
    one needs.

    ## Slow for one user or slow for many

    First, check that more capacity is the fix. Open the feed at 4 am, when
    almost nobody else is online.

    - If it is slow even then, the system has a performance problem. One request does too much work, for example a query that reads every photo a user follows. More machines will not help, because each request is still slow on its own. Fix the work.
    - If it is fast at 4 am and slow at 9 pm, the system has a scalability problem. Each request is fine, but the system cannot serve enough of them at once. More capacity helps.

    Inkwell's feed loads in 80 ms at 4 am, so it has a scalability problem.

    > pitfall: Adding servers to fix a performance problem costs money and changes nothing for the user. Measure one request on a quiet system before you add capacity.

    ## Scaling up

    Scaling up, also called vertical scaling, means a bigger machine with
    more cores, more memory or faster disks. The code does not change. It
    runs on one machine, as before.
    ${cue("up", "The team moves the app to a machine with 4 times the cores")},
    and the evening load now uses about a quarter of it.

    Scaling up is the fastest fix when it is available. It has these limits.

    - **Cost.** Within one family of cloud machines, twice the cores costs about twice as much. A bigger machine saves nothing per core.
    - **A ceiling.** Every family has a largest size. When the app outgrows it, scaling up is over.
    - **Downtime.** Moving to a bigger machine usually means stopping the app and starting it on the new one. With one machine, users see that restart.
    - **One machine.** All the work still runs on one machine, so one failure stops everything.

    Inkwell keeps growing.
    ${cue("grow", "A year later, traffic is 4 times higher")}, and the big
    machine is back at 95%. The next size up is the largest one sold, and it
    would last only a few months.

    ## Scaling out

    Scaling out, also called horizontal scaling, means more machines that
    each run the same app.
    ${cue("out", "Two more servers start, and a load balancer in front splits the requests")}
    between them. The phone talks only to the load balancer and never learns
    how many servers there are. Chapter 4 covers load balancers in detail.

    With 3 servers,
    ${cue("spread", "each one gets about a third of the requests")} and runs
    at about 32%. When traffic grows again, the team adds a fourth server
    without stopping the other three. An autoscaling rule can do this on its
    own. It adds a server when the average CPU passes a mark such as 70%,
    and removes one when the load falls at night.

    Scaling out has these costs.

    - More machines to deploy, watch and update.
    - A load balancer, which is one more part that can fail.
    - Servers that must not keep anything a later request needs, which the next section explains.

    ## What makes scaling out hard

    Data that a server keeps between requests is called state. Before
    scaling out, Inkwell's server kept each signed-in user's session in its
    own memory. With one server, that worked. With three, it breaks.
    ${cue("lost", "A user signs in on Server 1, and the next request lands on Server 3")},
    which has no record of the session. The user is asked to sign in again,
    on every request that goes to a different server.

    The fix is to make the servers stateless. A stateless server keeps
    nothing between requests that another server would need.
    ${cue("shared", "Sessions move to the database")}, or to a shared cache,
    and uploaded photos go to shared storage instead of a server's local
    disk. Then any server can answer any request, and a server can be added
    or removed at any time.

    > tradeoff: A load balancer can send each user back to the server that holds the session, which is called sticky routing. It avoids changing the code, but load becomes uneven, and the sessions on a server are lost when it fails. Moving state out of the servers costs more work once and removes both problems.

    Not every part can be stateless. The database is state, by definition.
    Its job is to keep the data. That is why databases are the hardest part
    to scale out, and why chapter 6 is about them.

    ## When a server fails

    One server is a single point of failure. When it crashes, or restarts
    for an update, Inkwell is down, however big the machine is.

    With 3 servers, the load balancer stops sending requests to the failed
    one, and the other two carry the load. Each was at 32%, so each now runs
    at about 48%. Users notice nothing.

    That works only if the servers that remain have room for the extra load.
    If each of the 3 ran at 80%, the 2 survivors would each need 120%. They
    would overload, and their queues would grow until requests time out. So
    size the servers so that all but one can carry the peak. With 3
    servers, keep each below about 60% at the peak.

    ## The bottleneck moves

    Scaling out the servers does not scale what they share. Every request
    still reads from the one database, and it took the whole 4 times growth
    in traffic.
    ${cue("db", "Its CPU is now at 90%")}, so it is the next bottleneck. The
    servers will wait on it the same way users waited on the one server.

    This is the normal pattern. Fixing one bottleneck moves the load to the
    next part in line. After the servers come the database, the cache and
    the network. Write down the next bottleneck in the design before traffic
    reaches it.
    For Inkwell, the next steps are a cache in front of the database for
    feed reads, and copies of the database that serve reads.

    ## In a design review

    Ask these questions about any design.

    1. Is the system slow for one user, or only under load?
    2. Which part runs out first at the peak, and how much room does it have?
    3. Can any server answer any request? Where do sessions and uploads live?
    4. If one server fails at the peak, can the others carry its load?
    5. After this part scales, which part is next?

    When you propose scaling, say which kind and why. For Inkwell it could
    be this. Keep the feed servers stateless and run at least 3 of them, so
    one can fail at the peak. Run the database on a large machine for now,
    because it takes every write. Plan read copies of it before its CPU
    passes 70%.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "The feed takes 3 s to load at 4 am, when almost nobody else is online. What is the first thing to do?",
      options: [
        { text: "Find out why one request does so much work", correct: true },
        { text: "Add more servers", why: "The system is slow with almost no load, so more servers would each still take 3 s per request." },
        { text: "Move the app to a bigger machine", why: "A bigger machine helps when the server is busy. At 4 am it is nearly idle, so the time is in the work itself." },
      ],
      explain: "Slow for one user is a performance problem. Fix the work before adding capacity.",
    },
    {
      kind: "choice",
      prompt: "Inkwell's one server hits 95% CPU every evening. It keeps sessions in memory, and the team must fix the slowdown this week with no code changes. What do they do?",
      options: [
        { text: "Move the app to a bigger machine", correct: true },
        { text: "Add 2 servers behind a load balancer", why: "The sessions live in one server's memory, so users would be signed out whenever a request reached another server." },
        { text: "Add a bigger database", why: "The server's CPU is what is full. The database is not the bottleneck yet." },
      ],
      explain: "Scaling up needs no code changes, so it is the fastest fix. Moving sessions out of memory comes next, before the bigger machine fills up.",
      replay: "up",
    },
    {
      kind: "choice",
      prompt: "What must be true before you can add servers behind a load balancer?",
      options: [
        { text: "Any server can answer any request, because user data lives outside the servers", correct: true },
        { text: "Every server has the same number of cores", why: "A load balancer can send more requests to bigger servers. The servers do not need to match." },
        { text: "The database runs on the biggest machine available", why: "The database size does not decide whether servers can share the requests. Where the state lives does." },
      ],
      explain: "A stateless server keeps nothing between requests, so the balancer can send any request to any server.",
      replay: "shared",
    },
    {
      kind: "choice",
      prompt: "Inkwell scales out from 1 server to 3, and traffic keeps growing. Which part becomes the bottleneck next?",
      options: [
        { text: "The database that all 3 servers share", correct: true },
        { text: "The phone", why: "Each phone sends its own few requests. It does not carry the growing total." },
        { text: "Server 1, because it was there first", why: "The load balancer splits the requests evenly, so Server 1 gets no more than the others." },
      ],
      explain: "Scaling out the servers sends all their queries to the one shared database, so the load moves there.",
      replay: "db",
    },
    {
      kind: "choice",
      prompt: "3 servers each run at 60% CPU at the peak. One fails. About how busy are the other two?",
      options: [
        { text: "About 90%", correct: true },
        { text: "About 60%", why: "The failed server's requests do not disappear. The other two now share them." },
        { text: "About 120%", why: "That gives the failed server's whole 60% to each survivor. The two share it, so each gets 30% more." },
      ],
      explain: "The total load is 3 times 60%, which is 180%. Split over 2 servers, that is 90% each, close to overload.",
    },
    {
      kind: "choice",
      prompt: "Which part of Inkwell is the best fit for scaling up rather than out, for now?",
      options: [
        { text: "The main database, which takes every write", correct: true },
        { text: "The stateless feed servers", why: "Stateless servers are the easiest part to scale out, and several of them survive a failure." },
        { text: "The workers that resize uploaded photos", why: "Each resize job is independent, so adding more workers is easy." },
      ],
      explain: "The database holds the state, so splitting it across machines is hard. A bigger machine gives the team time to plan read copies and sharding, which chapter 6 covers.",
    },
    {
      kind: "choice",
      prompt: "Inkwell's one server is only 40% busy at the peak, but the app is down whenever the server restarts for updates. What fixes that?",
      options: [
        { text: "Run at least 2 servers behind a load balancer", correct: true },
        { text: "Move to a bigger machine", why: "A bigger machine is still one machine. When it restarts, the app is still down." },
        { text: "Restart the server less often", why: "That makes the outages rarer, but each one still takes the whole app down." },
      ],
      explain: "Scaling out also removes the single point of failure. One server can restart while the other serves users.",
    },
    {
      kind: "order",
      prompt: "Put these steps for moving Inkwell from one server to three in order.",
      items: [
        "Time one request at 4 am to confirm that load is the problem",
        "Move sessions and uploads out of the server into shared stores",
        "Start 2 more servers behind a load balancer",
        "Watch the shared database, which now takes all the queries",
      ],
      explain: "First confirm that more capacity is the fix. The server must be stateless before others join it, and once they do, the load moves to the database.",
    },
  ],
})
```

## Appendix B. Test changes

````diff
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index e6c5d82..c74f721 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -38,6 +38,17 @@ export const LATENCY_CORRECT: readonly QuizAnswer[] = [
   { radio: "Analytics events that nobody waits on" },
 ]
 
+export const SCALING_CORRECT: readonly QuizAnswer[] = [
+  { radio: "Find out why one request does so much work" },
+  { radio: "Move the app to a bigger machine" },
+  { radio: "Any server can answer any request, because user data lives outside the servers" },
+  { radio: "The database that all 3 servers share" },
+  { radio: "About 90%" },
+  { radio: "The main database, which takes every write" },
+  { radio: "Run at least 2 servers behind a load balancer" },
+  { order: "solved" },
+]
+
 export async function solveOrder(page: Page) {
   const read = () => page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
     rows.map((row) => Number(row.getAttribute("data-item"))),
diff --git a/e2e/progress.spec.ts b/e2e/progress.spec.ts
index 6781be1..ce6ad00 100644
--- a/e2e/progress.spec.ts
+++ b/e2e/progress.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { LATENCY_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
+import { LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
 
 const lessonPath = "/#/learn/load-balancer"
 const lessonMark = (page: import("@playwright/test").Page) =>
@@ -16,7 +16,7 @@ test("pass the quiz, reload, the sidebar shows a check for Load balancer", async
 
 test("home Continue card points at the first not-done lesson", async ({ page }) => {
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 3 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 4 lessons done")
   const next = page.getByTestId("next-lesson")
   await expect(next).toHaveAttribute("href", "#/learn/what-system-design-is")
   await expect(next).toHaveAttribute("data-status", "new")
@@ -28,13 +28,19 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/learn/what-system-design-is")
   await passQuiz(page, SYSTEM_DESIGN_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("1 of 3 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("1 of 4 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/latency-and-throughput")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/latency-and-throughput")
   await passQuiz(page, LATENCY_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("2 of 3 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("2 of 4 lessons done")
+  await expect(next).toHaveAttribute("href", "#/learn/scaling-up-and-out")
+  await expect(next).toHaveAttribute("data-status", "new")
+  await gotoReady(page, "/#/learn/scaling-up-and-out")
+  await passQuiz(page, SCALING_CORRECT)
+  await gotoReady(page, "/#/")
+  await expect(page.getByTestId("progress-count")).toHaveText("3 of 4 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/load-balancer")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, lessonPath)
@@ -42,7 +48,7 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/")
   await expect(page.getByTestId("next-lesson")).toHaveCount(0)
   await expect(page.getByTestId("all-done")).toBeVisible()
-  await expect(page.getByTestId("progress-count")).toHaveText("3 of 3 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("4 of 4 lessons done")
 })
 
 test("Reset progress clears marks", async ({ page }) => {
@@ -55,7 +61,7 @@ test("Reset progress clears marks", async ({ page }) => {
   await page.getByRole("button", { name: "Reset progress" }).click()
   await page.getByRole("button", { name: "Reset", exact: true }).click()
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 3 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 4 lessons done")
   expect(await page.evaluate(() => localStorage.getItem("sd.progress"))).toBe(null)
   await gotoReady(page, "/#/")
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
diff --git a/e2e/quiz.spec.ts b/e2e/quiz.spec.ts
index cffd549..d67eddc 100644
--- a/e2e/quiz.spec.ts
+++ b/e2e/quiz.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { CORRECT, LATENCY_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
+import { CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
 
 const path = "/#/learn/load-balancer"
 
@@ -32,6 +32,14 @@ test("the latency-and-throughput answer key scores 8/8", async ({ page }) => {
   await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
 })
 
+test("the scaling-up-and-out answer key scores 8/8", async ({ page }) => {
+  await gotoReady(page, "/#/learn/scaling-up-and-out")
+  await answerQuiz(page, SCALING_CORRECT)
+
+  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
+  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
+})
+
 test("a wrong choice shows its why", async ({ page }) => {
   await gotoReady(page, path)
   await answerQuiz(page, [{ radio: "Restarts Server A" }, ...CORRECT.slice(1)])
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index b604c0f..dffaee5 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -101,3 +101,20 @@ test("latency-and-throughput shows 9 cues, 'wait' notes the queue wait and 'shed
   await gotoReady(page, `${lesson}/step/shed`)
   await expect(queue.getByTestId("scene-note")).toHaveText("full")
 })
+
+test("scaling-up-and-out shows 9 cues, 'lost' notes the missing session and 'db' marks the database busy", async ({ page }) => {
+  const lesson = "/#/learn/scaling-up-and-out"
+  await gotoReady(page, lesson)
+  await expect(page.getByRole("heading", { level: 2, name: "Slow every evening" })).toBeVisible()
+  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(9)
+  const scene = page.getByTestId("scene")
+  const three = scene.locator('[data-scene-node="three"]')
+  const db = scene.locator('[data-scene-node="db"]')
+  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(3)
+  await expect(page.getByText("Step 1 of 9")).toBeVisible()
+  await gotoReady(page, `${lesson}/step/lost`)
+  await expect(three).toHaveAttribute("data-visible", "true")
+  await expect(three.getByTestId("scene-note")).toHaveText("who is this?")
+  await gotoReady(page, `${lesson}/step/db`)
+  await expect(db.getByTestId("scene-note")).toHaveText("CPU 90%")
+})
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index e0aee03..ebd92d7 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -210,6 +210,35 @@ test("the real curriculum holds the latency-and-throughput lesson", () => {
   ])
 })
 
+test("the real curriculum holds the scaling-up-and-out lesson", () => {
+  const lesson = curriculum.bySlug.get("scaling-up-and-out")
+
+  expect(lesson?.track).toBe("foundations")
+  expect(lesson?.order).toBe(3)
+  expect(lesson?.minutes).toBe(7)
+  expect(lesson?.headings.map((heading) => heading.id)).toEqual([
+    "slow-every-evening",
+    "slow-for-one-user-or-slow-for-many",
+    "scaling-up",
+    "scaling-out",
+    "what-makes-scaling-out-hard",
+    "when-a-server-fails",
+    "the-bottleneck-moves",
+    "in-a-design-review",
+  ])
+  expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
+    "arrive", "peak", "up", "grow", "out", "spread", "lost", "shared", "db",
+  ])
+  expect(lesson?.quiz).toHaveLength(8)
+  expect(lesson?.sources.map((source) => source.url)).toEqual([
+    "https://github.com/donnemartin/system-design-primer#performance-vs-scalability",
+    "https://www.allthingsdistributed.com/2006/03/a_word_on_scalability.html",
+    "https://12factor.net/processes",
+    "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_stateless.html",
+    "https://learn.microsoft.com/en-us/azure/architecture/best-practices/auto-scaling",
+  ])
+})
+
 test("TRACKS lists the 12 chapters in reading order", () => {
   expect(TRACKS.map((track) => track.id)).toEqual([
     "foundations", "estimation", "network", "edge", "application", "data",
````
