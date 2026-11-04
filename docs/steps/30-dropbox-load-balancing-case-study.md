# Step 30. Lesson 4.2, a Dropbox load balancing case study

## Why

The course has a rule for examples, written in `docs/curriculum.md`. Each lesson opens with a small unnamed app, then works through a public case study that a reader can check. Lesson 4.2 still uses Inkwell, the made-up photo app the course has retired. It is the last lesson that does. This step brings lesson 4.2 in line with the rule, as steps 27 to 29 did for lessons 1.1 to 1.3.

The small app stays, but it is now "a small photo app" with no name. A new section, "How Dropbox balances its requests", retells a 2019 post by three Dropbox engineers. Dropbox's layer 7 balancer, Bandaid, runs on many machines, and each one counts only its own requests. Picking by those counts left some servers fully busy at the peak. Dropbox fixed it by having each server report its own load on every response. The section ties back to the lesson's layers, its balancing rules and its health checks. Opus checked every fact in it against the post.

This step changes one lesson file and five test files. It changes no app code.

## Branch and coder rules

- Branch `step/30-dropbox-load-balancing-case-study` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 6 files below may change, and only by the 2 commands in "How to do it". Do not edit any other file.
- Do not change the lesson text, captions, quiz or tests. Opus wrote and unslopped them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the content to make it pass.
- Do not kill processes.

## What changes

### 1. The lesson

`src/content/lessons/load-balancer/lesson.ts` is replaced by Appendix A, byte for byte. The changes from main:

- "Inkwell's feed" becomes "A small photo app's feed" and "the photo app's feed". "Inkwell" in the quiz prompts becomes "A photo app". The numbers stay the same.
- The intro says the lesson ends by looking at how Dropbox's balancers choose a server.
- A new section, "How Dropbox balances its requests", sits before "In a design review". It covers the path a request takes through Dropbox's balancers, why counting requests on each Bandaid machine left load uneven, the load each server reports in a header, and the two problems that fix brought.
- The lesson now has 10 sections and reads in 11 minutes, up from 9.
- One further-reading link is added at the end of the list, for the Dropbox post. It returned 200 on 2026-11-04.
- Quiz Q7 is new. It asks why a recent 5xx error raises a server's score at Dropbox. The old Q7 asked what happens to a request that reaches a server 4 seconds after it crashed. The "Health checks" section still covers that, with its numbers for how long a crash can go unnoticed and its passive checks. Q2, Q3 and Q5 keep their answers, with Inkwell taken out of their prompts.
- The scene does not change.

The facts in the new section come from "Enhancing Bandaid load balancing at Dropbox by leveraging real-time backend server load information" by Haowei Yuan, Yi-Shu Tai and Dmitry Kopytkov, September 18, 2019.

- "our web services serve millions of requests and terabits of network traffic per second".
- A user's request reaches "one of our 20+ Point of Presences (PoPs) via DNS". Then "TCP/IP (layer-4) load balancing determines which layer-7 load balancer (i.e., edge proxies) is used". The request then goes to a data center.
- "Bandaid is a layer-7 load balancing gateway". "the Bandaid production deployment consists of a large number of instances". Each one keeps "local states" that "track only the loads introduced from this specific instance".
- "Previously, we used random N choices (where N=2 in most cases) based on numbers of active requests". It "showed benefits compared with round-robin and least-connections, but loads among backend servers could still differ considerably, and some backend servers could be fully utilized at peak load".
- The post's example of uneven cost is round robin sending five low-cost requests to one server and five high-cost requests to another.
- Each server reports its utilization in the "X-Bandaid-Utilization header". It is "the number of active requests over the maximum number of requests that can be concurrently processed", "ranging from 0.0 to 1.0". Bandaid scores servers by it and "we rely more heavily on the server utilization value".
- Because Bandaid reads load from real responses, "passively collecting piggybacked load information ... we do not have to implement active probing".
- On errors, "when a server fast fails requests, it may attract and fail more requests". So "an additional weight is added to the score if the error happened recently".
- On old numbers, Bandaid applies "stats decay", so a stored value counts less as it ages.
- After the change, "the total request processing time became more balanced". The spread of request counts per server "actually became wider".

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. The load balancer test now expects 11 minutes, the heading id `how-dropbox-balances-its-requests` before `in-a-design-review`, and the Dropbox URL at the end of the sources.
- `e2e/helpers.ts`. The seventh answer in `CORRECT` becomes "A server that fails fast looks idle, so it would draw more requests to fail".
- `e2e/lesson-text.spec.ts`. The lesson card shows "11 min", and the further reading has 5 links.
- `e2e/a11y.spec.ts`. The table of contents lists "How Dropbox balances its requests" before "In a design review".
- `e2e/search.spec.ts`. The new section mentions layer 7, so a search for "layer 7" now finds 3 sections. The new one is second.

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/30-dropbox-load-balancing-case-study.md > /tmp/step30.diff && git apply /tmp/step30.diff`
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A. This overwrites the existing file.
   `awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/30-dropbox-load-balancing-case-study.md > src/content/lessons/load-balancer/lesson.ts && git status --short`
   The status must list exactly these 6 lines, in any order.
   `M e2e/a11y.spec.ts`, `M e2e/helpers.ts`, `M e2e/lesson-text.spec.ts`, `M e2e/search.spec.ts`, `M src/content/curriculum.test.ts` and `M src/content/lessons/load-balancer/lesson.ts`.
3. Install. `pnpm install > /tmp/install30.log 2>&1; tail -3 /tmp/install30.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 85 tests, the same as main.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 204 tests in 14 files, the same as main.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e.log`. 62 tests, the same as main.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run. If the ports are still busy after 10 minutes, stop waiting and report it.

The test "Play sets data-mode=playing and a packet moves" in `e2e/scene-play.spec.ts` can fail with "packet has no box" when the machine is busy. It plays this lesson's scene, which this step does not change. If it is the only failure in a run, that run does not count. Run it again, as above.

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

- Changing the seventh answer in `CORRECT` back to the old Q7 answer fails 3 quiz tests. They are "answering all correctly shows 8/8 and passed", "a wrong choice shows its why" and "3 wrong answers out of 8 fails the quiz".
- Before the change to `e2e/search.spec.ts`, the "layer 7" search test failed, because the new section is a third match.
- With all of it in place on main at ff4b370, build passed 85 and unit 204 in 14 files. e2e passed 62 in 3 of 3 runs.
- No text on the page contains "Inkwell". The page shows the heading "How Dropbox balances its requests".
- At 390 px wide, the page's `scrollWidth` is 390.

## Originality

Opus wrote the new section and the new question. The post's facts are retold in our own words, and the short quotes stay in this spec, not in the lesson. The primer stays as a further-reading link, and the lesson copies nothing from it.

## What you see

Lesson 4.2 reads the same as before, except that the photo app has no name. Below "When the balancer fails", "How Dropbox balances its requests" follows a request through Dropbox's balancers and explains how its servers report their own load. The page's table of contents lists the new section, and the further reading lists the Dropbox post. The home card shows 11 min. Quiz question 7 asks why a recent error raises a server's score.

## Appendix A. The lesson

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  you: { kind: "client", label: "You", at: [0, 1] },
  lb: { kind: "lb", label: "Load balancer", at: [2, 1] },
  a: { kind: "server", label: "Server A", at: [4, 0] },
  b: { kind: "server", label: "Server B", at: [4, 1] },
  c: { kind: "server", label: "Server C", at: [4, 2], hidden: true },
  sessions: { kind: "cache", label: "Session store", at: [6, 1], hidden: true },
}).steps((s) => ({
  arrive: s.step(
    "Your request goes to the load balancer. You never see the servers behind it.",
    s.send("you", "lb", "GET /feed"),
  ),
  pick: s.step(
    "The balancer picks Server A by round robin and forwards the request.",
    s.focus("lb"),
    s.send("lb", "a", "GET /feed"),
  ),
  reply: s.step(
    "Server A answers. The balancer passes the response back to you.",
    s.send("a", "lb", "200", "response"),
    s.send("lb", "you", "200", "response"),
  ),
  next: s.step(
    "The next request goes to Server B, the next server in turn.",
    s.send("you", "lb", "GET /feed"),
    s.send("lb", "b", "GET /feed"),
  ),
  probe: s.step(
    "Every few seconds the balancer sends a health check to each server. Both answer 200.",
    s.parallel(s.send("lb", "a", "GET /health"), s.send("lb", "b", "GET /health")),
    s.parallel(s.send("a", "lb", "200", "response"), s.send("b", "lb", "200", "response")),
  ),
  fail: s.step(
    "Server A misses 3 health checks in a row. The balancer takes it out of the pool.",
    s.down("a"),
    s.note("lb", "A failed 3 checks"),
  ),
  reroute: s.step(
    "New requests go only to Server B, which still passes its checks.",
    s.send("you", "lb", "GET /feed"),
    s.send("lb", "b", "GET /feed"),
  ),
  scale: s.step(
    "Server C starts, passes its first health check, and joins the pool.",
    s.show("c"),
    s.send("lb", "c", "GET /health"),
    s.send("c", "lb", "200", "response"),
  ),
  drain: s.step(
    "Server B is leaving for a deploy. The balancer sends it nothing new, and B finishes its last request.",
    s.note("b", "draining"),
    s.send("b", "lb", "200", "response"),
    s.send("lb", "you", "200", "response"),
  ),
  stateless: s.step(
    "B is gone, and no user noticed. Sessions live in a shared store, so Server C can serve anyone.",
    s.hide("b"),
    s.show("sessions"),
    s.send("you", "lb", "GET /feed"),
    s.send("lb", "c", "GET /feed"),
    s.send("c", "sessions", "session?", "data"),
    s.send("sessions", "c", "session", "data"),
  ),
}))

export default defineLesson({
  title: "Load balancer",
  summary: "How a load balancer spreads requests over many servers, skips the ones that fail, and lets the pool grow or shrink while users keep working.",
  track: "edge",
  order: 2,
  tags: [
    "L4",
    "L7",
    "round robin",
    "least connections",
    "health check",
    "sticky sessions",
    "TLS termination",
    "connection draining",
    "horizontal scaling",
  ],
  sources: [
    {
      use: "link",
      repo: "donnemartin/system-design-primer",
      title: "The System Design Primer: load balancer",
      url: "https://github.com/donnemartin/system-design-primer#load-balancer",
    },
    {
      use: "link",
      title: "NGINX: HTTP load balancing",
      url: "https://nginx.org/en/docs/http/load_balancing.html",
    },
    {
      use: "link",
      title: "Envoy: outlier detection",
      url: "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier",
    },
    {
      use: "link",
      title: "Michael Mitzenmacher: The Power of Two Choices in Randomized Load Balancing",
      url: "https://www.eecs.harvard.edu/~michaelm/postscripts/mythesis.pdf",
    },
    {
      use: "link",
      title: "Dropbox: Enhancing Bandaid load balancing with real-time server load",
      url: "https://dropbox.tech/infrastructure/enhancing-bandaid-load-balancing-at-dropbox-by-leveraging-real-time-backend-server-load-information",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## One server is not enough

    A small photo app's feed gets about 2,300 requests a second on an average day and
    about 7,000 at the evening peak. Say one server can handle 1,500 feed
    requests a second before it slows down. You run it at about two thirds of
    that, 1,000 a second, so a spike has room. The peak then needs 7 servers,
    and an 8th so the pool survives losing one.

    A phone cannot choose among 8 servers. It does not know which servers
    exist, which are busy, or which crashed a minute ago. So
    ${cue("arrive", "every request goes to one address")}, and a load balancer
    behind that address chooses a server. The servers it can choose from are
    called the pool. Near the end, this lesson looks at how Dropbox's
    balancers choose a server.

    ## What happens to one request

    ${cue("pick", "The balancer picks a server from the pool")} and forwards the
    request. Round robin is the simplest rule. It takes the servers in turn, A,
    then B, then C, then A again.
    ${cue("reply", "The response comes back through the balancer")}, so the
    client only ever talks to one address.
    ${cue("next", "The next request goes to the next server in turn")}, even when
    it comes from the same user.

    Most web balancers hold two connections for each request, one to the
    client and one to the server. That is why the balancer can send each
    request to a different server, and why it sees every response a server
    returns.

    ## Health checks

    A balancer that sends requests to a dead server is worse than no balancer.
    So ${cue("probe", "it sends a health check to each server")} every few
    seconds, often a \`GET /health\` that should return 200. A server that
    misses a set number of checks in a row counts as unhealthy.
    ${cue("fail", "Server A misses 3 checks")}, and the balancer takes it out of
    the pool. ${cue("reroute", "New requests go only to the servers that pass")}.
    When A passes its checks again, often 2 in a row, it rejoins.

    These are active checks, where the balancer sends extra requests to learn
    each server's state. Passive checks watch real traffic instead. If a server
    returns 5 errors in a row, or its connections time out, the balancer stops
    using it for a while. Passive checks react faster when traffic is heavy.
    Active checks still work when there is no traffic at all. Many setups use
    both.

    The numbers decide how long users see errors. With a check every 5 seconds
    and 3 misses to fail, a dead server keeps getting requests for up to 15
    seconds. Checking every second cuts that to 3 seconds. The cost is more
    check traffic, and more false alarms from a single slow reply.

    > pitfall: Do not make \`/health\` query a database that every server shares. If that database slows down, every server fails its check at once and the balancer empties the whole pool. Let the check test only what one server owns, such as whether its process answers and its disk has space.

    ## Choosing a server

    Round robin assumes that every server is the same size and every request
    costs the same. Real pools break both assumptions, so balancers offer other
    rules.

    - **Weighted round robin.** A server with weight 2 gets twice as many requests as a server with weight 1. It suits a pool of mixed machine sizes.
    - **Least connections.** Each request goes to the server with the fewest open connections. It suits long connections, such as WebSockets or large uploads, where round robin can pile many long sessions onto one server.
    - **Least response time.** The balancer picks the server that has answered fastest lately. Load moves away from a server that slows down, before its health checks fail.
    - **Hashing.** The balancer turns a key, such as the client's IP address or the user id, into a server. The same key always reaches the same server, which helps when each server caches data for its own users. A later lesson on consistent hashing shows how to add a server without moving most keys.

    Least connections and least response time need the balancer to track the
    state of every server. When you run many balancers, each one sees only its
    own traffic, and they can all rush to the same idle server. A cheap rule
    that holds up at scale is to pick 2 servers at random and send the request
    to the one with fewer connections. It is called the power of two choices.

    ## Layer 4 and layer 7

    A **layer 4** balancer works with TCP and UDP connections. It sees IP
    addresses and ports, picks a server when a connection opens, and passes the
    bytes along without reading them. It is fast, and it works for any protocol,
    from HTTP to a database connection.

    A **layer 7** balancer reads the HTTP request. It can send \`/upload\` to
    servers with fast disks and every other path to the feed servers. It can
    route on a header or a cookie, retry a failed request on another server,
    and add a header with the client's real IP address. Reading every request
    costs CPU, so one layer 7 machine handles fewer requests than one layer 4
    machine.

    To read HTTPS, a layer 7 balancer has to decrypt it. This is called TLS
    termination. The balancer holds the certificate, and the servers behind it
    receive plain HTTP. You renew certificates in one place, and the servers
    spend no CPU on encryption.

    > tradeoff: After TLS termination, traffic inside your network is unencrypted. Many teams accept that on a private network. When rules or threats call for encryption everywhere, the balancer opens a new TLS connection to each server. That costs CPU on both sides and keeps every hop encrypted.

    Large sites often use both kinds. A layer 4 tier spreads connections over
    many layer 7 balancers, and the layer 7 balancers do the routing.

    ## Adding and removing servers

    Adding capacity is a change to the pool.
    ${cue("scale", "A new server starts, passes its first health checks, and joins")}.
    No user notices. Autoscaling does this for you, on a schedule or from a
    metric, such as adding servers when average CPU passes 60%.

    Removing a server needs more care, because it may be in the middle of
    requests. Shutting it down breaks them.
    ${cue("drain", "Connection draining")} fixes this. The balancer stops sending
    the server new requests and waits for the open ones to finish. Then the
    server shuts down. Set a limit, such as 30 seconds, so one stuck upload
    cannot hold up a deploy. A rolling deploy drains one or two servers at a
    time, so the pool never loses much capacity at once.

    ## Sessions and sticky routing

    Adding and removing servers freely has one condition. Say a user logs in
    and Server A keeps the login in its memory. The next request goes to Server
    B, which has never seen this user, and the user is logged out.

    One fix is sticky sessions. The balancer sets a cookie, or hashes the
    client's address, and keeps sending that user to Server A. It works, and it
    has costs. Load becomes uneven, because a server keeps its users even when
    it gets busy. A new server gets only new users, so it fills slowly. When
    Server A dies, every user on it loses their session.

    The better fix is to keep servers stateless.
    ${cue("stateless", "Sessions live in a shared store")}, such as a cache or a
    database, and the server reads the session on each request. Any server can
    then serve any user, and losing a server loses no logins. The price is one
    extra lookup per request, usually under a millisecond from an in-memory
    cache.

    ## When the balancer fails

    Every request now passes through the balancer, so one balancer is a single
    point of failure. There are three common answers.

    - **A pair with one shared address.** Two balancers watch each other. In active-passive mode one handles all traffic, and the other takes over the address if the first stops answering. In active-active mode both handle traffic all the time.
    - **Several balancers behind DNS.** The domain name returns several addresses, one per balancer, and clients spread across them. Clients cache DNS answers, so a dead balancer's address can linger for minutes. DNS providers that run their own health checks shorten that.
    - **A managed balancer.** A cloud provider runs many machines behind one name and replaces the ones that fail. You still choose the rules, the health checks and the timeouts.

    > note: Everything above is local load balancing, which picks a server inside one data center. Global load balancing picks the data center first, usually the nearest healthy one, through DNS or anycast routing. A request often passes through both.

    ## How Dropbox balances its requests

    Dropbox stores and syncs files for its users. In 2019, three of its
    engineers, Haowei Yuan, Yi-Shu Tai and Dmitry Kopytkov, wrote about how
    its balancers choose a server. Its services handle millions of requests
    a second.

    A request to Dropbox passes through several balancers. DNS sends it to
    one of more than 20 points of presence, which are Dropbox sites near
    users. There, a layer 4 balancer picks a layer 7 balancer, which
    forwards the request to a data center. In the data center, a
    layer 7 balancer called Bandaid sends it to the right service. This is
    the layered setup described above, with global balancing in front.

    Bandaid runs on many machines, because one could not carry all the
    requests. That brings back the problem from "Choosing a server". Each
    Bandaid machine counts only the requests it sent itself, so none of
    them sees the real load on a server. For most services, Bandaid used
    the power of two choices on those counts. It did better than round
    robin and least connections. Even so, load across servers could still
    differ a lot, and at the peak some servers were fully busy.

    Part of the reason is that requests differ in cost. Round robin can send
    5 cheap requests to one server and 5 costly ones to another. The counts
    match, but the second server does far more work.

    The fix was to let each server report its own load. A server knows how
    many requests it is serving and the most it can serve at once. It
    divides the first by the second and puts the result, from 0.0 to 1.0,
    in a header on every response. Bandaid still picks servers at random,
    usually 2. Now it gives each one a score built mostly from these
    reported numbers, and sends the request to the one with the lower score.
    Requests arrive so often that the responses keep the numbers fresh, so
    Bandaid sends no extra probes for them.

    Two problems needed their own fix.

    - A server that fails fast looks idle. If it answered every request at once with a 5xx error, its load would look low, and it would draw more requests to fail. So a recent error raises the server's score.
    - A stored number goes stale. Once a server reports high load, Bandaid sends it less, so the server has few chances to report that it has recovered. So Bandaid gives a stored number less weight as it gets older.

    After the change, the time each server spent on requests was more even.
    The number of requests per server became less even, because requests
    take different amounts of time.

    ## In a design review

    When a design shows a load balancer, ask these questions.

    1. What does the health check test, and how long does a dead server keep getting requests?
    2. Which rule picks a server, and does it fit how long the connections last?
    3. Is it layer 4 or layer 7, and where does TLS end?
    4. Where do sessions live? If the answer is sticky sessions, what happens when that server dies?
    5. How does a server leave the pool during a deploy?
    6. What happens when the balancer itself fails?

    A summary for the photo app's feed could read like this. A managed layer 7
    balancer ends TLS, checks each server every 5 seconds, and sends requests
    by round robin to 8 identical stateless servers. Sessions live in a shared
    cache, and a deploy drains each server for up to 30 seconds.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "Server A fails 3 health checks in a row. What does the load balancer do?",
      options: [
        { text: "Stops routing to Server A and keeps using the others", correct: true },
        { text: "Returns errors to every client until A recovers", why: "Only requests already on their way to A fail. The other servers keep serving." },
        { text: "Restarts Server A", why: "Restarting is an orchestrator's job, not the balancer's." },
      ],
      explain: "Health checks let the balancer route around a dead server. A rejoins once it passes its checks again.",
      replay: "fail",
    },
    {
      kind: "choice",
      prompt: "A photo app wants /upload to go to servers with fast disks and every other path to the feed servers. Which balancer can do this?",
      options: [
        { text: "Layer 4", why: "A layer 4 balancer sees addresses and ports. The path is inside the HTTP request, which it never reads." },
        { text: "Layer 7", correct: true },
        { text: "Either one, if every server has the same disks", why: "Same disks remove the reason to split, but the question asks which balancer can route on the path. Only layer 7 reads it." },
      ],
      explain: "A layer 7 balancer reads the HTTP request, so it can route on the path, a header or a cookie.",
    },
    {
      kind: "choice",
      prompt: "A photo app adds chat. Each user keeps one WebSocket open for about an hour. Which rule spreads the load best?",
      options: [
        { text: "Least connections", correct: true },
        { text: "Round robin", why: "Round robin hands out new connections in turn and ignores how many are still open. A server that got many long chats keeps them while new ones keep arriving." },
        { text: "A hash of the client's IP address", why: "Hashing ignores how busy each server is. Many users behind one office network share an address and land on the same server." },
      ],
      explain: "With long connections, the count of open connections is the load. Least connections balances that count.",
    },
    {
      kind: "multi",
      prompt: "What has to be true before you can add servers freely behind a balancer?",
      options: [
        { text: "Servers keep no per-user session in memory", correct: true },
        { text: "Sessions live in a shared store", correct: true },
        { text: "Every server has more RAM than the last", why: "Scaling out adds identical machines. Their size does not decide whether any server can serve any user." },
      ],
      explain: "Any server must be able to serve any request, so no user may depend on one server's memory.",
      replay: "stateless",
    },
    {
      kind: "multi",
      prompt: "A photo app turns on sticky sessions so it can keep logins in server memory. What does that cost?",
      options: [
        { text: "Load can become uneven, because users stay on the server they started on", correct: true },
        { text: "Users on a server that dies lose their session", correct: true },
        { text: "The balancer can no longer run health checks", why: "Health checks work the same way. The balancer still skips a failed server, and that server's users lose their session." },
        { text: "Every request needs a lookup in a session store", why: "That is the cost of a shared session store, the option sticky sessions avoid." },
      ],
      explain: "Sticky sessions tie each user to one server, so that server's load and failures become that user's problem.",
    },
    {
      kind: "choice",
      prompt: "You are deploying a new version and must take Server B out of the pool. What do you do first?",
      options: [
        { text: "Stop sending it new requests and let it finish the open ones", correct: true },
        { text: "Shut it down and let health checks reroute traffic", why: "Requests in flight on B fail, and the balancer only notices after B misses several checks." },
        { text: "Restart the balancer so it forgets B", why: "Restarting the balancer drops every open connection, not only B's." },
      ],
      explain: "Connection draining lets a server leave without breaking the requests it is serving.",
      replay: "drain",
    },
    {
      kind: "choice",
      prompt: "Dropbox's balancers pick 2 servers at random and send the request to the one with the lower load score. Why does a recent 5xx error raise a server's score?",
      options: [
        { text: "A server that fails fast looks idle, so it would draw more requests to fail", correct: true },
        { text: "Errors make a server's responses slower", why: "A server that fails fast answers quickly. The danger is that it looks less busy than the others." },
        { text: "So the failing server gets more requests and recovers sooner", why: "More requests to a failing server means more failed requests for users." },
      ],
      explain: "Picking by load favors the server that looks least busy. A server that fails every request at once can look the least busy of all, so errors have to count against it.",
    },
    {
      kind: "order",
      prompt: "Put the life of a failed server in order.",
      items: [
        "Server A stops answering",
        "A misses 3 health checks in a row",
        "The balancer takes A out of the pool",
        "A passes its checks again and rejoins",
      ],
      explain: "The balancer removes a server only after several misses, and adds it back only after several passes.",
      replay: "fail",
    },
  ],
})
```

## Appendix B. Test changes

````diff
diff --git a/e2e/a11y.spec.ts b/e2e/a11y.spec.ts
index bfa094b..f885cbc 100644
--- a/e2e/a11y.spec.ts
+++ b/e2e/a11y.spec.ts
@@ -85,6 +85,7 @@ test("TOC link scrolls to the section", async ({ page }) => {
     "Adding and removing servers",
     "Sessions and sticky routing",
     "When the balancer fails",
+    "How Dropbox balances its requests",
     "In a design review",
   ])
   await toc.getByRole("link", { name: "Choosing a server" }).click()
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index 4427731..c95cd20 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -12,7 +12,7 @@ export const CORRECT: readonly QuizAnswer[] = [
   { checks: ["Servers keep no per-user session in memory", "Sessions live in a shared store"] },
   { checks: ["Load can become uneven, because users stay on the server they started on", "Users on a server that dies lose their session"] },
   { radio: "Stop sending it new requests and let it finish the open ones" },
-  { radio: "It fails or times out, unless the balancer retries it on another server" },
+  { radio: "A server that fails fast looks idle, so it would draw more requests to fail" },
   { order: "solved" },
 ]
 
diff --git a/e2e/lesson-text.spec.ts b/e2e/lesson-text.spec.ts
index 099a922..6bc3c0f 100644
--- a/e2e/lesson-text.spec.ts
+++ b/e2e/lesson-text.spec.ts
@@ -6,7 +6,7 @@ test("home lists the Edge track with the Load balancer card", async ({ page }) =
   await expect(track.getByRole("heading", { level: 2, name: "Edge and traffic" })).toBeVisible()
   const card = track.locator('[data-testid="lesson-card"][data-slug="load-balancer"]')
   await expect(card).toContainText("Load balancer")
-  await expect(card).toContainText("9 min")
+  await expect(card).toContainText("11 min")
 })
 
 test("clicking the card opens #/learn/load-balancer", async ({ page }) => {
@@ -28,7 +28,7 @@ test("the lesson has no attribution section and lists the primer under further r
   await expect(page.getByRole("heading", { level: 2, name: "Attribution" })).toHaveCount(0)
   await expect(page.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toHaveCount(0)
   const reading = page.getByTestId("further-reading")
-  await expect(reading.locator("a")).toHaveCount(4)
+  await expect(reading.locator("a")).toHaveCount(5)
   await expect(reading.locator('a[href="https://github.com/donnemartin/system-design-primer#load-balancer"]')).toHaveText("The System Design Primer: load balancer")
 })
 
diff --git a/e2e/search.spec.ts b/e2e/search.spec.ts
index 5a1d5b0..3e03fce 100644
--- a/e2e/search.spec.ts
+++ b/e2e/search.spec.ts
@@ -53,10 +53,11 @@ test("typing 'layer 7' then Enter scrolls to the heading", async ({ page }) => {
   await page.keyboard.press("Meta+k")
   await page.getByTestId("search-input").pressSequentially("layer 7")
   const result = page.getByTestId("search-result")
-  await expect(result).toHaveCount(2)
+  await expect(result).toHaveCount(3)
   await expect(result.nth(0)).toHaveAttribute("data-kind", "section")
   await expect(result.nth(0)).toHaveAttribute("data-href", "#/learn/load-balancer/layer-4-and-layer-7")
-  await expect(result.nth(1)).toHaveAttribute("data-href", "#/learn/load-balancer/in-a-design-review")
+  await expect(result.nth(1)).toHaveAttribute("data-href", "#/learn/load-balancer/how-dropbox-balances-its-requests")
+  await expect(result.nth(2)).toHaveAttribute("data-href", "#/learn/load-balancer/in-a-design-review")
   await page.keyboard.press("Enter")
   await expect(page).toHaveURL(/#\/learn\/load-balancer\/layer-4-and-layer-7$/)
   const heading = page.locator("#layer-4-and-layer-7")
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 269ddf7..3c8fde3 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -127,7 +127,7 @@ test("the real curriculum holds the load-balancer lesson", () => {
 
   expect(curriculum.tracks.map((track) => track.id)).toEqual(["foundations", "edge"])
   expect(lesson?.order).toBe(2)
-  expect(lesson?.minutes).toBe(9)
+  expect(lesson?.minutes).toBe(11)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
     "one-server-is-not-enough",
     "what-happens-to-one-request",
@@ -137,6 +137,7 @@ test("the real curriculum holds the load-balancer lesson", () => {
     "adding-and-removing-servers",
     "sessions-and-sticky-routing",
     "when-the-balancer-fails",
+    "how-dropbox-balances-its-requests",
     "in-a-design-review",
   ])
   expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
@@ -148,6 +149,7 @@ test("the real curriculum holds the load-balancer lesson", () => {
     "https://nginx.org/en/docs/http/load_balancing.html",
     "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier",
     "https://www.eecs.harvard.edu/~michaelm/postscripts/mythesis.pdf",
+    "https://dropbox.tech/infrastructure/enhancing-bandaid-load-balancing-at-dropbox-by-leveraging-real-time-backend-server-load-information",
   ])
 })
 
````
