import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  "user-a": { kind: "client", label: "User A", at: [0, 0] },
  "user-b": { kind: "client", label: "User B", at: [4, 0] },
  east: { kind: "db", label: "East copy", at: [0, 2] },
  link: { kind: "internet", label: "Link", at: [2, 2] },
  west: { kind: "db", label: "West copy", at: [4, 2] },
}).steps((s) => ({
  write: s.step(
    "User A adds a book to a shared cart. The east copy saves it and sends the change across the link to the west copy.",
    s.send("user-a", "east", "add book"),
    s.send("east", "link", "copy", "data"),
    s.send("link", "west", "copy", "data"),
    s.send("east", "user-a", "200", "response"),
  ),
  read: s.step(
    "User B opens the cart from the west copy and sees the exact same book.",
    s.send("user-b", "west", "GET cart"),
    s.send("west", "user-b", "book", "data"),
    s.note("west", "holds book"),
  ),
  split: s.step(
    "The network link between the two data centers breaks. Both copies stay up, yet neither can reach the other.",
    s.down("link"),
    s.note("east", "west unreachable"),
    s.note("west", "east unreachable"),
  ),
  stale: s.step(
    "User A adds a lamp on the east coast, while User B on the west coast still sees only the book.",
    s.send("user-a", "east", "add lamp"),
    s.send("east", "user-a", "200", "response"),
    s.send("user-b", "west", "GET cart"),
    s.send("west", "user-b", "book", "data"),
    s.note("east", "holds book, lamp"),
    s.note("west", "holds book"),
  ),
  refuse: s.step(
    "The first choice is to refuse. The west copy turns away writes it cannot share, so User B gets an error and the data stays consistent.",
    s.send("user-b", "west", "add pen"),
    s.send("west", "user-b", "503", "error"),
    s.note("west", "refuses writes"),
  ),
  accept: s.step(
    "The second choice is to accept. The west copy saves the pen and answers 200, yet now the two copies disagree.",
    s.send("user-b", "west", "add pen"),
    s.send("west", "user-b", "200", "response"),
    s.note("east", "holds book, lamp"),
    s.note("west", "holds book, pen"),
  ),
  heal: s.step(
    "When the link returns, each copy sends the other the writes it missed during the split.",
    s.up("link"),
    s.parallel(s.send("east", "link", "lamp", "data"), s.send("west", "link", "pen", "data")),
    s.parallel(s.send("link", "west", "lamp", "data"), s.send("link", "east", "pen", "data")),
  ),
  merge: s.step(
    "Both copies merge the two carts into one list holding every item, and the two sides agree again.",
    s.note("east", "holds book, lamp, pen"),
    s.note("west", "holds book, lamp, pen"),
  ),
  wait: s.step(
    "Even when the link is healthy, waiting for the other copy to confirm each write adds a full coast-to-coast round trip.",
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
  summary: "When the link between two copies breaks, each copy must refuse writes or risk two answers. What CAP really says, and what consistency costs.",
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

    Imagine a small online shop with customers on both coasts. To keep pages
    fast and survive a regional outage, the shop runs one copy of its database
    in an east data center and another copy in a west data center. Each person
    talks to whichever copy sits closer, and the two copies send every update
    across a network link between them.

    On an ordinary day, the two copies stay in step.
    ${cue("write", "User A adds a book to a shared cart on the east copy")},
    and the east copy forwards that update to the west. Moments later,
    ${cue("read", "User B opens the cart on the west copy and sees the book")}.
    Both coasts give the same answer, so the shop behaves as if only one
    database exists.

    In the previous lesson, we added extra copies so a dead machine would not
    stop the app. This lesson asks a quieter, trickier question. What happens
    when both database machines stay healthy, yet the network cable between
    them stops carrying messages? Near the end, we see how Amazon designed its
    shopping cart around this exact dilemma.

    ## The link breaks

    One afternoon,
    ${cue("split", "the link between the two data centers breaks")}. Both
    databases keep running, and shoppers on each coast can still reach their
    local copy without trouble. The only thing missing is the connection
    between east and west. Engineers call this a network partition, or a
    split.

    From inside either data center, a network split looks identical to a
    crash on the far side. The east copy has no way to tell whether the west
    copy lost power or is still answering shoppers. You already saw that
    exact uncertainty trigger GitHub's 2018 failover in Lesson 1.4.

    While the link is down,
    ${cue("stale", "User A adds a lamp on the east side, while User B still sees only the book on the west")}.
    The west copy has no way to hear about the lamp, so if it answers a read,
    it can only share what it knew before the split.

    Now suppose User B tries to add a pen to that same cart on the west side.
    The west copy faces a hard choice, and there are only two honest ways to
    handle it.

    ## The first choice is to refuse

    The first option is to protect accuracy above all else.
    ${cue("refuse", "The west copy refuses any write it cannot share with the east")}.
    User B sees an error and has to try again later. That error is
    uncomfortable, yet the data stays trustworthy because the two sides can
    never give contradictory answers about what was saved.

    Choosing to refuse keeps the system consistent at the cost of availability
    on the cut-off side. With only two copies, neither side can tell whether
    the other is still alive, so real consistent databases usually run an odd
    number of copies like 3 or 5. During a split, whichever side still holds a
    majority keeps serving traffic, while the smaller side refuses writes and
    any reads that require the freshest data.

    Refusing is the right call whenever two conflicting answers would lose
    real money or break a hard rule.

    - **A bank balance.** If two disconnected copies both allow an $80 withdrawal from a $100 account, the bank hands out $160.
    - **The last seat on a flight.** If both copies sell that last seat, two travelers board with the same seat number.
    - **A unique username.** If both copies hand "sam" to a new signup, two accounts end up sharing one name.

    ## The second choice is to accept

    The second option is to keep serving shoppers and sort out the mess later.
    ${cue("accept", "The west copy accepts the write and returns 200")}.
    User B's tap works without an error, yet now the two copies tell different
    stories. The east cart holds a book and a lamp, while the west cart holds
    a book and a pen.

    Accepting keeps the app available during the split and gives up strict
    consistency for a little while. Once the network recovers, the two copies
    have to reconcile.
    ${cue("heal", "When the link comes back, each copy sends the other what it missed")}.
    Now both sides hold two versions of the cart, and a clear rule has to fold
    them back into one.

    - **Last write wins.** Keep whichever version carries the later timestamp and discard the other. It is easy to build, yet one accepted write vanishes without warning, and server clocks can even drift slightly apart.
    - **Merge.** Combine both versions using a rule tailored to the data. For a shopping cart, keep every item from both lists.

    In our shop,
    ${cue("merge", "each copy merges the two carts into one list holding every item")},
    and east and west agree again. A system that accepts writes during a split
    and converges afterward is called eventually consistent.

    > pitfall: Last write wins sounds tidy, and many databases turn it on by default. During a split it drops writes that users already saw succeed. Always check how your database resolves conflicting writes before you choose to accept them.

    Accepting writes makes sense when a brief mismatch causes little harm and
    showing an error hurts more.

    - **A like counter.** A count that trails by a few likes for a minute bothers nobody.
    - **A shopping cart.** The store double-checks stock and totals at checkout anyway.
    - **A social feed.** A new photo showing up a few seconds late does no harm.

    ## The CAP theorem, stated carefully

    The CAP theorem puts formal names on the two choices we just walked
    through. Computer scientist Eric Brewer proposed it in 2000, using three
    words in very specific ways.

    - **Consistency.** Every read returns the latest write, as if only one copy existed. The formal name is linearizability. It is separate from the C in ACID, which is about obeying a database's own rules.
    - **Availability.** Every healthy node that receives a request returns a non-error response. That is stricter than everyday uptime percentages, because returning a fast 503 counts as unavailable here.
    - **Partition tolerance.** The system continues operating even when the network drops messages between copies.

    You have likely heard CAP boiled down to "pick 2 of 3," a slogan Brewer
    himself later called misleading. Any database spread across machines
    cannot choose to skip partition tolerance, because network links fail on
    their own. What CAP really says is narrower and cleaner. While a network
    partition is underway, a system must give up either consistency or
    availability.

    Notice when that trade-off applies. It exists only during a split. While
    the network link works, a system can stay both consistent and available.
    Because splits are rare, CAP governs uncommon moments. The next section
    looks at a related trade-off that shows up on every normal day.

    > note: You do not have to pick one answer for an entire company. The same app running across the same two data centers can refuse writes on account balances while accepting writes on likes or carts.

    ## The cost on a normal day

    Network partitions are rare, yet the tension between speed and agreement
    never goes away.

    If you want every read to see the latest write on an ordinary day, one
    copy cannot tell a user "saved" until the other copy confirms it has the
    update too.
    ${cue("wait", "The east copy sends each write to the west and waits for a reply")}
    before answering User A. Across the United States, a coast-to-coast round
    trip takes roughly 70 ms. A local database write that took 5 ms inside one
    data center now takes about 75 ms.

    If the east copy answers in 5 ms first and copies the change to the west
    afterward, writes stay fast. The trade-off is that for a brief window, a
    reader on the west coast can miss that brand new write even when the
    network is healthy. Engineers sometimes sum up both halves as the PACELC
    rule. If there is a partition, choose availability or consistency. Else,
    choose lower latency or consistency. Chapter 6 shows how real databases
    and consistency models make that trade.

    > tradeoff: Waiting for a remote copy makes every write as slow as the distance between your data centers. Answering locally keeps writes fast, yet lets the two copies disagree for a moment even on a healthy network.

    ## Amazon's shopping cart

    Amazon wrote one of the most famous engineering papers about choosing
    availability on purpose. In 2007, nine Amazon engineers, including Werner
    Vogels, published their paper on Dynamo, the storage system behind
    Amazon's shopping cart and several other core services. At the time,
    Amazon served tens of millions of shoppers at peak across tens of
    thousands of servers in multiple data centers.

    The paper lays out a blunt product goal. Customers should always be able
    to view and add items to their shopping cart, even when hard drives fail,
    network routes flap, or a tornado knocks out an entire data center.
    Turning away an "add to cart" tap meant losing a sale and frustrating a
    shopper. So Amazon designed Dynamo to be "always writeable." It accepts
    every write and lets divergent copies settle afterward.

    In practice, Dynamo commonly kept each piece of data on 3 machines. A
    write succeeded once 2 machines stored it, and a read asked 2 machines. If
    one of those 3 machines was unreachable, the next healthy machine in line
    took the write for it and handed it back once the original machine
    returned. Engineers call this hinted handoff, and it kept a single crash
    or split from blocking writes.

    Whenever two copies ended up with different versions of a cart, Dynamo
    kept every version instead of picking one winner. On the next read, the
    shopping cart service received all of those versions and merged them into
    one cart. With that rule, the merge never loses an item a customer added.
    The trade-off shows up when someone removes an item. An item deleted on
    one side during a split can reappear after the merge because the other
    version still contains it.

    Amazon measured how often those extra versions appeared in production.
    Over a 24-hour stretch, 99.94% of cart requests saw just one version. When
    multiple versions did show up, the paper noted they came mostly from
    several writers updating the same cart at once, often automated programs,
    rather than from hardware failures. During one busy holiday season, that
    cart service handled well over 3 million checkouts in a single day.

    Amazon chose availability for the cart because losing a shopper's added
    item hurt far more than bringing back a deleted one. When the shopper
    reaches checkout and charges a credit card, the system switches to the
    other choice.

    ## In a design review

    When you review a design with more than one copy of the data, ask these
    questions for each type of record.

    1. Where do the copies live, and what happens if the network link between them breaks?
    2. During a split, should this data refuse writes or accept them?
    3. If it accepts them, how do two versions become one, and could any user action be lost?
    4. On a normal day, does a write wait for remote copies, and how many milliseconds does that add?
    5. Could a user ever see their own write vanish, or read an older value after seeing a newer one?

    Then state your choices out loud for each part of the product. For our
    small shop app, you might put it like this. The shopping cart accepts
    writes during a split and merges versions by keeping every item. Payments
    and inventory refuse writes on any side without a majority, so shoppers
    there see an error until the link returns rather than double-spending or
    overselling stock.
  `,
  quiz: [
    {
      kind: "choice",
      prompt: "A bank keeps account balances in two data centers, and the link between them breaks. What should a copy that cannot reach the other side do with a withdrawal?",
      options: [
        { text: "Refuse it, so the balance cannot be spent twice", correct: true },
        { text: "Accept it and fix the balance when the link returns", why: "Both sides could hand out the same funds during the split, and recovering the extra money later is not guaranteed." },
        { text: "Accept it and use last write wins later", why: "Last write wins keeps one balance and discards the other withdrawal, so the ledger no longer adds up." },
      ],
      explain: "Two conflicting answers about a bank balance cost real money, so returning an error is safer than accepting the withdrawal.",
      replay: "refuse",
    },
    {
      kind: "choice",
      prompt: "A video app counts views across two data centers. During a network split, what should each copy do when a new view arrives?",
      options: [
        { text: "Accept it and add the counts together when the link returns", correct: true },
        { text: "Refuse it until the link returns", why: "Showing errors or dropping views to keep a view counter exact to the second hurts users for no real gain." },
        { text: "Accept it and keep only the copy with the later timestamp", why: "Last write wins would throw away all the views counted on the other side of the split." },
      ],
      explain: "A view count that trails briefly harms nobody, and separate counts from both coasts add together cleanly once the link returns.",
      replay: "merge",
    },
    {
      kind: "choice",
      prompt: "The network link between a database's copies is healthy and fast. What does the CAP theorem say the system must give up?",
      options: [
        { text: "Nothing. The choice is forced only during a split", correct: true },
        { text: "One of consistency, availability or partition tolerance", why: "That is the misleading \"pick 2 of 3\" shorthand. CAP forces a choice only while the network is partitioned." },
        { text: "Availability, because copies must always wait for each other", why: "Waiting for another copy adds latency, not unavailability. CAP only governs what happens during a partition." },
      ],
      explain: "When the network is working, a system can stay both consistent and available. The everyday trade-off is latency, not CAP.",
    },
    {
      kind: "choice",
      prompt: "Why can a system with copies in two data centers not pick consistency and availability and drop partition tolerance?",
      options: [
        { text: "Networks break, so the system will face splits whether it plans for them or not", correct: true },
        { text: "Partition tolerance is the cheapest of the three", why: "Cost is not the reason. Network partitions happen in the real world whether you want them or not." },
        { text: "Two data centers are always split", why: "Links work almost all the time. Splits are rare, yet you still have to decide how to behave when one happens." },
      ],
      explain: "Dropping partition tolerance would assume the network never drops messages. Because links do break, the real choice during a split is consistency or availability.",
      replay: "split",
    },
    {
      kind: "choice",
      prompt: "A write on the east coast waits for the west copy to confirm before replying to the user. The network is healthy. What does that guarantee cost?",
      options: [
        { text: "About one coast-to-coast round trip, roughly 70 ms, on every write", correct: true },
        { text: "Nothing, since there is no split", why: "Even without a partition, waiting for a signal to cross the country and return adds real time to every write." },
        { text: "Availability, since the west copy might refuse", why: "When the link is healthy, the west copy confirms the write. The price you pay is extra latency." },
      ],
      explain: "Strong consistency costs latency even on a normal day, because a write cannot finish until the remote copy confirms it.",
      replay: "wait",
    },
    {
      kind: "choice",
      prompt: "During a split, two copies accept different updates to the same shopping cart. When the link returns, the database keeps the version with the later timestamp. What goes wrong?",
      options: [
        { text: "The items added on the other side disappear without an error", correct: true },
        { text: "The two copies never agree again", why: "Last write wins does make the copies match, by throwing away one of the two versions." },
        { text: "Every later write is refused", why: "Last write wins picks a winner and keeps going. It does not block future writes." },
      ],
      explain: "Last write wins keeps one version and discards the other, even though the user who made the dropped write was told it succeeded.",
    },
    {
      kind: "choice",
      prompt: "Amazon's Dynamo merges every version of a shopping cart after a split. What side effect can a shopper occasionally see?",
      options: [
        { text: "An item they deleted comes back", correct: true },
        { text: "An item they added is lost", why: "Merging all versions keeps every added item. Preventing lost additions was the whole goal." },
        { text: "An error when they add to the cart during a split", why: "Dynamo was designed to stay writeable during failures, so it accepts the add." },
      ],
      explain: "Because the merge keeps every item present in either version, an item deleted on one side can return. Amazon preferred that over losing items a shopper added.",
    },
    {
      kind: "order",
      prompt: "Put the steps of a network split in an app that accepts writes in order.",
      items: [
        "The link between the copies breaks",
        "Each copy accepts writes the other cannot see",
        "The link comes back and the copies swap what they missed",
        "Each copy merges the versions into one",
      ],
      explain: "Copies diverge while the link is down, exchange missed writes once it heals, and merge both versions once each side has them.",
    },
  ],
})
