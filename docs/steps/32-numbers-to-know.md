# Step 32. Lesson 2.1, numbers worth knowing

## Why

The course follows `docs/curriculum.md` in chapter order. Chapter 1 is done, so lesson 2.1 comes next. It opens chapter 2, "Back of the envelope", which turns a product description into numbers that pick a design. This lesson gives the numbers the rest of the chapter uses. These are the storage units from KB to PB and 5 rough latencies, from a memory read to a round trip between continents. It draws 3 rules from them and shows how to count round trips.

The lesson follows the course's example rule. It opens with a small unnamed app whose page reads from 4 places and takes 151 ms. It then works through a public case study, Facebook's memcache. Opus checked every fact in that section against the paper "Scaling memcache at Facebook", and the latency numbers and the thumbnails example against Jeff Dean's 2009 talk. Both are in the lesson's sources.

This step adds one lesson file and the tests that a seventh lesson and a new chapter need. It changes no app code.

## Branch and coder rules

- Branch `step/32-numbers-to-know` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 7 files below may change, and only by the 2 commands in "How to do it". Do not edit any other file.
- Do not change the lesson text, captions, quiz or tests. Opus wrote and unslopped them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the content to make it pass.
- Do not kill processes.

## What changes

### 1. The lesson

`src/content/lessons/numbers-to-know/lesson.ts` is a new file, given in Appendix A byte for byte. Its fields:

- Chapter `estimation`, order 1, 9 minutes. It is the first lesson in chapter 2, so the sidebar and the home page gain a second chapter, "Back of the envelope", between Foundations and "Edge and traffic".
- 8 sections. These are "A page that takes 151 ms", "Sizes", "How long things take", "Three rules", "Counting round trips", "When a fast read turns slow", "Facebook's cache" and "In a design review".
- The diagram has a phone, an app server, a cache, a database and far storage. It has 9 steps, `request`, `local`, `cache`, `ssd`, `far`, `reply`, `serial`, `batch` and `near`. The phone asks for a page. The server reads its own memory, then the cache, the database and the far storage, and a note on each gives the read's rough time. The reply notes "about 151 ms". The next step asks the cache for 30 values one at a time and notes "30 trips, 15 ms". Then one batched request notes "1 trip, 0.5 ms". The last step copies the far file into the cache and notes "0.5 ms, not 150 ms". The text cues each step once.
- 8 quiz questions. Q1 asks what helps a page that runs 40 queries one after another. Q2 asks how much faster memory is than an SSD. Q3 and Q4 ask what 3 calls from Europe to California cost and what removes that wait. Q5 sizes 10 million profiles of 1 KB. Q6 asks why Facebook batched its cache reads. Q7 asks for a cache timeout. Q8 orders the 5 latencies.
- 5 further-reading links. All 5 returned 200 on 2026-11-06. The last one is the memcache paper.

The latencies, from the "Numbers Everyone Should Know" slide in Dean's talk "Designs, lessons and advice from building large distributed systems", LADIS 2009:

- "Main memory reference 100 ns". "Round trip within same datacenter 500,000 ns". "Disk seek 10,000,000 ns". "Send packet CA->Netherlands->CA 150,000,000 ns".
- The slide has no SSD row. "Read 4K randomly from SSD 150,000 ns" is in Jonas Bonér's gist and in the primer. The lesson rounds it to about 100 µs.
- The thumbnails example. "Design 1: Read serially" is "30 seeks * 10 ms/seek + 30 * 256K / 30 MB/s = 560 ms". "Design 2: Issue reads in parallel" is "10 ms/seek + 256K read / 30 MB/s = 18 ms (Ignores variance, so really more like 30-60 ms, probably)".
- Jonas Bonér's gist credits the table "Originally by Peter Norvig". The lesson says Dean's table built on an older list by Norvig.

The facts in the Facebook section, from "Scaling memcache at Facebook" by Rajesh Nishtala and 12 others, NSDI 2013:

- The system is "processing over a billion requests per second and storing trillions of items". The paper speaks of "scaling to thousands of servers within a cluster".
- "users consume an order of magnitude more content than they create."
- "loading one of our popular pages results in an average of 521 distinct items fetched from memcache." "The 95th percentile of fetches for that page is 1,740 items."
- "Over 7 days the median request latency is 333 microseconds while the 75th and 95th percentiles (p75 and p95) are 475μs and 1.135ms respectively."
- "We construct a directed acyclic graph (DAG) representing the dependencies between data. A web server uses this DAG to maximize the number of items that can be fetched concurrently. On average these batches consist of 24 keys per request."
- "relying on UDP can lead to a 20% reduction in latency to serve requests."
- "putting web servers closer to end users can significantly reduce latency." "We designate one region to hold the master databases and the other regions to contain read-only replicas". "web servers experience low latency when accessing either the local memcached servers or the local database replicas."

The lesson labels its own arithmetic as ours, not the paper's. 521 requests at 333 µs is about 170 ms. 521 items in batches of 24 is about 22 trips, and 22 trips at 333 µs is about 7 ms. The 200,000 km a second for light in fiber and the 18,000 km for California to the Netherlands and back are rough, commonly used numbers, and the lesson says "about" for each.

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. A new test checks the new lesson's chapter, order, 9 minutes, 8 heading ids, 9 step ids, quiz length and 5 source URLs. The load balancer test now expects 3 chapters with lessons, `foundations`, `estimation` and `edge`.
- `e2e/helpers.ts`. A new `NUMBERS_CORRECT` list holds the right answers to the new quiz.
- `e2e/quiz.spec.ts`. A new test answers the new quiz with `NUMBERS_CORRECT` and expects 8/8. The pass mark is 70%, so a key with one wrong answer still passes the quiz. Only this test catches it.
- `e2e/progress.spec.ts`. The Continue card test now walks 7 lessons in reading order. After the consistency quiz passes, the count is 5 of 7 and the card points at the new lesson. After the new quiz passes, the count is 6 of 7 and the card points at the load balancer. After that quiz, the count is 7 of 7. The reset test expects "0 of 7 lessons done".
- `e2e/scene-static.spec.ts`. A new test opens the lesson and checks its first heading, 9 cues, 5 visible boxes and "Step 1 of 9". At `far`, the far storage notes "150 ms trip". At `serial`, the cache notes "30 trips, 15 ms". At `batch`, it notes "1 trip, 0.5 ms".
- `e2e/sidebar-chapters.spec.ts`. The sidebar numbers the chapters that have lessons, so it now expects "1. Foundations", "2. Back of the envelope" and "3. Edge and traffic".

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/32-numbers-to-know.md > /tmp/step32.diff && git apply /tmp/step32.diff`
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A.
   `mkdir -p src/content/lessons/numbers-to-know && awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/32-numbers-to-know.md > src/content/lessons/numbers-to-know/lesson.ts && git status --short`
   The status must list exactly these 7 lines, in any order.
   `M e2e/helpers.ts`, `M e2e/progress.spec.ts`, `M e2e/quiz.spec.ts`, `M e2e/scene-static.spec.ts`, `M e2e/sidebar-chapters.spec.ts`, `M src/content/curriculum.test.ts` and `?? src/content/lessons/numbers-to-know/`.
3. Install. `pnpm install > /tmp/install32.log 2>&1; tail -3 /tmp/install32.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 95 tests. Main runs 90, and this step adds 4 lesson checks and 1 curriculum test.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 250 tests in 16 files. Main runs 245.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e.log`. 73 tests. Main has 71, and this step adds 2.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run, including the ones that do not count. If the ports are still busy after 10 minutes, stop waiting and report it.

The test "Play sets data-mode=playing and a packet moves" in `e2e/scene-play.spec.ts` can fail with "packet has no box" when the machine is busy. It plays the load balancer lesson's scene, which this step does not change. If it is the only failure in a run, that run does not count. Run it again, as above.

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

- Moving the Q2 key to "About 10 times" fails the new quiz.spec test with 7/8.
- Changing the far note to "15 ms trip" fails the new scene-static test.
- Renaming the `batch` cue fails the content test "every scene step except the first is cued in the text".
- The first run failed `e2e/sidebar-chapters.spec.ts`, because "Edge and traffic" became chapter 3. The patch updates that test.
- The first draft said Dean shared the table first. The gist credits an older list by Peter Norvig, so the note now says so.
- With all of it in place on main at 87283cf, build passed 95 and unit 250 in 16 files. e2e passed 73.
- No text on the page contains "Inkwell". At 1280 px and at 390 px, the page's `scrollWidth` equals the window width. On the desktop the diagram fits in its frame with no edge crossing a box. At 390 px the diagram's left and right edges are cut off, the same as the live lesson 1.5 at that width.

## Originality

Opus wrote the lesson, then read the primer's latency and powers of two tables. Those tables and this lesson share the standard numbers, which come from Dean's and Norvig's lists. The lesson picks 5 of them, rounds them and says them in its own words. The primer's wording is not used. The small app with 4 reads, the 3 rules, the 30-value batching scene, the query in a loop pitfall, the timeout section, the Facebook case study, the design review and the quiz are not in the primer.

## What you see

The home page and the sidebar list a new chapter, "Back of the envelope", between Foundations and "Edge and traffic". Its one card is "Numbers worth knowing", 9 min. The lesson's diagram shows a phone, an app server, a cache, a database and far storage. The page reads from each, and the notes read 100 ns, 0.5 ms trip, 0.6 ms and 150 ms trip, so the reply notes "about 151 ms". Then 30 cache reads in a loop note "30 trips, 15 ms", one batched read notes "1 trip, 0.5 ms", and a copy of the far file in the cache notes "0.5 ms, not 150 ms". Below the latency sections, "Facebook's cache" retells how one page fetched 521 items and how Facebook cut its trips.

## Appendix A. The lesson

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "client", label: "Phone", at: [0, 1] },
  server: { kind: "server", label: "App server", at: [2, 1] },
  cache: { kind: "cache", label: "Cache", at: [4, 0] },
  db: { kind: "db", label: "Database", at: [4, 2] },
  far: { kind: "storage", label: "Far storage", at: [6, 1] },
}).steps((s) => ({
  request: s.step(
    "A phone asks the app server for a page. The server needs data from 4 places before it can answer.",
    s.send("phone", "server", "GET /page"),
    s.note("server", "needs 4 reads"),
  ),
  local: s.step(
    "First the server reads from its own memory. That takes about 100 ns.",
    s.focus("server"),
    s.note("server", "100 ns"),
  ),
  cache: s.step(
    "Next it asks the cache server. The cache reads its memory in 100 ns, but the trip across the data center takes about 0.5 ms.",
    s.send("server", "cache", "get", "request"),
    s.send("cache", "server", "value", "data"),
    s.note("cache", "0.5 ms trip"),
  ),
  ssd: s.step(
    "Then it queries the database. The SSD read adds about 0.1 ms to the same 0.5 ms trip.",
    s.send("server", "db", "query", "request"),
    s.send("db", "server", "rows", "data"),
    s.note("db", "0.6 ms"),
  ),
  far: s.step(
    "Last it fetches a file kept on another continent. The round trip alone takes about 150 ms.",
    s.send("server", "far", "get", "request"),
    s.send("far", "server", "file", "data"),
    s.note("far", "150 ms trip"),
  ),
  reply: s.step(
    "The page goes back after about 151 ms. The far read is almost all of it.",
    s.send("server", "phone", "200", "response"),
    s.note("server", "about 151 ms"),
  ),
  serial: s.step(
    "Now the page needs 30 values from the cache, and the code asks for them one at a time. 30 trips of 0.5 ms add up to 15 ms.",
    s.send("server", "cache", "get 1", "request"),
    s.send("cache", "server", "value", "data"),
    s.send("server", "cache", "get 2", "request"),
    s.send("cache", "server", "value", "data"),
    s.note("cache", "30 trips, 15 ms"),
  ),
  batch: s.step(
    "Asking for all 30 values in one request needs one trip, about 0.5 ms.",
    s.send("server", "cache", "get 30", "request"),
    s.send("cache", "server", "30 values", "data"),
    s.note("cache", "1 trip, 0.5 ms"),
  ),
  near: s.step(
    "A copy of the far file goes into the cache. The next read takes a 0.5 ms trip instead of 150 ms.",
    s.send("far", "cache", "copy", "data"),
    s.send("server", "cache", "get file", "request"),
    s.send("cache", "server", "file", "data"),
    s.note("cache", "0.5 ms, not 150 ms"),
  ),
}))

export default defineLesson({
  title: "Numbers worth knowing",
  summary: "The sizes and latencies a designer uses every day, the 3 rules that follow from them, and how Facebook cut the round trips on one page.",
  track: "estimation",
  order: 1,
  tags: [
    "latency numbers",
    "powers of two",
    "storage units",
    "memory",
    "SSD",
    "disk seek",
    "round trip",
    "speed of light",
    "batching",
    "memcache",
  ],
  sources: [
    {
      use: "link",
      repo: "donnemartin/system-design-primer",
      title: "The System Design Primer: latency numbers every programmer should know",
      url: "https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know",
    },
    {
      use: "link",
      title: "Jeff Dean: Designs, lessons and advice from building large distributed systems",
      url: "https://www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf",
    },
    {
      use: "link",
      title: "Jonas Bonér: Latency numbers every programmer should know",
      url: "https://gist.github.com/jboner/2841832",
    },
    {
      use: "link",
      title: "Colin Scott: Latency numbers by year",
      url: "https://colin-scott.github.io/personal_website/research/interactive_latency.html",
    },
    {
      use: "link",
      title: "Rajesh Nishtala and others: Scaling memcache at Facebook",
      url: "https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## A page that takes 151 ms

    Start with a small app. ${cue("request", "A phone asks its app server for a page")},
    and the server needs data from 4 places before it can answer. One is
    the server's own memory. One is a cache server, one is a database on an
    SSD, and one is a file stored on another continent. The page takes about
    151 ms. Which of the 4 reads should you speed up?

    You can answer that before you run anything, if you know roughly how
    long each kind of read takes. This chapter turns a product description
    into numbers that pick a design. This first lesson gives the numbers
    the rest of the chapter uses. It ends with Facebook's cache, where one
    page made hundreds of reads.

    ## Sizes

    Computers count in powers of 2, and 2 to the power 10 is 1,024. That is
    close enough to 1,000 for any estimate, so each step up in units is about
    1,000 times the last.

    - 1 KB, a kilobyte, is about a thousand bytes. A short text post or a row of user data fits in 1 KB.
    - 1 MB, a megabyte, is about a million bytes. A phone photo is a few MB, and a resized one is a few hundred KB.
    - 1 GB, a gigabyte, is about a billion bytes. A server's memory holds tens or hundreds of GB.
    - 1 TB, a terabyte, is about a trillion bytes. One SSD holds a few TB.
    - 1 PB, a petabyte, is about a thousand TB. Only large fleets of machines hold PB.

    Multiply by powers of 10 and count the zeros. 10 million users with 1 KB
    of profile each is 10,000,000 times 1,000 bytes. That is 10 to the power
    10 bytes, or 10 GB, which fits in one server's memory.

    > note: A character of English text takes 1 byte. A number usually takes 4 or 8 bytes. A user id that fits in 8 bytes can count far past every person alive.

    ## How long things take

    Times use 3 small units. A nanosecond, ns, is a billionth of a second. A
    microsecond, µs, is a thousand ns. A millisecond, ms, is a thousand µs.
    These 5 times cover most designs. All of them are rough.

    - Reading memory takes about 100 ns.
    - A random read from an SSD takes about 100 µs.
    - A round trip between two machines in one data center takes about 0.5 ms.
    - A seek on a spinning disk takes about 10 ms.
    - A round trip between continents takes about 150 ms.

    Walk the page through them.
    ${cue("local", "The server reads its own memory in about 100 ns")}.
    ${cue("cache", "The cache also reads memory, but the trip to it takes about 0.5 ms")}.
    ${cue("ssd", "The database adds an SSD read of about 0.1 ms to the same trip")}.
    ${cue("far", "The file on another continent takes about 150 ms")}, and
    ${cue("reply", "the page goes back after about 151 ms")}. The far read is
    almost all of it. A faster SSD would save a tenth of a millisecond, so
    it is the wrong read to work on.

    > note: These numbers follow a table that Jeff Dean at Google showed in a 2009 talk, which built on an older list by Peter Norvig. New hardware has made memory and SSDs faster since then. Round trips between continents have barely changed. The further reading has a page that shows how each number moved over the years.

    ## Three rules

    The 5 times differ by factors of 1,000, so 3 rules follow.

    1. Memory is about 1,000 times faster than an SSD. 100 ns against 100 µs is a factor of 1,000. Data that a server reads on every request belongs in memory.
    2. Network round trips usually decide a request's latency. A trip inside a data center costs 0.5 ms, about 5,000 memory reads. Count the trips first.
    3. Distance costs time that no hardware can remove. Light in fiber covers about 200,000 km a second. California to the Netherlands and back is about 18,000 km, so the trip takes at least about 90 ms. Real routes are longer and pass through many routers, so it takes about 150 ms.

    ## Counting round trips

    Rule 2 makes the number of trips matter more than the speed of each one.
    Say a page needs 30 values from the cache, and the code asks for them in
    a loop. ${cue("serial", "30 trips of 0.5 ms add up to 15 ms")}, before any
    other work. ${cue("batch", "Asking for all 30 in one request needs one trip")}.

    There are 3 fixes, and they work with each other.

    - **Batch.** Fetch many values in one request. Most caches and databases take a list of keys.
    - **Run in parallel.** Send requests that do not depend on each other at the same time. The page then waits for the slowest one, not the sum.
    - **Move the data closer.** ${cue("near", "Keep a copy of far data in a nearby cache")}, so the next read takes a 0.5 ms trip instead of 150 ms. Rule 3 says no hardware can shorten the far trip, so the only fix is not to make it.

    At Google, Jeff Dean worked an example like this in his 2009 talk. A
    results page shows 30 thumbnails read from spinning disks. Reading them
    one after another costs 30 seeks of 10 ms, plus reading the data, which
    comes to about 560 ms. Reading all 30 at once costs one seek plus one
    read, about 18 ms. He noted that this ignores how much disks vary, so
    the real time is more like 30 to 60 ms. That is still 10 to 20 times
    faster.

    > pitfall: The common version of this bug is a query inside a loop. The code loads a list of 50 posts, then runs one more query for each post's author. That is 51 trips where 2 would do. It looks fine with 3 test posts and slows down with real data.

    ## When a fast read turns slow

    The numbers above are typical times. A read can also take much longer.
    A cache can miss, and the read then goes to the database. A database can
    miss its own memory and read from disk. A packet can be lost, and the
    network sends it again after a delay. The user sees a page that is
    usually fast and sometimes slow.

    The same numbers tell you what to do about it. A cache inside the data
    center should answer in about 1 ms. If it has not answered in 10 ms,
    something is wrong, so the app can stop waiting and read from the
    database instead. Set each timeout from the expected time, not from a
    default such as 30 seconds. A page that waits 30 seconds for a cache has
    failed, even if the answer arrives.

    > tradeoff: A short timeout gives up on some reads that would have answered. A long one makes users wait for reads that will never answer. Pick a timeout a few times longer than the read's normal slow case, and measure how often it fires.

    ## Facebook's cache

    In 2013, Rajesh Nishtala and 12 other Facebook engineers published
    "Scaling memcache at Facebook". Memcached keeps data in memory and answers lookups
    by key. Facebook ran it on thousands of servers in each cluster. Together they answered
    more than a billion requests a second and held trillions of items.

    Facebook used a cache because of what its users did. The paper says
    users read an order of magnitude more content than they create, about 10
    times as much. So most
    requests are reads, and memory serves a repeated read far faster than a
    database.

    The paper then shows what one page costs. Loading one popular page
    fetched 521 different items from the cache on average. At the 95th
    percentile it fetched 1,740. Over 7 days, a single cache request took
    333 µs at the median and about 1.1 ms at the 95th percentile. That
    matches the 0.5 ms trip from the list above.

    Here is our own arithmetic, not the paper's. 521 requests one after
    another, at 333 µs each, would take about 170 ms of waiting on the
    network alone. So Facebook worked on the number of trips. Its web
    servers map which items depend on which, and fetch every item that is
    ready at the same time. Requests went out in batches of 24 keys on
    average. In 24-key batches, 521 items need about 22 trips. Run one after
    another, those take about 7 ms.

    Facebook made each trip cheaper too. For reads it switched to UDP, a
    network protocol with less setup than TCP. The paper says this could cut
    the latency of serving requests by about 20%. For rule 3, it ran data
    centers in several regions so that web servers sit closer to users.
    Each region has its own caches and a copy of the database, so web
    servers read from caches and copies in their own region. Writes still go
    to one region that holds the main databases.

    ## In a design review

    Ask these questions about any design.

    1. How many round trips does one request make, and which of them run one after another?
    2. Does any request cross a continent? Can that data live closer to the user?
    3. What does the busiest request read from disk, and could it come from memory?
    4. How big is each kind of data, and does the part read most fit in memory?
    5. What is each call's timeout, and how does it compare with the call's normal time?

    For the small app at the top, the answer could be this. The page spends
    150 ms of its 151 ms on one read from another continent. Caching that
    file near the servers cuts the page to about 2 ms. Batching the cache
    reads keeps it there as the page grows.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "A page runs 40 database queries one after another, and each takes about 1 ms. The database is barely busy. What helps most?",
      options: [
        { text: "Fetch the same data in 1 or 2 batched queries", correct: true },
        { text: "Move the database to a faster SSD", why: "Most of each query's 1 ms is the round trip, not the SSD read. A faster SSD saves a little on each of 40 trips." },
        { text: "Add more app servers", why: "Each page still makes 40 trips one after another, so each page is as slow as before." },
      ],
      explain: "When a page makes many trips one after another, cut the number of trips. Batching does that.",
      replay: "batch",
    },
    {
      kind: "choice",
      prompt: "About how much faster is a memory read than a random SSD read?",
      options: [
        { text: "About 1,000 times", correct: true },
        { text: "About 10 times", why: "A memory read takes about 100 ns and an SSD read about 100 µs. A µs is 1,000 ns, so the gap is about 1,000." },
        { text: "About a million times", why: "That is closer to the gap between a memory read and a 150 ms trip between continents." },
      ],
      explain: "100 ns against 100 µs is a factor of 1,000. That gap is why hot data belongs in memory.",
    },
    {
      kind: "choice",
      prompt: "Users in Europe load a page from servers in California. The page makes 3 calls to those servers, one after another. What is the least time they wait?",
      options: [
        { text: "About 450 ms, 3 round trips of about 150 ms", correct: true },
        { text: "About 150 ms, because the 3 calls go to the same servers", why: "Each call waits for the one before it, so each one pays its own round trip." },
        { text: "About 1.5 ms, 3 trips of 0.5 ms", why: "0.5 ms is a trip inside one data center. Between continents a trip takes about 150 ms." },
      ],
      explain: "Calls that run one after another each pay the full round trip. Across continents that is about 150 ms each.",
    },
    {
      kind: "choice",
      prompt: "Users in Europe wait about 150 ms for every round trip to servers in California. Which change removes most of that wait?",
      options: [
        { text: "Serve them from servers and data in Europe", correct: true },
        { text: "Buy faster servers in California", why: "The wait is the distance, not the server. A faster server still waits for light to cross the ocean and back." },
        { text: "Upgrade the servers' network cards", why: "A faster card sends the bytes sooner, but the trip still covers the same distance." },
      ],
      explain: "No hardware shortens the distance. The fix is to make the trip shorter by putting the servers and data near the users.",
      replay: "near",
    },
    {
      kind: "choice",
      prompt: "An app has 10 million users with about 1 KB of profile data each. Roughly how much is that?",
      options: [
        { text: "About 10 GB", correct: true },
        { text: "About 10 MB", why: "10 million times 1,000 bytes is 10 to the power 10 bytes. 10 MB is only 10 to the power 7." },
        { text: "About 10 TB", why: "That is 1,000 times too big. 10 TB would be 1 MB for each user." },
      ],
      explain: "10 million times 1,000 bytes is 10 to the power 10 bytes, which is 10 GB. It fits in one server's memory.",
    },
    {
      kind: "choice",
      prompt: "One popular Facebook page fetched 521 items from the cache on average. Why did Facebook fetch them in batches?",
      options: [
        { text: "Each trip to the cache costs far more than the read in memory, so fewer trips make a faster page", correct: true },
        { text: "Each cache server could hold only 24 keys", why: "The cache held trillions of items. 24 was the average number of keys in one request." },
        { text: "Batching made each memory read faster", why: "A memory read takes about 100 ns either way. Batching saves round trips, which cost hundreds of µs each." },
      ],
      explain: "A cache request took 333 µs at the median, mostly network. Fewer trips cut the page time.",
    },
    {
      kind: "choice",
      prompt: "A cache in the same data center normally answers in under 1 ms. What timeout should the app set on cache calls?",
      options: [
        { text: "A few to 10 ms, then read from the database instead", correct: true },
        { text: "30 seconds, so slow answers still count", why: "A user who waits 30 seconds for one cache read has already given up. The page has failed either way." },
        { text: "No timeout, because the cache is fast", why: "A lost packet or a stuck server would then hang the request forever." },
      ],
      explain: "Set a timeout from the call's normal time. A cache that has not answered in 10 ms is not going to answer in time.",
    },
    {
      kind: "order",
      prompt: "Put these in order from fastest to slowest.",
      items: [
        "Read from memory",
        "Random read from an SSD",
        "Round trip inside one data center",
        "Seek on a spinning disk",
        "Round trip between continents",
      ],
      explain: "Roughly 100 ns, 100 µs, 0.5 ms, 10 ms and 150 ms. Each step is about 5 to 1,000 times the last.",
    },
  ],
})
```

## Appendix B. Test changes

````diff
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index e275c85..bc2c881 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -71,6 +71,17 @@ export const CONSISTENCY_CORRECT: readonly QuizAnswer[] = [
   { order: "solved" },
 ]
 
+export const NUMBERS_CORRECT: readonly QuizAnswer[] = [
+  { radio: "Fetch the same data in 1 or 2 batched queries" },
+  { radio: "About 1,000 times" },
+  { radio: "About 450 ms, 3 round trips of about 150 ms" },
+  { radio: "Serve them from servers and data in Europe" },
+  { radio: "About 10 GB" },
+  { radio: "Each trip to the cache costs far more than the read in memory, so fewer trips make a faster page" },
+  { radio: "A few to 10 ms, then read from the database instead" },
+  { order: "solved" },
+]
+
 export async function solveOrder(page: Page) {
   const read = () => page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
     rows.map((row) => Number(row.getAttribute("data-item"))),
diff --git a/e2e/progress.spec.ts b/e2e/progress.spec.ts
index 0bb34e6..9cffe62 100644
--- a/e2e/progress.spec.ts
+++ b/e2e/progress.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { AVAILABILITY_CORRECT, CONSISTENCY_CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
+import { AVAILABILITY_CORRECT, CONSISTENCY_CORRECT, LATENCY_CORRECT, NUMBERS_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
 
 const lessonPath = "/#/learn/load-balancer"
 const lessonMark = (page: import("@playwright/test").Page) =>
@@ -16,7 +16,7 @@ test("pass the quiz, reload, the sidebar shows a check for Load balancer", async
 
 test("home Continue card points at the first not-done lesson", async ({ page }) => {
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 7 lessons done")
   const next = page.getByTestId("next-lesson")
   await expect(next).toHaveAttribute("href", "#/learn/what-system-design-is")
   await expect(next).toHaveAttribute("data-status", "new")
@@ -28,31 +28,37 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/learn/what-system-design-is")
   await passQuiz(page, SYSTEM_DESIGN_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("1 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("1 of 7 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/latency-and-throughput")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/latency-and-throughput")
   await passQuiz(page, LATENCY_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("2 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("2 of 7 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/scaling-up-and-out")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/scaling-up-and-out")
   await passQuiz(page, SCALING_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("3 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("3 of 7 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/availability")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/availability")
   await passQuiz(page, AVAILABILITY_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("4 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("4 of 7 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/consistency-and-partitions")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/consistency-and-partitions")
   await passQuiz(page, CONSISTENCY_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("5 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("5 of 7 lessons done")
+  await expect(next).toHaveAttribute("href", "#/learn/numbers-to-know")
+  await expect(next).toHaveAttribute("data-status", "new")
+  await gotoReady(page, "/#/learn/numbers-to-know")
+  await passQuiz(page, NUMBERS_CORRECT)
+  await gotoReady(page, "/#/")
+  await expect(page.getByTestId("progress-count")).toHaveText("6 of 7 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/load-balancer")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, lessonPath)
@@ -60,7 +66,7 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/")
   await expect(page.getByTestId("next-lesson")).toHaveCount(0)
   await expect(page.getByTestId("all-done")).toBeVisible()
-  await expect(page.getByTestId("progress-count")).toHaveText("6 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("7 of 7 lessons done")
 })
 
 test("Reset progress clears marks", async ({ page }) => {
@@ -73,7 +79,7 @@ test("Reset progress clears marks", async ({ page }) => {
   await page.getByRole("button", { name: "Reset progress" }).click()
   await page.getByRole("button", { name: "Reset", exact: true }).click()
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 6 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 7 lessons done")
   expect(await page.evaluate(() => localStorage.getItem("sd.progress"))).toBe(null)
   await gotoReady(page, "/#/")
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
diff --git a/e2e/quiz.spec.ts b/e2e/quiz.spec.ts
index cfeb1c0..e9a5fe9 100644
--- a/e2e/quiz.spec.ts
+++ b/e2e/quiz.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { AVAILABILITY_CORRECT, CONSISTENCY_CORRECT, CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
+import { AVAILABILITY_CORRECT, CONSISTENCY_CORRECT, CORRECT, LATENCY_CORRECT, NUMBERS_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
 
 const path = "/#/learn/load-balancer"
 
@@ -56,6 +56,14 @@ test("the consistency answer key scores 8/8", async ({ page }) => {
   await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
 })
 
+test("the numbers answer key scores 8/8", async ({ page }) => {
+  await gotoReady(page, "/#/learn/numbers-to-know")
+  await answerQuiz(page, NUMBERS_CORRECT)
+
+  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
+  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
+})
+
 test("a wrong choice shows its why", async ({ page }) => {
   await gotoReady(page, path)
   await answerQuiz(page, [{ radio: "Restarts Server A" }, ...CORRECT.slice(1)])
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index d4ff084..24382d0 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -170,3 +170,21 @@ test("consistency shows 9 cues, 'split' takes the link down and 'accept' notes t
   await expect(link).not.toHaveAttribute("data-down", "")
   await expect(west.getByTestId("scene-note")).toHaveText("holds book, lamp, pen")
 })
+
+test("numbers shows 9 cues, 'far' notes the 150 ms trip and 'batch' needs one trip", async ({ page }) => {
+  const lesson = "/#/learn/numbers-to-know"
+  await gotoReady(page, lesson)
+  await expect(page.getByRole("heading", { level: 2, name: "A page that takes 151 ms" })).toBeVisible()
+  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(9)
+  const scene = page.getByTestId("scene")
+  const cache = scene.locator('[data-scene-node="cache"]')
+  const far = scene.locator('[data-scene-node="far"]')
+  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(5)
+  await expect(page.getByText("Step 1 of 9")).toBeVisible()
+  await gotoReady(page, `${lesson}/step/far`)
+  await expect(far.getByTestId("scene-note")).toHaveText("150 ms trip")
+  await gotoReady(page, `${lesson}/step/serial`)
+  await expect(cache.getByTestId("scene-note")).toHaveText("30 trips, 15 ms")
+  await gotoReady(page, `${lesson}/step/batch`)
+  await expect(cache.getByTestId("scene-note")).toHaveText("1 trip, 0.5 ms")
+})
diff --git a/e2e/sidebar-chapters.spec.ts b/e2e/sidebar-chapters.spec.ts
index b1f4dfd..8e50e46 100644
--- a/e2e/sidebar-chapters.spec.ts
+++ b/e2e/sidebar-chapters.spec.ts
@@ -5,7 +5,11 @@ test("sidebar chapter headings are numbered and larger than the lesson titles un
   await gotoReady(page, "/#/learn/latency-and-throughput")
   const sidebar = page.getByTestId("sidebar")
   const labels = sidebar.locator('[data-sidebar="group-label"]')
-  await expect(labels).toHaveText([/^1\.\s*Foundations$/, /^2\.\s*Edge and traffic$/])
+  await expect(labels).toHaveText([
+    /^1\.\s*Foundations$/,
+    /^2\.\s*Back of the envelope$/,
+    /^3\.\s*Edge and traffic$/,
+  ])
   const size = (selector: string) =>
     sidebar.locator(selector).first().evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize))
   expect(await size('[data-sidebar="group-label"]')).toBeGreaterThan(await size('[data-sidebar="menu-button"]'))
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index c669055..940e5e2 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -125,7 +125,7 @@ test("defineLesson throws with every quiz problem", () => {
 test("the real curriculum holds the load-balancer lesson", () => {
   const lesson = curriculum.bySlug.get("load-balancer")
 
-  expect(curriculum.tracks.map((track) => track.id)).toEqual(["foundations", "edge"])
+  expect(curriculum.tracks.map((track) => track.id)).toEqual(["foundations", "estimation", "edge"])
   expect(lesson?.order).toBe(2)
   expect(lesson?.minutes).toBe(11)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
@@ -307,6 +307,35 @@ test("the real curriculum holds the consistency-and-partitions lesson", () => {
   ])
 })
 
+test("the real curriculum holds the numbers-to-know lesson", () => {
+  const lesson = curriculum.bySlug.get("numbers-to-know")
+
+  expect(lesson?.track).toBe("estimation")
+  expect(lesson?.order).toBe(1)
+  expect(lesson?.minutes).toBe(9)
+  expect(lesson?.headings.map((heading) => heading.id)).toEqual([
+    "a-page-that-takes-151-ms",
+    "sizes",
+    "how-long-things-take",
+    "three-rules",
+    "counting-round-trips",
+    "when-a-fast-read-turns-slow",
+    "facebook-s-cache",
+    "in-a-design-review",
+  ])
+  expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
+    "request", "local", "cache", "ssd", "far", "reply", "serial", "batch", "near",
+  ])
+  expect(lesson?.quiz).toHaveLength(8)
+  expect(lesson?.sources.map((source) => source.url)).toEqual([
+    "https://github.com/donnemartin/system-design-primer#latency-numbers-every-programmer-should-know",
+    "https://www.cs.cornell.edu/projects/ladis2009/talks/dean-keynote-ladis2009.pdf",
+    "https://gist.github.com/jboner/2841832",
+    "https://colin-scott.github.io/personal_website/research/interactive_latency.html",
+    "https://www.usenix.org/conference/nsdi13/technical-sessions/presentation/nishtala",
+  ])
+})
+
 test("TRACKS lists the 12 chapters in reading order", () => {
   expect(TRACKS.map((track) => track.id)).toEqual([
     "foundations", "estimation", "network", "edge", "application", "data",
````
