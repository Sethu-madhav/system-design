import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
  server: { kind: "server", label: "App server", at: [2, 0] },
  db: { kind: "db", label: "Database", at: [4, 0] },
}).steps((s) => ({
  request: s.step(
    "A phone asks the app server for the photo feed.",
    s.send("phone", "server", "GET /feed"),
  ),
  query: s.step(
    "The server asks the database for recent photos from people the user follows.",
    s.send("server", "db", "query", "data"),
  ),
  answer: s.step(
    "The database sends back the rows, and the server returns the feed to the phone.",
    s.send("db", "server", "rows", "data"),
    s.send("server", "phone", "200", "response"),
  ),
  users: s.step(
    "Start with the people. How many will use the app, and how often?",
    s.focus("phone"),
    s.note("phone", "how many users?"),
  ),
  speed: s.step(
    "Next, think about time. How fast should each screen load?",
    s.focus("server"),
    s.note("server", "how fast?"),
  ),
  data: s.step(
    "Then look at the data. How much arrives, and how long does it stay?",
    s.focus("db"),
    s.note("db", "how much data?"),
  ),
  dies: s.step(
    "Now the database stops. With only one copy, every request that needs data comes back as an error.",
    s.down("db"),
    s.note("db", "what if this dies?"),
    s.send("phone", "server", "GET /feed"),
    s.send("server", "phone", "500", "error"),
  ),
  bottleneck: s.step(
    "The database is back online. As traffic grows, it is the first box to fill up, so it is the first bottleneck to solve.",
    s.up("db"),
    s.focus("db"),
    s.note("db", "runs out first"),
  ),
}))

export default defineLesson({
  title: "What system design is",
  summary: "How a rough product idea becomes clear requirements, rough numbers, and a simple first design, and why no single design fits every app.",
  track: "foundations",
  order: 1,
  tags: [
    "requirements",
    "functional requirements",
    "non-functional requirements",
    "scale",
    "availability",
    "consistency",
    "trade-off",
    "bottleneck",
    "single point of failure",
  ],
  sources: [
    {
      use: "link",
      repo: "donnemartin/system-design-primer",
      title: "The System Design Primer: how to approach a system design interview question",
      url: "https://github.com/donnemartin/system-design-primer#how-to-approach-a-system-design-interview-question",
    },
    {
      use: "link",
      title: "Google SRE book: Service level objectives",
      url: "https://sre.google/sre-book/service-level-objectives/",
    },
    {
      use: "link",
      title: "AWS Well-Architected Framework",
      url: "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
    },
    {
      use: "link",
      title: "Martin Kleppmann: Designing Data-Intensive Applications",
      url: "https://dataintensive.net/",
    },
    {
      use: "link",
      title: "Nick Craver: Stack Overflow, the architecture, 2016 edition",
      url: "https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## A one-line idea is not a design

    Suppose someone sits down with a blank notebook and says, "let people
    share photos." That sounds simple enough, yet two teams handed the same
    sentence can walk away and build two very different systems. One team puts
    up a single small server for 500 students at a local school. Another
    builds a fleet spread across data centers on three continents for 10
    million people every day. Both teams built what they were asked to build.

    The gap between those two systems comes from everything that one sentence
    left unsaid. It never mentioned how many people will open the app, how
    fast a screen needs to load, or what should happen when a hard drive gives
    out at midnight. System design is the calm, practical work of uncovering
    those missing details and choosing the simplest parts that meet them. In
    this first lesson, we walk through that process on a small photo app, then
    look at how Stack Overflow ran in 2016, when one of the busiest sites on
    the web ran on fewer than a dozen web servers. Every lesson after this one
    uses the same way of thinking.

    ## The smallest real system

    Almost every web product begins with three pieces, and it helps to keep
    this simple picture in mind before adding anything else. First,
    ${cue("request", "a phone sends a request")} over the network to an app
    server. That server holds your application code, checks who is signed in,
    and decides what belongs on the screen. When it needs stored information,
    ${cue("query", "the server asks a database")} for the right rows. The
    database writes everything to disk, so a power flicker or a server restart
    does not erase anyone's photos. Then
    ${cue("answer", "the rows come back, and the server sends the feed to the phone")}.

    There is nothing wrong with staying right here for a long time. One app
    server and one database can serve thousands of active users with room to
    spare. Later in this course, we place extra boxes into this drawing, like
    a cache, a queue, or a second database, one at a time. We add each new box
    only to fix a real problem that shows up as traffic grows. Adding a box
    before you have its problem does not make a system stronger. It only gives
    you one more piece to run.

    ## What the product does

    When you start designing a system, the easiest place to begin is a plain
    list of what a user can do. Engineers call these functional requirements,
    because they describe the product in everyday words a user would
    recognize. For our photo app, the core features fit into four lines.

    - Users can post a photo with a short caption.
    - Users can follow other users.
    - Users can open a feed of recent photos from people they follow.
    - Users can leave a comment on a photo.

    Once that list is on the page, take a moment to trim it. Whether you are
    working through an hour-long design conversation or scoping a first
    version for your team, you cannot design every corner of an app at once.
    Pick the two or three actions that matter most, and say out loud what
    stays out for now, such as direct messages, search, or video uploads.
    Agreeing on those boundaries early keeps everyone on the same page, so
    nobody expects a feature you never designed.

    ## How well it must do it

    Knowing what the app does is only half the picture. The second list,
    called non-functional requirements, says how well the app must perform
    those actions, and these numbers decide most of the design. Five questions
    come up in almost every system.

    - **Scale.** ${cue("users", "How many people use the app, and how often")} do they open it? Imagine our photo app has 10 million daily users, and each person opens the feed about 20 times a day.
    - **Speed.** ${cue("speed", "How fast must each screen load?")} A feed that opens in under half a second is comfortable to browse, while a 3-second wait makes people close the app.
    - **Data.** ${cue("data", "How much data arrives, and how long must it stay?")} Here, the app keeps every uploaded photo for as long as the account stays open.
    - **Availability.** What share of the year must the app stay reachable? An app that is up 99.9% of the time can be down for roughly 9 hours over a full year.
    - **Consistency.** After someone posts something new, how soon must everyone else see it? A friend can wait a few seconds for a new photo to appear in their feed, whereas a bank balance has to be exact on every read.

    Tightening any of these five numbers has a real cost in machines,
    complexity, or both. A good design does not chase the strictest number on
    the page. It meets what the product needs, and stops there.

    > tradeoff: Tighter targets change the whole shape of a system. Moving from 99.9% to 99.99% availability shrinks your yearly downtime budget from about 9 hours down to 53 minutes. With only 53 minutes for the whole year, you can no longer wait for a person to notice an alert, wake up, and fix a broken server. The system has to survive a failure on its own. That means keeping a spare copy of every server and database, placing those spares in a separate data center so one power cut cannot take out both, and writing software that notices a failed machine and sends traffic to the spare. You end up paying for twice the hardware, along with the steady work of testing that switch.

    ## Ask before you draw

    When someone hands you a broad idea, the natural urge is to reach for a
    marker and start drawing boxes right away. Slowing down for a few minutes
    saves hours later. Start with questions about the people and the product,
    not the tools. Who uses it? Which single action has to keep working even
    on a bad day? How many people show up during the busiest hour of the
    evening? Would anyone mind if a new post took a few seconds to appear for
    followers?

    Questions about specific tools belong later in the conversation. Asking
    "should we use a SQL database?" before you know what the data looks like
    or how the app reads it leaves you with no grounded way to answer. You end
    up picking a familiar tool first and forcing the problem to match it.

    > pitfall: Resist the urge to design for a billion users when the product serves 10,000. Overbuilding brings extra servers, harder bugs, and higher bills long before the traffic ever arrives. Design for the numbers in front of you with room to grow, and note what you would change if traffic grew 10 times.

    ## A method in six steps

    Having a steady routine takes the guesswork out of a blank page. Every
    case study later in this course moves through the same six steps, in
    order.

    1. **Requirements.** Write down what users can do, along with the target numbers for scale, speed, data, availability, and consistency.
    2. **Rough numbers.** Turn user counts into requests per second and bytes of storage. For our photo app, 10 million daily users opening the feed 20 times each comes to 200 million views a day, or about 2,300 requests a second on average. Two million new photos a day at 500 KB each adds up to about 1 TB of new photos every day.
    3. **An API.** Sketch the calls the client makes to the server, such as \`POST /photos\`, \`GET /feed\`, and \`POST /follows\`.
    4. **A data model.** Lay out what you store and how the pieces link together. Here, that means users, photos, and follows that connect one user to another.
    5. **A first design.** Draw the smallest set of boxes that meets the requirements, often the three-box setup from earlier.
    6. **The bottleneck and its fixes.** Trace your rough numbers through that first drawing to spot whichever part runs out of room first. Fix that one piece, then check the numbers again.

    The sequence works well because each step feeds the next one. The rough
    numbers come from the requirements, the API comes from the user actions,
    and the data model follows from the API. Most important, the real
    bottleneck only shows up once you test your numbers against a concrete
    first design.

    In our photo app,
    ${cue("bottleneck", "the database is the first part to run out")}.
    Every feed load asks the database for fresh rows, and people scroll
    through feeds about 100 times as often as they upload new photos. Once you
    see that 100-to-1 split, the next moves make sense right away. Later
    lessons show how to take that load off the database with a cache, with
    extra read copies, and by splitting data across more than one machine.

    ## When one part fails

    A diagram that only works when every machine stays healthy is unfinished.
    Once the normal flow makes sense, pause over each box and ask what happens
    to the person holding the phone if that machine stops. In our three-box
    design, when ${cue("dies", "the database stops")}, every request that
    needs stored data comes back as an error. Nothing else can step in,
    because there is only one database holding the rows.

    Any piece whose failure stops the whole product is a single point of
    failure. The usual fix is to run a second copy that can take over. Still,
    removing every single point of failure costs money and engineering time,
    so you do not always need to do it. An internal tool used by 20 coworkers
    can sit offline for an hour while someone restarts a server. A consumer
    app with 10 million people on it cannot. Your availability target from the
    requirements tells you which case you are in.

    ## No design is best in general

    It helps to let go of the idea that one right architecture exists for
    every app. A design is only good or bad next to the requirements it must
    meet. Because our photo feed can show a new post a few seconds late
    without hurting anyone, it can serve reads from caches and database copies
    to stay fast. A payments system cannot show an outdated balance, so it
    pays the extra cost of making every read see the latest write. Hand the
    same design to both products, and it fits one and fails the other.

    That is also why stopping at "it depends" is not enough. Whenever a choice
    depends on the situation, name the exact factor it depends on, such as the
    read-to-write ratio or how many seconds of delay users will accept. Once
    those numbers are clear, the right option is much easier to pick.

    ## Stack Overflow in 2016

    To see how grounded this way of thinking looks in real life, consider
    Stack Overflow, the question-and-answer site that programmers visit all
    day. In February 2016, one of its engineers, Nick Craver, wrote up the
    hardware behind the site. On February 9 of that year, its load balancers
    handled about 209 million HTTP requests, including around 66 million page
    loads. Spread across the day, that averages out to roughly 2,400 requests
    a second, close to the traffic of our sample photo app.

    You might expect hundreds of servers behind numbers like that, yet the
    setup was close to our three boxes with a few extra pieces. Nine web
    servers ran Stack Overflow and all of its sister Q&A sites from one shared
    application, so any of those servers could answer for any site. Behind
    them sat 4 SQL Server machines arranged as 2 clusters, where one primary
    in each cluster carried almost all of the database work. Two Redis servers
    held a shared cache, so a value fetched by one web server saved the others
    a database query. Three servers ran search through Elasticsearch, and
    three more ran a tag engine. Every machine had a spare, and a second data
    center in Colorado could take over from New York.

    On average, a question page rendered in about 23 ms. Craver also wrote
    that the whole site could run on a single web server, and had done so by
    accident a few times. The other 8 web servers were not there because
    average traffic needed them. They were there for rolling deploys, spare
    room during spikes, and redundancy if a machine failed. In other words,
    the web server count came from the availability requirement rather than
    the average load. Every other box answered a specific requirement too. The
    cache kept repeat reads off the database, and search ran on its own
    servers so heavy text queries would not slow down regular pages.

    ## In a design review

    When a teammate walks you through a design, a handful of calm questions
    will uncover almost everything that matters.

    1. Which two or three user actions must work well, and what are we leaving out for now?
    2. How many people will use it, and what does the busiest hour look like in requests per second?
    3. How fast should the main screen load, and how many seconds late can new data appear?
    4. What availability target does the product need, and what extra hardware does that require?
    5. Which part of the drawing will run out of room first as traffic grows?
    6. What will a user see if each box goes down?

    And when it is your turn to walk through a design, state your main
    trade-off out loud before anyone has to ask. For our photo app, you might
    put it like this. The feed may show a new photo a few seconds after it is
    posted, and in return we can serve reads from caches and copies, so the
    feed stays fast during the evening rush.
  `,
  quiz: [
    {
      kind: "multi",
      prompt: "Which of these are functional requirements for the photo app?",
      options: [
        { text: "Users can post a photo", correct: true },
        { text: "Users can follow other users", correct: true },
        { text: "The feed loads in under half a second", why: "This describes how fast the app must respond, not what it does. Speed is a non-functional requirement." },
        { text: "The app is up 99.9% of the time", why: "Availability says what share of the time the app stays reachable, so it is a non-functional requirement." },
      ],
      explain: "Functional requirements list what a user can do. Non-functional requirements put numbers on how well the app performs.",
    },
    {
      kind: "choice",
      prompt: "In 2016, Stack Overflow ran 9 web servers for its sites, even though its engineers said 1 could carry the load. Why run the other 8?",
      options: [
        { text: "Spare room for deploys, traffic peaks and failures", correct: true },
        { text: "Each web server holds part of the data", why: "The data lives in SQL Server. One shared application serves every Q&A site, and every web server runs it." },
        { text: "One server made each page too slow", why: "The site had already run on 1 web server a few times by accident. The extra servers are not there for normal speed." },
      ],
      explain: "Nick Craver pointed to rolling deploys, spare room, and redundancy. The web server count came from the availability requirement rather than the average load.",
    },
    {
      kind: "choice",
      prompt: "Someone asks you to \"design a chat app\" with no other details. What is the best thing to ask first?",
      options: [
        { text: "Who uses it, and which actions must work, such as one-to-one or group chat?", correct: true },
        { text: "Should messages go over WebSockets?", why: "That jumps straight to a tool before you know the problem. The right choice depends on how many users there are and what they do." },
        { text: "Should it use a SQL or a NoSQL database?", why: "You cannot choose a database without knowing what the data looks like and how the app reads it." },
      ],
      explain: "Always start with the people and the product. Tool choices come later, once the requirements and rough numbers are clear.",
    },
    {
      kind: "choice",
      prompt: "The photo app has 10 million daily users, and each person opens the feed 20 times a day. About how many feed requests per second is that on average?",
      options: [
        { text: "About 2,300", correct: true },
        { text: "About 23,000", why: "Dividing 200 million daily views by the 86,400 seconds in a day lands near 2,300, not ten times higher." },
        { text: "About 200 million", why: "That is the total for the whole day. Remember to divide by the 86,400 seconds in a day." },
      ],
      explain: "Ten million users times 20 views comes to 200 million views a day. Divide by 86,400 seconds, and you get about 2,300 requests a second.",
    },
    {
      kind: "choice",
      prompt: "In the three-box design, the single database stops and every feed request fails. The app needs 99.9% availability. What should you change first?",
      options: [
        { text: "Add a second copy of the database that can take over", correct: true },
        { text: "Move the database to a bigger machine", why: "A bigger machine handles more traffic, but if that single machine stops, the feed still goes down with it." },
        { text: "Put a cache in front of the database", why: "A cache can answer some repeated reads, yet writes and cache misses still fail while the database is down." },
      ],
      explain: "Right now the database is a single point of failure. Adding a second copy that can take over removes that risk.",
      replay: "dies",
    },
    {
      kind: "choice",
      prompt: "One team builds photo sharing for 500 students on a single server. Another builds it for 10 million daily users across many machines. Which statement is true?",
      options: [
        { text: "Both can be good designs, because their requirements differ", correct: true },
        { text: "The 10 million user design is better for both", why: "For 500 students, that larger setup costs far more to build and run and solves problems the school does not have." },
        { text: "The school's design is wrong because it cannot grow", why: "It fits the requirements it has today. You only add extra machinery when the numbers ask for it." },
      ],
      explain: "Judge every design against its requirements. No single architecture is best in general.",
    },
    {
      kind: "choice",
      prompt: "Which product needs every read to show the latest write right away?",
      options: [
        { text: "A bank account balance", correct: true },
        { text: "A photo feed", why: "If a follower sees a new photo a few seconds late, nobody is harmed, so the feed can read from slightly older copies." },
        { text: "The like count under a photo", why: "A like counter that trails by a few likes for a moment causes no real harm." },
      ],
      explain: "Strict consistency adds latency and cost, so save it for places where stale data causes real harm, such as money.",
    },
    {
      kind: "order",
      prompt: "Put the six steps of the design method in order.",
      items: [
        "Requirements",
        "Rough numbers",
        "An API",
        "A data model",
        "A first design",
        "The bottleneck and its fixes",
      ],
      explain: "Each step feeds the next one, and the real bottleneck only appears once your numbers meet the first design.",
    },
  ],
})
