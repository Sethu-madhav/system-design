# Step 18. Original load balancer lesson and no adapted text

## Why

The user wants every lesson and chapter to be our own writing, and wants no Attribution section on lesson pages. CC BY 4.0 requires credit on any page that adapts the primer. So the app stops adapting it, and the credit code goes away with it. The current load balancer lesson is also a short demo with 8 cues. It is replaced by a full original lesson of about 1,570 words, 10 diagram steps and 8 quiz questions.

This must be one PR. If the credit section went first, the live site would show adapted primer text without credit. If the new lesson went first, the code would still allow adapting.

The PR also replaces the 10 `TRACKS` with the 12 chapters of `docs/curriculum.md`, and fixes two layout bugs that the longer lesson exposes.

## Branch and coder rules

- Branch `step/18-original-load-balancer` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Do not edit `src/components/ui`, `src/lib/ink` or `vendor`.
- No comments in code, except the `@ts-expect-error` lines in `src/content/license.typetest.ts`. No `any`, no `as` casts, no non-null `!`.
- Do not change the lesson text, captions, quiz or tests below. Opus wrote and unslopped them. If something does not compile or a test fails, stop and report the exact error. Do not rewrite the content to make it pass.

## What changes

### 1. The source registry allows links only

`src/content/sources.ts`.
- `Rule` becomes `"link" | "link-only"`.
- `SourceInfo` is one interface with `rule`, `title`, `author`, `url` and `license`. The adapt variant and `licenseUrl` are gone.
- The primer entry becomes `rule: "link"`.
- `AdaptableRepo`, `CHANGE_NOTICE`, `Attribution` and `attribution()` are deleted.
- `SourceRef` is `{ readonly use: "link"; readonly title: string; readonly url: string; readonly repo?: RepoId }`. `Sources` is a non-empty tuple of `SourceRef`.
- `toRule` no longer accepts `"Adapt."`.

`src/content/lesson.ts` drops `attributions` and `furtherReading` from `Lesson` and from `finishLesson`. Pages read `lesson.sources` directly. `src/content/index.ts` exports `SourceRef` instead of the deleted types.

`docs/sources.md` now says that lessons are our own writing and only link sources. The primer's row becomes `Link.`, and the Adapt. paragraph is gone.

### 2. Lesson pages lose the Attribution section

`src/app/LessonPage.tsx` deletes the `data-testid="attribution"` section. Further reading maps `lesson.sources`.

### 3. The 12 chapters

`src/content/curriculum.ts` replaces `TRACKS` with these entries, in this order:

| id | title |
| :--- | :--- |
| `foundations` | Foundations |
| `estimation` | Back of the envelope |
| `network` | The path of a request |
| `edge` | Edge and traffic |
| `application` | Application services |
| `data` | Databases |
| `cache` | Caching |
| `async` | Asynchronous work |
| `distributed` | Distributed systems |
| `operations` | Running in production |
| `security` | Security |
| `case-studies` | Case studies |

### 4. The new lesson

`src/content/lessons/load-balancer/lesson.ts` is replaced by the file in the appendix, byte for byte. It is in chapter `edge`, order 2, and reads in 9 minutes. It has 9 sections, 10 steps (`arrive`, `pick`, `reply`, `next`, `probe`, `fail`, `reroute`, `scale`, `drain`, `stateless`), 8 quiz questions and 4 further-reading links. All 4 URLs returned 200 on 2026-11-03.

A note on the scene. `stateless` starts with `s.hide("b")`, not `drain`. The `drain` step still sends from B, and a step cannot send from a node it hides, so the DSL throws "b is not visible in step drain".

### 5. Two layout fixes the long lesson needs

**The page widens on a phone.** At 390 px wide, the home page's `scrollWidth` became 397 px. The overflow grows with page height. Grids 3,000 and 6,000 px tall gave 390, 9,000 px gave 392, and the real 11,484 px page gave 397. The scrubber's 12 px ink overflow is the same on main, so it is not the cause. Clipping the article removed the overflow, but the prose wrapper and its pseudo-elements were not the cause. The fix is `overflow-x-clip` on the page wrapper in `src/app/Shell.tsx`. `clip` keeps `position: sticky` working, which `hidden` would break.

**A section deep link lands in the wrong place.** The page scrolled to the heading before the web fonts loaded. The fonts then grew the page from 6,882 to 7,664 px and pushed the heading off screen. The fix in `LessonPage.tsx` scrolls again once `document.fonts.ready` resolves, and the cleanup stops a stale scroll. With the fix, the heading stays at top 80 px.

### 6. Tests

The patch in the appendix has every test change. In short:

- `sources.test.ts` tests `Link.` and `Link only.`, and expects `Unknown rule: Adapt.`. The licenseUrl test and the 2 attribution tests are gone.
- `license.typetest.ts` has 2 valid link cases and 3 `@ts-expect-error` cases: adapting the primer, adapting ByteByteGo and an unknown repo.
- `content.test.ts` drops "adapted sources name only adapt repos". The link test checks `source.repo !== undefined`.
- `curriculum.test.ts` checks the new lesson's fields, sections, steps, quiz length and source URLs. A new test checks the 12 `TRACKS` in order.
- `e2e/helpers.ts` gets a `CORRECT` answer list for the 8 questions and an `answerQuiz` helper. `solveOrder` works for any number of items.
- `quiz.spec.ts` checks 8/8 to pass, 7/8 with a wrong answer's why and 5/8 to fail. It also checks "show me" on the drain question, Retake and the disabled Next and Submit buttons.
- `lesson-text.spec.ts` checks "9 min", the first heading and 10 cues. It also checks that the page has no attribution section and lists the primer under further reading. The deep link uses `adding-and-removing-servers`.
- `a11y.spec.ts`, `scene-static.spec.ts`, `scene-play.spec.ts` and `search.spec.ts` change to the new headings, step count, captions and search results. A new static test checks the `drain` and `stateless` steps.
- `progress.spec.ts` and `deploy.spec.ts` do not change.

### 7. Docs

The patch includes `docs/sources.md`. Also change these lines by hand.

`docs/design/architecture.md`
- Line 12 becomes `    sources.ts       SOURCES registry, SourceRef, Sources, parseSourcesTable`.
- Line 42. Replace the sentence that starts "`docs/sources.md` requires that the build fail" with: `docs/sources.md` says every lesson is our own writing and every source is a further-reading link, and the build fails when a lesson marks a source as adapted.
- Line 62 becomes `  sources: [{ use: "link", repo: "donnemartin/system-design-primer", title: "The System Design Primer: load balancer", url: "https://github.com/donnemartin/system-design-primer#load-balancer" }],`.
- Line 72. Change "and `use: "adapted"` with any repo except the primer" to "and `use: "adapted"` with any repo".
- Line 107 becomes this paragraph:

  **The license rule lives in the type of `SourceRef`.** `SourceRef` allows only `use: "link"`, so `{ use: "adapted", ... }` does not compile for any repo, the primer included, and `pnpm build` starts with `tsc -b`. Lesson pages have no credit section, because no lesson adapts text. `docs/sources.md` stays the human source. `content.test.ts` parses its table and fails the build if the registry differs, which makes the two lists fail loudly when they diverge (hand-synced list rule). `license.typetest.ts` holds `@ts-expect-error` cases, so a loosened type also breaks `tsc`. Build: `tsc -b && vitest run src/content && vite build`.

`docs/plan.md`
- Line 3. Replace "Lesson text adapts `donnemartin/system-design-primer` under CC BY 4.0 and links to the other repos listed in `docs/sources.md`." with "Lesson text is our own writing and links to the repos listed in `docs/sources.md` for further reading."
- Line 70 becomes `- No lesson adapts a source. `SourceRef` accepts only `use: "link"`, so `use: "adapted"` is a compile error for every repo, and a test fails the build when `src/content/sources.ts` and `docs/sources.md` disagree. Paraphrase can't be caught by a test, so Opus reviews every lesson's text.`

Leave `docs/design/steps.md` and the step table in `docs/plan.md` alone. They record what steps 1 to 15 built.

## How to do it

1. Save the patch from Appendix B to a file and run `git apply` on it. It must apply cleanly. If it does not, stop and report the error.
2. Write `src/content/lessons/load-balancer/lesson.ts` from Appendix A, byte for byte.
3. Make the doc edits in section 7.
4. Run the commands below.

## Commands that must pass

Run each one 3 times.

- `pnpm build`. The content step runs 65 tests.
- `pnpm test`. 183 tests in 14 files.
- `pnpm e2e`. 50 tests.

`grep -rn "AdaptableRepo\|CHANGE_NOTICE\|licenseUrl\|furtherReading\|attribution(" src e2e` prints nothing. The word "attribution" still appears in `e2e/lesson-text.spec.ts`, which checks that the section is gone.

The two `adapted` cases in `license.typetest.ts` are valid `SourceRef` values apart from `use`. So `use` is their only type error, and adding `"adapted"` back to `SourceRef` makes `tsc -b` fail on an unused `@ts-expect-error`.

## Originality

Opus read the primer's load balancer section (README lines 660 to 720) after writing the lesson. The lesson does not follow its order or examples. It opens with sizing a pool for a made-up app called Inkwell, and uses `/upload` for the layer 7 example, not the primer's examples. The health check timing math, the shared-database pitfall, power of two choices, connection draining and the design review questions do not appear in that section.

## What you see

The lesson page has 9 sections and no Attribution section. Further reading lists the primer, NGINX, Envoy and Mitzenmacher's thesis. The diagram plays 10 steps. Server A gets crossed out, Server C joins, B drains with a note and then leaves, and a session store appears beside C. The home page shows the Edge and traffic chapter with the Load balancer card at 9 min.

## Appendix A. `src/content/lessons/load-balancer/lesson.ts`

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
  ],
  scene,
  body: ({ cue }) => md`
    ## One server is not enough

    Inkwell's feed gets about 2,300 requests a second on an average day and
    about 7,000 at the evening peak. Say one server can handle 1,500 feed
    requests a second before it slows down. You run it at about two thirds of
    that, 1,000 a second, so a spike has room. The peak then needs 7 servers,
    and an 8th so the pool survives losing one.

    A phone cannot choose among 8 servers. It does not know which servers
    exist, which are busy, or which crashed a minute ago. So
    ${cue("arrive", "every request goes to one address")}, and a load balancer
    behind that address chooses a server. The servers it can choose from are
    called the pool.

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

    ## In a design review

    When a design shows a load balancer, ask these questions.

    1. What does the health check test, and how long does a dead server keep getting requests?
    2. Which rule picks a server, and does it fit how long the connections last?
    3. Is it layer 4 or layer 7, and where does TLS end?
    4. Where do sessions live? If the answer is sticky sessions, what happens when that server dies?
    5. How does a server leave the pool during a deploy?
    6. What happens when the balancer itself fails?

    A summary for Inkwell's feed could read like this. A managed layer 7
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
      prompt: "Inkwell wants /upload to go to servers with fast disks and every other path to the feed servers. Which balancer can do this?",
      options: [
        { text: "Layer 4", why: "A layer 4 balancer sees addresses and ports. The path is inside the HTTP request, which it never reads." },
        { text: "Layer 7", correct: true },
        { text: "Either one, if every server has the same disks", why: "Same disks remove the reason to split, but the question asks which balancer can route on the path. Only layer 7 reads it." },
      ],
      explain: "A layer 7 balancer reads the HTTP request, so it can route on the path, a header or a cookie.",
    },
    {
      kind: "choice",
      prompt: "Inkwell adds chat. Each user keeps one WebSocket open for about an hour. Which rule spreads the load best?",
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
      prompt: "Inkwell turns on sticky sessions so it can keep logins in server memory. What does that cost?",
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
      prompt: "Server A crashes. A request reaches it 4 seconds later, before A has missed enough health checks. What happens to that request?",
      options: [
        { text: "It fails or times out, unless the balancer retries it on another server", correct: true },
        { text: "Nothing, because the balancer knows at once and never sends it", why: "The balancer learns about the crash only from missed checks or failed requests. Until A misses enough checks, it still counts as healthy." },
        { text: "It waits at the balancer until A comes back", why: "A balancer does not hold requests for a dead server. The client gets an error or a timeout." },
      ],
      explain: "Health checks take time to notice a crash. Retries and passive checks shorten the window, but they cannot close it.",
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

## Appendix B. The patch for every other file

````diff
diff --git a/docs/sources.md b/docs/sources.md
index bf32f69..eec1247 100644
--- a/docs/sources.md
+++ b/docs/sources.md
@@ -1,6 +1,6 @@
 # Content sources and what the license allows
 
-The app's lessons are original text. Facts and concepts, such as how consistent hashing works, are not protected by copyright. The wording, the diagrams, and the structure of a source are. Each source below has a rule that says what a lesson may take from it.
+The app's lessons and chapters are our own writing. Facts and concepts, such as how consistent hashing works, are not protected by copyright. The wording, the diagrams and the structure of a source are. No lesson adapts any source below. A lesson may only link a source in its further-reading list.
 
 Stars and license types come from `https://api.github.com/repos/<owner>/<repo>`, checked on 2026-11-01. GitHub reported `NOASSERTION` for the primer, `system-design-101`, and `karanpratapsingh/system-design`, so their license types come from reading their license files.
 
@@ -8,7 +8,7 @@ Stars and license types come from `https://api.github.com/repos/<owner>/<repo>`,
 
 | Repo | Stars | License | Rule |
 |---|---|---|---|
-| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 376,462 | CC BY 4.0, from `LICENSE.txt` | Adapt. |
+| [donnemartin/system-design-primer](https://github.com/donnemartin/system-design-primer) | 376,462 | CC BY 4.0, from `LICENSE.txt` | Link. |
 | [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | 75,286 | MIT | Link. |
 | [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101) | 90,918 | CC BY-NC-ND 4.0, from `LICENSE.md` | Link only. |
 | [karanpratapsingh/system-design](https://github.com/karanpratapsingh/system-design) | 46,746 | CC BY-NC-ND 4.0, from `LICENSE` | Link only. |
@@ -18,9 +18,7 @@ Stars and license types come from `https://api.github.com/repos/<owner>/<repo>`,
 
 ## Rules
 
-**Adapt.** A lesson may follow the source's topic order and paraphrase its explanations. The lesson's frontmatter names the source, links the source and the license, and says that the lesson changed the text. CC BY 4.0 requires all three. The app does not copy the source's images, because some primer images credit other authors under other terms. The app draws its own diagrams.
-
-**Link.** A lesson may link the source in its further-reading list. MIT allows copying with the notice kept, but no lesson needs more than a link.
+**Link.** A lesson may link the source in its further-reading list. It does not copy or paraphrase the text, and it does not follow the source's topic order. The licenses of these repos would allow more. CC BY 4.0 allows adapting with credit, and MIT allows copying with the notice kept. We choose to write every lesson ourselves, so no lesson page needs a credit section.
 
 **Link only.** A lesson may link the source in its further-reading list. A lesson does not copy or paraphrase the source's text, diagrams, or structure. A redrawn version of a source's diagram counts as an adaptation, so lesson animations do not recreate a diagram from a "Link only" repo.
 - CC BY-NC-ND forbids sharing adapted versions.
@@ -33,4 +31,4 @@ Stars and license types come from `https://api.github.com/repos/<owner>/<repo>`,
 
 `src/content/sources.ts` holds the same table as code. Step 3 of `docs/plan.md` adds it. A test reads this file during `pnpm build` and fails the build if the two tables disagree. So a change to the table above needs the same change in `sources.ts`.
 
-From step 7, every lesson has a required `sources` field. A lesson that cites a "Link only" or "Link" repo as adapted does not compile. That check reads only the `sources` field, so it cannot catch a paraphrase. Opus compares each lesson against its sources when it reviews the lesson.
+Every lesson has a required `sources` field, and every entry in it is a link. `src/content/license.typetest.ts` checks that an entry with `use: "adapted"` does not compile, for any repo. That check reads only the `sources` field, so it cannot catch a paraphrase. Opus compares each lesson against its sources when it reviews the lesson.
diff --git a/e2e/a11y.spec.ts b/e2e/a11y.spec.ts
index ebe8660..c1fe2e1 100644
--- a/e2e/a11y.spec.ts
+++ b/e2e/a11y.spec.ts
@@ -76,10 +76,20 @@ test("TOC link scrolls to the section", async ({ page }) => {
   await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Load balancer")
   const toc = page.getByTestId("toc")
   await expect(toc).toBeVisible()
-  await expect(toc.locator("a").allTextContents()).resolves.toEqual(["What it does", "How it picks a server", "Horizontal scaling"])
-  await toc.getByRole("link", { name: "How it picks a server" }).click()
-  await expect(page).toHaveURL(/#\/learn\/load-balancer\/how-it-picks-a-server$/)
-  await expect(page.locator("#how-it-picks-a-server")).toBeInViewport()
+  await expect(toc.locator("a").allTextContents()).resolves.toEqual([
+    "One server is not enough",
+    "What happens to one request",
+    "Health checks",
+    "Choosing a server",
+    "Layer 4 and layer 7",
+    "Adding and removing servers",
+    "Sessions and sticky routing",
+    "When the balancer fails",
+    "In a design review",
+  ])
+  await toc.getByRole("link", { name: "Choosing a server" }).click()
+  await expect(page).toHaveURL(/#\/learn\/load-balancer\/choosing-a-server$/)
+  await expect(page.locator("#choosing-a-server")).toBeInViewport()
   expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
   const tocRect = await toc.boundingBox()
   expect(tocRect?.y).toBeGreaterThanOrEqual(0)
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index 2328f0d..55a8ce2 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -1,35 +1,51 @@
 import { expect, type Page } from "@playwright/test"
 
-export async function solveOrder(page: Page) {
-  let values: number[] = []
-  for (let target = 0; target < 4; target += 1) {
-    values = await page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
-      rows.map((row) => Number(row.getAttribute("data-item"))),
-    )
-    let position = values.indexOf(target)
+export type QuizAnswer =
+  | { readonly radio: string }
+  | { readonly checks: readonly string[] }
+  | { readonly order: "solved" }
+
+export const CORRECT: readonly QuizAnswer[] = [
+  { radio: "Stops routing to Server A and keeps using the others" },
+  { radio: "Layer 7" },
+  { radio: "Least connections" },
+  { checks: ["Servers keep no per-user session in memory", "Sessions live in a shared store"] },
+  { checks: ["Load can become uneven, because users stay on the server they started on", "Users on a server that dies lose their session"] },
+  { radio: "Stop sending it new requests and let it finish the open ones" },
+  { radio: "It fails or times out, unless the balancer retries it on another server" },
+  { order: "solved" },
+]
 
-    while (position > target) {
+export async function solveOrder(page: Page) {
+  const read = () => page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
+    rows.map((row) => Number(row.getAttribute("data-item"))),
+  )
+  let values = await read()
+  for (let target = 0; target < values.length; target += 1) {
+    while (values.indexOf(target) > target) {
       const row = page.locator(`[data-testid="quiz-order"] li[data-item="${target}"]`)
       const upLabel = await row.getByRole("button").first().getAttribute("aria-label")
       await row.getByRole("button", { name: upLabel ?? "" }).click()
-      values = await page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
-        rows.map((item) => Number(item.getAttribute("data-item"))),
-      )
-      position = values.indexOf(target)
+      values = await read()
+    }
+  }
+  expect(values).toEqual([...values.keys()])
+}
+
+export async function answerQuiz(page: Page, answers: readonly QuizAnswer[] = CORRECT, { submit = true } = {}) {
+  const quiz = page.getByTestId("quiz")
+  for (const [index, answer] of answers.entries()) {
+    if ("radio" in answer) await page.getByRole("radio", { name: answer.radio, exact: true }).click()
+    if ("checks" in answer) {
+      for (const name of answer.checks) await page.getByRole("checkbox", { name, exact: true }).check()
     }
+    if ("order" in answer) await solveOrder(page)
+    const last = submit && index === answers.length - 1
+    await quiz.getByRole("button", { name: last ? "Submit" : "Next", exact: true }).click()
   }
-  expect(values).toEqual([0, 1, 2, 3])
 }
 
 export async function passQuiz(page: Page) {
-  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("radio", { name: "Layer 7" }).click()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
-  await page.getByRole("checkbox", { name: "Sessions live in a shared store" }).check()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await solveOrder(page)
-  await page.getByRole("button", { name: "Submit" }).click()
+  await answerQuiz(page)
   await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
 }
diff --git a/e2e/lesson-text.spec.ts b/e2e/lesson-text.spec.ts
index fef1572..099a922 100644
--- a/e2e/lesson-text.spec.ts
+++ b/e2e/lesson-text.spec.ts
@@ -6,7 +6,7 @@ test("home lists the Edge track with the Load balancer card", async ({ page }) =
   await expect(track.getByRole("heading", { level: 2, name: "Edge and traffic" })).toBeVisible()
   const card = track.locator('[data-testid="lesson-card"][data-slug="load-balancer"]')
   await expect(card).toContainText("Load balancer")
-  await expect(card).toContainText("2 min")
+  await expect(card).toContainText("9 min")
 })
 
 test("clicking the card opens #/learn/load-balancer", async ({ page }) => {
@@ -16,24 +16,26 @@ test("clicking the card opens #/learn/load-balancer", async ({ page }) => {
   await expect(page.getByRole("heading", { level: 1, name: "Load balancer" })).toBeVisible()
 })
 
-test("lesson shows h2 'What it does' and 8 cues", async ({ page }) => {
+test("lesson shows h2 'One server is not enough' and 10 cues", async ({ page }) => {
   await gotoReady(page, "/#/learn/load-balancer")
-  await expect(page.locator('[data-testid="prose"] h2[id="what-it-does"]')).toHaveText("What it does")
-  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(8)
+  await expect(page.locator('[data-testid="prose"] h2[id="one-server-is-not-enough"]')).toHaveText("One server is not enough")
+  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(10)
 })
 
-test("attribution links to the primer anchor and to the CC BY 4.0 license and says text was changed", async ({ page }) => {
+test("the lesson has no attribution section and lists the primer under further reading", async ({ page }) => {
   await gotoReady(page, "/#/learn/load-balancer")
-  const attribution = page.locator('[data-testid="attribution"]')
-  await expect(attribution.locator('a[href="https://github.com/donnemartin/system-design-primer#load-balancer"]')).toBeVisible()
-  await expect(attribution.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toBeVisible()
-  await expect(attribution).toContainText("Text paraphrased and shortened. Diagrams are original.")
+  await expect(page.getByTestId("attribution")).toHaveCount(0)
+  await expect(page.getByRole("heading", { level: 2, name: "Attribution" })).toHaveCount(0)
+  await expect(page.locator('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toHaveCount(0)
+  const reading = page.getByTestId("further-reading")
+  await expect(reading.locator("a")).toHaveCount(4)
+  await expect(reading.locator('a[href="https://github.com/donnemartin/system-design-primer#load-balancer"]')).toHaveText("The System Design Primer: load balancer")
 })
 
-test("deep link #/learn/load-balancer/horizontal-scaling scrolls the heading into view", async ({ page }) => {
+test("deep link #/learn/load-balancer/adding-and-removing-servers scrolls the heading into view", async ({ page }) => {
   await page.setViewportSize({ width: 1280, height: 500 })
-  await gotoReady(page, "/#/learn/load-balancer/horizontal-scaling")
-  await expect(page.locator("#horizontal-scaling")).toBeInViewport()
+  await gotoReady(page, "/#/learn/load-balancer/adding-and-removing-servers")
+  await expect(page.locator("#adding-and-removing-servers")).toBeInViewport()
   await expect(page.getByRole("heading", { level: 1, name: "Load balancer" })).not.toBeInViewport()
 })
 
@@ -87,7 +89,7 @@ test("every text line on a lesson card sits just above a ruled line", async ({ p
 test("text links are blue and underlined", async ({ page }) => {
   const blue = "rgb(44, 79, 158)"
   const pages: [string, string][] = [
-    ["/#/learn/load-balancer", '[data-testid="attribution"] a, [data-testid="further-reading"] a, [data-testid="lesson-nav"] a, [data-testid="prose"] a'],
+    ["/#/learn/load-balancer", '[data-testid="further-reading"] a, [data-testid="lesson-nav"] a, [data-testid="prose"] a'],
     ["/#/nowhere", '[data-testid="not-found"] a'],
   ]
   for (const [path, selector] of pages) {
diff --git a/e2e/quiz.spec.ts b/e2e/quiz.spec.ts
index c89d72c..5a79084 100644
--- a/e2e/quiz.spec.ts
+++ b/e2e/quiz.spec.ts
@@ -1,24 +1,16 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { solveOrder } from "./helpers"
+import { CORRECT, answerQuiz } from "./helpers"
 
 const path = "/#/learn/load-balancer"
 
-test("answering all correctly shows 4/4 and passed", async ({ page }) => {
+test("answering all correctly shows 8/8 and passed", async ({ page }) => {
   await gotoReady(page, path)
-  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("radio", { name: "Layer 7" }).click()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
-  await page.getByRole("checkbox", { name: "Sessions live in a shared store" }).check()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await solveOrder(page)
-  await page.getByRole("button", { name: "Submit" }).click()
+  await answerQuiz(page)
 
-  await expect(page.getByTestId("quiz-score")).toHaveText("4/4")
+  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
   await expect(page.getByTestId("quiz-verdict")).toHaveText("Passed")
   await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
-  await expect(page.getByTestId("quiz-answer")).toHaveCount(4)
+  await expect(page.getByTestId("quiz-answer")).toHaveCount(8)
   expect(await page.getByTestId("quiz-answer").evaluateAll((items) =>
     items.every((item) => item.getAttribute("data-correct") === "true"),
   )).toBe(true)
@@ -26,52 +18,51 @@ test("answering all correctly shows 4/4 and passed", async ({ page }) => {
 
 test("a wrong choice shows its why", async ({ page }) => {
   await gotoReady(page, path)
-  await page.getByRole("radio", { name: "Restarts Server A" }).click()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("radio", { name: "Layer 7" }).click()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await solveOrder(page)
-  await page.getByRole("button", { name: "Submit" }).click()
+  await answerQuiz(page, [{ radio: "Restarts Server A" }, ...CORRECT.slice(1)])
 
+  await expect(page.getByTestId("quiz-score")).toHaveText("7/8")
   const firstAnswer = page.locator('[data-testid="quiz-answer"][data-index="0"]')
   await expect(firstAnswer).toHaveAttribute("data-correct", "false")
   await expect(firstAnswer).toContainText("Restarting is an orchestrator's job, not the balancer's.")
 })
 
-test("'show me' on the health-check question sets the scene to step fail", async ({ page }) => {
+test("3 wrong answers out of 8 fails the quiz", async ({ page }) => {
   await gotoReady(page, path)
-  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
-  await page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("radio", { name: "Layer 7" }).click()
-  await page.getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
-  await page.getByRole("button", { name: "Next", exact: true }).click()
-  await solveOrder(page)
-  await page.getByRole("button", { name: "Submit" }).click()
-  await page.locator('[data-testid="quiz-answer"][data-index="0"]').getByRole("button", { name: "Show me in the diagram" }).click()
+  await answerQuiz(page, [
+    { radio: "Restarts Server A" },
+    { radio: "Layer 4" },
+    { radio: "Round robin" },
+    ...CORRECT.slice(3),
+  ])
+
+  await expect(page.getByTestId("quiz-score")).toHaveText("5/8")
+  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "false")
+})
+
+test("'show me' on the drain question sets the scene to step drain", async ({ page }) => {
+  await gotoReady(page, path)
+  await answerQuiz(page, [
+    ...CORRECT.slice(0, 5),
+    { radio: "Shut it down and let health checks reroute traffic" },
+    ...CORRECT.slice(6),
+  ])
+  const drainAnswer = page.locator('[data-testid="quiz-answer"][data-index="5"]')
+  await expect(drainAnswer).toContainText("Requests in flight on B fail")
+  await drainAnswer.getByRole("button", { name: "Show me in the diagram" }).click()
 
   const scene = page.getByTestId("scene")
-  await expect(scene).toHaveAttribute("data-step-id", "fail")
+  await expect(scene).toHaveAttribute("data-step-id", "drain")
   await expect(scene).toHaveAttribute("data-mode", "stepping")
   await expect(scene).toBeInViewport()
 })
 
 test("Retake clears answers", async ({ page }) => {
   await gotoReady(page, path)
-  await page.getByRole("radio", { name: "Stops routing to Server A and keeps using the others" }).click()
-  await page.getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("radio", { name: "Layer 7" }).click()
-  await page.getByRole("button", { name: "Next", exact: true }).click()
-  await page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" }).check()
-  await page.getByRole("button", { name: "Next", exact: true }).click()
-  await solveOrder(page)
-  await page.getByRole("button", { name: "Submit" }).click()
+  await answerQuiz(page)
   await page.getByRole("button", { name: "Retake" }).click()
 
   await expect(page.getByTestId("quiz")).toHaveAttribute("data-phase", "answering")
-  await expect(page.getByTestId("quiz-count")).toHaveText("Question 1 of 4")
+  await expect(page.getByTestId("quiz-count")).toHaveText("Question 1 of 8")
   expect(await page.getByRole("radio").evaluateAll((radios) =>
     radios.every((radio) => radio.getAttribute("aria-checked") !== "true"),
   )).toBe(true)
@@ -86,16 +77,19 @@ test("Next and Submit are disabled until the question is answered", async ({ pag
   await expect(next).toBeEnabled()
   await next.click()
   await page.getByRole("radio", { name: "Layer 7" }).click()
-  await page.getByRole("button", { name: "Next", exact: true }).click()
+  await next.click()
+  await page.getByRole("radio", { name: "Least connections" }).click()
+  await next.click()
 
-  const multiNext = page.getByTestId("quiz").getByRole("button", { name: "Next", exact: true })
   const multiOption = page.getByRole("checkbox", { name: "Servers keep no per-user session in memory" })
-  await expect(multiNext).toBeDisabled()
+  await expect(next).toBeDisabled()
   await multiOption.check()
-  await expect(multiNext).toBeEnabled()
+  await expect(next).toBeEnabled()
   await multiOption.uncheck()
-  await expect(multiNext).toBeDisabled()
+  await expect(next).toBeDisabled()
   await multiOption.check()
-  await multiNext.click()
+  await next.click()
+  await answerQuiz(page, CORRECT.slice(4, 7), { submit: false })
+  await expect(page.getByTestId("quiz-count")).toHaveText("Question 8 of 8")
   await expect(page.getByTestId("quiz").getByRole("button", { name: "Submit" })).toBeEnabled()
 })
diff --git a/e2e/scene-play.spec.ts b/e2e/scene-play.spec.ts
index de64091..13fdb82 100644
--- a/e2e/scene-play.spec.ts
+++ b/e2e/scene-play.spec.ts
@@ -62,12 +62,12 @@ test("dragging the slider to the end shows the last caption", async ({ page }) =
   await page.mouse.down()
   await page.mouse.move(trackBox.x + trackBox.width + 40, trackBox.y + trackBox.height / 2)
   await page.mouse.up()
-  await expect(page.getByTestId("step-count")).toHaveText("Step 8 of 8")
-  await expect(page.getByTestId("caption")).toHaveText("Any server can take any request only if servers keep no session state. Sessions move to a shared store.")
+  await expect(page.getByTestId("step-count")).toHaveText("Step 10 of 10")
+  await expect(page.getByTestId("caption")).toHaveText("B is gone, and no user noticed. Sessions live in a shared store, so Server C can serve anyone.")
   await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "paused")
 })
 
-test("clicking the cue 'stops sending requests to unhealthy servers' sets data-step-id=fail", async ({ page }) => {
+test("clicking the cue 'Server A misses 3 checks' sets data-step-id=fail", async ({ page }) => {
   await page.setViewportSize({ width: 1280, height: 900 })
   await gotoReady(page, path)
   const scene = page.getByTestId("scene")
@@ -82,7 +82,7 @@ test("deep link #/learn/load-balancer/step/scale opens at scale", async ({ page
   const scene = page.getByTestId("scene")
   await expect(scene).toHaveAttribute("data-step-id", "scale")
   await expect(scene).toHaveAttribute("data-mode", "paused")
-  await expect(page.getByTestId("step-count")).toHaveText("Step 7 of 8")
+  await expect(page.getByTestId("step-count")).toHaveText("Step 8 of 10")
 })
 
 test("with emulateMedia reducedMotion=reduce: data-motion=reduced, no packet elements during Play, and captions still advance", async ({ page }) => {
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index 251ba6b..b5318e8 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -33,11 +33,11 @@ test("deep link to 'reroute' hides server C and 'scale' shows it", async ({ page
 
 test("caption text matches the step", async ({ page }) => {
   await gotoReady(page, path)
-  await expect(page.getByTestId("step-count")).toHaveText("Step 1 of 8")
-  await expect(page.getByTestId("caption")).toHaveText("Your request goes to the load balancer, not to a server.")
+  await expect(page.getByTestId("step-count")).toHaveText("Step 1 of 10")
+  await expect(page.getByTestId("caption")).toHaveText("Your request goes to the load balancer. You never see the servers behind it.")
   await gotoReady(page, `${path}/step/pick`)
-  await expect(page.getByTestId("step-count")).toHaveText("Step 2 of 8")
-  await expect(page.getByTestId("caption")).toHaveText("The balancer picks a healthy server, here by round robin, and forwards the request.")
+  await expect(page.getByTestId("step-count")).toHaveText("Step 2 of 10")
+  await expect(page.getByTestId("caption")).toHaveText("The balancer picks Server A by round robin and forwards the request.")
 })
 
 test("Prev returns to the previous caption", async ({ page }) => {
@@ -46,7 +46,7 @@ test("Prev returns to the previous caption", async ({ page }) => {
   await expect(prev).toBeDisabled()
   await gotoReady(page, `${path}/step/reply`)
   await prev.click()
-  await expect(page.getByTestId("caption")).toHaveText("The balancer picks a healthy server, here by round robin, and forwards the request.")
+  await expect(page.getByTestId("caption")).toHaveText("The balancer picks Server A by round robin and forwards the request.")
   await expect(page.getByTestId("scene")).toHaveAttribute("data-mode", "paused")
 })
 
@@ -59,3 +59,13 @@ test("the cue for the current step has data-active", async ({ page }) => {
   await expect(prose.locator('[data-cue="pick"]')).toHaveAttribute("data-active", "")
   await expect(prose.locator('[data-cue="arrive"]')).not.toHaveAttribute("data-active", "")
 })
+
+test("deep link to 'drain' keeps server B with a draining note and 'stateless' hides B and shows the session store", async ({ page }) => {
+  const scene = page.getByTestId("scene")
+  await gotoReady(page, `${path}/step/drain`)
+  await expect(scene.locator('[data-scene-node="b"]')).toHaveAttribute("data-visible", "true")
+  await gotoReady(page, `${path}/step/stateless`)
+  await expect(scene.locator('[data-scene-node="b"]')).toHaveAttribute("data-visible", "false")
+  await expect(scene.locator('[data-scene-node="sessions"]')).toHaveAttribute("data-visible", "true")
+  await expect(scene.locator('[data-scene-node="a"]')).toHaveAttribute("data-down", "")
+})
diff --git a/e2e/search.spec.ts b/e2e/search.spec.ts
index b1518a3..5a1d5b0 100644
--- a/e2e/search.spec.ts
+++ b/e2e/search.spec.ts
@@ -21,27 +21,31 @@ test("Cmd-K opens the palette", async ({ page }) => {
   await expect(input).toHaveValue("")
 })
 
-test("typing 'health check' lists the Load balancer lesson then the fail step; Down and Enter land on #/learn/load-balancer/step/fail", async ({ page }) => {
+test("typing 'health check' lists the lesson, then sections, then steps; Enter on the first step lands on #/learn/load-balancer/step/probe", async ({ page }) => {
   await gotoReady(page, "/#/")
   await page.keyboard.press("Meta+k")
   await page.getByTestId("search-input").pressSequentially("health check")
   const results = page.getByTestId("search-result")
-  await expect(results).toHaveCount(2)
+  await expect(results).toHaveCount(9)
   await expect(results.nth(0)).toHaveAttribute("data-kind", "lesson")
   await expect(results.nth(0)).toContainText("Load balancer")
-  await expect(results.nth(1)).toHaveAttribute("data-kind", "step")
-  await expect(results.nth(1)).toHaveAttribute("data-href", "#/learn/load-balancer/step/fail")
+  await expect(results.nth(1)).toHaveAttribute("data-kind", "section")
+  await expect(results.nth(1)).toHaveAttribute("data-href", "#/learn/load-balancer/health-checks")
+  expect(await results.evaluateAll((items) => items.map((item) => item.getAttribute("data-kind")))).toEqual([
+    "lesson", "section", "section", "section", "section", "section", "step", "step", "step",
+  ])
+  await expect(results.nth(6)).toHaveAttribute("data-href", "#/learn/load-balancer/step/probe")
   const resultBox = await results.nth(0).boundingBox()
   const contentBox = await page.getByTestId("search-result-content").first().boundingBox()
   const dialogBox = await page.getByRole("dialog").boundingBox()
   if (resultBox === null || contentBox === null || dialogBox === null) throw new Error("Expected result and dialog bounding boxes")
   expect(resultBox.x + resultBox.width).toBeLessThanOrEqual(dialogBox.x + dialogBox.width)
   expect(contentBox.x + contentBox.width).toBeLessThanOrEqual(dialogBox.x + dialogBox.width)
-  await page.keyboard.press("ArrowDown")
+  for (let press = 0; press < 6; press += 1) await page.keyboard.press("ArrowDown")
   await page.keyboard.press("Enter")
-  await expect(page).toHaveURL(/#\/learn\/load-balancer\/step\/fail$/)
+  await expect(page).toHaveURL(/#\/learn\/load-balancer\/step\/probe$/)
   await expect(page.getByRole("dialog")).toBeHidden()
-  await expect(page.getByTestId("scene")).toHaveAttribute("data-step-id", "fail")
+  await expect(page.getByTestId("scene")).toHaveAttribute("data-step-id", "probe")
 })
 
 test("typing 'layer 7' then Enter scrolls to the heading", async ({ page }) => {
@@ -49,12 +53,13 @@ test("typing 'layer 7' then Enter scrolls to the heading", async ({ page }) => {
   await page.keyboard.press("Meta+k")
   await page.getByTestId("search-input").pressSequentially("layer 7")
   const result = page.getByTestId("search-result")
-  await expect(result).toHaveCount(1)
-  await expect(result).toHaveAttribute("data-kind", "section")
-  await expect(result).toHaveAttribute("data-href", "#/learn/load-balancer/how-it-picks-a-server")
+  await expect(result).toHaveCount(2)
+  await expect(result.nth(0)).toHaveAttribute("data-kind", "section")
+  await expect(result.nth(0)).toHaveAttribute("data-href", "#/learn/load-balancer/layer-4-and-layer-7")
+  await expect(result.nth(1)).toHaveAttribute("data-href", "#/learn/load-balancer/in-a-design-review")
   await page.keyboard.press("Enter")
-  await expect(page).toHaveURL(/#\/learn\/load-balancer\/how-it-picks-a-server$/)
-  const heading = page.locator("#how-it-picks-a-server")
+  await expect(page).toHaveURL(/#\/learn\/load-balancer\/layer-4-and-layer-7$/)
+  const heading = page.locator("#layer-4-and-layer-7")
   await expect(heading).toBeInViewport()
   expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
 })
diff --git a/src/app/LessonPage.tsx b/src/app/LessonPage.tsx
index 2aa9ec1..9bd37c2 100644
--- a/src/app/LessonPage.tsx
+++ b/src/app/LessonPage.tsx
@@ -24,10 +24,19 @@ export function LessonPage({ route }: { route: LessonRoute }) {
   }, [record, slug])
 
   useEffect(() => {
-    if (route.section) {
-      document.getElementById(route.section)?.scrollIntoView()
-    } else {
+    const section = route.section
+    if (!section) {
       window.scrollTo(0, 0)
+      return
+    }
+    const scroll = () => document.getElementById(section)?.scrollIntoView()
+    scroll()
+    let current = true
+    void document.fonts.ready.then(() => {
+      if (current) scroll()
+    })
+    return () => {
+      current = false
     }
   }, [route.section, lesson])
 
@@ -68,19 +77,10 @@ export function LessonPage({ route }: { route: LessonRoute }) {
         <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-3">
           <ProseView prose={lesson.body} />
           <QuizView slug={lesson.slug} quiz={lesson.quiz} />
-          <section data-testid="attribution" className="space-y-2">
-            <H2>Attribution</H2>
-            {lesson.attributions.map((item) => (
-              <p key={item.sourceUrl} className="font-hand text-base">
-                <a href={item.sourceUrl} className={LINK_CLASS}>{item.text}</a>{" "}
-                Licensed under <a href={item.licenseUrl} className={LINK_CLASS}>{item.license}</a>. {item.changed}
-              </p>
-            ))}
-          </section>
           <section data-testid="further-reading" className="space-y-2">
             <H2>Further reading</H2>
             <ul className="list-disc space-y-1 ps-6">
-              {lesson.furtherReading.map((item) => <li key={item.url}><a href={item.url} className={LINK_CLASS}>{item.title}</a></li>)}
+              {lesson.sources.map((item) => <li key={item.url}><a href={item.url} className={LINK_CLASS}>{item.title}</a></li>)}
             </ul>
           </section>
           <nav data-testid="lesson-nav" aria-label="Lesson navigation" className="flex justify-between gap-4 font-hand text-lg">
diff --git a/src/app/Shell.tsx b/src/app/Shell.tsx
index 00130d2..98b035f 100644
--- a/src/app/Shell.tsx
+++ b/src/app/Shell.tsx
@@ -83,7 +83,7 @@ export function Shell({ children }: { children: ReactNode }) {
         </div>
         <SearchPalette />
       </header>
-      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-12 md:grid md:grid-cols-[14rem_1fr] md:px-8">
+      <div className="mx-auto flex max-w-6xl flex-col gap-6 overflow-x-clip px-4 pb-12 md:grid md:grid-cols-[14rem_1fr] md:px-8">
         <aside data-testid="sidebar" aria-label="Lessons" className="hidden md:block">
           <LessonNav />
         </aside>
diff --git a/src/content/content.test.ts b/src/content/content.test.ts
index b5e52e9..b220423 100644
--- a/src/content/content.test.ts
+++ b/src/content/content.test.ts
@@ -6,15 +6,9 @@ import { lintLayout } from "@/scene/layout"
 describe.each(curriculum.flat.map((lesson) => [lesson.slug, lesson] as const))(
   "lesson %s",
   (_slug, lesson) => {
-    test("adapted sources name only adapt repos", () => {
-      for (const source of lesson.sources) {
-        if (source.use === "adapted") expect(SOURCES[source.repo].rule).toBe("adapt")
-      }
-    })
-
     test("link sources with a repo point inside that repo's url", () => {
       for (const source of lesson.sources) {
-        if (source.use === "link" && source.repo !== undefined) {
+        if (source.repo !== undefined) {
           expect(source.url.startsWith(SOURCES[source.repo].url)).toBe(true)
         }
       }
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 1db14fa..617ca39 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -1,6 +1,6 @@
 import { expect, test } from "vitest"
 import { defineLesson, defineScene, md } from "./author"
-import { buildCurriculum, curriculum, neighbors, type TrackId } from "./curriculum"
+import { buildCurriculum, curriculum, neighbors, TRACKS, type TrackId } from "./curriculum"
 import type { Quiz } from "./quiz"
 
 const baseQuiz: Quiz<never> = [
@@ -126,16 +126,36 @@ test("the real curriculum holds the load-balancer lesson", () => {
   const lesson = curriculum.bySlug.get("load-balancer")
 
   expect(curriculum.tracks.map((track) => track.id)).toEqual(["edge"])
-  expect(lesson?.minutes).toBe(2)
+  expect(lesson?.order).toBe(2)
+  expect(lesson?.minutes).toBe(9)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
-    "what-it-does",
-    "how-it-picks-a-server",
-    "horizontal-scaling",
+    "one-server-is-not-enough",
+    "what-happens-to-one-request",
+    "health-checks",
+    "choosing-a-server",
+    "layer-4-and-layer-7",
+    "adding-and-removing-servers",
+    "sessions-and-sticky-routing",
+    "when-the-balancer-fails",
+    "in-a-design-review",
   ])
-  expect(lesson?.attributions.map((entry) => entry.text)).toEqual([
-    'Adapted from "Load balancer" in The System Design Primer by Donne Martin.',
+  expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
+    "arrive", "pick", "reply", "next", "probe", "fail", "reroute", "scale", "drain", "stateless",
+  ])
+  expect(lesson?.quiz).toHaveLength(8)
+  expect(lesson?.sources.map((source) => source.url)).toEqual([
+    "https://github.com/donnemartin/system-design-primer#load-balancer",
+    "https://nginx.org/en/docs/http/load_balancing.html",
+    "https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/upstream/outlier",
+    "https://www.eecs.harvard.edu/~michaelm/postscripts/mythesis.pdf",
+  ])
+})
+
+test("TRACKS lists the 12 chapters in reading order", () => {
+  expect(TRACKS.map((track) => track.id)).toEqual([
+    "foundations", "estimation", "network", "edge", "application", "data",
+    "cache", "async", "distributed", "operations", "security", "case-studies",
   ])
-  expect(lesson?.furtherReading).toHaveLength(2)
 })
 
 test("finishLesson counts reading and scene time and defaults tags", () => {
diff --git a/src/content/curriculum.ts b/src/content/curriculum.ts
index 1cfb4b9..7f59f5c 100644
--- a/src/content/curriculum.ts
+++ b/src/content/curriculum.ts
@@ -2,14 +2,16 @@ import { finishLesson, type Lesson, type LessonDraft } from "./lesson"
 
 export const TRACKS = [
   { id: "foundations", title: "Foundations" },
+  { id: "estimation", title: "Back of the envelope" },
+  { id: "network", title: "The path of a request" },
   { id: "edge", title: "Edge and traffic" },
-  { id: "application", title: "Application layer" },
+  { id: "application", title: "Application services" },
   { id: "data", title: "Databases" },
   { id: "cache", title: "Caching" },
-  { id: "async", title: "Asynchronism" },
-  { id: "communication", title: "Communication" },
+  { id: "async", title: "Asynchronous work" },
+  { id: "distributed", title: "Distributed systems" },
+  { id: "operations", title: "Running in production" },
   { id: "security", title: "Security" },
-  { id: "estimation", title: "Back of the envelope" },
   { id: "case-studies", title: "Case studies" },
 ] as const
 
diff --git a/src/content/index.ts b/src/content/index.ts
index 013580b..8696ea6 100644
--- a/src/content/index.ts
+++ b/src/content/index.ts
@@ -5,4 +5,4 @@ export type { Prose, Block, Inline } from "./prose"
 export { blockText } from "./prose"
 export { grade, PASS_RATIO, shuffledOrder } from "./quiz"
 export type { Answer, Option, Question, QuestionResult, Quiz, QuizResult } from "./quiz"
-export type { Attribution, SourceRef } from "./sources"
+export type { SourceRef } from "./sources"
diff --git a/src/content/lesson.ts b/src/content/lesson.ts
index 67b8449..78d4d79 100644
--- a/src/content/lesson.ts
+++ b/src/content/lesson.ts
@@ -1,7 +1,7 @@
 import { compile, type Scene, type Timeline } from "@/scene"
 import { makeCue, type Block, type CueFn, type Prose } from "./prose"
 import { checkQuiz, type Quiz } from "./quiz"
-import { attribution, type Attribution, type SourceRef, type Sources } from "./sources"
+import type { Sources } from "./sources"
 import type { TrackId } from "./curriculum"
 
 export interface LessonInput<N extends string, S extends string> {
@@ -31,8 +31,6 @@ export interface LessonDraft {
 export interface Lesson extends LessonDraft {
   readonly slug: string
   readonly minutes: number
-  readonly attributions: readonly Attribution[]
-  readonly furtherReading: readonly Extract<SourceRef, { use: "link" }>[]
   readonly headings: readonly Extract<Block, { t: "h" }>[]
 }
 
@@ -59,12 +57,6 @@ export function finishLesson(slug: string, draft: LessonDraft): Lesson {
     ...draft,
     slug,
     minutes: Math.max(1, Math.ceil(draft.body.words / 200 + draft.timeline.duration / 60000)),
-    attributions: draft.sources
-      .filter((source): source is Extract<SourceRef, { use: "adapted" }> => source.use === "adapted")
-      .map((source) => attribution(source)),
-    furtherReading: draft.sources.filter(
-      (source): source is Extract<SourceRef, { use: "link" }> => source.use === "link",
-    ),
     headings: draft.body.blocks.filter((block): block is Extract<Block, { t: "h" }> => block.t === "h"),
   }
 }
diff --git a/src/content/license.typetest.ts b/src/content/license.typetest.ts
index d38c4ce..ec973bc 100644
--- a/src/content/license.typetest.ts
+++ b/src/content/license.typetest.ts
@@ -1,10 +1,10 @@
 import type { SourceRef } from "./sources"
 
-export const ok: SourceRef = {
-  use: "adapted",
+export const primerAsLink: SourceRef = {
+  use: "link",
   repo: "donnemartin/system-design-primer",
-  section: "Load balancer",
-  anchor: "load-balancer",
+  title: "The System Design Primer: load balancer",
+  url: "https://github.com/donnemartin/system-design-primer#load-balancer",
 }
 
 export const linkOnlyAsLink: SourceRef = {
@@ -14,11 +14,11 @@ export const linkOnlyAsLink: SourceRef = {
   url: "https://github.com/ByteByteGoHq/system-design-101",
 }
 
-// @ts-expect-error CC BY-NC-ND repo is link only
-export const bad1: SourceRef = { use: "adapted", repo: "ByteByteGoHq/system-design-101", section: "x", anchor: "x" }
+// @ts-expect-error no repo may be adapted, the primer included
+export const adaptPrimer: SourceRef = { use: "adapted", repo: "donnemartin/system-design-primer", title: "x", url: "https://example.com" }
 
-// @ts-expect-error MIT repo is link, not adapt
-export const bad2: SourceRef = { use: "adapted", repo: "binhnguyennus/awesome-scalability", section: "x", anchor: "x" }
+// @ts-expect-error CC BY-NC-ND repo is link only
+export const adaptLinkOnly: SourceRef = { use: "adapted", repo: "ByteByteGoHq/system-design-101", title: "x", url: "https://example.com" }
 
 // @ts-expect-error repo is not in the registry
-export const bad3: SourceRef = { use: "adapted", repo: "someone/random", section: "x", anchor: "x" }
+export const unknownRepo: SourceRef = { use: "link", repo: "someone/random", title: "x", url: "https://example.com" }
diff --git a/src/content/sources.test.ts b/src/content/sources.test.ts
index 838cbe9..687a433 100644
--- a/src/content/sources.test.ts
+++ b/src/content/sources.test.ts
@@ -1,28 +1,14 @@
 import { readFileSync } from "node:fs"
 import { resolve } from "node:path"
 import { describe, expect, test } from "vitest"
-import {
-  CHANGE_NOTICE,
-  SOURCES,
-  attribution,
-  parseSourcesTable,
-  type SourceRef,
-} from "./sources"
-
-const primer: Extract<SourceRef, { use: "adapted" }> = {
-  use: "adapted",
-  repo: "donnemartin/system-design-primer",
-  section: "Load balancer",
-  anchor: "load-balancer",
-}
+import { SOURCES, parseSourcesTable } from "./sources"
 
 const table = `# Title
 
 | Repo | Stars | License | Rule |
 |---|---|---|---|
-| [owner/adapt](https://github.com/owner/adapt) | 1 | CC BY 4.0 | Adapt. |
-| [owner/link](https://github.com/owner/link) | 2 | MIT | Link. |
-| [owner/link-only](https://github.com/owner/link-only) | 3 | None | Link only. |
+| [owner/link](https://github.com/owner/link) | 1 | MIT | Link. |
+| [owner/link-only](https://github.com/owner/link-only) | 2 | None | Link only. |
 
 A paragraph after the table.
 `
@@ -45,11 +31,10 @@ describe("sources", () => {
     }
   })
 
-  test("parseSourcesTable maps Adapt./Link./Link only.", () => {
+  test("parseSourcesTable maps Link. and Link only.", () => {
     const rules = parseSourcesTable(table)
     expect(rules).toEqual(
       new Map([
-        ["owner/adapt", "adapt"],
         ["owner/link", "link"],
         ["owner/link-only", "link-only"],
       ]),
@@ -57,8 +42,8 @@ describe("sources", () => {
   })
 
   test("parseSourcesTable throws on an unknown rule", () => {
-    const markdown = table.replace("| Adapt. |", "| Copy. |")
-    expect(() => parseSourcesTable(markdown)).toThrow("Copy.")
+    expect(() => parseSourcesTable(table.replace("| Link. |", "| Copy. |"))).toThrow("Copy.")
+    expect(() => parseSourcesTable(table.replace("| Link. |", "| Adapt. |"))).toThrow("Unknown rule: Adapt.")
   })
 
   test("parseSourcesTable throws when the table is missing", () => {
@@ -68,31 +53,6 @@ describe("sources", () => {
   test("parseSourcesTable throws on a malformed table", () => {
     expect(() => parseSourcesTable(table.replace("|---|---|---|---|\n", ""))).toThrow("separator")
     expect(() => parseSourcesTable(table.replace("[owner/link](https://github.com/owner/link)", "owner/link"))).toThrow("Malformed")
-    expect(() => parseSourcesTable(table.replace("[owner/link]", "[owner/adapt]"))).toThrow("Duplicate Repo row: owner/adapt")
-  })
-
-  test("every adapt repo has licenseUrl", () => {
-    for (const info of Object.values(SOURCES)) {
-      if (info.rule === "adapt") {
-        expect(typeof info.licenseUrl).toBe("string")
-        expect(info.licenseUrl.startsWith("https://")).toBe(true)
-      }
-    }
-  })
-
-  test("attribution names section, title, author, license, and the change notice", () => {
-    const credit = attribution(primer)
-    expect(credit.text).toBe(
-      'Adapted from "Load balancer" in The System Design Primer by Donne Martin.',
-    )
-    expect(credit.license).toBe("CC BY 4.0")
-    expect(credit.licenseUrl).toBe("https://creativecommons.org/licenses/by/4.0/")
-    expect(credit.changed).toBe(CHANGE_NOTICE)
-  })
-
-  test("attribution sourceUrl is repo url + #anchor", () => {
-    expect(attribution(primer).sourceUrl).toBe(
-      "https://github.com/donnemartin/system-design-primer#load-balancer",
-    )
+    expect(() => parseSourcesTable(table.replace("[owner/link]", "[owner/link-only]"))).toThrow("Duplicate Repo row: owner/link-only")
   })
 })
diff --git a/src/content/sources.ts b/src/content/sources.ts
index 78a9fdf..5f59272 100644
--- a/src/content/sources.ts
+++ b/src/content/sources.ts
@@ -1,24 +1,20 @@
-export type Rule = "adapt" | "link" | "link-only"
+export type Rule = "link" | "link-only"
 
-interface SourceBase {
+export interface SourceInfo {
+  readonly rule: Rule
   readonly title: string
   readonly author: string
   readonly url: string
   readonly license: string
 }
 
-export type SourceInfo =
-  | (SourceBase & { readonly rule: "adapt"; readonly licenseUrl: string })
-  | (SourceBase & { readonly rule: "link" | "link-only" })
-
 export const SOURCES = {
   "donnemartin/system-design-primer": {
-    rule: "adapt",
+    rule: "link",
     title: "The System Design Primer",
     author: "Donne Martin",
     url: "https://github.com/donnemartin/system-design-primer",
     license: "CC BY 4.0",
-    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
   },
   "binhnguyennus/awesome-scalability": {
     rule: "link",
@@ -66,39 +62,16 @@ export const SOURCES = {
 
 export type RepoId = keyof typeof SOURCES
 
-export type AdaptableRepo = {
-  [K in RepoId]: (typeof SOURCES)[K]["rule"] extends "adapt" ? K : never
-}[RepoId]
-
-export type SourceRef =
-  | { readonly use: "adapted"; readonly repo: AdaptableRepo; readonly section: string; readonly anchor: string }
-  | { readonly use: "link"; readonly title: string; readonly url: string; readonly repo?: RepoId }
-
-export type Sources = readonly [SourceRef, ...SourceRef[]]
-
-export const CHANGE_NOTICE = "Text paraphrased and shortened. Diagrams are original."
-
-export interface Attribution {
-  readonly text: string
-  readonly sourceUrl: string
-  readonly license: string
-  readonly licenseUrl: string
-  readonly changed: typeof CHANGE_NOTICE
+export interface SourceRef {
+  readonly use: "link"
+  readonly title: string
+  readonly url: string
+  readonly repo?: RepoId
 }
 
-export function attribution(ref: Extract<SourceRef, { use: "adapted" }>): Attribution {
-  const source = SOURCES[ref.repo]
-  return {
-    text: `Adapted from "${ref.section}" in ${source.title} by ${source.author}.`,
-    sourceUrl: `${source.url}#${ref.anchor}`,
-    license: source.license,
-    licenseUrl: source.licenseUrl,
-    changed: CHANGE_NOTICE,
-  }
-}
+export type Sources = readonly [SourceRef, ...SourceRef[]]
 
 function toRule(text: string): Rule {
-  if (text === "Adapt.") return "adapt"
   if (text === "Link.") return "link"
   if (text === "Link only.") return "link-only"
   throw new Error(`Unknown rule: ${text}`)
````
