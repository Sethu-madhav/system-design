import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 1] },
  lb: { kind: "lb", label: "Load balancer", at: [2, 1], hidden: true },
  one: { kind: "server", label: "Server 1", at: [4, 0] },
  two: { kind: "server", label: "Server 2", at: [4, 1], hidden: true },
  three: { kind: "server", label: "Server 3", at: [4, 2], hidden: true },
  db: { kind: "db", label: "Database", at: [6, 1] },
}).steps((s) => ({
  arrive: s.step(
    "Our small photo app starts on one app server and one database. The server reads the feed from the database and sends it back.",
    s.send("phone", "one", "GET /feed"),
    s.send("one", "db", "SELECT"),
    s.send("db", "one", "rows", "data"),
    s.send("one", "phone", "200", "response"),
  ),
  peak: s.step(
    "During the evening rush, the server reaches 95% CPU, and feeds take seconds to load.",
    s.parallel(s.send("phone", "one", "GET /feed"), s.send("phone", "one", "GET /feed")),
    s.focus("one"),
    s.note("one", "CPU 95%"),
  ),
  up: s.step(
    "The team moves the app onto a machine with 4 times as many cores, so the same evening traffic uses about a quarter of it.",
    s.focus("one"),
    s.note("one", "4x cores, CPU 25%"),
  ),
  grow: s.step(
    "A year later, traffic has grown 4 times larger, and the bigger machine is back at 95% CPU. The next step up is the largest machine sold.",
    s.parallel(s.send("phone", "one", "GET /feed"), s.send("phone", "one", "GET /feed")),
    s.note("one", "CPU 95% again"),
  ),
  out: s.step(
    "Two more servers join beside it, and a load balancer in front spreads incoming requests across all three.",
    s.show("lb"),
    s.show("two"),
    s.show("three"),
    s.send("phone", "lb", "GET /feed"),
    s.send("lb", "two", "GET /feed"),
  ),
  spread: s.step(
    "Each server now receives about a third of the traffic and sits near 32% CPU.",
    s.parallel(s.send("lb", "one", "GET /feed"), s.send("lb", "two", "GET /feed"), s.send("lb", "three", "GET /feed")),
    s.note("lb", "a third each"),
  ),
  lost: s.step(
    "A user signed in on Server 1, which stored the session in local memory. The next request lands on Server 3, which has never seen that session.",
    s.send("phone", "lb", "GET /feed"),
    s.send("lb", "three", "GET /feed"),
    s.note("three", "who is this?"),
    s.send("three", "lb", "401", "error"),
    s.send("lb", "phone", "401", "error"),
  ),
  shared: s.step(
    "The servers stop holding user sessions in memory. Sessions move to the shared database, so any server can handle any user.",
    s.parallel(s.send("one", "db", "SELECT"), s.send("two", "db", "SELECT"), s.send("three", "db", "SELECT")),
    s.note("db", "sessions here"),
  ),
  db: s.step(
    "All three servers still talk to one shared database. It absorbed the full 4x traffic growth, and its CPU is now at 90%.",
    s.focus("db"),
    s.note("db", "CPU 90%"),
  ),
}))

export default defineLesson({
  title: "Scaling up and scaling out",
  summary: "When one server fills up, move to a bigger machine or add more. What each path costs, why state makes scaling out hard, and where load goes next.",
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
    {
      use: "link",
      title: "Figma: The growing pains of database architecture",
      url: "https://www.figma.com/blog/how-figma-scaled-to-multiple-databases/",
    },
    {
      use: "link",
      title: "Figma: How Figma's databases team lived to tell the scale",
      url: "https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## Slow every evening

    ${cue("arrive", "Our small photo app began on one server and one database")}.
    The app server runs the application code, and the database stores the
    photos, user accounts, and follows. For a full year, that quiet setup
    handled everything without trouble. Then more people joined, and now
    ${cue("peak", "the server's CPU climbs to 95% every evening")}, and the
    feed takes seconds to load. From the previous lesson, you already know
    why. Once a server sits near 100% busy, every new request waits in a
    growing queue.

    At this point, the team has two ways to add room. They can move the app
    onto a larger machine, known as scaling up. Or they can run the app on
    several machines at once, known as scaling out. This lesson walks through
    both paths, shows what each one asks of your code, and ends with the real
    story of how Figma scaled its Postgres database over four years of rapid
    growth.

    ## Slow for one user or slow for many

    Before buying bigger hardware or adding extra machines, take a quiet
    minute to check whether capacity is even the real issue. Try opening the
    feed at 4 am, when almost nobody else is using the app.

    - If the feed is still slow at 4 am, you have a performance problem. One request is doing too much work on its own, such as scanning every photo row in the database without an index. Extra servers will not speed it up, because each single request will remain slow. Fix the work first.
    - If the feed is fast at 4 am and slows down only at 9 pm, you have a scalability problem. Each request is lean, yet the machine cannot handle so many at the same time. Adding capacity will help.

    Our photo app loads a feed in 80 ms at 4 am, so the team knows they are
    dealing with a scalability problem.

    > pitfall: Adding servers to solve a performance problem raises your bill without helping the user. Time a single request on a quiet machine before you add hardware.

    ## Scaling up

    Scaling up, also called vertical scaling, means moving your app onto a
    stronger machine with more CPU cores, more memory, or faster disks. Your
    code does not have to change at all, because everything still runs inside
    one box.
    ${cue("up", "The team moves the photo app to a machine with 4 times the cores")},
    and the same evening traffic drops from 95% CPU down to about 25%.

    When a bigger machine is available, scaling up is the fastest and calmest
    fix you can make. Still, it comes with four real limits.

    - **Cost.** Within one cloud machine family, doubling the cores costs roughly twice as much, and at the very top end specialized hardware can cost even more per core.
    - **A hardware ceiling.** Every cloud provider and hardware vendor has a largest machine. Once you fill it, vertical scaling stops.
    - **Restart downtime.** Moving a single server to a larger machine usually requires stopping the app and starting it on the new host, which interrupts anyone using the app at that moment.
    - **One failure stops everything.** Even the largest server in the world is still one machine. If its power supply or operating system fails, the entire app goes offline.

    Over the next twelve months, the photo app keeps growing.
    ${cue("grow", "A year later, evening traffic is 4 times higher")}, and the
    big machine is back at 95% CPU. The next step up is the largest machine
    the provider sells, and at this growth rate it would only buy a few more
    months.

    ## Scaling out

    Scaling out, also called horizontal scaling, takes a different path.
    Instead of buying one giant server, you run the same app on several
    machines side by side.
    ${cue("out", "Two more servers start up, and a load balancer in front splits incoming requests")}
    between them. The phone only ever talks to the load balancer and has no
    idea how many servers sit behind it. Chapter 4 takes a closer look at how
    load balancers work.

    With 3 equal servers sharing the traffic,
    ${cue("spread", "each server receives about a third of the requests")}
    and settles near 32% CPU. When traffic grows again next season, the team
    can add a fourth server without restarting the other three. An autoscaling
    rule can do this on its own. It launches a new machine whenever average
    CPU crosses a mark like 70%, so the new server boots before queues grow,
    and turns spare machines off during quiet overnight hours.

    Horizontal scaling supports much higher growth, though it adds three
    ongoing responsibilities.

    - More servers to deploy, monitor, and keep up to date.
    - A load balancer in front, which is a new piece that needs its own backup.
    - Application code that no longer relies on local memory or local disk between requests.

    ## What makes scaling out hard

    Any information a server holds between requests is called state. Back when
    the photo app ran on one server, keeping each signed-in user's session in
    the server's memory worked fine, because every request returned to that
    same machine. With three servers, that assumption breaks right away.
    ${cue("lost", "A user signs in on Server 1, and their next request lands on Server 3")},
    which has no record of who they are. The app logs the person out whenever
    the load balancer picks a different server.

    The clean fix is to make your app servers stateless. A stateless server
    keeps nothing on itself between requests that another server would need.
    ${cue("shared", "Sessions move out to the shared database")}, or to a
    shared cache like Redis, and uploaded photos go straight to shared object
    storage instead of a local disk. Once the servers hold no private state,
    any server can answer any user, and you can add, restart, or remove
    machines at any time.

    > tradeoff: A load balancer can pin each user to the same server using sticky routing. That avoids touching your code right away, yet load spreads unevenly across machines, and everyone on a server loses their session if that server crashes. Moving state out of the app servers takes one stretch of work up front and avoids both headaches.

    Of course, not every box in your diagram can be stateless. By definition,
    the database is where state lives. Its entire job is to hold onto your
    data and keep it safe. That is why scaling out a database is far harder
    than scaling out app servers, and why all of chapter 6 focuses on data.

    ## When a server fails

    A single server is always a single point of failure. No matter how many
    cores you buy, if that one machine crashes or reboots for a security
    patch, every user sees an outage.

    With 3 servers behind a load balancer, losing one machine becomes a
    routine event. The load balancer stops sending traffic to the broken host,
    and the remaining two servers pick up its share. Each server was at 32%
    CPU, so each climbs to about 48%, and nobody using the app notices a
    thing.

    That calm failover only works when the surviving servers have spare room.
    Imagine all 3 servers running at 80% CPU during the evening peak. The
    total load is 240%. If one machine goes down, the 2 survivors each need
    120% capacity, so both overload and time out. Plan your fleet so that all
    servers minus one can still carry peak traffic. With 3 servers, keeping
    each below 60% at peak means 2 survivors land near 90% if one fails, tight
    enough to build queues yet still able to stay up, and keeping even more
    headroom keeps latency calm during a failure.

    ## The bottleneck moves

    Adding app servers does not add any capacity to the parts those servers
    share. Every request from all three machines still queries the same single
    database, which absorbed the entire 4x rise in traffic on its own.
    ${cue("db", "Now the database CPU sits at 90%")}, so the bottleneck has
    moved one step downstream. Soon the app servers will sit waiting on the
    database the same way phones once waited on the single app server.

    Expect this in every growing system. Removing one bottleneck shifts the
    pressure onto the next piece in the chain, from app servers to the
    database, then to the cache or the network. A good habit is to name the
    next bottleneck in your notes before traffic gets there. For our photo
    app, the next relief comes from putting a cache in front of the database
    for popular feeds and adding read copies of the database.

    ## How Figma scaled its database

    Figma is a browser-based design tool where teams edit the same files
    together in real time. In 2023 and 2024, Figma's engineers published two
    posts tracing how their database grew. Their journey follows the exact
    sequence in this lesson, only at a much larger scale.

    In 2020, Figma stored most of its metadata, such as permissions, file
    details, and comments, inside a single Postgres database on Amazon RDS.
    Their database traffic grew roughly 3 times every year. At peak hours, CPU
    on that database passed 65%. That sounds like plenty of margin on paper,
    yet database latency grows unpredictable as load creeps toward the limit,
    and saturating that one database would have stopped Figma for everyone.

    To buy roughly a year of breathing room, the team applied four quick fixes
    first.

    - They scaled up, moving Postgres onto the largest machine Amazon offered.
    - They added read replicas, copies of the database that answer read queries.
    - They placed new product features onto separate databases so the main database grew slower.
    - They introduced a connection pooler, because thousands of app servers were holding open database connections.

    Soon they hit the ceiling of vertical scaling because no larger machine
    existed. Read replicas had limits too. Writes made up a large share of
    database load, and replicas only take reads. On top of that, replicas lag
    slightly behind the main database, so parts of Figma that needed the
    freshest rows could not read from them.

    That left one option, scaling the database out. Figma's application code
    already ran on thousands of stateless servers, while the database still
    lived on one machine. First, the team used vertical partitioning, moving
    groups of related tables, such as files or organizations, onto their own
    dedicated databases. Each cutover paused traffic to those tables briefly,
    and about 2% of requests failed during a 30-second window. By the end of
    2022, Figma ran roughly a dozen of these databases, and by April 2023 the
    busiest one sat near 10% CPU.

    Even then, the bottleneck moved once more. A handful of single tables had
    grown to several terabytes and billions of rows, and the heaviest-write
    tables were nearing the maximum disk operations per second that one RDS
    instance could support. Moving whole tables could no longer shrink a
    single table any further. So Figma began horizontal sharding, splitting
    individual tables across multiple databases. Sharding their first table
    took about 9 months of engineering work and went live in September 2023.
    Chapter 6 walks through how sharding works in detail.

    Between 2020 and early 2024, Figma's database stack grew almost 100 times
    larger. Through both posts, one theme stands out. Scaling up was fast and
    bought valuable time before hitting a hard ceiling, while scaling out the
    stateful database took years of careful engineering.

    ## In a design review

    A few practical questions keep scaling discussions grounded in any review.

    1. Is the app slow for one user alone, or only when traffic is heavy?
    2. Which box runs out of room first at peak hour, and how much headroom is left?
    3. Can any app server handle any user, and where do sessions and uploaded files live?
    4. If one server drops out during peak hour, can the remaining servers absorb its load?
    5. Once we scale this tier, which part becomes the next bottleneck?

    When you recommend a scaling plan, name which kind of scaling you chose
    and why. For our photo app, you could say this. Keep the feed servers
    stateless and run at least 3 of them so any single machine can fail at
    peak hour. Keep the database on a larger machine for now because it takes
    every write, and add read copies before its CPU climbs past 70%.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "The photo feed takes 3 s to load at 4 am, when almost nobody else is online. What should you do first?",
      options: [
        { text: "Find out why one request does so much work", correct: true },
        { text: "Add more servers", why: "The app is slow with almost no traffic, so extra servers would each still take 3 s on that single request." },
        { text: "Move the app to a bigger machine", why: "A bigger machine helps when CPU or memory is full. At 4 am the server is almost idle, so the delay is in the work itself." },
      ],
      explain: "Being slow for a single user is a performance problem. Trim the work each request does before adding capacity.",
    },
    {
      kind: "choice",
      prompt: "A photo app's single server hits 95% CPU every evening. It stores user sessions in memory, and the team needs to fix the slowdown this week with no code changes. What is the best move?",
      options: [
        { text: "Move the app to a bigger machine", correct: true },
        { text: "Add 2 servers behind a load balancer", why: "Because sessions live in one server's memory, users would get signed out whenever a request landed on another server." },
        { text: "Add a bigger database", why: "The app server's CPU is what is full right now, not the database." },
      ],
      explain: "Scaling up requires no code changes, so it is the fastest relief. Moving sessions out of local memory comes next, before the larger machine fills up.",
      replay: "up",
    },
    {
      kind: "choice",
      prompt: "What must be true before you can cleanly add app servers behind a load balancer?",
      options: [
        { text: "Any server can answer any request, because user data lives outside the servers", correct: true },
        { text: "Every server has the same number of cores", why: "A load balancer can weight traffic toward larger machines, so the servers do not have to match." },
        { text: "The database runs on the biggest machine available", why: "Database size does not decide whether app servers can share requests. Where session and file state live does." },
      ],
      explain: "Stateless servers hold no private user data between requests, so the load balancer can route any request to any healthy server.",
      replay: "shared",
    },
    {
      kind: "choice",
      prompt: "A photo app scales out from 1 app server to 3, and traffic keeps rising. Which part becomes the bottleneck next?",
      options: [
        { text: "The database that all 3 servers share", correct: true },
        { text: "The phone", why: "Each phone only sends its own few requests and does not carry the growing traffic from other users." },
        { text: "Server 1, because it was there first", why: "The load balancer spreads requests evenly across all three servers, so Server 1 carries no extra share." },
      ],
      explain: "Scaling out the app servers sends all of their queries to the single shared database, so the bottleneck moves there.",
      replay: "db",
    },
    {
      kind: "choice",
      prompt: "Three servers each sit at 60% CPU during peak hour, and one fails. Roughly how busy are the remaining two?",
      options: [
        { text: "About 90%", correct: true },
        { text: "About 60%", why: "The failed server's traffic does not vanish. The two surviving servers now carry it." },
        { text: "About 120%", why: "That adds the failed server's entire 60% to each survivor. Split across two machines, each takes an extra 30%." },
      ],
      explain: "Total load across 3 servers at 60% is 180%. Divided across 2 survivors, each runs at 90%, close to overload.",
    },
    {
      kind: "choice",
      prompt: "In 2020, Figma's main database already ran on the largest machine Amazon offered, and writes made up a big share of its load. Why did read replicas not solve the problem?",
      options: [
        { text: "Every write still went to the one main database", correct: true },
        { text: "The team had not tried a bigger machine", why: "Figma had already moved to the largest available RDS instance, so vertical scaling had reached its ceiling." },
        { text: "The app servers were the bottleneck", why: "Figma already ran thousands of app servers. The single database was the piece running out of room." },
      ],
      explain: "Read replicas only offload read queries. To spread out writes, Figma had to split data across multiple databases.",
    },
    {
      kind: "choice",
      prompt: "An app's single server sits at only 40% CPU during peak hour, yet users see downtime every time the server restarts for updates. What fixes that?",
      options: [
        { text: "Run at least 2 servers behind a load balancer", correct: true },
        { text: "Move to a bigger machine", why: "A bigger machine is still a single machine. Restarting it still takes the whole app offline." },
        { text: "Restart the server less often", why: "Fewer restarts mean fewer outages, yet every single update still drops users." },
      ],
      explain: "Scaling out also removes the single point of failure, so one server can restart while the other keeps serving users.",
    },
    {
      kind: "order",
      prompt: "Put these steps for moving an app from one server to three in order.",
      items: [
        "Time one request at 4 am to confirm that load is the problem",
        "Move sessions and uploads out of the server into shared stores",
        "Start 2 more servers behind a load balancer",
        "Watch the shared database, which now takes all the queries",
      ],
      explain: "Start by confirming that capacity is the real issue, make the app stateless before adding more machines, and then watch the shared database once traffic grows.",
    },
  ],
})
