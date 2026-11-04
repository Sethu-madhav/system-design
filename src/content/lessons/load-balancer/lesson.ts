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
