# Step 26. Lesson 1.4, availability and failure

## Why

The course follows `docs/curriculum.md` in chapter order, and lesson 1.4 comes next. It turns nines into downtime and shows why parts in a row lower availability while copies side by side raise it. It also shows how to find a single point of failure, how a standby database takes over after missed heartbeats, and when every copy can serve at once. Lesson 1.3 ended with the one database as the next weak point, and this lesson removes it.

The lesson follows the course's new example rule in `docs/curriculum.md`. It opens with a small unnamed app with one database. It then works through a public case study, GitHub's October 2018 outage, where a 43-second network cut started a database failover that left the site degraded for 24 hours. Opus checked every fact in that section against GitHub's post-incident analysis, which is in the lesson's sources.

This step adds one lesson file and the tests that a fifth lesson needs. It changes no app code.

## Branch and coder rules

- Branch `step/26-availability` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 6 files below may change, and only by the 2 commands in "How to do it". Do not edit any other file.
- Do not change the lesson text, captions, quiz or tests. Opus wrote and unslopped them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the content to make it pass.
- Do not kill processes.

## What changes

### 1. The lesson

`src/content/lessons/availability/lesson.ts` is a new file, given in Appendix A byte for byte. Its fields:

- Chapter `foundations`, order 4, 8 minutes.
- 9 sections. These are "Down at 2 am", "Counting nines", "Parts in a row multiply", "Copies side by side", "Single points of failure", "A standby takes over", "Every copy active", "A failover at GitHub" and "In a design review".
- The diagram has a phone, the app servers, a primary database and a standby database. It has 9 steps, `arrive`, `copy`, `beat`, `crash`, `notice`, `promote`, `retry`, `rejoin` and `both`. The primary copies writes and sends heartbeats to the standby, then crashes. The standby notices the missed heartbeats, promotes itself and serves the next request. The old primary comes back as the standby. The last step shows the app servers as active-active. The text cues each step once.
- 8 quiz questions. Q1 turns 99.9% into minutes a month. Q2 is a chain calculation and Q3 a side by side calculation. Q4 spots the single point of failure. Q5 and Q6 test decisions about shared failure causes and active-active. Q7 asks why GitHub's failover caused trouble. Q8 orders the steps of a failover.
- 6 further-reading links. All 6 returned 200 on 2026-11-03. The last one is GitHub's post-incident analysis.

The numbers come from a 365-day year of 8,760 hours. 99.9% leaves 8.76 hours a year, or 43.2 minutes in a 30-day month. 99.99% leaves 52.6 minutes a year and 4.3 a month. 99.999% leaves 5.3 minutes a year. In a row, 0.999² ≈ 0.998, 0.999³ ≈ 0.997 and 0.999⁵ ≈ 0.995, which is 43.7 hours a year. Side by side, 0.001 × 0.001 = 0.000001, so 99.9999%, and two 99% copies give 99.99%.

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. A new test checks the new lesson's chapter, order, 8 minutes, 9 heading ids, step ids, quiz length and 6 source URLs.
- `e2e/helpers.ts`. A new `AVAILABILITY_CORRECT` list holds the right answers to the new quiz.
- `e2e/quiz.spec.ts`. A new test answers the new quiz with `AVAILABILITY_CORRECT` and expects 8/8. The pass mark is 70%, so a key with one wrong answer still passes the quiz. Only this test catches it.
- `e2e/progress.spec.ts`. The Continue card test now walks 5 lessons in reading order. After the scaling quiz passes, the count is 3 of 5 and the card points at the new lesson. After the new quiz passes, the count is 4 of 5 and the card points at the load balancer. After that quiz, the count is 5 of 5. The reset test expects "0 of 5 lessons done".
- `e2e/scene-static.spec.ts`. A new test opens the lesson and checks its first heading, 9 cues, 4 visible boxes and "Step 1 of 9". At `notice`, the primary is down and the standby has the note "no heartbeat for 3 s". At `rejoin`, the primary is up again and has the note "now the standby".

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/26-availability.md > /tmp/step26.diff && git apply /tmp/step26.diff`
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A.
   `mkdir -p src/content/lessons/availability && awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/26-availability.md > src/content/lessons/availability/lesson.ts && git status --short`
   The status must list exactly these 6 lines, in any order.
   `M e2e/helpers.ts`, `M e2e/progress.spec.ts`, `M e2e/quiz.spec.ts`, `M e2e/scene-static.spec.ts`, `M src/content/curriculum.test.ts` and `?? src/content/lessons/availability/`.
3. Install. `pnpm install > /tmp/install26.log 2>&1; tail -3 /tmp/install26.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 85 tests. Main runs 80, and this step adds 4 lesson checks and 1 curriculum test.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 204 tests in 14 files.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e.log`. 62 tests. Main has 60, and this step adds 2.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run.

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

- Removing the `rejoin` cue from the text fails the build's content check "every scene step except the first is cued in the text".
- Moving the app servers to the cell between the 2 databases fails the build's layout check "no edge crosses a node".
- Removing `s.up("primary")` from the `rejoin` step fails the new scene-static test.
- Changing the Q7 answer in `AVAILABILITY_CORRECT` to "The failover took too long to start" fails the new quiz.spec test with 7/8.
- With all of it in place, build passed 85, unit 203 in 14 files and e2e 61. e2e passed 5 times. One more run had 3 `ERR_TIMED_OUT` failures from machine load and did not count. Those runs were on main before step 25, which adds 1 unit test and 1 e2e test. The counts in "Commands that must pass" include them.
- The patch still applies cleanly on top of step 25, and the phone in Appendix A uses the `mobile` kind from step 25. Start this step only after step 25 is merged.
- With step 25's patch and this one applied together on main, build passed 85, unit 204 in 14 files and e2e 62.
- No text on the page contains "Inkwell".
- A fact-check of the GitHub section against the post found 3 claims the post does not support. Opus rewrote them before writing this spec. The post does not say where the copies sit, that failing back would have lost writes, or that latency caused the outage.
- At 390 px wide, the page's `scrollWidth` is 390. The diagram scrolls sideways inside its frame, the same as the earlier lessons.

## Originality

Opus wrote the lesson, then read the primer's "Fail-over" section (README lines 503 to 525) and its "Availability in numbers" section (lines 535 to 580). The lesson shares the standard terms and formulas, which are nines, active-passive, active-active, heartbeats, the multiply rules for parts in a row and side by side, and the risk of losing writes that were not yet copied. It also uses the same 99.9% × 99.9% ≈ 99.8% example, which `docs/curriculum.md` names and which is plain arithmetic. The small app's outage, the GitHub case study told in our own words, the planned downtime note, the shared failure causes, the timeout tradeoff, the single point of failure walk, the design review and the quiz are not in those sections.

## What you see

The home page lists Foundations with 4 cards, the last one "Availability and failure". The card shows 8 min. The lesson's diagram shows a phone, the app servers and two databases, the primary above the standby. Writes and heartbeats flow from the primary to the standby. The primary gets a cross, the standby notes 3 seconds without a heartbeat, takes over, and the next request succeeds through it. The old primary comes back as the standby, and the last step shows the app servers serving with all copies active. Below the active-active section, "A failover at GitHub" retells the 2018 outage and links the source.

## Appendix A. `src/content/lessons/availability/lesson.ts`

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
  servers: { kind: "server", label: "App servers", at: [2, 1] },
  primary: { kind: "db", label: "Primary", at: [5, 0] },
  standby: { kind: "db", label: "Standby", at: [5, 2] },
}).steps((s) => ({
  arrive: s.step(
    "The app servers read from one database, the primary. A second database, the standby, waits beside it.",
    s.send("phone", "servers", "GET /feed"),
    s.send("servers", "primary", "SELECT"),
    s.send("primary", "servers", "rows", "data"),
    s.send("servers", "phone", "200", "response"),
  ),
  copy: s.step(
    "Every write that reaches the primary is also sent to the standby, so the standby holds the same data.",
    s.send("phone", "servers", "POST /photo"),
    s.send("servers", "primary", "INSERT"),
    s.send("primary", "standby", "copy", "data"),
    s.note("standby", "same data"),
  ),
  beat: s.step(
    "Once a second, the primary sends the standby a short message that says it is alive. This is a heartbeat.",
    s.send("primary", "standby", "heartbeat"),
    s.note("primary", "every 1 s"),
  ),
  crash: s.step(
    "The primary crashes. Every request now fails.",
    s.down("primary"),
    s.send("phone", "servers", "GET /feed"),
    s.send("servers", "phone", "500", "error"),
  ),
  notice: s.step(
    "The standby gets no heartbeat for 3 seconds in a row, so it decides the primary is gone.",
    s.focus("standby"),
    s.note("standby", "no heartbeat for 3 s"),
  ),
  promote: s.step(
    "The standby promotes itself to primary and takes over the address the app servers connect to.",
    s.focus("standby"),
    s.note("standby", "now the primary"),
  ),
  retry: s.step(
    "The next request reaches the new primary and succeeds.",
    s.send("phone", "servers", "GET /feed"),
    s.send("servers", "standby", "SELECT"),
    s.send("standby", "servers", "rows", "data"),
    s.send("servers", "phone", "200", "response"),
    s.note("standby", "now the primary"),
  ),
  rejoin: s.step(
    "The old primary is repaired and comes back as the new standby. It copies the writes it missed.",
    s.up("primary"),
    s.send("standby", "primary", "copy", "data"),
    s.note("primary", "now the standby"),
    s.note("standby", "now the primary"),
  ),
  both: s.step(
    "The app servers work another way. All 3 serve traffic all the time, so losing one needs no switch at all.",
    s.parallel(s.send("phone", "servers", "GET /feed"), s.send("phone", "servers", "GET /feed")),
    s.focus("servers"),
    s.note("servers", "3 copies, all active"),
  ),
}))

export default defineLesson({
  title: "Availability and failure",
  summary: "How much downtime each number of nines allows, why parts in a row lower it and copies side by side raise it, and how a standby takes over.",
  track: "foundations",
  order: 4,
  tags: [
    "availability",
    "nines",
    "downtime",
    "single point of failure",
    "redundancy",
    "failover",
    "heartbeat",
    "active-passive",
    "active-active",
  ],
  sources: [
    {
      use: "link",
      repo: "donnemartin/system-design-primer",
      title: "The System Design Primer: availability in numbers",
      url: "https://github.com/donnemartin/system-design-primer#availability-in-numbers",
    },
    {
      use: "link",
      title: "Google SRE book: Embracing risk",
      url: "https://sre.google/sre-book/embracing-risk/",
    },
    {
      use: "link",
      title: "AWS Well-Architected: Availability",
      url: "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/availability.html",
    },
    {
      use: "link",
      title: "PostgreSQL documentation: Failover",
      url: "https://www.postgresql.org/docs/current/warm-standby-failover.html",
    },
    {
      use: "link",
      title: "Patterns of Distributed Systems: HeartBeat",
      url: "https://martinfowler.com/articles/patterns-of-distributed-systems/heartbeat.html",
    },
    {
      use: "link",
      title: "GitHub blog: October 21 post-incident analysis",
      url: "https://github.blog/news-insights/company-news/oct21-post-incident-analysis/",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## Down at 2 am

    Start with a small app.
    ${cue("arrive", "Its app servers read from one database")}. One night at
    2 am, the database's disk fails. Every request returns an error until an
    engineer wakes up, finds the cause and starts a new machine. The app is
    down for 40 minutes.

    The previous lesson made the app servers safe to lose. Three of them
    run, and any two can carry the load. The database is still one machine.
    This lesson puts a number on how often a system works. It shows how
    parts combine, and how a second database takes over when the first one
    fails. Then it follows a real failover at GitHub, where the same steps
    ran across two data centers.

    ## Counting nines

    Availability is the share of time a system answers correctly. Teams
    often measure it as the share of requests that succeed. A goal is
    usually written as a number of nines.

    - **99.9%, three nines.** A year has 8,760 hours, and 0.1% of that is about 8.8 hours of downtime a year, or 43 minutes a month.
    - **99.99%, four nines.** About 53 minutes a year, or 4 minutes a month.
    - **99.999%, five nines.** About 5 minutes a year.

    Each extra nine cuts the allowed downtime by 10 times. The small app's
    40-minute outage almost used up a year of four nines in one night.

    > note: Planned downtime looks the same to users as a crash. Unless the goal says otherwise, a database upgrade that stops the app for 20 minutes uses 20 minutes of the budget.

    ## Parts in a row multiply

    A request passes through several parts, and it fails if any one of
    them fails. For parts in a row, multiply their availabilities.

    Two parts at 99.9% each give 0.999 × 0.999, which is about 99.8%. That
    is twice the downtime of either part alone. Five parts at 99.9% give
    about 99.5%, or 44 hours a year. A system in a row is always less
    available than its weakest part.

    So every part on the request path costs some availability, even a
    reliable one. A design with fewer parts in a row has less that can stop
    it.

    ## Copies side by side

    Now put two copies side by side, where either one is enough. The system
    fails only when both copies are down at once. For copies side by side,
    multiply their chances of being down.

    Each 99.9% copy is down 0.1% of the time. Both are down at once 0.001
    × 0.001 of the time, which is 0.0001%. The pair is up about 99.9999%
    of the time.

    That number holds only when the two copies fail for separate reasons.

    > pitfall: Two copies in the same rack, on the same power supply, or running the same bad deploy fail together. Then the pair is no better than one copy. Put copies in different places, and roll out changes to one copy before the other.

    The switch from one copy to the other also takes time, and that time
    counts as downtime.

    ## Single points of failure

    A part whose failure stops the whole system is a single point of
    failure. To find them, follow one request from the phone to the
    database. At each part, ask what happens if it stops.

    - **The load balancer.** The app runs two that share one address, so either one is enough. Chapter 4 covers how.
    - **The app servers.** Any two of the three can carry the peak.
    - **The database.** There is one, so it is a single point of failure.

    Removing one means adding a copy that can take over, which is called
    redundancy.

    ## A standby takes over

    The app adds a second database, the standby.
    ${cue("copy", "Every write the primary takes is also sent to the standby")},
    so the standby holds the same data. It serves no traffic and only waits. This
    setup is called active-passive.

    The standby needs to know when the primary dies.
    ${cue("beat", "Once a second, the primary sends the standby a heartbeat")},
    a short message that says it is alive. Then
    ${cue("crash", "the primary crashes")}, and requests fail.
    ${cue("notice", "The standby misses 3 heartbeats in a row")} and decides
    the primary is gone.
    ${cue("promote", "It promotes itself to primary and takes over the address")}
    that the app servers connect to. The servers do not need new settings.
    ${cue("retry", "The next request reaches the new primary and succeeds")}.

    Switching to the standby is called failover. Here it took about 3
    seconds to notice and a few more to promote, instead of 40 minutes.
    Later,
    ${cue("rejoin", "the repaired machine comes back as the new standby")}
    and copies the writes it missed.

    > tradeoff: The timeout decides how fast failover starts. A short one, such as 1 missed heartbeat, starts it within a second. It also fires when the network is slow for a moment and the primary is fine. Then two databases both act as primary and take writes that disagree. A longer timeout avoids those false alarms and makes each real outage longer.

    One more cost is the copy itself. If the primary sends writes to the
    standby a moment after it saves them, the last few writes can be lost
    when it crashes. Chapter 6 covers how databases copy data and what each
    choice risks.

    ## Every copy active

    Active-active is the other way to use copies.
    ${cue("both", "Every copy serves traffic all the time")}. The app
    servers already work this way. When one fails, the load balancer stops
    sending it requests, and the others carry on. There is no switch to wait
    for, and no copy sits idle.

    The cost is spare capacity. Each copy must have room for the load of the
    one that failed, as the previous lesson showed. Active-active is easy
    for stateless servers. It is hard for a database, because two copies
    that both take writes can accept changes that conflict. That is why
    the app's database starts with active-passive.

    ## A failover at GitHub

    GitHub ran the same pattern at a much larger size. It keeps its data in
    many MySQL clusters. The app sends each cluster's writes to its primary,
    and copies of the primary serve reads. A tool called Orchestrator
    manages the clusters and runs failover. Its nodes sit in several places,
    and enough of them must agree before a failover starts.

    On October 21, 2018, at 22:52 UTC, engineers were replacing failing
    network equipment on the US East Coast. The work cut the link between
    the East Coast network hub and the main East Coast data center. The link
    came back after 43 seconds.

    Those 43 seconds were long enough for a failover. The Orchestrator nodes
    in a West Coast data center and in a public cloud agreed without the
    East Coast data center. They moved the primaries to the West Coast, and
    the app began sending its writes there. The East Coast primaries had not
    crashed. They had only lost the network for a moment, which is the
    false alarm from the timeout tradeoff above.

    Two problems followed. The East Coast primaries held a few seconds of
    writes that had never reached the West Coast. Meanwhile the West Coast
    primaries took new writes for nearly 40 minutes. The two sides now held
    different data, and GitHub could not safely switch back. It put the
    integrity of user data first, even though that left the site unusable
    for many users for a while. Service stayed degraded for 24 hours and
    11 minutes while the team repaired the databases.

    The failover ran the same steps as in the small app, with Orchestrator
    doing the checking. A failover on a 43-second network fault, plus the
    writes that had not been copied yet, turned a short fault into a day of
    degraded service.

    ## In a design review

    Ask these questions about any design.

    1. What availability does the product need, and how much downtime a month is that?
    2. Which parts are in a row on the main request path?
    3. Which part is a single point of failure?
    4. How does the system notice a failure, and how long does the switch take?
    5. Can both copies fail for the same reason?

    When you add a copy, say which kind and why. For the small app it could
    be this. Run the app servers active-active, at least 3 of them. Run the
    database active-passive, with the standby in a different data center,
    and test failover every month.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "An app promises 99.9% availability each month. About how much downtime does a 30-day month allow?",
      options: [
        { text: "About 43 minutes", correct: true },
        { text: "About 9 hours", why: "That is the budget for a whole year at 99.9%." },
        { text: "About 4 minutes", why: "That is the monthly budget at 99.99%, one more nine." },
      ],
      explain: "30 days is 43,200 minutes, and 0.1% of that is about 43 minutes.",
    },
    {
      kind: "choice",
      prompt: "A request passes a load balancer, an app server and a database. It needs all three, and each is 99.9% available. About how available is the app?",
      options: [
        { text: "About 99.7%", correct: true },
        { text: "About 99.9%", why: "Each part can fail on its own, so the downtime of all three adds up." },
        { text: "About 99.9999%", why: "That is for copies side by side, where either one is enough." },
      ],
      explain: "For parts in a row, multiply. 0.999 × 0.999 × 0.999 is about 0.997.",
    },
    {
      kind: "choice",
      prompt: "Two database copies are each 99% available. Either one is enough, and they fail for separate reasons. About how available is the pair?",
      options: [
        { text: "About 99.99%", correct: true },
        { text: "About 98%", why: "That is two parts in a row, where both must work." },
        { text: "About 99%", why: "The second copy covers the times the first is down, so the pair does better than one copy." },
      ],
      explain: "Each copy is down 1% of the time. Both are down at once 1% of 1% of the time, which is 0.01%.",
    },
    {
      kind: "choice",
      prompt: "An app runs 2 load balancers that share one address, 3 app servers and 1 database. Which part is a single point of failure?",
      options: [
        { text: "The database", correct: true },
        { text: "The app servers", why: "Any two of the three can carry the load, so losing one stops nothing." },
        { text: "The load balancers", why: "If one fails, the other takes over the shared address." },
      ],
      explain: "Only the database has no copy that can take over.",
      replay: "crash",
    },
    {
      kind: "choice",
      prompt: "The primary and the standby database sit in the same rack, on the same power supply. What is the biggest risk?",
      options: [
        { text: "One power cut takes down both copies at once", correct: true },
        { text: "The standby holds a second copy of the data", why: "That copy is the point of the standby. It does not add risk." },
        { text: "The heartbeats use too much of the network", why: "One small message a second is almost nothing." },
      ],
      explain: "The availability math for copies side by side holds only when they fail for separate reasons.",
    },
    {
      kind: "choice",
      prompt: "The same app has load balancers, app servers, a database and a nightly job. Which part suits active-active best?",
      options: [
        { text: "The stateless app servers", correct: true },
        { text: "The main database", why: "Two copies that both take writes can accept changes that conflict, so a database usually starts active-passive." },
        { text: "A job that must run exactly once each night", why: "If every copy runs it, it runs several times. One active copy with a standby fits better." },
      ],
      explain: "Copies that keep no state can all serve at once, and losing one costs only capacity.",
      replay: "both",
    },
    {
      kind: "choice",
      prompt: "At GitHub in 2018, a 43-second network cut led to a failover to the West Coast. Why did that cause trouble?",
      options: [
        { text: "The East Coast primaries still worked and held writes the West Coast never got", correct: true },
        { text: "The failover took too long to start", why: "It started within the 43 seconds. The problem was that it started at all." },
        { text: "Both copies sat in the same data center", why: "The failover moved the primaries from the East Coast to the West Coast, so the copies were far apart." },
      ],
      explain: "The primaries had only lost the network for a moment. Promoting the copies left two sets of writes that disagreed, so GitHub could not simply switch back.",
      replay: "notice",
    },
    {
      kind: "order",
      prompt: "Put the steps of a failover in order.",
      items: [
        "The primary crashes and stops sending heartbeats",
        "The standby misses several heartbeats in a row",
        "The standby promotes itself and takes over the primary's address",
        "The next query from the app servers reaches the new primary",
      ],
      explain: "The standby can only act after it notices the silence, and the servers reach it only after it owns the address.",
    },
  ],
})
```

## Appendix B. Test changes

````diff
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index c74f721..dfb3d2f 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -49,6 +49,17 @@ export const SCALING_CORRECT: readonly QuizAnswer[] = [
   { order: "solved" },
 ]
 
+export const AVAILABILITY_CORRECT: readonly QuizAnswer[] = [
+  { radio: "About 43 minutes" },
+  { radio: "About 99.7%" },
+  { radio: "About 99.99%" },
+  { radio: "The database" },
+  { radio: "One power cut takes down both copies at once" },
+  { radio: "The stateless app servers" },
+  { radio: "The East Coast primaries still worked and held writes the West Coast never got" },
+  { order: "solved" },
+]
+
 export async function solveOrder(page: Page) {
   const read = () => page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
     rows.map((row) => Number(row.getAttribute("data-item"))),
diff --git a/e2e/progress.spec.ts b/e2e/progress.spec.ts
index ce6ad00..1776e4d 100644
--- a/e2e/progress.spec.ts
+++ b/e2e/progress.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
+import { AVAILABILITY_CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
 
 const lessonPath = "/#/learn/load-balancer"
 const lessonMark = (page: import("@playwright/test").Page) =>
@@ -16,7 +16,7 @@ test("pass the quiz, reload, the sidebar shows a check for Load balancer", async
 
 test("home Continue card points at the first not-done lesson", async ({ page }) => {
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 4 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 5 lessons done")
   const next = page.getByTestId("next-lesson")
   await expect(next).toHaveAttribute("href", "#/learn/what-system-design-is")
   await expect(next).toHaveAttribute("data-status", "new")
@@ -28,19 +28,25 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/learn/what-system-design-is")
   await passQuiz(page, SYSTEM_DESIGN_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("1 of 4 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("1 of 5 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/latency-and-throughput")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/latency-and-throughput")
   await passQuiz(page, LATENCY_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("2 of 4 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("2 of 5 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/scaling-up-and-out")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/scaling-up-and-out")
   await passQuiz(page, SCALING_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("3 of 4 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("3 of 5 lessons done")
+  await expect(next).toHaveAttribute("href", "#/learn/availability")
+  await expect(next).toHaveAttribute("data-status", "new")
+  await gotoReady(page, "/#/learn/availability")
+  await passQuiz(page, AVAILABILITY_CORRECT)
+  await gotoReady(page, "/#/")
+  await expect(page.getByTestId("progress-count")).toHaveText("4 of 5 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/load-balancer")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, lessonPath)
@@ -48,7 +54,7 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/")
   await expect(page.getByTestId("next-lesson")).toHaveCount(0)
   await expect(page.getByTestId("all-done")).toBeVisible()
-  await expect(page.getByTestId("progress-count")).toHaveText("4 of 4 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("5 of 5 lessons done")
 })
 
 test("Reset progress clears marks", async ({ page }) => {
@@ -61,7 +67,7 @@ test("Reset progress clears marks", async ({ page }) => {
   await page.getByRole("button", { name: "Reset progress" }).click()
   await page.getByRole("button", { name: "Reset", exact: true }).click()
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 4 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 5 lessons done")
   expect(await page.evaluate(() => localStorage.getItem("sd.progress"))).toBe(null)
   await gotoReady(page, "/#/")
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
diff --git a/e2e/quiz.spec.ts b/e2e/quiz.spec.ts
index d67eddc..e1d087d 100644
--- a/e2e/quiz.spec.ts
+++ b/e2e/quiz.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
+import { AVAILABILITY_CORRECT, CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
 
 const path = "/#/learn/load-balancer"
 
@@ -40,6 +40,14 @@ test("the scaling-up-and-out answer key scores 8/8", async ({ page }) => {
   await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
 })
 
+test("the availability answer key scores 8/8", async ({ page }) => {
+  await gotoReady(page, "/#/learn/availability")
+  await answerQuiz(page, AVAILABILITY_CORRECT)
+
+  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
+  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
+})
+
 test("a wrong choice shows its why", async ({ page }) => {
   await gotoReady(page, path)
   await answerQuiz(page, [{ radio: "Restarts Server A" }, ...CORRECT.slice(1)])
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index dffaee5..771d7e6 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -118,3 +118,21 @@ test("scaling-up-and-out shows 9 cues, 'lost' notes the missing session and 'db'
   await gotoReady(page, `${lesson}/step/db`)
   await expect(db.getByTestId("scene-note")).toHaveText("CPU 90%")
 })
+
+test("availability shows 9 cues, 'notice' notes the missed heartbeats and 'rejoin' brings the old primary back", async ({ page }) => {
+  const lesson = "/#/learn/availability"
+  await gotoReady(page, lesson)
+  await expect(page.getByRole("heading", { level: 2, name: "Down at 2 am" })).toBeVisible()
+  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(9)
+  const scene = page.getByTestId("scene")
+  const primary = scene.locator('[data-scene-node="primary"]')
+  const standby = scene.locator('[data-scene-node="standby"]')
+  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(4)
+  await expect(page.getByText("Step 1 of 9")).toBeVisible()
+  await gotoReady(page, `${lesson}/step/notice`)
+  await expect(primary).toHaveAttribute("data-down", "")
+  await expect(standby.getByTestId("scene-note")).toHaveText("no heartbeat for 3 s")
+  await gotoReady(page, `${lesson}/step/rejoin`)
+  await expect(primary).not.toHaveAttribute("data-down", "")
+  await expect(primary.getByTestId("scene-note")).toHaveText("now the standby")
+})
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index ebd92d7..3fe172c 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -239,6 +239,37 @@ test("the real curriculum holds the scaling-up-and-out lesson", () => {
   ])
 })
 
+test("the real curriculum holds the availability lesson", () => {
+  const lesson = curriculum.bySlug.get("availability")
+
+  expect(lesson?.track).toBe("foundations")
+  expect(lesson?.order).toBe(4)
+  expect(lesson?.minutes).toBe(8)
+  expect(lesson?.headings.map((heading) => heading.id)).toEqual([
+    "down-at-2-am",
+    "counting-nines",
+    "parts-in-a-row-multiply",
+    "copies-side-by-side",
+    "single-points-of-failure",
+    "a-standby-takes-over",
+    "every-copy-active",
+    "a-failover-at-github",
+    "in-a-design-review",
+  ])
+  expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
+    "arrive", "copy", "beat", "crash", "notice", "promote", "retry", "rejoin", "both",
+  ])
+  expect(lesson?.quiz).toHaveLength(8)
+  expect(lesson?.sources.map((source) => source.url)).toEqual([
+    "https://github.com/donnemartin/system-design-primer#availability-in-numbers",
+    "https://sre.google/sre-book/embracing-risk/",
+    "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/availability.html",
+    "https://www.postgresql.org/docs/current/warm-standby-failover.html",
+    "https://martinfowler.com/articles/patterns-of-distributed-systems/heartbeat.html",
+    "https://github.blog/news-insights/company-news/oct21-post-incident-analysis/",
+  ])
+})
+
 test("TRACKS lists the 12 chapters in reading order", () => {
   expect(TRACKS.map((track) => track.id)).toEqual([
     "foundations", "estimation", "network", "edge", "application", "data",
````
