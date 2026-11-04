# Step 29. Lesson 1.3, a Figma database case study

## Why

The course has a rule for examples, written in `docs/curriculum.md`. Each lesson opens with a small unnamed app, then works through a public case study that a reader can check. Lesson 1.3 still uses Inkwell, the made-up photo app the course has retired. This step brings lesson 1.3 in line with the rule, as steps 27 and 28 did for lessons 1.1 and 1.2.

The small app stays, but it is now "a small photo app" with no name. A new section, "How Figma scaled its database", retells two posts by Figma's engineers. In 2020, Figma ran one Postgres database that kept growing. The team scaled it up to the largest machine Amazon offered, hit that ceiling, then scaled it out in two stages. It follows the same steps as the lesson, on a real system. Opus checked every fact in the new section against the two posts.

This step changes one lesson file and two test files. It changes no app code.

## Branch and coder rules

- Branch `step/29-figma-database-case-study` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 3 files below may change, and only by the 2 commands in "How to do it". Do not edit any other file.
- Do not change the lesson text, captions, quiz or tests. Opus wrote and unslopped them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the content to make it pass.
- Do not kill processes.

## What changes

### 1. The lesson

`src/content/lessons/scaling-up-and-out/lesson.ts` is replaced by Appendix A, byte for byte. The changes from main:

- Every "Inkwell" becomes "a small photo app", "the photo app", "the app" or "an app". The numbers stay the same.
- The intro says the lesson ends by looking at how Figma scaled its database.
- A new section, "How Figma scaled its database", sits before "In a design review". It covers the one database in 2020, the first fixes, why scaling up and read replicas ran out, the move of table groups to their own databases, and the start of sharding.
- The lesson now has 9 sections and reads in 10 minutes, up from 7.
- Two further-reading links are added at the end of the list, one for each Figma post. Both returned 200 on 2026-11-04.
- Quiz Q6 is new. It asks why read replicas did not solve Figma's problem. The old Q6 asked which part of the app to scale up, which the "In a design review" section still covers. Q2, Q4, Q7 and Q8 keep their answers, with Inkwell taken out of their prompts.
- The scene does not change, except that the first caption names "a small photo app".

The facts in the new section, from the two posts.

"The growing pains of database architecture" by Tim Liang, April 4, 2023:

- In 2020, Figma used "a single, large Amazon RDS database to persist most of our metadata". The examples it gives are "permissions, file information, and comments".
- "database traffic grows approximately 3x annually".
- "we observed upwards of 65% CPU utilization during peak traffic". "Database latencies become increasingly unpredictable as usage edges closer to the limit". "If our database became completely saturated, Figma would stop working."
- The first fixes were meant "to secure an additional year of runway". They were to "Upgrade our database to the largest instance available (from r5.12xlarge to r5.24xlarge)", "Create multiple read replicas to scale read traffic", "Establish new databases for new use cases to limit growth on original database", and add PgBouncer as a connection pooler because connections "were in the thousands".
- "writes ... contributed to a significant portion of database utilization". "not all reads or data fetching could be moved to replicas due to application sensitivity to replication lag".
- The move had to be coordinated "across thousands of application backend instances".
- Each move stopped traffic to the moved tables "only briefly". "we observed a ~30 second period of partial availability impact (~2% of requests dropped)".
- "Our largest partition has CPU utilization hovering ~10%".

"How Figma's databases team lived to tell the scale" by Sammy Steele, March 14, 2024:

- "Figma's database stack has grown almost 100x since 2020."
- "In 2020, we were running a single Postgres database hosted on AWS's largest physical instance, and by the end of 2022, we had built out a distributed architecture with caching, read replicas, and a dozen vertically partitioned databases." The table groups named are "Figma files" and "Organizations".
- "some of our tables, containing several terabytes and billions of rows, were becoming too large for a single database". "Our highest write tables were growing so quickly that we would soon exceed the maximum IO operations per second (IOPS) supported by Amazon's Relational Database Service (RDS)." "the smallest unit of partitioning is a single table".
- "it took our team roughly nine months to shard our first table". "We shipped our first horizontally sharded table in September 2023." Horizontal sharding is "a multi-year investment".

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. The lesson 1.3 test now expects 10 minutes, the heading id `how-figma-scaled-its-database` before `in-a-design-review`, and the two Figma URLs at the end of the sources.
- `e2e/helpers.ts`. The sixth answer in `SCALING_CORRECT` becomes "Every write still went to the one main database".

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/29-figma-database-case-study.md > /tmp/step29.diff && git apply /tmp/step29.diff`
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A. This overwrites the existing file.
   `awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/29-figma-database-case-study.md > src/content/lessons/scaling-up-and-out/lesson.ts && git status --short`
   The status must list exactly these 3 lines, in any order.
   `M e2e/helpers.ts`, `M src/content/curriculum.test.ts` and `M src/content/lessons/scaling-up-and-out/lesson.ts`.
3. Install. `pnpm install > /tmp/install29.log 2>&1; tail -3 /tmp/install29.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 85 tests, the same as main.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 204 tests in 14 files, the same as main.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e.log`. 62 tests, the same as main.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run. If the ports are still busy after 10 minutes, stop waiting and report it.

The test "Play sets data-mode=playing and a packet moves" in `e2e/scene-play.spec.ts` can fail with "packet has no box" when the machine is busy. It tests the load balancer lesson, which this step does not change. If it is the only failure in a run, that run does not count. Run it again, as above.

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

- Changing the Q6 answer in `SCALING_CORRECT` to "The team had not tried a bigger machine" fails the quiz test "the scaling-up-and-out answer key scores 8/8".
- With all of it in place on main at 04f4e36, build passed 85 and unit 204 in 14 files. e2e passed 62 in 3 of 4 runs. The other run failed only "Play sets data-mode=playing and a packet moves" with "packet has no box", in the load balancer lesson.
- No text on the page contains "Inkwell". The page shows the heading "How Figma scaled its database".
- At 390 px wide, the page's `scrollWidth` is 390.

## Originality

Opus wrote the new section and the new question. The posts' facts are retold in our own words, and the short quotes stay in this spec, not in the lesson. The primer stays as a further-reading link, and the lesson copies nothing from it.

## What you see

Lesson 1.3 reads the same as before, except that the photo app has no name. Below "The bottleneck moves", "How Figma scaled its database" tells Figma's story from one database to sharding. The page's table of contents lists the new section, and the further reading lists the two Figma posts. The home card shows 10 min. Quiz question 6 asks about Figma's read replicas.

## Appendix A. `src/content/lessons/scaling-up-and-out/lesson.ts`

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
  lb: { kind: "lb", label: "Load balancer", at: [2, 1], hidden: true },
  one: { kind: "server", label: "Server 1", at: [4, 0] },
  two: { kind: "server", label: "Server 2", at: [4, 1], hidden: true },
  three: { kind: "server", label: "Server 3", at: [4, 2], hidden: true },
  db: { kind: "db", label: "Database", at: [6, 1] },
}).steps((s) => ({
  arrive: s.step(
    "A small photo app runs on one server and one database. The server reads the feed from the database and sends it back.",
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
    {
      use: "link",
      title: "Figma: The growing pains of database architecture",
      url: "https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/",
    },
    {
      use: "link",
      title: "Figma: How Figma's databases team lived to tell the scale",
      url: "https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## Slow every evening

    ${cue("arrive", "A small photo app started on one server and one database")}. The
    server runs the app, and the database holds the photos, users and
    follows. For a year that was enough. Now
    ${cue("peak", "the server's CPU reaches 95% every evening")}, and the
    feed takes seconds to load. The previous lesson showed why. A server
    that busy makes every request wait in its queue.

    The team has two ways to add capacity. It can move the app to a bigger
    machine, which is scaling up. Or it can run the app on more machines,
    which is scaling out. This lesson compares the two and the changes each
    one needs. Near the end, it looks at how Figma scaled its database.

    ## Slow for one user or slow for many

    First, check that more capacity is the fix. Open the feed at 4 am, when
    almost nobody else is online.

    - If it is slow even then, the system has a performance problem. One request does too much work, for example a query that reads every photo a user follows. More machines will not help, because each request is still slow on its own. Fix the work.
    - If it is fast at 4 am and slow at 9 pm, the system has a scalability problem. Each request is fine, but the system cannot serve enough of them at once. More capacity helps.

    The photo app's feed loads in 80 ms at 4 am, so it has a scalability problem.

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

    The app keeps growing.
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
    scaling out, the app's server kept each signed-in user's session in its
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
    for an update, the app is down, however big the machine is.

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
    For the photo app, the next steps are a cache in front of the database for
    feed reads, and copies of the database that serve reads.

    ## How Figma scaled its database

    Figma is a design tool that many people can edit at once in the
    browser. In 2023 and 2024, its engineers wrote two posts about how its
    database grew. It follows the same steps as this lesson, at a much
    larger scale.

    In 2020, Figma kept most of its metadata, such as permissions, file
    information and comments, in one Postgres database on Amazon RDS. Its
    database traffic grew about 3 times every year. At the peak, the
    database's CPU passed 65%. That was far from full, but latency gets
    harder to predict as a database nears its limit. If the database filled
    up, Figma would stop working.

    The team's first fixes were meant to buy about a year.

    - It scaled up. It moved the database to the largest machine Amazon offered.
    - It added read replicas, which are copies of the database that answer reads.
    - It put new features on new databases, so the main one grew more slowly.
    - It added a connection pooler, because the connections to the database were in the thousands.

    That was the ceiling for scaling up, because no bigger machine was
    available. The replicas had limits too. Writes were a large part
    of the load, and a replica takes only reads. Some reads could not move
    either. A replica lags a little behind the main database, and parts of
    the app needed the latest data.

    So Figma scaled the database out. Its app already ran on thousands of
    servers. The database was the one part that still ran on one machine.
    The team moved groups of related tables, such as the ones for files or
    for organizations, onto databases of their own. Each move paused
    traffic to those tables for a short time, and for about 30 seconds
    about 2% of requests were dropped. By the end of 2022, Figma ran about
    a dozen of these databases. In April 2023, the largest one ran at about
    10% CPU.

    Then the bottleneck moved again. Some single tables had grown to
    several terabytes and billions of rows. The tables with the most writes
    would soon need more disk operations per second than one RDS database
    supports. Moving whole tables could not help, because a table was the
    smallest piece the team could move. So Figma began to split single
    tables across many databases, which is called sharding. The first table
    took about 9 months of work and was split in September 2023. Chapter 6
    covers how sharding works.

    From 2020 to early 2024, Figma's database stack grew almost 100 times.
    In both posts, the hard part was the database, the one part that ran on
    one machine. Scaling it up was the fast first fix, and it reached
    its ceiling. Scaling it out took years of work, because the database
    holds the state.

    ## In a design review

    Ask these questions about any design.

    1. Is the system slow for one user, or only under load?
    2. Which part runs out first at the peak, and how much room does it have?
    3. Can any server answer any request? Where do sessions and uploads live?
    4. If one server fails at the peak, can the others carry its load?
    5. After this part scales, which part is next?

    When you propose scaling, say which kind and why. For the photo app it could
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
      prompt: "A photo app's one server hits 95% CPU every evening. It keeps sessions in memory, and the team must fix the slowdown this week with no code changes. What do they do?",
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
      prompt: "A photo app scales out from 1 server to 3, and traffic keeps growing. Which part becomes the bottleneck next?",
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
      prompt: "In 2020, Figma's main database already ran on the largest machine Amazon offered, and writes were a large part of its load. Why did read replicas not solve the problem?",
      options: [
        { text: "Every write still went to the one main database", correct: true },
        { text: "The team had not tried a bigger machine", why: "It had already moved to the largest size, so scaling up was over." },
        { text: "The app servers were the bottleneck", why: "Figma's app ran on thousands of servers. The one database was the part running out." },
      ],
      explain: "A replica answers reads only. To take writes off the main database, Figma had to split its data across more databases.",
    },
    {
      kind: "choice",
      prompt: "An app's one server is only 40% busy at the peak, but the app is down whenever the server restarts for updates. What fixes that?",
      options: [
        { text: "Run at least 2 servers behind a load balancer", correct: true },
        { text: "Move to a bigger machine", why: "A bigger machine is still one machine. When it restarts, the app is still down." },
        { text: "Restart the server less often", why: "That makes the outages rarer, but each one still takes the whole app down." },
      ],
      explain: "Scaling out also removes the single point of failure. One server can restart while the other serves users.",
    },
    {
      kind: "order",
      prompt: "Put these steps for moving an app from one server to three in order.",
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
index 58246c3..4427731 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -44,7 +44,7 @@ export const SCALING_CORRECT: readonly QuizAnswer[] = [
   { radio: "Any server can answer any request, because user data lives outside the servers" },
   { radio: "The database that all 3 servers share" },
   { radio: "About 90%" },
-  { radio: "The main database, which takes every write" },
+  { radio: "Every write still went to the one main database" },
   { radio: "Run at least 2 servers behind a load balancer" },
   { order: "solved" },
 ]
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 61cc89c..269ddf7 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -218,7 +218,7 @@ test("the real curriculum holds the scaling-up-and-out lesson", () => {
 
   expect(lesson?.track).toBe("foundations")
   expect(lesson?.order).toBe(3)
-  expect(lesson?.minutes).toBe(7)
+  expect(lesson?.minutes).toBe(10)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
     "slow-every-evening",
     "slow-for-one-user-or-slow-for-many",
@@ -227,6 +227,7 @@ test("the real curriculum holds the scaling-up-and-out lesson", () => {
     "what-makes-scaling-out-hard",
     "when-a-server-fails",
     "the-bottleneck-moves",
+    "how-figma-scaled-its-database",
     "in-a-design-review",
   ])
   expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
@@ -239,6 +240,8 @@ test("the real curriculum holds the scaling-up-and-out lesson", () => {
     "https://12factor.net/processes",
     "https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/rel_mitigate_interaction_failure_stateless.html",
     "https://learn.microsoft.com/en-us/azure/architecture/best-practices/auto-scaling",
+    "https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/",
+    "https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/",
   ])
 })
 
````
