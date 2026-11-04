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
