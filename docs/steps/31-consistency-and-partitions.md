# Step 31. Lesson 1.5, consistency when the network splits

## Why

The course follows `docs/curriculum.md` in chapter order, and lesson 1.5 comes next. It is the last lesson in chapter 1. Lesson 1.4 added copies so that one failure does not stop the app. This lesson asks what happens when the copies are fine and the network between them breaks. Each copy can refuse writes and stay correct, or accept them and risk two answers. The lesson states the CAP theorem carefully, shows the latency cost of the same choice on a normal day, and says which choice fits a bank balance, a like counter and a cart.

The lesson follows the course's example rule. It opens with a small unnamed shop app with one database copy on each coast. It then works through a public case study, Amazon's Dynamo, the "always writeable" store behind its shopping cart. Opus checked every fact in that section against the Dynamo paper, and the CAP section against posts by Eric Brewer and Martin Kleppmann. All three are in the lesson's sources.

This step adds one lesson file and the tests that a sixth lesson needs. It changes no app code.

## Branch and coder rules

- Branch `step/31-consistency-and-partitions` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Read only `Instructions.md` and this spec. Do not explore the repo. Do not read `vendor/`, `node_modules/` or `dist/`.
- Only the 6 files below may change, and only by the 2 commands in "How to do it". Do not edit any other file.
- Do not change the lesson text, captions, quiz or tests. Opus wrote and unslopped them. If something does not compile or a test fails, run it once more. If it fails again, stop and report the exact error. Do not rewrite the content to make it pass.
- Do not kill processes.

## What changes

### 1. The lesson

`src/content/lessons/consistency-and-partitions/lesson.ts` is a new file, given in Appendix A byte for byte. Its fields:

- Chapter `foundations`, order 5, 9 minutes.
- 8 sections. These are "Two copies, two places", "The link breaks", "The first choice is to refuse", "The second choice is to accept", "The CAP theorem, stated carefully", "The cost on a normal day", "Amazon's shopping cart" and "In a design review".
- The diagram has User A and User B, an east copy and a west copy of the database, and an internet box called "Link" between the copies. It has 9 steps, `write`, `read`, `split`, `stale`, `refuse`, `accept`, `heal`, `merge` and `wait`. A write to the east copy reaches the west copy. The link goes down, and the west copy no longer sees the east copy's writes. One step shows the west copy refusing a write with a 503. The next shows it accepting the write instead, and the notes show two different carts. The link comes back, the copies swap what they missed and merge the carts. The last step shows the round trip a write pays when it waits for the other copy. The text cues each step once.
- 8 quiz questions. Q1 and Q2 test which choice fits a bank balance and a view counter. Q3 asks what CAP says when the network works. Q4 asks why partition tolerance is not optional. Q5 asks what waiting for the other copy costs. Q6 asks what last write wins loses. Q7 asks what Dynamo's merge can do to a cart. Q8 orders the steps of a split in a system that accepts writes.
- 5 further-reading links. All 5 returned 200 on 2026-11-04. The last one is Werner Vogels's post with the Dynamo paper.

The facts in the Dynamo section, from "Dynamo: Amazon's Highly Available Key-value Store" by Giuseppe DeCandia and 8 others, Werner Vogels among them, SOSP, October 2007:

- Amazon "serves tens of millions customers at peak times using tens of thousands of servers located in many data centers around the world".
- "customers should be able to view and add items to their shopping cart even if disks are failing, network routes are flapping, or data centers are being destroyed by tornados."
- "Dynamo targets the design space of an "always writeable" data store". "rejecting customer updates could result in a poor customer experience". The goal is "to ensure that writes are never rejected".
- "the shopping cart application requires that an "Add to Cart" operation can never be forgotten or rejected". "the item is added to (or removed from) the older version and the divergent versions are reconciled later."
- The client merges versions. "A typical example of a collapse operation is "merging" different versions of a customer's shopping cart. Using this reconciliation mechanism, an "add to cart" operation is never lost. However, deleted items can resurface."
- "The common (N,R,W) configuration used by several instances of Dynamo is (3,2,2)." R and W are the number of nodes that must take part in a read and a write.
- On failure, Dynamo uses a "sloppy quorum" and "hinted handoff". A replica meant for an unreachable node goes to another node, which delivers it "Upon detecting that A has recovered". "Dynamo ensures that the read and write operations are not failed due to temporary node or network failures."
- "99.94% of requests saw exactly one version" over 24 hours. "the increase in the number of divergent versions is contributed not by failures but due to the increase in number of concurrent writers", which is "usually triggered by busy robots (automated client programs)".
- During "the busy holiday shopping season", the cart service "served tens of millions requests that resulted in well over 3 million checkouts in a single day".

The facts in the CAP section:

- Brewer, "CAP twelve years later". "The "2 of 3" formulation was always misleading". "because partitions are rare, there is little reason to forfeit C or A when the system is not partitioned". "the choice between C and A can occur many times within the same system at very fine granularity". "Sometimes it makes sense to forfeit strong C to avoid the high latency of maintaining consistency over a wide area."
- Kleppmann, "Please stop calling databases CP or AP". "Consistency in CAP actually means linearizability". "it has got nothing to do with the C in ACID". Availability is "every request received by a non-failing [database] node in the system must result in a [non-error] response". "In 2000, it was meant to start a discussion".

The 70 ms coast-to-coast round trip is a rough, commonly used number, and the lesson labels it "roughly".

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. A new test checks the new lesson's chapter, order, 9 minutes, 8 heading ids, 9 step ids, quiz length and 5 source URLs.
- `e2e/helpers.ts`. A new `CONSISTENCY_CORRECT` list holds the right answers to the new quiz.
- `e2e/quiz.spec.ts`. A new test answers the new quiz with `CONSISTENCY_CORRECT` and expects 8/8. The pass mark is 70%, so a key with one wrong answer still passes the quiz. Only this test catches it.
- `e2e/progress.spec.ts`. The Continue card test now walks 6 lessons in reading order. After the availability quiz passes, the count is 4 of 6 and the card points at the new lesson. After the new quiz passes, the count is 5 of 6 and the card points at the load balancer. After that quiz, the count is 6 of 6. The reset test expects "0 of 6 lessons done".
- `e2e/scene-static.spec.ts`. A new test opens the lesson and checks its first heading, 9 cues, 5 visible boxes and "Step 1 of 9". At `split`, the link is down. At `accept`, the link is still down, the east copy notes "holds book, lamp" and the west copy notes "holds book, pen". At `merge`, the link is up again and the west copy notes "holds book, lamp, pen".

## How to do it

Run these from the worktree root, in order.

1. Apply the patch.
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/31-consistency-and-partitions.md > /tmp/step31.diff && git apply /tmp/step31.diff`
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A.
   `mkdir -p src/content/lessons/consistency-and-partitions && awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/31-consistency-and-partitions.md > src/content/lessons/consistency-and-partitions/lesson.ts && git status --short`
   The status must list exactly these 6 lines, in any order.
   `M e2e/helpers.ts`, `M e2e/progress.spec.ts`, `M e2e/quiz.spec.ts`, `M e2e/scene-static.spec.ts`, `M src/content/curriculum.test.ts` and `?? src/content/lessons/consistency-and-partitions/`.
3. Install. `pnpm install > /tmp/install31.log 2>&1; tail -3 /tmp/install31.log`
4. Run the commands in the next section.

## Commands that must pass

Run each one 3 times. Send output to a log file and print only the summary lines, so the output stays short.

- `pnpm build > /tmp/b.log 2>&1; grep -E "Tests +[0-9]+|error" /tmp/b.log`. The content step runs 90 tests. Main runs 85, and this step adds 4 lesson checks and 1 curriculum test.
- `pnpm test > /tmp/t.log 2>&1; grep -E "Test Files|Tests +[0-9]" /tmp/t.log`. 209 tests in 14 files. Main runs 204.
- `until [ -z "$(lsof -ti :4173 -ti :4174)" ]; do sleep 3; done; pnpm e2e > /tmp/e.log 2>&1; grep -E "✘|^ +[0-9]+ (passed|failed)|already in use|already used|ERR_" /tmp/e.log`. 64 tests. Main has 62, and this step adds 2.

Other sessions on this machine sometimes use ports 4173 and 4174, or load the machine heavily. If an e2e run prints "already in use" or "already used", or its failures are `ERR_CONNECTION_REFUSED` or `ERR_TIMED_OUT`, that run does not count. Wait 20 seconds and run it again, up to 3 extra times. Report every run. If the ports are still busy after 10 minutes, stop waiting and report it.

The test "Play sets data-mode=playing and a packet moves" in `e2e/scene-play.spec.ts` can fail with "packet has no box" when the machine is busy. It plays the load balancer lesson's scene, which this step does not change. If it is the only failure in a run, that run does not count. Run it again, as above.

## Report

End with this report and nothing else.

```
files: <output of git status --short>
build: <count> <count> <count>
test: <count> <count> <count>
e2e: <count> <count> <count>
failures: <each failing test name and its first Error line, or none>
```

## Checks Opus ran on the prototype

- Changing the Q7 answer in `CONSISTENCY_CORRECT` to "An item they added is lost" fails the new quiz.spec test. The progress test still passes, because 7/8 is above the pass mark.
- Removing `s.up("link")` from the `heal` step fails the new scene-static test.
- The first draft used node ids `userA` and `userB`. The scene rejects capital letters in ids, so the lesson uses `"user-a"` and `"user-b"`.
- With all of it in place on main at c66b55e, build passed 90 and unit 209 in 14 files. e2e passed 64 in 3 of 3 runs.
- No text on the page contains "Inkwell". At 1280 px and at 390 px, the page's `scrollWidth` equals the window width. The diagram fits in its frame with no edge crossing a box.

## Originality

Opus wrote the lesson, then read the primer's "CAP theorem" section. The lesson shares the standard terms, which are consistency, availability, partition tolerance, the refuse or accept choice during a split, and eventual consistency. The primer's examples and wording are not used. The small shop app, the cart scene, the bank, seat and username examples, the last write wins pitfall, the latency section, the Dynamo case study told in our own words, the design review and the quiz are not in the primer.

## What you see

The home page lists Foundations with 5 cards, the last one "Consistency when the network splits". The card shows 9 min. The lesson's diagram shows two users above two database copies, with a cloud called "Link" between the copies. A book added in the east reaches the west. The link gets a cross, and a lamp added in the east never reaches the west. The west copy first refuses a pen with a 503, then accepts it, and the two copies note different carts. The link comes back, the copies swap the lamp and the pen, and both note all 3 items. The last step shows a write waiting a round trip for the west copy, noted "+70 ms". Below the CAP and latency sections, "Amazon's shopping cart" retells how Dynamo keeps every write and why a deleted item can come back.

## Appendix A. The lesson

```ts
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
```

## Appendix B. Test changes

````diff
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index c95cd20..e275c85 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -60,6 +60,17 @@ export const AVAILABILITY_CORRECT: readonly QuizAnswer[] = [
   { order: "solved" },
 ]
 
+export const CONSISTENCY_CORRECT: readonly QuizAnswer[] = [
+  { radio: "Refuse it, so the balance cannot be spent twice" },
+  { radio: "Accept it and add the counts together when the link returns" },
+  { radio: "Nothing. The choice is forced only during a split" },
+  { radio: "Networks break, so the system will face splits whether it plans for them or not" },
+  { radio: "About one coast-to-coast round trip, roughly 70 ms, on every write" },
+  { radio: "The items added on the other side disappear without an error" },
+  { radio: "An item they deleted comes back" },
+  { order: "solved" },
+]
+
 export async function solveOrder(page: Page) {
   const read = () => page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
     rows.map((row) => Number(row.getAttribute("data-item"))),
diff --git a/e2e/progress.spec.ts b/e2e/progress.spec.ts
index 1776e4d..0bb34e6 100644
--- a/e2e/progress.spec.ts
+++ b/e2e/progress.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { AVAILABILITY_CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
+import { AVAILABILITY_CORRECT, CONSISTENCY_CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
 
 const lessonPath = "/#/learn/load-balancer"
 const lessonMark = (page: import("@playwright/test").Page) =>
@@ -16,7 +16,7 @@ test("pass the quiz, reload, the sidebar shows a check for Load balancer", async
 
 test("home Continue card points at the first not-done lesson", async ({ page }) => {
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 5 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 6 lessons done")
   const next = page.getByTestId("next-lesson")
   await expect(next).toHaveAttribute("href", "#/learn/what-system-design-is")
   await expect(next).toHaveAttribute("data-status", "new")
@@ -28,25 +28,31 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/learn/what-system-design-is")
   await passQuiz(page, SYSTEM_DESIGN_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("1 of 5 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("1 of 6 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/latency-and-throughput")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/latency-and-throughput")
   await passQuiz(page, LATENCY_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("2 of 5 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("2 of 6 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/scaling-up-and-out")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/scaling-up-and-out")
   await passQuiz(page, SCALING_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("3 of 5 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("3 of 6 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/availability")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, "/#/learn/availability")
   await passQuiz(page, AVAILABILITY_CORRECT)
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("4 of 5 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("4 of 6 lessons done")
+  await expect(next).toHaveAttribute("href", "#/learn/consistency-and-partitions")
+  await expect(next).toHaveAttribute("data-status", "new")
+  await gotoReady(page, "/#/learn/consistency-and-partitions")
+  await passQuiz(page, CONSISTENCY_CORRECT)
+  await gotoReady(page, "/#/")
+  await expect(page.getByTestId("progress-count")).toHaveText("5 of 6 lessons done")
   await expect(next).toHaveAttribute("href", "#/learn/load-balancer")
   await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, lessonPath)
@@ -54,7 +60,7 @@ test("home Continue card points at the first not-done lesson", async ({ page })
   await gotoReady(page, "/#/")
   await expect(page.getByTestId("next-lesson")).toHaveCount(0)
   await expect(page.getByTestId("all-done")).toBeVisible()
-  await expect(page.getByTestId("progress-count")).toHaveText("5 of 5 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("6 of 6 lessons done")
 })
 
 test("Reset progress clears marks", async ({ page }) => {
@@ -67,7 +73,7 @@ test("Reset progress clears marks", async ({ page }) => {
   await page.getByRole("button", { name: "Reset progress" }).click()
   await page.getByRole("button", { name: "Reset", exact: true }).click()
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 5 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 6 lessons done")
   expect(await page.evaluate(() => localStorage.getItem("sd.progress"))).toBe(null)
   await gotoReady(page, "/#/")
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
diff --git a/e2e/quiz.spec.ts b/e2e/quiz.spec.ts
index e1d087d..cfeb1c0 100644
--- a/e2e/quiz.spec.ts
+++ b/e2e/quiz.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { AVAILABILITY_CORRECT, CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
+import { AVAILABILITY_CORRECT, CONSISTENCY_CORRECT, CORRECT, LATENCY_CORRECT, SCALING_CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
 
 const path = "/#/learn/load-balancer"
 
@@ -48,6 +48,14 @@ test("the availability answer key scores 8/8", async ({ page }) => {
   await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
 })
 
+test("the consistency answer key scores 8/8", async ({ page }) => {
+  await gotoReady(page, "/#/learn/consistency-and-partitions")
+  await answerQuiz(page, CONSISTENCY_CORRECT)
+
+  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
+  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
+})
+
 test("a wrong choice shows its why", async ({ page }) => {
   await gotoReady(page, path)
   await answerQuiz(page, [{ radio: "Restarts Server A" }, ...CORRECT.slice(1)])
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index d537f2b..d4ff084 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -148,3 +148,25 @@ test("availability shows 9 cues, 'notice' notes the missed heartbeats and 'rejoi
   await expect(primary).not.toHaveAttribute("data-down", "")
   await expect(primary.getByTestId("scene-note")).toHaveText("now the standby")
 })
+
+test("consistency shows 9 cues, 'split' takes the link down and 'accept' notes the two carts", async ({ page }) => {
+  const lesson = "/#/learn/consistency-and-partitions"
+  await gotoReady(page, lesson)
+  await expect(page.getByRole("heading", { level: 2, name: "Two copies, two places" })).toBeVisible()
+  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(9)
+  const scene = page.getByTestId("scene")
+  const link = scene.locator('[data-scene-node="link"]')
+  const east = scene.locator('[data-scene-node="east"]')
+  const west = scene.locator('[data-scene-node="west"]')
+  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(5)
+  await expect(page.getByText("Step 1 of 9")).toBeVisible()
+  await gotoReady(page, `${lesson}/step/split`)
+  await expect(link).toHaveAttribute("data-down", "")
+  await gotoReady(page, `${lesson}/step/accept`)
+  await expect(link).toHaveAttribute("data-down", "")
+  await expect(east.getByTestId("scene-note")).toHaveText("holds book, lamp")
+  await expect(west.getByTestId("scene-note")).toHaveText("holds book, pen")
+  await gotoReady(page, `${lesson}/step/merge`)
+  await expect(link).not.toHaveAttribute("data-down", "")
+  await expect(west.getByTestId("scene-note")).toHaveText("holds book, lamp, pen")
+})
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 3c8fde3..c669055 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -278,6 +278,35 @@ test("the real curriculum holds the availability lesson", () => {
   ])
 })
 
+test("the real curriculum holds the consistency-and-partitions lesson", () => {
+  const lesson = curriculum.bySlug.get("consistency-and-partitions")
+
+  expect(lesson?.track).toBe("foundations")
+  expect(lesson?.order).toBe(5)
+  expect(lesson?.minutes).toBe(9)
+  expect(lesson?.headings.map((heading) => heading.id)).toEqual([
+    "two-copies-two-places",
+    "the-link-breaks",
+    "the-first-choice-is-to-refuse",
+    "the-second-choice-is-to-accept",
+    "the-cap-theorem-stated-carefully",
+    "the-cost-on-a-normal-day",
+    "amazon-s-shopping-cart",
+    "in-a-design-review",
+  ])
+  expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
+    "write", "read", "split", "stale", "refuse", "accept", "heal", "merge", "wait",
+  ])
+  expect(lesson?.quiz).toHaveLength(8)
+  expect(lesson?.sources.map((source) => source.url)).toEqual([
+    "https://github.com/donnemartin/system-design-primer#cap-theorem",
+    "https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/",
+    "https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html",
+    "https://jepsen.io/consistency",
+    "https://www.allthingsdistributed.com/2007/10/amazons_dynamo.html",
+  ])
+})
+
 test("TRACKS lists the 12 chapters in reading order", () => {
   expect(TRACKS.map((track) => track.id)).toEqual([
     "foundations", "estimation", "network", "edge", "application", "data",
````
