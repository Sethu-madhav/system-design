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
