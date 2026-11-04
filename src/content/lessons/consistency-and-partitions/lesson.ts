import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  "user-a": { kind: "client", label: "User A", at: [0, 0] },
  "user-b": { kind: "client", label: "User B", at: [4, 0] },
  east: { kind: "db", label: "East copy", at: [0, 2] },
  link: { kind: "internet", label: "Link", at: [2, 2] },
  west: { kind: "db", label: "West copy", at: [4, 2] },
}).steps((s) => ({
  write: s.step(
    "User A adds a book to a shared cart. The east copy saves it and sends the change over the link to the west copy.",
    s.send("user-a", "east", "add book"),
    s.send("east", "link", "copy", "data"),
    s.send("link", "west", "copy", "data"),
    s.send("east", "user-a", "200", "response"),
  ),
  read: s.step(
    "User B reads the cart from the west copy and sees the same book.",
    s.send("user-b", "west", "GET cart"),
    s.send("west", "user-b", "book", "data"),
    s.note("west", "holds book"),
  ),
  split: s.step(
    "The link between the two data centers breaks. Both copies still run, but neither can reach the other.",
    s.down("link"),
    s.note("east", "west unreachable"),
    s.note("west", "east unreachable"),
  ),
  stale: s.step(
    "User A adds a lamp on the east side. User B still sees only the book on the west side.",
    s.send("user-a", "east", "add lamp"),
    s.send("east", "user-a", "200", "response"),
    s.send("user-b", "west", "GET cart"),
    s.send("west", "user-b", "book", "data"),
    s.note("east", "holds book, lamp"),
    s.note("west", "holds book"),
  ),
  refuse: s.step(
    "The first choice is to refuse. The west copy turns down writes it cannot share, so User B gets an error and the data stays correct.",
    s.send("user-b", "west", "add pen"),
    s.send("west", "user-b", "503", "error"),
    s.note("west", "refuses writes"),
  ),
  accept: s.step(
    "The second choice is to accept. The west copy saves the write and User B's request succeeds, but now the copies disagree.",
    s.send("user-b", "west", "add pen"),
    s.send("west", "user-b", "200", "response"),
    s.note("east", "holds book, lamp"),
    s.note("west", "holds book, pen"),
  ),
  heal: s.step(
    "The link comes back. Each copy sends the other the changes it missed.",
    s.up("link"),
    s.parallel(s.send("east", "link", "lamp", "data"), s.send("west", "link", "pen", "data")),
    s.parallel(s.send("link", "west", "lamp", "data"), s.send("link", "east", "pen", "data")),
  ),
  merge: s.step(
    "Each copy merges the two carts into one that holds every item. The copies agree again.",
    s.note("east", "holds book, lamp, pen"),
    s.note("west", "holds book, lamp, pen"),
  ),
  wait: s.step(
    "With the link up, a copy can wait for the other to confirm each write before it answers. That costs a round trip every time.",
    s.send("user-a", "east", "add mug"),
    s.send("east", "link", "copy", "data"),
    s.send("link", "west", "copy", "data"),
    s.send("west", "link", "ok", "response"),
    s.send("link", "east", "ok", "response"),
    s.send("east", "user-a", "200", "response"),
    s.note("east", "+70 ms"),
  ),
}))

export default defineLesson({
  title: "Consistency when the network splits",
  summary: "When the link between two copies breaks, each copy must refuse writes or risk two answers. The CAP theorem says when, and what it costs.",
  track: "foundations",
  order: 5,
  tags: [
    "consistency",
    "availability",
    "partition",
    "network split",
    "CAP theorem",
    "linearizability",
    "eventual consistency",
    "conflict",
    "last write wins",
    "Dynamo",
  ],
  sources: [
    {
      use: "link",
      repo: "donnemartin/system-design-primer",
      title: "The System Design Primer: CAP theorem",
      url: "https://github.com/donnemartin/system-design-primer#cap-theorem",
    },
    {
      use: "link",
      title: "Eric Brewer: CAP twelve years later, how the rules have changed",
      url: "https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/",
    },
    {
      use: "link",
      title: "Martin Kleppmann: Please stop calling databases CP or AP",
      url: "https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html",
    },
    {
      use: "link",
      title: "Jepsen: Consistency models",
      url: "https://jepsen.io/consistency",
    },
    {
      use: "link",
      title: "Werner Vogels: Amazon's Dynamo",
      url: "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html",
    },
  ],
  scene,
  body: ({ cue }) => md`
    ## Two copies, two places

    Start with a small shop app. Its users live on both coasts, so it keeps
    a copy of its database in an east data center and another in a west
    one. Each user talks to the nearer copy, and the copies send each other
    every change over a network link.

    ${cue("write", "User A adds a book to a shared cart on the east copy")},
    and the east copy sends the change to the west.
    ${cue("read", "User B reads the cart from the west copy and sees the book")}.
    Both copies give the same answer, so the app behaves as if there were
    only one.

    The previous lesson added copies so that one failure does not stop the
    app. This lesson looks at what happens when the copies are fine and the
    network between them is not. It ends with Amazon's shopping cart, which
    was built around this exact problem.

    ## The link breaks

    One day
    ${cue("split", "the link between the two data centers breaks")}. Both
    copies still run, and users can still reach the copy near them. The
    copies cannot reach each other. This is a network partition, or a
    split.

    A split looks like a crash from the other side. The east copy cannot
    tell whether the west copy has died or is still serving users. Lesson
    1.4 showed the same doubt in GitHub's failover.

    ${cue("stale", "User A adds a lamp on the east side, and User B still sees only the book")}.
    The west copy has no way to know about the lamp. Any copy that answers
    during a split answers from what it has.

    Now User B wants to add a pen to the cart on the west side. The west
    copy has two choices.

    ## The first choice is to refuse

    ${cue("refuse", "The west copy refuses any write it cannot share with the east")}.
    User B gets an error and tries again later. The data stays correct,
    because the two copies can never say different things about the same
    write.

    This choice keeps the system consistent and gives up availability on
    one side. The usual way to do it is to let one side keep working and
    stop the other. With 3 or 5 copies, the side that still holds a
    majority keeps taking writes, and the smaller side refuses them.

    Refusing is right when two different answers would cost real money or
    break a promise.

    - **A bank balance.** Two copies that each allow a withdrawal of 80 from a balance of 100 hand out 160.
    - **The last seat on a flight.** Two copies that each sell it put two people in one seat.
    - **A username.** Two copies that each give "sam" to a new user make two accounts with one name.

    ## The second choice is to accept

    ${cue("accept", "The west copy accepts the write and answers 200")}.
    User B's request succeeds, and the copies now disagree. The east cart
    holds a book and a lamp. The west cart holds a book and a pen.

    This choice keeps the system available and gives up consistency for a
    while. The copies must sort out the difference later.
    ${cue("heal", "When the link comes back, each copy sends the other what it missed")}.
    Each copy then holds two versions of the cart, and something has to
    turn them into one.

    - **Last write wins.** Keep the version with the later timestamp and drop the other. It is simple, but one of the two writes is lost, and nobody is told.
    - **Merge.** Combine the versions with a rule that fits the data. For a cart, keep every item from both.

    Here ${cue("merge", "each copy merges the two carts into one that holds every item")},
    and the copies agree again. A copy that accepts writes during a split
    and catches up later is called eventually consistent.

    > pitfall: Last write wins sounds harmless, and many databases use it by default. During a split it throws away writes that users were told had worked. Check what your database does with conflicting writes before you rely on accepting them.

    Accepting is right when a short disagreement costs little and an
    error costs more.

    - **A like counter.** A count that is a few likes behind for a minute hurts nobody.
    - **A shopping cart.** The app checks every item again at checkout.
    - **A feed.** A post that shows up a few seconds late is fine.

    ## The CAP theorem, stated carefully

    The CAP theorem names these choices. Eric Brewer proposed it in 2000.
    It uses three words in a strict sense.

    - **Consistency.** Every read sees the latest write, as if there were one copy. The formal name is linearizability. It is not the C in ACID, which is about a database's own rules.
    - **Availability.** Every copy that is still running answers every request with a real answer, not an error.
    - **Partition tolerance.** The system keeps running when the network between copies drops messages.

    The common summary is "pick 2 of 3", and Brewer himself has called it
    misleading. A system with copies in more than one place cannot choose
    to have no splits, because networks break. So partition tolerance is
    not optional. The theorem says that during a split, each copy must give
    up either consistency or availability.

    The choice exists only during a split. When the network works, a system
    can be both consistent and available. So CAP is about rare moments.
    The next section covers a cost that comes up every day.

    > note: The choice need not be the same across a whole system. One app can refuse writes to balances and accept writes to likes, using the same pair of data centers.

    ## The cost on a normal day

    Splits are rare. A related cost comes up on every write.

    To be consistent, a copy cannot confirm a write until the other copy
    has it.
    ${cue("wait", "The east copy sends each write to the west and waits for its reply")}
    before it answers User A. Between the two coasts, that round trip is
    roughly 70 ms. A write that took 5 ms in one data center now takes
    about 75 ms.

    A copy that answers first and sends the change afterward answers in 5
    ms. The cost is that for a short time, a read from the other copy can
    miss that write. Every replicated database makes this trade, and many
    let each app pick its side. Chapter 6 covers how replication and consistency models make
    it.

    > tradeoff: Waiting for the other copy makes every write as slow as the network between the copies. Not waiting makes writes fast and lets the copies disagree for a moment, even with no split at all.

    ## Amazon's shopping cart

    Amazon wrote about this choice in detail. In 2007, nine of its engineers,
    Werner Vogels among them, published a paper on Dynamo, the data store
    behind its shopping cart and other core services. At the time, Amazon
    served tens of millions of customers at peak with tens of thousands of
    servers in many data centers.

    The paper states the goal. Customers should be able to view
    and add to their carts even when disks fail, network routes flap or a
    data center is destroyed by a tornado. Turning down an "add to cart"
    would be a poor experience for the customer. So Amazon built Dynamo to be
    "always writeable". It accepts every write and leaves the copies to
    disagree until later.

    Dynamo keeps each item on several machines, commonly 3. A write
    succeeds once 2 of them have it, and a read asks 2 of them. When one of
    the 3 cannot be reached, the next healthy machine takes the write for
    it and hands it over once the first comes back. So a split or a dead
    machine does not fail the write.

    When copies disagree, Dynamo keeps every version instead of picking
    one. A later read gets all of them, and the cart service merges them
    into one cart. An item that a customer added is never lost. The cost
    shows up in the other direction. An item that a customer deleted during
    a split can come back after the merge, because the other version still
    holds it.

    Amazon measured how often this happens. Over 24 hours, 99.94% of
    requests to the cart saw exactly one version. The paper says the extra
    versions came mostly from many writers on the same item at once, often
    automated programs, rather than from failures. It also reports that
    in one holiday season, the cart service handled well over 3 million
    checkouts in a single day.

    Amazon picked the accept choice for the cart because a lost item costs
    more than one that comes back. A balance or
    an order total would need the other choice.

    ## In a design review

    Ask these questions for each kind of data in the design.

    1. Where are the copies, and what happens when the network between them breaks?
    2. During a split, should this data refuse writes or accept them?
    3. If it accepts them, how do two versions become one? Is anything lost?
    4. On a normal day, does a write wait for other copies, and how long is that wait?
    5. Can a user see their own write disappear, or see an older value after a newer one?

    Then say the choice out loud for the small shop app. The cart accepts
    writes during a split and merges versions by keeping every item. Payment
    and stock refuse writes on the side without a majority, and users there
    see an error until the link returns.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "A bank keeps account balances in two data centers. The link between them breaks. What should the copy that cannot reach the other do with a withdrawal?",
      options: [
        { text: "Refuse it, so the balance cannot be spent twice", correct: true },
        { text: "Accept it and fix the balance when the link returns", why: "Both sides could hand out the same money. Some of it may never come back." },
        { text: "Accept it and use last write wins later", why: "That keeps one balance and silently drops the other withdrawal, so the books no longer add up." },
      ],
      explain: "Two answers about one balance cost real money, so refusing the write is worth the error.",
      replay: "refuse",
    },
    {
      kind: "choice",
      prompt: "A video app counts views in two data centers. During a split, what should each copy do with a new view?",
      options: [
        { text: "Accept it and add the counts together when the link returns", correct: true },
        { text: "Refuse it until the link returns", why: "Users would see errors to protect a number nobody needs to be exact." },
        { text: "Accept it and keep only the copy with the later timestamp", why: "Last write wins would drop all the views counted on the other side." },
      ],
      explain: "A count that is briefly behind costs nothing, and counts from both sides add up cleanly.",
      replay: "merge",
    },
    {
      kind: "choice",
      prompt: "The network between a system's copies is working normally. What does the CAP theorem say the system must give up?",
      options: [
        { text: "Nothing. The choice is forced only during a split", correct: true },
        { text: "One of consistency, availability or partition tolerance", why: "That is the \"pick 2 of 3\" summary. The theorem only applies while the network is split." },
        { text: "Availability, because copies must always wait for each other", why: "Waiting costs latency, not availability. CAP is silent about the normal case." },
      ],
      explain: "With no split, a system can be consistent and available. The cost on a normal day is latency.",
    },
    {
      kind: "choice",
      prompt: "Why can a system with copies in two data centers not choose consistency and availability and drop partition tolerance?",
      options: [
        { text: "Networks break, so the system will face splits whether it plans for them or not", correct: true },
        { text: "Partition tolerance is the cheapest of the three", why: "Cost is not the point. Splits happen on their own, so there is nothing to drop." },
        { text: "Two data centers are always split", why: "Most of the time the link works. Splits are rare, but they do happen." },
      ],
      explain: "Dropping partition tolerance would mean the network never breaks. Since it does, the real choice during a split is consistency or availability.",
      replay: "split",
    },
    {
      kind: "choice",
      prompt: "A write on the east coast waits for the west copy to confirm before it answers. The network works fine. What does this cost?",
      options: [
        { text: "About one coast-to-coast round trip, roughly 70 ms, on every write", correct: true },
        { text: "Nothing, since there is no split", why: "CAP forces no choice here, but waiting for the other copy still takes time." },
        { text: "Availability, since the west copy might refuse", why: "With the link up, the west copy confirms the write. The cost is the wait." },
      ],
      explain: "Consistency without a split still costs latency. A write cannot finish before the other copy has it.",
      replay: "wait",
    },
    {
      kind: "choice",
      prompt: "Two copies accepted different writes to one cart during a split. The database keeps the version with the later timestamp. What goes wrong?",
      options: [
        { text: "The items added on the other side disappear without an error", correct: true },
        { text: "The two copies never agree again", why: "Last write wins does make them agree. It does so by dropping one version." },
        { text: "Every later write is refused", why: "Last write wins resolves the conflict and carries on. Nothing is refused." },
      ],
      explain: "Last write wins keeps one version whole and throws the other away, even though its user was told the write worked.",
    },
    {
      kind: "choice",
      prompt: "Amazon's Dynamo merges every version of a cart after a split. What can a customer see as a result?",
      options: [
        { text: "An item they deleted comes back", correct: true },
        { text: "An item they added is lost", why: "The merge keeps every added item. That was the point of the design." },
        { text: "An error when they add to the cart during a split", why: "Dynamo was built to be always writeable, so it accepts the add." },
      ],
      explain: "A merge that keeps every item keeps one that was deleted on one side only. Amazon chose that over losing items customers added.",
    },
    {
      kind: "order",
      prompt: "Put the steps of a split in an app that accepts writes in order.",
      items: [
        "The link between the copies breaks",
        "Each copy accepts writes the other cannot see",
        "The link comes back and the copies swap what they missed",
        "Each copy merges the versions into one",
      ],
      explain: "The copies can only swap changes once the link is back, and they can only merge once each holds both versions.",
    },
  ],
})
