import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "client", label: "Phone", at: [0, 1] },
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

    At noon, Inkwell's feed server answers a request in about 10 ms. At 9 pm,
    the same request sometimes takes a full second. Nobody changed the code,
    and nothing broke. The server is busier, and a busy server makes requests
    wait before it starts on them.

    This lesson explains that wait. It needs two measures, latency and
    throughput, and one idea about how requests line up. The later lessons on
    scaling, caching and back pressure use all three.

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

    One page often needs many backend calls. Inkwell's feed page asks one
    service for the photos, another for the like counts, and another for the
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
    the pattern of arrivals. It is most useful for sizing. If Inkwell's feed
    service gets 2,300 requests a second and each takes 0.2 s, about 460
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

    ## In a design review

    Ask these questions about any design.

    1. What is the latency target, and at which percentile?
    2. What is the peak throughput, and what is the capacity of each part?
    3. How busy is each part at the peak? A part above about 80% will build long queues.
    4. How many backend calls does one page make, and do they run at the same time?
    5. What happens when arrivals pass capacity? Does every queue have a limit?

    When you present a design, give latency and throughput together, and name
    the percentile. For Inkwell it could be this. The feed serves about 7,000
    requests a second at the evening peak, 3 times the daily average, with a
    p99 under 300 ms. Each server runs at no more than 70% busy, so a burst
    does not build a long queue.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "Inkwell's feed server is 30% busy, and one feed request takes 200 ms. Which change makes a feed load faster?",
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
      prompt: "Some users say the feed takes seconds to load, but the average latency looks fine. Which number should the alert watch?",
      options: [
        { text: "The p99 latency", correct: true },
        { text: "The average latency", why: "A few requests that take seconds barely move the average, which is why it looks fine now." },
        { text: "The p50 latency", why: "The p50 describes the typical request, and the typical request is already fast." },
      ],
      explain: "The complaints come from the slowest requests, and the p99 is the number that tracks them.",
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
