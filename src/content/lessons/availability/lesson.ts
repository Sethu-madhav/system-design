import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
  servers: { kind: "server", label: "App servers", at: [2, 1] },
  primary: { kind: "db", label: "Primary", at: [5, 0] },
  standby: { kind: "db", label: "Standby", at: [5, 2] },
}).steps((s) => ({
  arrive: s.step(
    "The app servers send requests to one main database, the primary. A second database, the standby, waits beside it.",
    s.send("phone", "servers", "GET /feed"),
    s.send("servers", "primary", "SELECT"),
    s.send("primary", "servers", "rows", "data"),
    s.send("servers", "phone", "200", "response"),
  ),
  copy: s.step(
    "Every write that lands on the primary copies over to the standby, so both databases hold the same data.",
    s.send("phone", "servers", "POST /photo"),
    s.send("servers", "primary", "INSERT"),
    s.send("primary", "standby", "copy", "data"),
    s.note("standby", "same data"),
  ),
  beat: s.step(
    "Once every second, the primary sends the standby a small message called a heartbeat to say it is healthy.",
    s.send("primary", "standby", "heartbeat"),
    s.note("primary", "every 1 s"),
  ),
  crash: s.step(
    "The primary crashes. With no database answering, incoming requests come back as errors.",
    s.down("primary"),
    s.send("phone", "servers", "GET /feed"),
    s.send("servers", "phone", "500", "error"),
  ),
  notice: s.step(
    "Three seconds pass with no heartbeat from the primary, so the standby concludes the primary is gone.",
    s.focus("standby"),
    s.note("standby", "no heartbeat for 3 s"),
  ),
  promote: s.step(
    "The standby promotes itself to primary and takes over the network address the app servers already use.",
    s.focus("standby"),
    s.note("standby", "now the primary"),
  ),
  retry: s.step(
    "The very next request flows straight to the new primary and succeeds.",
    s.send("phone", "servers", "GET /feed"),
    s.send("servers", "standby", "SELECT"),
    s.send("standby", "servers", "rows", "data"),
    s.send("servers", "phone", "200", "response"),
    s.note("standby", "now the primary"),
  ),
  rejoin: s.step(
    "Once the old primary is repaired, it returns as the new standby and catches up on the writes it missed.",
    s.up("primary"),
    s.send("standby", "primary", "copy", "data"),
    s.note("primary", "now the standby"),
    s.note("standby", "now the primary"),
  ),
  both: s.step(
    "The app servers work another way. All 3 serve traffic all the time, so losing one requires no switch at all.",
    s.parallel(s.send("phone", "servers", "GET /feed"), s.send("phone", "servers", "GET /feed")),
    s.focus("servers"),
    s.note("servers", "3 copies, all active"),
  ),
}))

export default defineLesson({
  title: "Availability and failure",
  summary: "How much downtime each nine allows, how parts in a row and copies side by side change the math, and how a standby takes over.",
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

    Picture our small app after the changes from the previous lesson.
    ${cue("arrive", "Its app servers read from one database")}. Three app
    servers share the load, so losing any one of them causes no interruption.
    The database, though, still runs on a single machine. One night at 2 am,
    that machine's disk fails. Every request returns an error until an
    on-call engineer wakes up, finds the problem, and brings up a replacement
    server. By the time the app answers again, it has been offline for 40
    minutes.

    This lesson puts clear numbers on how often a system stays up. It shows
    how parts in a chain lower availability while copies side by side raise
    it, and walks through how a standby database can step in within seconds
    instead of 40 minutes. Near the end, we follow a real 2018 failover at
    GitHub, where those exact mechanics played out across two coasts.

    ## Counting nines

    Availability is the share of time a system answers as expected. In
    practice, many teams measure it as the share of requests that succeed,
    because a 5-minute outage during the evening rush affects far more people
    than 5 minutes at 4 am. Either way, teams usually write availability
    targets as a count of nines.

    - **99.9%, three nines.** A full year holds 8,760 hours, and 0.1% of that leaves about 8.8 hours of downtime a year, or about 43 minutes in a 30-day month.
    - **99.99%, four nines.** About 53 minutes of downtime a year, or just over 4 minutes a month.
    - **99.999%, five nines.** About 5 minutes of downtime across an entire year.

    Every extra nine shrinks your allowed downtime by a factor of 10. That
    single 40-minute disk failure at 2 am uses up almost a full month of three
    nines, and almost a whole year of four nines in one night.

    > note: To a person opening your app, planned maintenance looks identical to a crash. Unless your agreement says otherwise, a 20-minute database upgrade that takes the app offline uses 20 minutes of your downtime budget.

    ## Parts in a row multiply

    A single user request crosses several boxes in sequence, and if any one
    of those boxes stops working, the request fails. When parts sit in a row
    like that, you multiply their availabilities together.

    Suppose two independent parts are each 99.9% available. Multiply 0.999 by
    0.999, and you get about 99.8%, which means twice the downtime of either
    part on its own. Chain five 99.9% parts in a row, and the combined number
    drops to about 99.5%, or roughly 44 hours of downtime a year. A chain of
    parts is always less available than its weakest link.

    Every extra box you put directly on the request path trims a little off
    your availability, even when that box is well built. Keeping the critical
    path short gives less room for something to break.

    ## Copies side by side

    Now place two copies side by side, where either copy can answer on its
    own. The service only goes down when both copies fail at the exact same
    time. To find the combined availability, multiply their chances of being
    down.

    Each 99.9% copy is down 0.1%, or 0.001, of the time. If they fail for
    separate reasons, the chance that both are down together is 0.001 times
    0.001, which is 0.000001, or 0.0001%. That leaves the pair up about
    99.9999% of the time on paper.

    That math holds only when the two copies fail independently.

    > pitfall: Two copies sitting in the same rack, plugged into the same power supply, or receiving the same buggy deploy will fail together. When that happens, two copies behave no better than one. Place copies in separate power zones or data centers, and roll out changes to one copy before touching the next.

    Remember too that switching traffic from a failed copy to its partner
    takes real time, and those seconds of switching count as downtime.

    ## Single points of failure

    Any part whose failure halts the whole app is a single point of failure.
    The calmest way to spot them is to trace one request from the phone all
    the way to storage and ask what happens if each box stops.

    - **The load balancer.** The app runs two load balancers sharing one network address, so if one stops, the other keeps routing. Chapter 4 shows how that works.
    - **The app servers.** Three servers share the load, and any two can carry the evening peak.
    - **The database.** Only one machine holds the data, so it is our single point of failure.

    Removing a single point of failure means adding a spare copy that can
    take over, a practice called redundancy.

    ## A standby takes over

    To remove that last weak spot, the team adds a second database called a
    standby.
    ${cue("copy", "Every write the primary accepts is also sent to the standby")},
    so the standby stays up to date with the same rows. During normal hours,
    the standby handles no user traffic and waits. Engineers call this
    active-passive.

    For the standby to take over on its own, something has to notice when the
    primary stops answering.
    ${cue("beat", "Once a second, the primary sends a heartbeat")}, a tiny
    check-in message that says it is still healthy. Now suppose
    ${cue("crash", "the primary crashes")}, and requests start failing.
    ${cue("notice", "The standby misses 3 heartbeats in a row")} and decides
    the primary is gone.
    ${cue("promote", "It promotes itself to primary and takes over the address")}
    that the app servers already connect to, so the app servers need no
    configuration changes.
    ${cue("retry", "The very next request reaches the new primary and succeeds")}.

    Handing traffic over to the standby is called failover. Instead of 40
    minutes waiting for a person to wake up, the app recovers in a handful of
    seconds. Later,
    ${cue("rejoin", "the repaired machine rejoins as the new standby")} and
    copies the writes that arrived while it was offline. In larger setups, a
    separate coordinator watches both machines so the standby does not have
    to guess alone whether the primary crashed or its own network cable came
    unplugged.

    > tradeoff: Your heartbeat timeout sets how fast failover triggers. A very short timeout, such as 1 missed beat, reacts in a second, yet it can also trigger when the network pauses for a moment while the primary is still healthy. Both databases then act as primary at once and accept conflicting writes, a failure known as split brain. A longer timeout avoids false alarms at the price of a longer pause during a real crash.

    Replication itself carries one more trade-off. If the primary copies each
    write to the standby just after saving it locally, the last few writes
    can be lost if the primary crashes before those copies reach the standby.
    Chapter 6 covers how databases replicate data and what each option
    protects.

    ## Every copy active

    Active-active is the second way to use redundant copies.
    ${cue("both", "Every copy serves live traffic all the time")}. Our three
    app servers already work this way. When one server stops, the load
    balancer stops sending it requests, and the other two keep going. Nobody
    waits for a promotion step, and no machine sits idle.

    The trade-off is headroom. Every active copy needs enough spare capacity
    to absorb a neighbor's traffic when one machine drops out, just as the
    previous lesson showed. Active-active is straightforward for stateless
    app servers. For writable databases it is much harder, because two active
    copies taking writes at the same time can accept changes that contradict
    each other. That is why most apps start their database active-passive.

    ## A failover at GitHub

    GitHub ran this exact active-passive pattern at massive scale. Its data
    lived across many MySQL clusters, where each cluster's primary took
    writes and its replicas served reads. A tool called Orchestrator watched
    those clusters and ran failovers. Orchestrator nodes ran across multiple
    locations, and a majority had to agree before promoting a new primary.

    On October 21, 2018, at 22:52 UTC, engineers were replacing failing
    network gear on the US East Coast. During that work, the link between the
    East Coast network hub and GitHub's main East Coast data center dropped.
    Connectivity returned after 43 seconds.

    Those 43 seconds were long enough to trigger automatic failover. The
    Orchestrator nodes in a West Coast data center and a public cloud could
    no longer reach the East Coast data center, reached agreement without it,
    and promoted the West Coast replicas to primary. GitHub's app servers
    began sending new writes to the West Coast. The East Coast primaries had
    never crashed at all. They had only lost network reachability for less
    than a minute, the exact false alarm from the timeout trade-off above.

    Two serious problems followed. First, the East Coast primaries held a few
    seconds of writes that had never finished copying to the West Coast.
    Second, the West Coast primaries accepted brand new writes for nearly 40
    minutes. The two coasts now held different histories, so GitHub could not
    switch back without losing user changes. GitHub put data integrity first,
    even though that meant keeping parts of the site broken while engineers
    repaired the clusters. Service remained degraded for 24 hours and 11
    minutes.

    The underlying steps were identical to our small photo app, with
    Orchestrator watching the heartbeats. A failover triggered by a 43-second
    network cut, combined with writes that had not finished replicating,
    turned a brief network hiccup into a full day of recovery.

    ## In a design review

    A few clear questions show whether a design will hold up when hardware
    fails.

    1. What availability target does the product need, and how many minutes of downtime a month does that allow?
    2. Which boxes sit in a row along the main request path?
    3. Where are the remaining single points of failure?
    4. How does the system detect a crash, and how many seconds does failover take?
    5. Could two redundant copies ever fail for the same underlying reason?

    When you propose redundancy, say which mode you picked and why. For our
    small app, you could put it like this. Run at least 3 stateless app
    servers active-active behind redundant load balancers. Run the database
    active-passive with the standby in a separate data center, and practice
    failover every month so you know it works before 2 am arrives.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "An app targets 99.9% availability each month. Roughly how much downtime does a 30-day month allow?",
      options: [
        { text: "About 43 minutes", correct: true },
        { text: "About 9 hours", why: "About 8.8 to 9 hours is the downtime budget for an entire year at 99.9%, not one month." },
        { text: "About 4 minutes", why: "Roughly 4 minutes is the monthly budget for 99.99%, one extra nine." },
      ],
      explain: "A 30-day month has 43,200 minutes, and 0.1% of that comes to about 43 minutes.",
    },
    {
      kind: "choice",
      prompt: "A request must pass through a load balancer, an app server, and a database in sequence, and each is 99.9% available. Roughly how available is the combined path?",
      options: [
        { text: "About 99.7%", correct: true },
        { text: "About 99.9%", why: "Each of the three parts can fail on its own, so their downtimes add up." },
        { text: "About 99.9999%", why: "That higher number comes from redundant copies side by side, where either copy is enough." },
      ],
      explain: "For parts in a row, multiply their availabilities. 0.999 × 0.999 × 0.999 is about 0.997, or 99.7%.",
    },
    {
      kind: "choice",
      prompt: "Two database copies are each 99% available, either one can serve the app, and they fail for separate reasons. Roughly how available is the pair?",
      options: [
        { text: "About 99.99%", correct: true },
        { text: "About 98%", why: "That is the math for two parts in a row, where both must stay up at once." },
        { text: "About 99%", why: "Because the second copy covers the times the first is down, the pair stays up far more often than one copy alone." },
      ],
      explain: "Each copy is down 1% of the time. Both are down at once 1% of 1% of the time, which is 0.01%, so the pair stays up 99.99% of the time.",
    },
    {
      kind: "choice",
      prompt: "An app runs 2 load balancers sharing one address, 3 app servers, and 1 database. Which part is a single point of failure?",
      options: [
        { text: "The database", correct: true },
        { text: "The app servers", why: "Any two of the three servers can carry the traffic, so losing one causes no outage." },
        { text: "The load balancers", why: "If one load balancer fails, the other takes over the shared network address." },
      ],
      explain: "Only the database has no backup copy ready to take over if it fails.",
      replay: "crash",
    },
    {
      kind: "choice",
      prompt: "Your primary and standby databases sit in the same rack on the same power supply. What is the biggest risk?",
      options: [
        { text: "One power cut takes down both copies at once", correct: true },
        { text: "The standby holds a second copy of the data", why: "Holding that copy is the whole reason to run a standby, not a risk." },
        { text: "The heartbeats use too much of the network", why: "One tiny heartbeat message per second uses almost zero bandwidth." },
      ],
      explain: "Parallel availability math holds only when your copies fail for separate reasons, not from the same power strip or rack.",
    },
    {
      kind: "choice",
      prompt: "An app has load balancers, app servers, a main database, and a nightly billing job. Which piece fits active-active best?",
      options: [
        { text: "The stateless app servers", correct: true },
        { text: "The main database", why: "Two writable copies taking changes at the same time can conflict, so databases usually start active-passive." },
        { text: "A job that must run exactly once each night", why: "Running every copy at once would run the job multiple times. One active runner with a standby fits better." },
      ],
      explain: "Stateless copies can all serve live traffic at once, and losing one only reduces spare capacity.",
      replay: "both",
    },
    {
      kind: "choice",
      prompt: "During GitHub's October 2018 outage, a 43-second network cut triggered a failover to the West Coast. Why did that turn into a 24-hour recovery?",
      options: [
        { text: "The East Coast primaries still worked and held writes the West Coast never got", correct: true },
        { text: "The failover took too long to start", why: "Failover started inside those 43 seconds. The trouble was that it triggered during a short network blip." },
        { text: "Both copies sat in the same data center", why: "The failover moved traffic from the US East Coast to the West Coast, across the country." },
      ],
      explain: "The East Coast primaries had only lost network reachability briefly. Promoting the West Coast copies left both sides with different writes, so GitHub could not switch back without reconciling the data.",
      replay: "notice",
    },
    {
      kind: "order",
      prompt: "Put the steps of an active-passive failover in order.",
      items: [
        "The primary crashes and stops sending heartbeats",
        "The standby misses several heartbeats in a row",
        "The standby promotes itself and takes over the primary's address",
        "The next query from the app servers reaches the new primary",
      ],
      explain: "The standby acts only after noticing the missing heartbeats, and app servers reach it once it owns the shared address.",
    },
  ],
})
