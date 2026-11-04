# Step 28. Lesson 1.2, a Google tail latency case study

## Why

The course has a rule for examples, written in `docs/curriculum.md`. Each lesson opens with a small unnamed app, then works through a public case study that a reader can check. Lesson 1.2 still uses Inkwell, the made-up photo app the course has retired. This step brings lesson 1.2 in line with the rule, as step 27 did for lesson 1.1.

The small app stays, but it is now "a small photo app" with no name. A new section, "Slow servers at Google", retells parts of "The tail at scale", the 2013 paper by Jeffrey Dean and Luiz André Barroso. It shows why a request that waits on many servers is slower than any one of them, with numbers from a real Google service, and how a second copy of a slow request cut the slowest times. The lesson already links the paper, and its "Slow calls add up" section sets up the idea. Opus checked every fact in the new section against the paper's text.

This step changes one lesson file and two test files. It changes no app code.

## Branch and coder rules

- Branch `step/28-tail-at-scale-case-study` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 3 files below may change, and only by the 2 commands in "How to do it". Do not edit any other file.
- Do not change the lesson text, captions, quiz or tests. Opus wrote and unslopped them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the content to make it pass.
- Do not kill processes.

## What changes

### 1. The lesson

`src/content/lessons/latency-and-throughput/lesson.ts` is replaced by Appendix A, byte for byte. The changes from main:

- Every "Inkwell" becomes "a small photo app", "the photo app" or "its". The numbers stay the same.
- The intro says the lesson ends by looking at what Google measured.
- A new section, "Slow servers at Google", sits before "In a design review". It gives the paper's 100-server example, the measurements from a real Google service, the causes of slow servers the paper lists, and the hedged request test.
- The lesson now has 10 sections and reads in 11 minutes, up from 9.
- The 5 further-reading links do not change. The paper's page is already one of them, and it returned 200 on 2026-11-04.
- Quiz Q3 is new. It asks why the root waited 140 ms at the p99 when one leaf answered within 10 ms. The old Q3 asked which number a latency alert should watch, which the pitfall callout still covers. Q1 keeps its answers, with Inkwell taken out of its prompt.
- The scene does not change.

The facts in the new section, from the paper (Communications of the ACM, February 2013, volume 56, number 2):

- Web services consult data "spanning thousands of servers".
- The example is a server that "typically responds in 10ms but with a 99th-percentile latency of one second". With 1 such server, 1 user request in 100 is slow. With 100 such servers, "63% of user requests will take more than one second". 0.99 to the power 100 is about 0.37.
- Table 1 is from "a real Google service". At the p99, one random leaf finishes in 10 ms, 95% of all leaf requests finish in 70 ms, and all of them finish in 140 ms. The paper says the slowest 5% are "responsible for half of the total 99%-percentile latency".
- The causes the paper lists include shared resources, background daemons, maintenance activities such as garbage collection, and queueing. It says the source of latency "is often not inherent in the particular request".
- In "a Google benchmark that reads the values for 1,000 keys stored in a BigTable table distributed across 100 different servers", a hedging request after 10 ms cut the p99.9 "from 1,800ms to 74ms while sending just 2% more requests".

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. The lesson 1.2 test now expects 11 minutes and the heading id `slow-servers-at-google` before `in-a-design-review`.
- `e2e/helpers.ts`. The third answer in `LATENCY_CORRECT` becomes "The root waits for the slowest of many leaves".

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/28-tail-at-scale-case-study.md > /tmp/step28.diff && git apply /tmp/step28.diff`
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A. This overwrites the existing file.
   `awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/28-tail-at-scale-case-study.md > src/content/lessons/latency-and-throughput/lesson.ts && git status --short`
   The status must list exactly these 3 lines, in any order.
   `M e2e/helpers.ts`, `M src/content/curriculum.test.ts` and `M src/content/lessons/latency-and-throughput/lesson.ts`.
3. Install. `pnpm install > /tmp/install28.log 2>&1; tail -3 /tmp/install28.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 85 tests, the same as main.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 204 tests in 14 files, the same as main.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e.log`. 62 tests, the same as main.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run. If the ports are still busy after 10 minutes, stop waiting and report it.

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

- Changing the Q3 answer in `LATENCY_CORRECT` to "The root server itself was overloaded" fails the quiz test "the latency-and-throughput answer key scores 8/8".
- With all of it in place on main at 07e7cc4, build passed 85, unit 204 in 14 files and e2e 62. e2e passed 3 times out of 3.
- No text on the page contains "Inkwell". The page shows "11 min read".
- At 390 px wide, the page's `scrollWidth` is 390.

## Originality

Opus wrote the new section and the new question. The paper's facts are retold in our own words, and the short quotes stay in this spec, not in the lesson. The primer stays as a further-reading link, and the lesson copies nothing from it.

## What you see

Lesson 1.2 reads the same as before, except that the photo app has no name. Below "When load passes capacity", "Slow servers at Google" walks through the paper's numbers. The page's table of contents lists the new section. The home card shows 11 min. Quiz question 3 asks about Google's leaf servers.

## Appendix A. `src/content/lessons/latency-and-throughput/lesson.ts`

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
  queue: { kind: "queue", label: "Queue", at: [2, 0] },
  server: { kind: "server", label: "Feed server", at: [4, 1] },
}).steps((s) => ({
  arrive: s.step(
    "At a quiet hour, a request finds the queue empty and goes straight to the server.",
    s.send("phone", "queue", "GET /feed"),
    s.send("queue", "server", "GET /feed"),
  ),
  serve: s.step(
    "The server spends 10 ms on it and sends the feed back. The time from request to answer is the latency.",
    s.focus("server"),
    s.note("server", "10 ms"),
    s.send("server", "phone", "200", "response"),
  ),
  rate: s.step(
    "Working on one request at a time, at 10 ms each, the server finishes at most 100 requests a second. That is its throughput.",
    s.focus("server"),
    s.note("server", "100 a second"),
  ),
  slow: s.step(
    "Most requests take 10 ms. About 1 in 100 takes 300 ms or more, and those slow ones set the p99.",
    s.send("phone", "queue", "GET /feed"),
    s.send("queue", "server", "GET /feed"),
    s.note("server", "this one 300 ms"),
    s.send("server", "phone", "200", "response"),
  ),
  busy: s.step(
    "At the evening peak, requests arrive almost as fast as the server finishes them. New ones wait in the queue.",
    s.send("phone", "queue", "GET /feed"),
    s.send("phone", "queue", "GET /feed"),
    s.send("phone", "queue", "GET /feed"),
    s.focus("queue"),
    s.note("queue", "3 waiting"),
  ),
  wait: s.step(
    "At 90% busy, a request waits about 90 ms in the queue before its 10 ms of work starts.",
    s.focus("queue"),
    s.note("queue", "wait 90 ms"),
    s.send("queue", "server", "GET /feed"),
  ),
  little: s.step(
    "90 requests arrive each second, and each spends 0.1 s in the system. So about 9 are in the system at any moment.",
    s.note("queue", "9 in the system"),
  ),
  full: s.step(
    "More than 100 requests arrive each second. The queue grows every second, and so does the wait.",
    s.send("phone", "queue", "GET /feed"),
    s.send("phone", "queue", "GET /feed"),
    s.focus("queue"),
    s.note("queue", "wait keeps growing"),
  ),
  shed: s.step(
    "The queue has a limit. When it is full, a new request gets a fast 503 instead of a long wait.",
    s.send("phone", "queue", "GET /feed"),
    s.note("queue", "full"),
    s.send("queue", "phone", "503", "error"),
  ),
}))

export default defineLesson({
  title: "Latency and throughput",
  summary: "How long one request takes, how many finish each second, why the slowest 1% matters, and why a nearly full server makes everyone wait.",
  track: "foundations",
  order: 2,
  tags: [
    "latency",
    "throughput",
    "percentile",
    "p50",
    "p99",
    "tail latency",
    "queueing",
    "utilization",
    "Little's law",
    "batching",
  ],
  sources: [
    {
      use: "link",
      repo: "donnemartin/system-design-primer",
      title: "The System Design Primer: latency vs throughput",
      url: "https://github.com/donnemartin/system-design-primer#latency-vs-throughput",
    },
    {
      use: "link",
      title: "Google SRE book: Monitoring distributed systems",
      url: "https://sre.google/sre-book/monitoring-distributed-systems/",
    },
    {
      use: "link",
      title: "Jeffrey Dean and Luiz André Barroso: The tail at scale",
      url: "https://research.google/pubs/the-tail-at-scale/",
    },
    {
      use: "link",
      title: "John Little: Little's law as viewed on its 50th anniversary",
      url: "https://people.cs.umass.edu/~emery/classes/cmpsci691st/readings/OS/Littles-Law-50-Years-Later.pdf",
    },
    {
      use: "link",
      title: "Marc Brooker: Latency sneaks up on you",
      url: "https://brooker.co.za/blog/2021/08/05/utilization.html",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## Fast at noon, slow at night

    Picture a small photo app. At noon, its feed server answers a request in
    about 10 ms. At 9 pm, the same request sometimes takes a full second. Nobody changed the code,
    and nothing broke. The server is busier, and a busy server makes requests
    wait before it starts on them.

    This lesson explains that wait. It needs two measures, latency and
    throughput, and one idea about how requests line up. Near the end, it
    looks at what Google measured when one request waits on many servers.
    The later lessons on scaling, caching and back pressure use all of this.

    ## Two different numbers

    Latency is how long one request takes, from the moment it leaves the
    phone to the moment the answer arrives.
    ${cue("arrive", "At a quiet hour, a request finds nothing ahead of it")} and
    goes straight to the server. ${cue("serve", "The server spends 10 ms on it and replies")}.
    That time, plus the time on the network, is the latency the user feels.

    Throughput is how many requests finish each second. Say the server works
    on one request at a time. At 10 ms each,
    ${cue("rate", "it can finish at most 100 requests a second")}. That ceiling
    is its capacity. A real server works on many requests at once across its
    cores, but the arithmetic is the same for each worker.

    The two numbers answer different questions. Latency says how long one
    user waits. Throughput says how many users the system can serve. A system
    can do well on one and badly on the other.

    ## Improving one does not always improve the other

    Some changes help both. An index that lets the feed query read less data
    makes each request faster. A faster request also frees the server sooner,
    so it finishes more requests each second.

    Other changes help only one.

    - **More servers.** A second server doubles throughput. If the first server was not busy, each request still takes 10 ms, so latency stays the same.
    - **Batching.** Writing 100 events to disk in one batch takes far less disk time than 100 separate writes, so throughput goes up. Each event now waits for its batch to fill, so latency goes up too.
    - **Servers closer to users.** Moving servers nearer to the people using them cuts the network time of every request. The servers finish no more requests a second than before.

    Pick by the requirement you are missing. If users wait too long while the
    servers sit half idle, work on latency. If the servers are full, add
    throughput first. A later section shows that a full server is also a slow
    one.

    > tradeoff: Batching raises throughput and adds latency. It suits work that nobody waits on, such as analytics events and log lines. It does not suit a user posting a comment, who would wait for each batch to fill before the server saves the comment.

    ## Averages hide the slow requests

    A server handles thousands of requests a minute, and they do not all take
    the same time. Most take 10 ms.
    ${cue("slow", "A few take far longer")}, for example when the server pauses
    to free memory, or when a read misses the cache and goes to disk. The
    average mixes fast and slow requests into one number, so a few slow ones
    barely change it.

    Percentiles show the spread instead. Sort a minute of request times from
    fastest to slowest. The p50, or median, is the time halfway down the list.
    Half the requests were faster, so the p50 describes a typical user. The
    p99 is the time 99% of the way down. 1 request in 100 was slower than
    that, so the p99 describes the slowest users. They are often the most
    active users, with the biggest feeds.

    A feed with a p50 of 10 ms and a p99 of 300 ms is fast for most people
    and slow for some of them every minute. Its average could be 15 ms, which
    hides the slow loads.

    > pitfall: Do not set a latency target on the average. A few requests that take 5 seconds barely move it. Set targets on percentiles, such as "p99 under 300 ms", and alert on those.

    ## Slow calls add up

    One page often needs many backend calls. The photo app's feed page asks
    one service for the photos, another for the like counts, and another for the
    comments. The page is ready only when the slowest call returns.

    Say a page makes 50 calls, and each call has a 1% chance of being slower
    than its p99. The chance that all 50 are fast is 0.99 multiplied by itself
    50 times, about 0.6. So about 40% of page loads wait on at least one slow
    call. A delay that hits 1 call in 100 hits nearly half the pages.

    These changes help.

    - Make fewer calls per page, for example by asking for the like counts of 20 photos in one call.
    - Run the calls at the same time rather than one after another. The page then waits for the slowest call, not the sum of all of them.
    - For a call that is safe to run twice, send a second copy if the first has not answered by its p95 time, and use whichever answer comes back first.

    ## Why the queue grows

    Requests do not arrive evenly. Even when 90 arrive in an average second,
    some milliseconds bring 3 at once and others bring none. A request that
    arrives while the server is busy waits in a queue.
    ${cue("busy", "At the evening peak, requests arrive almost as fast as the server finishes them")},
    and many find others ahead of them.

    The share of time the server is working is its utilization. At 50%
    utilization, a new request often finds the server free. At 90%, it
    usually finds a line. The wait does not grow in step with the load. In a
    simple model of one server with random arrivals, the rough wait in the
    queue for a 10 ms request is this.

    - At 50% busy, about 10 ms.
    - At 80% busy, about 40 ms.
    - At 90% busy, about 90 ms.
    - At 99% busy, about 1 second.

    So at 90% busy, ${cue("wait", "a request waits about 90 ms")} before its
    10 ms of work starts. Going from 50% to 90% busy makes the wait 9 times
    longer. Going from 90% to 99% makes it 11 times longer again. That is the
    server from the top of this lesson, fast at noon and slow at 9 pm.

    > note: Real servers do not follow the model exactly, but the curve has the same shape. Many teams plan for busy servers to run at about 60% to 70% at the peak, so that a burst does not push them into the steep part.

    ## Little's law

    One rule links these numbers. The rule is Little's law, after John
    Little, who proved it in 1961. The average number of requests in a system
    equals the rate they arrive multiplied by the average time each one
    spends inside.

    At 90% busy, 90 requests arrive each second. Each one waits 90 ms and is
    served for 10 ms, so it spends 0.1 s inside. That means
    ${cue("little", "about 9 requests are in the system at any moment")}, either
    waiting or being served.

    The law holds for any system that is not growing without limit, whatever
    the pattern of arrivals. It is most useful for sizing. If the photo app's
    feed service gets 2,300 requests a second and each takes 0.2 s, about 460
    requests are in progress at once. The service needs room for 460 open
    requests, in threads, connections and memory, plus more for the peak.

    ## When load passes capacity

    Utilization cannot go past 100%.
    ${cue("full", "When more than 100 requests arrive each second")}, the
    server still finishes 100, and the rest join the queue. The queue grows
    every second the overload lasts, and the wait grows with it, until
    arrivals drop below 100 a second.

    The user sees the feed spin and then fail with a timeout. Two things make
    it worse. A request that timed out may still be in the queue, so the
    server later spends 10 ms on an answer nobody reads. And users and their
    apps retry, which adds more arrivals.

    The fix is to put a limit on the queue.
    ${cue("shed", "When the queue is full, the server rejects a new request at once")}
    with an error such as 503. A fast error lets the app react at once. It
    can wait and retry later, show a message, or try another server. Then
    add capacity, or cut the work each request needs, so that the overload
    ends. Chapter 8 covers this as back pressure.

    ## Slow servers at Google

    In 2013, two Google engineers, Jeffrey Dean and Luiz André Barroso,
    published "The tail at scale". Google's services search data spread over
    thousands of servers, so one user request can wait on many of them.
    At that size, the slow calls from the section above stop being rare.

    The paper starts with a simple case. Each server answers in 10 ms most
    of the time, and 1 request in 100 takes a full second. If a user request
    goes to 1 such server, 1 user in 100 waits a second. If it needs answers
    from 100 such servers, 63% of user requests take more than a second. It
    is the same arithmetic as the 50 calls above. 0.99 multiplied by itself 100
    times is about 0.37, so 63% of requests hit at least one slow server.

    Then the paper gives numbers from a real Google service. A root server
    sends each request to a very large number of leaf servers and waits for
    their answers. At the p99, one leaf answers within 10 ms. Waiting for
    the fastest 95% of the leaves takes 70 ms. Waiting for all of them takes
    140 ms. So the slowest 5% of the leaves cause half of the p99 time.

    The slow leaves are often not slow because of the request itself. The
    paper lists causes such as other programs on the same machine, background
    jobs, garbage collection and queues. These come and go, so a second copy
    of the request on another server is likely to be fast. That is the
    second copy from the list above. In a Google test, one request read 1,000
    values stored on 100 servers. The client sent a second copy of any read
    that had not answered after 10 ms. The p99.9 for the whole request fell
    from 1,800 ms to 74 ms, and the test sent only 2% more requests.

    For a design, measure the p99 of each part, and count how many parts one
    request waits on. The more parts it waits on, the more their slowest
    answers set its latency.

    ## In a design review

    Ask these questions about any design.

    1. What is the latency target, and at which percentile?
    2. What is the peak throughput, and what is the capacity of each part?
    3. How busy is each part at the peak? A part above about 80% will build long queues.
    4. How many backend calls does one page make, and do they run at the same time?
    5. What happens when arrivals pass capacity? Does every queue have a limit?

    When you present a design, give latency and throughput together, and name
    the percentile. For the photo app it could be this. The feed serves about 7,000
    requests a second at the evening peak, 3 times the daily average, with a
    p99 under 300 ms. Each server runs at no more than 70% busy, so a burst
    does not build a long queue.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "The photo app's feed server is 30% busy, and one feed request takes 200 ms. Which change makes a feed load faster?",
      options: [
        { text: "Add an index so the feed query reads less data", correct: true },
        { text: "Add a second feed server", why: "At 30% busy, requests barely wait. A second server adds throughput, but each request still takes 200 ms." },
        { text: "Make the queue longer", why: "The queue length matters only when requests wait, and at 30% busy they rarely do." },
      ],
      explain: "When the server is not busy, latency is the work itself. Cut the work to cut the latency.",
    },
    {
      kind: "choice",
      prompt: "The feed has a p50 of 80 ms and a p99 of 2 s. What does the p99 tell you?",
      options: [
        { text: "1 in 100 feed loads takes 2 s or longer", correct: true },
        { text: "The average feed load takes 2 s", why: "A percentile is not an average. The p50 says a typical load takes 80 ms." },
        { text: "99 in 100 feed loads take 2 s or longer", why: "It is the other way round. 99 in 100 take 2 s or less." },
      ],
      explain: "The p99 is the time that 99% of requests beat. The slowest 1% take longer.",
      replay: "slow",
    },
    {
      kind: "choice",
      prompt: "In a Google service, one leaf server answered within 10 ms at the p99, but the root waited 140 ms at the p99 for all the leaves. Why the gap?",
      options: [
        { text: "The root waits for the slowest of many leaves", correct: true },
        { text: "Each leaf did more work when the root asked it", why: "Each leaf's own p99 was 10 ms. The gap comes from waiting on many leaves, not from more work on each." },
        { text: "The root server itself was overloaded", why: "Waiting for the fastest 95% of the leaves took only 70 ms. The last 5% of the leaves cost the other 70 ms." },
      ],
      explain: "A request that waits on many servers is as slow as the slowest one. With many leaves, the chance that at least one is slow is high.",
    },
    {
      kind: "choice",
      prompt: "A page makes 50 backend calls. Each call is slower than its p99 1% of the time. About what share of page loads wait on at least one slow call?",
      options: [
        { text: "About 40%", correct: true },
        { text: "About 1%", why: "Each of the 50 calls has its own 1% chance, so the page has many chances to hit a slow one." },
        { text: "About 50%", why: "That adds 50 chances of 1%. The chance that all 50 are fast is 0.99 to the power 50, about 0.6, so the answer is about 40%." },
      ],
      explain: "The chance that all 50 calls are fast is 0.99 to the power 50, about 0.6. The other 40% of loads hit a slow call.",
    },
    {
      kind: "choice",
      prompt: "A server is 60% busy at the peak, and latency is fine. Growth will push it to 95% busy. What happens to the wait in its queue?",
      options: [
        { text: "It becomes many times longer than it is now", correct: true },
        { text: "It grows by about a third, in step with the load", why: "The wait grows much faster than the load. In the simple model it goes from 1.5 to 19 service times." },
        { text: "It stays the same until the server reaches 100%", why: "Requests arrive in bursts, so they wait long before the server is fully busy." },
      ],
      explain: "Near full load, a small rise in utilization adds a large wait. Plan to keep spare capacity.",
      replay: "wait",
    },
    {
      kind: "choice",
      prompt: "A service gets 2,000 requests a second, and each spends 0.2 s in it. On average, how many requests are in the service at once?",
      options: [
        { text: "400", correct: true },
        { text: "10,000", why: "That divides 2,000 by 0.2. Little's law multiplies the arrival rate by the time inside." },
        { text: "2,000", why: "That is the arrival rate. It leaves out how long each request stays." },
      ],
      explain: "Little's law says requests inside equals arrival rate multiplied by time inside. 2,000 times 0.2 is 400.",
      replay: "little",
    },
    {
      kind: "choice",
      prompt: "Requests arrive faster than the server finishes them, its queue has no limit, and you cannot add machines today. What do you change first?",
      options: [
        { text: "Limit the queue, and send a fast error when it is full", correct: true },
        { text: "Make the queue bigger", why: "A bigger queue holds more requests, but each one waits longer, and many time out before the server reaches them." },
        { text: "Tell apps to retry right away", why: "Retries add more arrivals to a server that is already overloaded, so the queue grows faster." },
      ],
      explain: "A limited queue keeps the wait short for the requests it accepts, and a fast error lets the app back off.",
      replay: "shed",
    },
    {
      kind: "choice",
      prompt: "Writing 100 events to disk in one batch takes far less disk time than 100 single writes, but each event waits up to 1 s for its batch. Where does batching fit?",
      options: [
        { text: "Analytics events that nobody waits on", correct: true },
        { text: "A user posting a comment", why: "The user would wait up to an extra second on every post." },
        { text: "Everywhere, because more throughput is always better", why: "Batching raises throughput and adds latency. It is worth it only where the extra delay does not matter." },
      ],
      explain: "Batching raises throughput and adds latency, so use it where a short delay costs nothing.",
    },
  ],
})
```

## Appendix B. Test changes

````diff
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index 5d52bad..58246c3 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -30,7 +30,7 @@ export const SYSTEM_DESIGN_CORRECT: readonly QuizAnswer[] = [
 export const LATENCY_CORRECT: readonly QuizAnswer[] = [
   { radio: "Add an index so the feed query reads less data" },
   { radio: "1 in 100 feed loads takes 2 s or longer" },
-  { radio: "The p99 latency" },
+  { radio: "The root waits for the slowest of many leaves" },
   { radio: "About 40%" },
   { radio: "It becomes many times longer than it is now" },
   { radio: "400" },
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 3d12010..61cc89c 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -187,7 +187,7 @@ test("the real curriculum holds the latency-and-throughput lesson", () => {
 
   expect(lesson?.track).toBe("foundations")
   expect(lesson?.order).toBe(2)
-  expect(lesson?.minutes).toBe(9)
+  expect(lesson?.minutes).toBe(11)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
     "fast-at-noon-slow-at-night",
     "two-different-numbers",
@@ -197,6 +197,7 @@ test("the real curriculum holds the latency-and-throughput lesson", () => {
     "why-the-queue-grows",
     "little-s-law",
     "when-load-passes-capacity",
+    "slow-servers-at-google",
     "in-a-design-review",
   ])
   expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
````
