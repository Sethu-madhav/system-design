import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "mobile", label: "Phone", at: [0, 0] },
  server: { kind: "server", label: "App server", at: [2, 0] },
  db: { kind: "db", label: "Database", at: [4, 0] },
}).steps((s) => ({
  request: s.step(
    "A phone asks the app server for the feed.",
    s.send("phone", "server", "GET /feed"),
  ),
  query: s.step(
    "The server asks the database for the newest photos from people the user follows.",
    s.send("server", "db", "query", "data"),
  ),
  answer: s.step(
    "The database returns the rows, and the server sends the feed back to the phone.",
    s.send("db", "server", "rows", "data"),
    s.send("server", "phone", "200", "response"),
  ),
  users: s.step(
    "The first question is about the people. How many will use it, and how often?",
    s.focus("phone"),
    s.note("phone", "how many users?"),
  ),
  speed: s.step(
    "The next is about time. How fast must each answer come back?",
    s.focus("server"),
    s.note("server", "how fast?"),
  ),
  data: s.step(
    "Then the data. How much is there, and how long must it be kept?",
    s.focus("db"),
    s.note("db", "how much data?"),
  ),
  dies: s.step(
    "The database stops. Every request that needs data now fails, because there is only one database.",
    s.down("db"),
    s.note("db", "what if this dies?"),
    s.send("phone", "server", "GET /feed"),
    s.send("server", "phone", "500", "error"),
  ),
  bottleneck: s.step(
    "The database is back. As users grow, it is the first box to run out, so it is the bottleneck to fix first.",
    s.up("db"),
    s.focus("db"),
    s.note("db", "runs out first"),
  ),
}))

export default defineLesson({
  title: "What system design is",
  summary: "How to turn a one-line product idea into requirements, rough numbers and a first design, and why no design is best in general.",
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

    Someone says "let people share photos". Two teams could build that and end
    up with very different systems. One team serves 500 students at a school
    from a single small server. The other serves 10 million people a day across
    many data centers. Both built what they were asked for.

    The one-line idea leaves out what decides the design. It does not say how
    many people use the product, how fast it must answer, or what happens when
    a machine breaks. System design is the work of finding those answers and
    then choosing the parts that meet them. This lesson shows how to start that
    work on a small photo app. Then it looks at how Stack Overflow ran in
    2016, a real site that serves millions of people on very few machines.
    The rest of the course uses the same method.

    ## The smallest real system

    Most web products start as three boxes. ${cue("request", "A phone sends a request")}
    to an app server. The server holds the code. It checks who the user is and
    decides what to send back. ${cue("query", "The server asks a database")} for
    the data it needs. The database keeps the data on disk, so a restart loses
    nothing. ${cue("answer", "The rows come back, and the server answers the phone")}.

    This design is a good one for many products. A single server and a single
    database can serve thousands of users. Every later lesson adds a box to
    this picture, such as a cache, a queue or a second database. Each box fixes
    a problem the three boxes have at a certain size. A box that fixes no
    problem you have is only one more thing to run.

    ## What the product does

    The first list you write is the functional requirements. They say what the
    product does, in words a user would recognize. For the photo app, the core
    list is short.

    - Users can post a photo with a caption.
    - Users can follow other users.
    - Users can see a feed of recent photos from people they follow.
    - Users can comment on a photo.

    Write the list, then cut it. A design session has an hour, not a year.
    Pick the 2 or 3 actions that matter most, and say out loud which ones you
    leave out, such as direct messages, search and video. Naming the cuts lets
    everyone agree on them now, instead of finding a missing feature after
    launch.

    ## How well it must do it

    The second list is the non-functional requirements. They say how well the
    product must work, and they decide most of the design. Five come up in
    almost every system.

    - **Scale.** ${cue("users", "How many users, and how often")} do they act? Say the photo app has 10 million daily users, and each one opens the feed about 20 times a day.
    - **Speed.** ${cue("speed", "How fast must each answer be?")} The feed should load in under half a second. A feed that takes 3 seconds feels broken.
    - **Data.** ${cue("data", "How much data, and for how long?")} The app keeps every photo for as long as the account exists.
    - **Availability.** What share of the time must the product work? A feed that is down for 9 hours a year is up 99.9% of the time.
    - **Consistency.** After a write, how soon must every reader see it? A follower can see a new photo a few seconds late. A bank balance cannot be late at all.

    Each of the five also has a cost. Meeting a stricter number usually takes
    more machines or more copies of the data. A requirement should be as strict
    as the product needs and no stricter.

    > tradeoff: Stricter numbers cost more. Going from 99.9% to 99.99% availability cuts allowed downtime from about 9 hours a year to about 53 minutes. Fifty-three minutes is too little time for a person to notice a crash and fix it, so the system has to survive a broken part by itself. You run a spare copy of every server and database. You keep the spares in a different data center, so one power cut cannot take out both. You also add code that notices when a main copy fails and sends its traffic to the spare. That means paying for twice the machines, plus the time to build and test the switch.

    ## Ask before you draw

    With a vague brief, it is tempting to start drawing boxes at once. Ask
    about the product first, not the tools. Who uses it? What is the
    one action that must always work? How many users, and how many of them at
    the busiest hour? Is a few seconds of delay in showing new data fine?

    Questions about tools come later. "Should this use a SQL database?" has no
    answer until you know what the data looks like and how it is read. Asking
    it first means picking a tool before you know the job.

    > pitfall: Do not design for the biggest number you can imagine. A system built for a billion users when the product has 10,000 costs more to build and to run. Design for the stated numbers with some room to grow, and say what you would change at 10 times the load.

    ## A method in six steps

    Every case study later in the course follows the same order of work.

    1. **Requirements.** Write the functional list and the non-functional numbers.
    2. **Rough numbers.** Turn users into requests and bytes. The photo app's 10 million users times 20 feed views is 200 million views a day, or about 2,300 a second on average. 2 million new photos a day at 500 KB each is about 1 TB of new photos a day.
    3. **An API.** Name the calls the product needs, such as \`POST /photos\`, \`GET /feed\` and \`POST /follows\`.
    4. **A data model.** Name what you store and how the pieces link. The photo app has users, photos, and follows, where a follow links two users.
    5. **A first design.** Draw the simplest boxes that meet the requirements, often the three boxes above.
    6. **The bottleneck and its fixes.** Find the first part that runs out as load grows. Then change only that part, and check the numbers again.

    The order matters because each step feeds the next. The rough numbers
    come from the requirements. The API comes from the functional list. The
    data model comes from the API, and the bottleneck shows up only when the
    numbers meet the first design.

    For the photo app,
    ${cue("bottleneck", "the database is the first part to run out")}.
    A read of the feed touches the database every time, and reads outnumber
    writes about 100 to 1. Later lessons fix this in different ways, with a
    cache, with copies of the database that serve reads, and by splitting the
    data across machines.

    ## When one part fails

    Every design needs an answer for failure. Look at each box and ask what
    the user sees when it stops. In the three-box design,
    ${cue("dies", "the database stops")} and every request that needs data
    fails. The phone gets an error. Nothing else can answer, because there is
    only one database.

    A part whose failure stops the whole system is a single point of failure.
    The usual fix is a second copy that can take over. Removing every single
    point of failure is expensive, though. An internal tool used by 20 people
    can stay down for an hour while someone restarts a server. A product with
    10 million users cannot. The availability number from the requirements
    tells you which case you are in.

    ## No design is best in general

    A design is good or bad only against its requirements. The photo app's feed can
    show a photo a few seconds late, so it can serve reads from a cache and
    from copies of the database. A payments system cannot show a stale
    balance, so it pays for every read to see the latest write. Put the same
    design under both sets of requirements, and it is right for one and wrong
    for the other.

    That is why "it depends" is never the whole answer. Say what it depends
    on, such as the read-to-write ratio or how late data may be. Then pick an
    option for the numbers you have.

    ## Stack Overflow in 2016

    Stack Overflow is a large question and answer site for programmers. In
    February 2016, Nick Craver, one of its engineers, wrote up how it ran.
    On February 9 that year, its load balancers took about 209 million HTTP
    requests, and about 66 million of those were page loads. That is about
    2,400 requests a second on average, close to the photo app's numbers.

    The design behind those numbers is the three boxes with a few more
    added. 9 web servers run Stack Overflow and its sister sites. One app
    serves every Q&A site, so each of those servers can serve all of them. Behind them, 4 SQL Server
    machines form 2 clusters, and in each cluster one primary takes almost
    all the load. 2 Redis servers hold a shared cache, so a value one web
    server fetched saves the others a database query. 3 servers run search
    with Elasticsearch, and 3 more run a tag engine. Every server has a
    spare, and a second data center in Colorado can take over from New York.

    A question page took about 23 ms to render on average. Craver wrote that
    the whole site could run on 1 web server, and that this had happened by
    accident a few times. The other 8 are there for rolling deploys, spare
    room and redundancy. So the number of web servers came from the
    availability requirement, not from the average load. Each other extra
    box also answers one requirement. The cache keeps repeat reads off the
    database, and search runs on its own servers.

    ## In a design review

    When someone presents a design, ask these questions.

    1. What are the 2 or 3 actions that must work, and what was left out?
    2. How many users, and how many requests a second at the busiest hour?
    3. How fast must the main action be, and how late may data be?
    4. What availability does the product need, and what does that cost?
    5. Which part runs out first as load grows?
    6. What does the user see when each box fails?

    When you present one, state the trade-off out loud. For the photo app it
    could be this. The feed may show new photos a few seconds late, and in return
    reads can come from caches and copies, which keeps the feed fast at the
    evening peak.
  `,
  quiz: [
    {
      kind: "multi",
      prompt: "Which of these are functional requirements for the photo app?",
      options: [
        { text: "Users can post a photo", correct: true },
        { text: "Users can follow other users", correct: true },
        { text: "The feed loads in under half a second", why: "This says how fast the product must be, not what it does. Speed is a non-functional requirement." },
        { text: "The app is up 99.9% of the time", why: "Availability says how well the product works, so it is non-functional." },
      ],
      explain: "Functional requirements name what a user can do. Non-functional ones put numbers on how well it works.",
    },
    {
      kind: "choice",
      prompt: "In 2016, Stack Overflow ran 9 web servers for its sites, though its engineers said 1 could carry the load. Why run the other 8?",
      options: [
        { text: "Spare room for deploys, traffic peaks and failures", correct: true },
        { text: "Each web server holds part of the data", why: "The data lives in SQL Server. One app serves every site, and each web server runs it." },
        { text: "One server made each page too slow", why: "The site had run on 1 web server several times. The others are not there for speed." },
      ],
      explain: "Craver named rolling deploys, spare room and redundancy. The extra servers meet availability needs, not the average load.",
    },
    {
      kind: "choice",
      prompt: "You are asked to \"design a chat app\" and nothing else. What do you ask first?",
      options: [
        { text: "Who uses it, and which actions must work, such as one-to-one or group chat?", correct: true },
        { text: "Should messages go over WebSockets?", why: "That picks a tool before you know the job. The answer depends on how many users there are and what they do." },
        { text: "Should it use a SQL or a NoSQL database?", why: "A database choice needs the data's shape and how it is read. Neither is known yet." },
      ],
      explain: "Start with the product and its users. Tool choices come after the requirements and the rough numbers.",
    },
    {
      kind: "choice",
      prompt: "The photo app has 10 million daily users, and each opens the feed 20 times a day. About how many feed requests a second is that on average?",
      options: [
        { text: "About 2,300", correct: true },
        { text: "About 23,000", why: "200 million a day divided by the 86,400 seconds in a day is about 2,300, not 10 times that." },
        { text: "About 200 million", why: "That is the number per day. A day has 86,400 seconds." },
      ],
      explain: "10 million times 20 is 200 million views a day. Divided by 86,400 seconds, that is about 2,300 a second.",
    },
    {
      kind: "choice",
      prompt: "In the three-box design, the only database stops and every feed request fails. The app must be up 99.9% of the time. What do you change first?",
      options: [
        { text: "Add a second copy of the database that can take over", correct: true },
        { text: "Move the database to a bigger machine", why: "A bigger machine handles more load, but it still stops when it fails, and the feed fails with it." },
        { text: "Put a cache in front of the database", why: "A cache can serve some reads, but writes and cache misses still fail while the database is down." },
      ],
      explain: "The database is a single point of failure. A second copy that can take over removes it.",
      replay: "dies",
    },
    {
      kind: "choice",
      prompt: "One team builds photo sharing for 500 students on one server. Another builds it for 10 million people across many machines. Which is true?",
      options: [
        { text: "Both can be good designs, because their requirements differ", correct: true },
        { text: "The 10 million user design is better for both", why: "For 500 students it costs far more to build and run, and it solves problems they do not have." },
        { text: "The school's design is wrong because it cannot grow", why: "It meets its requirements. It only needs to grow when the numbers do." },
      ],
      explain: "A design is judged against its requirements. No design is best in general.",
    },
    {
      kind: "choice",
      prompt: "Which product needs every read to see the latest write?",
      options: [
        { text: "A bank account balance", correct: true },
        { text: "A photo feed", why: "A follower who sees a new photo a few seconds late loses nothing, so the feed can serve slightly old data." },
        { text: "The like count under a photo", why: "A count that is a few likes behind for a moment does not hurt anyone." },
      ],
      explain: "Strict consistency costs speed and money, so buy it only where stale data causes harm, such as money.",
    },
    {
      kind: "order",
      prompt: "Put the steps of the design method in order.",
      items: [
        "Requirements",
        "Rough numbers",
        "An API",
        "A data model",
        "A first design",
        "The bottleneck and its fixes",
      ],
      explain: "Each step uses the one before it. The bottleneck shows up only when the numbers meet the first design.",
    },
  ],
})
