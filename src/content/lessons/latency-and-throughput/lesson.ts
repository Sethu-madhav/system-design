import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
  queue: { kind: "queue", label: "Queue", at: [2, 0] },
  server: { kind: "server", label: "Feed server", at: [4, 1] },
}).steps((s) => ({
  arrive: s.step(
    "During a quiet hour, a request finds the queue empty and goes straight to the server.",
    s.send("phone", "queue", "GET /feed"),
    s.send("queue", "server", "GET /feed"),
  ),
  serve: s.step(
    "The server spends 10 ms building the feed and sends it back. The full trip from request to answer is the latency.",
    s.focus("server"),
    s.note("server", "10 ms"),
    s.send("server", "phone", "200", "response"),
  ),
  rate: s.step(
    "Handling one request at a time, at 10 ms each, the server can finish at most 100 requests a second. That rate is its throughput.",
    s.focus("server"),
    s.note("server", "100 a second"),
  ),
  slow: s.step(
    "Most requests finish in 10 ms, yet about 1 in 100 takes 300 ms or longer. Those slow requests set the p99.",
    s.send("phone", "queue", "GET /feed"),
    s.send("queue", "server", "GET /feed"),
    s.note("server", "this one 300 ms"),
    s.send("server", "phone", "200", "response"),
  ),
  busy: s.step(
    "During the evening rush, requests arrive almost as fast as the server finishes them, so new ones wait in line.",
    s.send("phone", "queue", "GET /feed"),
    s.send("phone", "queue", "GET /feed"),
    s.send("phone", "queue", "GET /feed"),
    s.focus("queue"),
    s.note("queue", "3 waiting"),
  ),
  wait: s.step(
    "At 90% busy, a request waits about 90 ms in the queue before its 10 ms of server work even begins.",
    s.focus("queue"),
    s.note("queue", "wait 90 ms"),
    s.send("queue", "server", "GET /feed"),
  ),
  little: s.step(
    "When 90 requests arrive each second and each spends 0.1 s inside, about 9 requests are in the system at any moment.",
    s.note("queue", "9 in the system"),
  ),
  full: s.step(
    "Now more than 100 requests arrive each second. The queue grows longer every second, and the wait grows with it.",
    s.send("phone", "queue", "GET /feed"),
    s.send("phone", "queue", "GET /feed"),
    s.focus("queue"),
    s.note("queue", "wait keeps growing"),
  ),
  shed: s.step(
    "With a cap on the queue, a new request gets a fast 503 error instead of sitting in a line that never clears.",
    s.send("phone", "queue", "GET /feed"),
    s.note("queue", "full"),
    s.send("queue", "phone", "503", "error"),
  ),
}))

export default defineLesson({
  title: "Latency and throughput",
  summary: "How long one request takes, how many finish each second, why the slowest 1% matters, and why a busy server makes everyone wait.",
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

    Imagine a small photo app running on a single feed server. At noon, when
    traffic is calm, the server answers a feed request in about 10 ms. By 9 pm,
    that exact same request can take a full second. Nobody shipped new code,
    and no machine crashed. The server is just busier, and once a server gets
    close to full, requests spend most of their time waiting in line before
    work on them even starts.

    This lesson explains why that wait happens and how to reason about it
    calmly. We only need two core measures, latency and throughput, along with
    a clear mental model of how requests queue up. Near the end, we look at
    real numbers Google published about what happens when one user request has
    to wait on dozens of servers. Every later lesson on scaling, caching, and
    overload builds on these ideas.

    ## Two different numbers

    Latency is how long a single request takes, measured from the moment it
    leaves the phone to the moment the response arrives back.
    ${cue("arrive", "During a quiet hour, a request finds nobody ahead of it")}
    and goes straight to the feed server.
    ${cue("serve", "The server spends 10 ms on the work and sends the answer back")}.
    That server time, plus any time spent crossing the network or waiting in a
    queue, is the latency the person holding the phone notices.

    Throughput is a different measure. It counts how many requests the server
    finishes each second. Suppose our feed server handles one request at a
    time, and each request takes 10 ms of work. In one full second,
    ${cue("rate", "the server can finish at most 100 requests")}. That top rate
    is its capacity. A real server handles several requests at once across its
    CPU cores, yet the same simple math applies to each worker.

    It helps to keep the two questions separate. Latency tells you how long
    one person waits. Throughput tells you how many people the system can
    serve at the same time. A design can do well on one and struggle on the
    other.

    ## Improving one does not always improve the other

    Some improvements help both numbers at once. Adding a database index so
    the feed query reads fewer rows cuts the time each request takes, which
    lowers latency. Because each request finishes sooner, the server also frees
    up sooner and completes more requests per second, which raises throughput.

    Other changes move only one number, and sometimes push the other in the
    wrong direction.

    - **More servers.** Adding a second server doubles your throughput. If the first server was not busy to begin with, each request still takes 10 ms, so latency stays the same.
    - **Batching.** Writing 100 analytics events to disk in one group takes far less disk time than 100 separate writes, so throughput rises. Each event now waits for its batch to fill up, so latency rises too.
    - **Servers closer to users.** Placing servers nearer to the people using the app cuts network travel time on every request. Each server still finishes the same number of requests per second.

    Let the problem you see guide the fix. When users wait too long while your
    servers sit half idle, focus on cutting latency. When your servers are
    running near full capacity, add throughput first. As we are about to see,
    running a server near full capacity makes it slow anyway.

    > tradeoff: Batching buys higher throughput at the price of extra latency. It works well for background data that nobody is waiting to see on screen, such as analytics events or log lines. It is a poor fit when someone taps Post on a comment, because they would sit and wait for a batch to fill before their comment saved.

    ## Averages hide the slow requests

    A busy server answers thousands of requests every minute, and they never
    all take the exact same time. Most of our feed requests finish in 10 ms.
    ${cue("slow", "A small fraction take much longer")}, perhaps because the
    server pauses for garbage collection or because a read misses the cache
    and hits disk. If you blend all of those times into one average, a handful
    of painful slow requests disappear into the crowd.

    Percentiles give you a clearer picture of the spread. Imagine sorting one
    minute of request times from fastest to slowest. The p50, also called the
    median, sits halfway down the list. Half the requests finished faster than
    that number, so the p50 shows the wait for a typical load. The p99 sits
    99% of the way down. One request in every 100 took longer than the p99, so
    it reveals the wait for your slowest users. In real apps, those slow
    requests often belong to your most active users, because they follow the
    most people and have the largest feeds to build.

    A feed with a p50 of 10 ms and a p99 of 300 ms is smooth for most people
    yet stalls for someone every few seconds. Its average might sit around
    15 ms, which looks healthy on a dashboard while real people wait.

    > pitfall: Avoid setting latency goals on the average. A few 5-second stalls barely nudge an average. Write your target as a percentile, such as "p99 under 300 ms", and set your alerts on that number instead.

    ## Slow calls add up

    A modern screen rarely comes from one single call. Opening our photo feed
    might ask one service for the photos, another for like counts, and another
    for comments. The phone can only finish drawing the screen once the
    slowest of those calls comes back.

    Picture a page that makes 50 backend calls, where each call has an
    independent 1% chance of running slower than its p99. The chance that one
    call is fast is 0.99. The chance that all 50 come back fast is 0.99
    multiplied by itself 50 times, which is about 0.6. That means roughly 40%
    of page loads end up waiting on at least one slow call. A hiccup that hits
    just 1 backend call in 100 reaches nearly half of your users.

    Three practical habits keep that slowdown in check.

    - Make fewer round trips per page, such as fetching like counts for 20 photos in one call instead of 20 separate calls.
    - Run independent calls in parallel rather than one after another, so the screen waits for the single slowest call instead of the sum of all of them.
    - Use a hedged request for safe reads. If a read has not answered by its p95 time, send a second copy to another server and use whichever reply arrives first. Only do this for reads or actions that are safe to repeat, never for a payment charge.

    ## Why the queue grows

    Even on a single server, latency climbs when traffic rises. Think of a
    quiet coffee counter with one barista. Customers do not walk through the
    door spaced like clockwork. Even if 90 requests arrive over an average
    second, some moments bring 3 requests at once while the next few
    milliseconds stay empty. Any request that shows up while the server is
    busy has to wait in a queue.
    ${cue("busy", "During the evening peak, requests arrive almost as fast as the server finishes them")},
    so new arrivals find a line waiting ahead of them.

    The share of time a server spends doing work is its utilization. At 50%
    utilization, a new request often finds the server free. At 90%, it almost
    always lands behind others. The surprise is how steep the wait becomes. In
    a standard single-server queueing model with random arrivals and requests
    that average 10 ms of server work, the average wait in line looks like
    this.

    - At 50% busy, about 10 ms of waiting.
    - At 80% busy, about 40 ms of waiting.
    - At 90% busy, about 90 ms of waiting.
    - At 99% busy, about 1 full second of waiting.

    At 90% busy, ${cue("wait", "a request waits about 90 ms in the queue")}
    before its 10 ms of work even begins. Moving from 50% to 90% busy makes
    the wait 9 times longer. Moving from 90% to 99% makes it 11 times longer
    again. That steep bend explains our feed server from the opening story,
    fast at noon and slow at 9 pm with no code changes at all.

    > note: Real servers have multiple cores and more complex traffic than this simple model, yet the curve bends in the exact same way. Most teams size servers to sit around 60% to 70% busy at peak load so normal traffic bursts stay out of the steep part of the curve.

    ## Little's law

    One clean rule connects arrival rate, time spent inside, and how many
    requests are in flight at once. Mathematician John Little proved it in
    1961, and engineers call it Little's law. The average number of requests
    inside a system equals the rate at which they arrive multiplied by the
    average time each request stays inside.

    Try it on our feed server at 90% busy. Ninety requests arrive each second.
    Each request waits 90 ms in line and spends 10 ms on the server, for a
    total of 100 ms, or 0.1 s, inside the system. Multiply 90 by 0.1, and you
    find that ${cue("little", "about 9 requests are in the system at any moment")},
    either waiting in line or being served.

    What makes Little's law so dependable is that it holds for any steady
    system whose queue is not growing without bound, no matter how uneven the
    traffic pattern is. It is a practical tool for sizing. If our photo app
    receives 2,300 feed requests a second and each takes 0.2 s from start to
    finish, about 460 requests are open at the same time. Your servers need
    enough threads, sockets, and memory to hold those 460 active requests,
    plus extra headroom for the evening peak.

    ## When load passes capacity

    A server cannot run above 100% utilization.
    ${cue("full", "Once more than 100 requests arrive each second")}, the
    server still completes 100, and every extra request joins the back of the
    queue. As long as arrivals stay above capacity, the line grows longer
    every single second, and the wait grows with it.

    From the user's side, the feed spinner turns until the app gives up with a
    timeout. Two quiet feedback loops make overload even harder to recover
    from. First, requests that already timed out on the phone often stay in
    the queue, so the server wastes 10 ms producing answers that nobody will
    ever read. Second, frustrated users and automatic client retries send even
    more requests into the pile.

    The safest first defense is to cap the queue length.
    ${cue("shed", "When the queue is full, the server rejects new requests right away")}
    with a fast error like HTTP 503. Engineers call this load shedding. A fast
    error lets the phone app react right away by backing off, showing a clear
    message, or trying another server, while keeping waits short for the
    requests the server did accept. Once the queue stops growing, you add
    capacity or trim the work per request so traffic drops back below
    capacity. Chapter 8 returns to this idea under back pressure.

    ## Slow servers at Google

    In 2013, two Google engineers, Jeffrey Dean and Luiz André Barroso,
    published a paper called "The tail at scale." Google's services answer
    queries by reading data spread across thousands of machines, so a single
    user action can wait on many servers at once. At that scale, tail latency
    stops being an edge case and becomes the everyday norm.

    The paper opens with a clean example. Imagine a server that answers in
    10 ms most of the time, with 1 request in 100 taking a full second. If a
    user request visits just 1 server, only 1 user in 100 waits a second. If
    that request needs answers from 100 such servers, 63% of user requests
    take more than a second. The math is the same as our 50-call feed page
    earlier. Multiply 0.99 by itself 100 times and you get about 0.37, leaving
    63% of requests waiting on at least one slow machine.

    Next, the paper shares measurements from a real Google service where a
    root server fans each request out to a large group of leaf servers. At the
    p99, any single leaf server answered within 10 ms. Waiting for the fastest
    95% of those leaves took 70 ms. Waiting for every last leaf took 140 ms.
    The slowest 5% of leaf servers accounted for half of the total p99 time.

    Those slow leaves were rarely slow because the request itself was hard.
    The paper points to temporary noise that comes and goes on real machines,
    such as other programs sharing the host, background jobs, garbage
    collection pauses, and short queues. Because the slowdown is tied to that
    one machine at that one moment, sending a hedged copy of the read to a
    different server is likely to finish fast. In one Google benchmark that
    read 1,000 values stored across 100 servers, the client sent a second copy
    of any read that had not answered after 10 ms. The p99.9 latency for the
    full request dropped from 1,800 ms to 74 ms, and the test sent only 2%
    more requests.

    When you review your own design, look at the p99 of each dependency and
    count how many of them a single request waits on. The wider the fan-out,
    the more the slowest leaf sets the user's wait.

    ## In a design review

    A few calm questions bring latency and throughput trade-offs into focus
    during any design review.

    1. What is our latency target, and which percentile are we measuring?
    2. What peak throughput do we expect, and what is the real capacity of each component?
    3. How busy is each box at peak hour? Anything past roughly 80% risks steep queue waits.
    4. How many backend calls does one screen trigger, and do they run in parallel?
    5. What happens if traffic passes capacity, and does every queue have an explicit limit?

    When you present a design, state latency and throughput together and name
    the percentile. For our photo app, you might put it like this. At the
    evening peak, the feed serves about 7,000 requests a second, three times
    the daily average, with a p99 under 300 ms. Each server stays at or below
    70% utilization so normal bursts do not build long queues.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "The photo app's feed server is 30% busy, and a single feed request takes 200 ms. Which change makes the feed load faster?",
      options: [
        { text: "Add an index so the feed query reads less data", correct: true },
        { text: "Add a second feed server", why: "At 30% busy, requests rarely wait in line. A second server adds throughput, yet each request still does 200 ms of work." },
        { text: "Make the queue longer", why: "Queue length only comes into play when requests are waiting, and at 30% busy the queue is almost always empty." },
      ],
      explain: "When a server has plenty of spare room, latency comes from the work itself. Reduce the work to lower the latency.",
    },
    {
      kind: "choice",
      prompt: "The feed has a p50 of 80 ms and a p99 of 2 s. What does the p99 tell you?",
      options: [
        { text: "1 in 100 feed loads takes 2 s or longer", correct: true },
        { text: "The average feed load takes 2 s", why: "A percentile is not an average. Here the p50 shows that a typical load finishes in 80 ms." },
        { text: "99 in 100 feed loads take 2 s or longer", why: "It works the other way around. 99 in 100 loads finish in 2 s or less." },
      ],
      explain: "The p99 marks the cutoff that 99% of requests beat, while the slowest 1% take that long or longer.",
      replay: "slow",
    },
    {
      kind: "choice",
      prompt: "In a real Google service, one leaf server answered within 10 ms at the p99, yet the root waited 140 ms at the p99 for all the leaves. Why the big gap?",
      options: [
        { text: "The root waits for the slowest of many leaves", correct: true },
        { text: "Each leaf did more work when the root asked it", why: "Each leaf's own p99 stayed at 10 ms. The gap came from waiting on many leaves at once, not from extra work per leaf." },
        { text: "The root server itself was overloaded", why: "Waiting for the fastest 95% of the leaves took 70 ms. Waiting for the slowest 5% added the other 70 ms." },
      ],
      explain: "A request that fans out to many servers is only as fast as the slowest reply. With enough leaves, at least one is likely to hit a brief slowdown.",
    },
    {
      kind: "choice",
      prompt: "A page makes 50 independent backend calls, and each call exceeds its p99 1% of the time. About what share of page loads wait on at least one slow call?",
      options: [
        { text: "About 40%", correct: true },
        { text: "About 1%", why: "Each of the 50 calls has its own 1% chance to be slow, so the page has 50 chances to hit a slowdown." },
        { text: "About 50%", why: "Adding 50 chances of 1% overcounts overlaps. The chance all 50 are fast is 0.99 to the power 50, about 0.6, which leaves about 40%." },
      ],
      explain: "The chance that all 50 calls finish fast is 0.99 to the power 50, about 0.6. The other 40% of loads hit at least one slow call.",
    },
    {
      kind: "choice",
      prompt: "A server sits at 60% busy during peak hours and latency looks fine. Traffic growth will push it to 95% busy. What happens to the wait in its queue?",
      options: [
        { text: "It becomes many times longer than it is now", correct: true },
        { text: "It grows by about a third, in step with the load", why: "Queue wait grows much faster than load. In the simple queueing model it jumps from 1.5 service times to 19." },
        { text: "It stays the same until the server reaches 100%", why: "Because requests arrive in uneven bursts, queues build long before a server hits 100%." },
      ],
      explain: "Near full capacity, a small jump in utilization causes a large jump in queue wait. Keep headroom so peak bursts stay off the steep part of the curve.",
      replay: "wait",
    },
    {
      kind: "choice",
      prompt: "A service receives 2,000 requests a second, and each stays inside for 0.2 s on average. Roughly how many requests are in the service at any moment?",
      options: [
        { text: "400", correct: true },
        { text: "10,000", why: "That divides 2,000 by 0.2. Little's law multiplies the arrival rate by the time spent inside." },
        { text: "2,000", why: "That is the arrival rate per second, and it leaves out how long each request stays." },
      ],
      explain: "By Little's law, requests in the system equal arrival rate multiplied by time inside. Multiply 2,000 by 0.2 to get 400.",
      replay: "little",
    },
    {
      kind: "choice",
      prompt: "Requests are arriving faster than a server can finish them, its queue has no cap, and you cannot add machines today. What should you change first?",
      options: [
        { text: "Limit the queue, and send a fast error when it is full", correct: true },
        { text: "Make the queue bigger", why: "A deeper queue only makes each request wait longer, so many time out before the server even reaches them." },
        { text: "Tell apps to retry right away", why: "Immediate retries pile even more traffic onto a server that is already past capacity." },
      ],
      explain: "Capping the queue keeps waits short for accepted requests, and returning a fast 503 lets clients back off instead of hanging.",
      replay: "shed",
    },
    {
      kind: "choice",
      prompt: "Writing 100 events to disk in one batch uses far less disk time than 100 single writes, yet each event waits up to 1 s for its batch to fill. Where does batching fit best?",
      options: [
        { text: "Analytics events that nobody waits on", correct: true },
        { text: "A user posting a comment", why: "The user would wait up to an extra second every time they post a comment." },
        { text: "Everywhere, because more throughput is always better", why: "Batching trades latency for throughput, so it only makes sense when a brief delay does not affect the user." },
      ],
      explain: "Batching boosts throughput by adding wait time, which works well for background data that nobody is waiting to see right away.",
    },
  ],
})
