# Step 19. Lesson 1.1, what system design is

## Why

The course follows `docs/curriculum.md` in chapter order, and lesson 1.1 comes first. It teaches the method every later lesson and case study uses. That means splitting functional requirements from non-functional ones, turning users into rough numbers, and finding the bottleneck. It also teaches that a design is good only against its requirements. Without it, a new reader lands on the load balancer lesson with no words for scale, availability or consistency.

This step adds one lesson file and the tests that a second lesson needs. It changes no app code.

## Branch and coder rules

- Branch `step/19-what-system-design-is` from `origin/main`.
- Use `pnpm` only. Never `npm`, `npx`, `yarn` or `bun`.
- Do not edit `src/components/ui`, `src/lib/ink`, `src/scene`, `src/app` or `vendor`.
- No comments in code. No `any`, no `as` casts, no non-null `!`.
- Do not change the lesson text, captions, quiz or tests below. Opus wrote and unslopped them. If something does not compile or a test fails, stop and report the exact error. Do not rewrite the content to make it pass.

## What changes

### 1. The lesson

`src/content/lessons/what-system-design-is/lesson.ts` is a new file, given in Appendix A byte for byte. Its fields:

- Chapter `foundations`, order 1, 8 minutes, 1,421 words.
- 9 sections. These are "A one-line idea is not a design", "The smallest real system", "What the product does", "How well it must do it", "Ask before you draw", "A method in six steps", "When one part fails", "No design is best in general" and "In a design review".
- The diagram has a phone, an app server and a database in one row. It has 8 steps, `request`, `query`, `answer`, `users`, `speed`, `data`, `dies` and `bottleneck`. The text cues each step once.
- 8 quiz questions. 2 sort requirements, 1 is a rough calculation and 1 orders the method's 6 steps. The other 4 test a decision, such as what to ask first about a vague brief, or what to change first when the only database fails.
- 4 further-reading links. All 4 returned 200 on 2026-11-03.

A note on the scene. Notes last one step, and a box can hold one note per step, so each designer's question gets its own step. `bottleneck` starts with `s.up("db")`, because `dies` took the database down and the down state persists.

### 2. Tests

The patch in Appendix B has every test change.

- `src/content/curriculum.test.ts`. The load balancer test now expects the tracks `["foundations", "edge"]`. A new test checks the new lesson's chapter, order, minutes, heading ids, step ids, quiz length and source URLs.
- `e2e/helpers.ts`. A new `SYSTEM_DESIGN_CORRECT` list holds the right answers to the new quiz. `passQuiz` takes an optional answer list, which defaults to the load balancer's `CORRECT`.
- `e2e/progress.spec.ts`. The Continue card test now walks both lessons in reading order. It starts at 0 of 2, points at the new lesson, and shows Continue after a visit. After the new quiz passes, the count is 1 of 2 and the card points at the load balancer. After that quiz passes, the count is 2 of 2. The reset test expects "0 of 2 lessons done".
- `e2e/quiz.spec.ts`. A new test answers the new quiz with `SYSTEM_DESIGN_CORRECT` and expects a score of 8/8. The pass mark is 70%, so a passed quiz alone would not catch one wrong key.
- `e2e/scene-static.spec.ts`. A new test opens the lesson and checks its first heading, 8 cues, 3 visible boxes and "Step 1 of 8". At `dies`, the database is down with the note "what if this dies?". At `bottleneck`, it is up with the note "runs out first".

## How to do it

1. Extract Appendix B to a file outside the repo and apply it:
   `awk '/^````diff$/{p=1;next} /^````$/{p=0} p' docs/steps/19-what-system-design-is.md > /tmp/step19.diff && git apply /tmp/step19.diff`.
   It must apply cleanly. If it does not, stop and report the error.
2. Write the lesson from Appendix A:
   `mkdir -p src/content/lessons/what-system-design-is && awk '/^```ts$/{p=1;next} /^```$/{if(p){p=0}} p' docs/steps/19-what-system-design-is.md > src/content/lessons/what-system-design-is/lesson.ts`.
3. Run the commands below.

## Commands that must pass

Run each one 3 times.

- `pnpm build`. The content step runs 70 tests.
- `pnpm test`. 188 tests in 14 files.
- `pnpm e2e`. 52 tests.

## Checks Opus ran on the prototype

- Removing `s.down("db")` fails the build with "up of db in step bottleneck".
- Changing the `dies` note to another text fails the new scene-static test.
- Moving the correct answer of the database question to another option fails the new quiz.spec test. The progress test alone did not catch it, because 7 of 8 still passes.
- At 390 px wide, the lesson page's `scrollWidth` is 390.

## Originality

Opus wrote the lesson, then read the primer's "How to approach a system design interview question" section (README lines 218 to 280). That section is a 4-step interview outline made of question bullets. The lesson uses its own 6-step method from `docs/curriculum.md`, and its own split into functional and non-functional requirements with Inkwell numbers. It also has sections on failure and on why no design is best, which the primer section lacks. The only overlap is the generic question "who uses it?".

## What you see

The home page lists Foundations first, with the "What system design is" card at 8 min, then Edge and traffic. The Continue card starts at the new lesson. The lesson's diagram shows a phone, an app server and a database. One request goes through, then each box gets a question. The database gets crossed out and the feed request fails with a 500. Then the database comes back with the note "runs out first".

## Appendix A. `src/content/lessons/what-system-design-is/lesson.ts`

```ts
import { defineLesson, defineScene, md } from "@/content/author"

const scene = defineScene({
  phone: { kind: "client", label: "Phone", at: [0, 0] },
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
    work. The rest of the course uses the same method.

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
    product does, in words a user would recognize. For Inkwell, our photo app,
    the core list is short.

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

    - **Scale.** ${cue("users", "How many users, and how often")} do they act? Inkwell has 10 million daily users, and each one opens the feed about 20 times a day.
    - **Speed.** ${cue("speed", "How fast must each answer be?")} Inkwell's feed should load in under half a second. A feed that takes 3 seconds feels broken.
    - **Data.** ${cue("data", "How much data, and for how long?")} Inkwell keeps every photo for as long as the account exists.
    - **Availability.** What share of the time must the product work? A feed that is down for 9 hours a year is up 99.9% of the time.
    - **Consistency.** After a write, how soon must every reader see it? A follower can see a new photo a few seconds late. A bank balance cannot be late at all.

    Each of the five also has a cost. Meeting a stricter number usually takes
    more machines or more copies of the data. A requirement should be as strict
    as the product needs and no stricter.

    > tradeoff: Stricter numbers cost more. Going from 99.9% to 99.99% availability cuts allowed downtime from about 9 hours a year to about 53 minutes. That usually means a second copy of every part, in a second place, plus the work to switch over.

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
    2. **Rough numbers.** Turn users into requests and bytes. Inkwell's 10 million users times 20 feed views is 200 million views a day, or about 2,300 a second on average. 2 million new photos a day at 500 KB each is about 1 TB of new photos a day.
    3. **An API.** Name the calls the product needs, such as \`POST /photos\`, \`GET /feed\` and \`POST /follows\`.
    4. **A data model.** Name what you store and how the pieces link. Inkwell has users, photos, and follows, where a follow links two users.
    5. **A first design.** Draw the simplest boxes that meet the requirements, often the three boxes above.
    6. **The bottleneck and its fixes.** Find the first part that runs out as load grows. Then change only that part, and check the numbers again.

    The order matters because each step feeds the next. The rough numbers
    come from the requirements. The API comes from the functional list. The
    data model comes from the API, and the bottleneck shows up only when the
    numbers meet the first design.

    For Inkwell, ${cue("bottleneck", "the database is the first part to run out")}.
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

    A design is good or bad only against its requirements. Inkwell's feed can
    show a photo a few seconds late, so it can serve reads from a cache and
    from copies of the database. A payments system cannot show a stale
    balance, so it pays for every read to see the latest write. Put the same
    design under both sets of requirements, and it is right for one and wrong
    for the other.

    That is why "it depends" is never the whole answer. Say what it depends
    on, such as the read-to-write ratio or how late data may be. Then pick an
    option for the numbers you have.

    ## In a design review

    When someone presents a design, ask these questions.

    1. What are the 2 or 3 actions that must work, and what was left out?
    2. How many users, and how many requests a second at the busiest hour?
    3. How fast must the main action be, and how late may data be?
    4. What availability does the product need, and what does that cost?
    5. Which part runs out first as load grows?
    6. What does the user see when each box fails?

    When you present one, state the trade-off out loud. For Inkwell it could
    be this. The feed may show new photos a few seconds late, and in return
    reads can come from caches and copies, which keeps the feed fast at the
    evening peak.
  `,
  quiz: [
    {
      kind: "multi",
      prompt: "Which of these are functional requirements for Inkwell?",
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
      prompt: "The brief says \"The feed must load in under half a second at the evening peak.\" What kind of requirement is that?",
      options: [
        { text: "Non-functional", correct: true },
        { text: "Functional", why: "Showing a feed is the function. The time limit says how well it must work." },
        { text: "Neither, it is an implementation detail", why: "It is a promise to users that the design must keep, so it belongs in the requirements." },
      ],
      explain: "A number on speed, scale, availability, consistency or cost is a non-functional requirement.",
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
      prompt: "Inkwell has 10 million daily users, and each opens the feed 20 times a day. About how many feed requests a second is that on average?",
      options: [
        { text: "About 2,300", correct: true },
        { text: "About 23,000", why: "200 million a day divided by the 86,400 seconds in a day is about 2,300, not 10 times that." },
        { text: "About 200 million", why: "That is the number per day. A day has 86,400 seconds." },
      ],
      explain: "10 million times 20 is 200 million views a day. Divided by 86,400 seconds, that is about 2,300 a second.",
    },
    {
      kind: "choice",
      prompt: "In the three-box design, the only database stops and every feed request fails. Inkwell must be up 99.9% of the time. What do you change first?",
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
```

## Appendix B. The patch for the tests

````diff
diff --git a/e2e/helpers.ts b/e2e/helpers.ts
index 55a8ce2..f4d3630 100644
--- a/e2e/helpers.ts
+++ b/e2e/helpers.ts
@@ -16,6 +16,17 @@ export const CORRECT: readonly QuizAnswer[] = [
   { order: "solved" },
 ]
 
+export const SYSTEM_DESIGN_CORRECT: readonly QuizAnswer[] = [
+  { checks: ["Users can post a photo", "Users can follow other users"] },
+  { radio: "Non-functional" },
+  { radio: "Who uses it, and which actions must work, such as one-to-one or group chat?" },
+  { radio: "About 2,300" },
+  { radio: "Add a second copy of the database that can take over" },
+  { radio: "Both can be good designs, because their requirements differ" },
+  { radio: "A bank account balance" },
+  { order: "solved" },
+]
+
 export async function solveOrder(page: Page) {
   const read = () => page.locator('[data-testid="quiz-order"] li').evaluateAll((rows) =>
     rows.map((row) => Number(row.getAttribute("data-item"))),
@@ -45,7 +56,7 @@ export async function answerQuiz(page: Page, answers: readonly QuizAnswer[] = CO
   }
 }
 
-export async function passQuiz(page: Page) {
-  await answerQuiz(page)
+export async function passQuiz(page: Page, answers: readonly QuizAnswer[] = CORRECT) {
+  await answerQuiz(page, answers)
   await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
 }
diff --git a/e2e/progress.spec.ts b/e2e/progress.spec.ts
index 946e121..a15e4e8 100644
--- a/e2e/progress.spec.ts
+++ b/e2e/progress.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { passQuiz } from "./helpers"
+import { SYSTEM_DESIGN_CORRECT, passQuiz } from "./helpers"
 
 const lessonPath = "/#/learn/load-balancer"
 const lessonMark = (page: import("@playwright/test").Page) =>
@@ -16,21 +16,27 @@ test("pass the quiz, reload, the sidebar shows a check for Load balancer", async
 
 test("home Continue card points at the first not-done lesson", async ({ page }) => {
   await gotoReady(page, "/#/")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 1 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 2 lessons done")
   const next = page.getByTestId("next-lesson")
-  await expect(next).toHaveAttribute("href", "#/learn/load-balancer")
+  await expect(next).toHaveAttribute("href", "#/learn/what-system-design-is")
   await expect(next).toHaveAttribute("data-status", "new")
   await expect(next).toContainText("Start here")
-  await gotoReady(page, lessonPath)
+  await gotoReady(page, "/#/learn/what-system-design-is")
   await gotoReady(page, "/#/")
   await expect(next).toHaveAttribute("data-status", "started")
   await expect(next).toContainText("Continue")
+  await gotoReady(page, "/#/learn/what-system-design-is")
+  await passQuiz(page, SYSTEM_DESIGN_CORRECT)
+  await gotoReady(page, "/#/")
+  await expect(page.getByTestId("progress-count")).toHaveText("1 of 2 lessons done")
+  await expect(next).toHaveAttribute("href", "#/learn/load-balancer")
+  await expect(next).toHaveAttribute("data-status", "new")
   await gotoReady(page, lessonPath)
   await passQuiz(page)
   await gotoReady(page, "/#/")
   await expect(page.getByTestId("next-lesson")).toHaveCount(0)
   await expect(page.getByTestId("all-done")).toBeVisible()
-  await expect(page.getByTestId("progress-count")).toHaveText("1 of 1 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("2 of 2 lessons done")
 })
 
 test("Reset progress clears marks", async ({ page }) => {
@@ -43,7 +49,7 @@ test("Reset progress clears marks", async ({ page }) => {
   await page.getByRole("button", { name: "Reset progress" }).click()
   await page.getByRole("button", { name: "Reset", exact: true }).click()
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
-  await expect(page.getByTestId("progress-count")).toHaveText("0 of 1 lessons done")
+  await expect(page.getByTestId("progress-count")).toHaveText("0 of 2 lessons done")
   expect(await page.evaluate(() => localStorage.getItem("sd.progress"))).toBe(null)
   await gotoReady(page, "/#/")
   await expect(lessonMark(page)).toHaveAttribute("data-status", "new")
diff --git a/e2e/quiz.spec.ts b/e2e/quiz.spec.ts
index 5a79084..0370015 100644
--- a/e2e/quiz.spec.ts
+++ b/e2e/quiz.spec.ts
@@ -1,5 +1,5 @@
 import { expect, gotoReady, test } from "./fixtures"
-import { CORRECT, answerQuiz } from "./helpers"
+import { CORRECT, SYSTEM_DESIGN_CORRECT, answerQuiz } from "./helpers"
 
 const path = "/#/learn/load-balancer"
 
@@ -16,6 +16,14 @@ test("answering all correctly shows 8/8 and passed", async ({ page }) => {
   )).toBe(true)
 })
 
+test("the what-system-design-is answer key scores 8/8", async ({ page }) => {
+  await gotoReady(page, "/#/learn/what-system-design-is")
+  await answerQuiz(page, SYSTEM_DESIGN_CORRECT)
+
+  await expect(page.getByTestId("quiz-score")).toHaveText("8/8")
+  await expect(page.getByTestId("quiz-verdict")).toHaveAttribute("data-passed", "true")
+})
+
 test("a wrong choice shows its why", async ({ page }) => {
   await gotoReady(page, path)
   await answerQuiz(page, [{ radio: "Restarts Server A" }, ...CORRECT.slice(1)])
diff --git a/e2e/scene-static.spec.ts b/e2e/scene-static.spec.ts
index b5318e8..0252194 100644
--- a/e2e/scene-static.spec.ts
+++ b/e2e/scene-static.spec.ts
@@ -69,3 +69,20 @@ test("deep link to 'drain' keeps server B with a draining note and 'stateless' h
   await expect(scene.locator('[data-scene-node="sessions"]')).toHaveAttribute("data-visible", "true")
   await expect(scene.locator('[data-scene-node="a"]')).toHaveAttribute("data-down", "")
 })
+
+test("what-system-design-is shows 8 cues, 'dies' crosses out the database and 'bottleneck' brings it back", async ({ page }) => {
+  const lesson = "/#/learn/what-system-design-is"
+  await gotoReady(page, lesson)
+  await expect(page.getByRole("heading", { level: 2, name: "A one-line idea is not a design" })).toBeVisible()
+  await expect(page.locator('[data-testid="prose"] [data-cue]')).toHaveCount(8)
+  const scene = page.getByTestId("scene")
+  const db = scene.locator('[data-scene-node="db"]')
+  await expect(scene.locator('[data-scene-node][data-visible="true"]')).toHaveCount(3)
+  await expect(page.getByText("Step 1 of 8")).toBeVisible()
+  await gotoReady(page, `${lesson}/step/dies`)
+  await expect(db).toHaveAttribute("data-down", "")
+  await expect(db.getByTestId("scene-note")).toHaveText("what if this dies?")
+  await gotoReady(page, `${lesson}/step/bottleneck`)
+  await expect(db).not.toHaveAttribute("data-down", "")
+  await expect(db.getByTestId("scene-note")).toHaveText("runs out first")
+})
diff --git a/src/content/curriculum.test.ts b/src/content/curriculum.test.ts
index 617ca39..4981003 100644
--- a/src/content/curriculum.test.ts
+++ b/src/content/curriculum.test.ts
@@ -125,7 +125,7 @@ test("defineLesson throws with every quiz problem", () => {
 test("the real curriculum holds the load-balancer lesson", () => {
   const lesson = curriculum.bySlug.get("load-balancer")
 
-  expect(curriculum.tracks.map((track) => track.id)).toEqual(["edge"])
+  expect(curriculum.tracks.map((track) => track.id)).toEqual(["foundations", "edge"])
   expect(lesson?.order).toBe(2)
   expect(lesson?.minutes).toBe(9)
   expect(lesson?.headings.map((heading) => heading.id)).toEqual([
@@ -151,6 +151,35 @@ test("the real curriculum holds the load-balancer lesson", () => {
   ])
 })
 
+test("the real curriculum holds the what-system-design-is lesson", () => {
+  const lesson = curriculum.bySlug.get("what-system-design-is")
+
+  expect(lesson?.track).toBe("foundations")
+  expect(lesson?.order).toBe(1)
+  expect(lesson?.minutes).toBe(8)
+  expect(lesson?.headings.map((heading) => heading.id)).toEqual([
+    "a-one-line-idea-is-not-a-design",
+    "the-smallest-real-system",
+    "what-the-product-does",
+    "how-well-it-must-do-it",
+    "ask-before-you-draw",
+    "a-method-in-six-steps",
+    "when-one-part-fails",
+    "no-design-is-best-in-general",
+    "in-a-design-review",
+  ])
+  expect(lesson?.timeline.steps.map((step) => step.id)).toEqual([
+    "request", "query", "answer", "users", "speed", "data", "dies", "bottleneck",
+  ])
+  expect(lesson?.quiz).toHaveLength(8)
+  expect(lesson?.sources.map((source) => source.url)).toEqual([
+    "https://github.com/donnemartin/system-design-primer#how-to-approach-a-system-design-interview-question",
+    "https://sre.google/sre-book/service-level-objectives/",
+    "https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html",
+    "https://dataintensive.net/",
+  ])
+})
+
 test("TRACKS lists the 12 chapters in reading order", () => {
   expect(TRACKS.map((track) => track.id)).toEqual([
     "foundations", "estimation", "network", "edge", "application", "data",
````
