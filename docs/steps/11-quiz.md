# Step 11: quiz

## Goal

The load-balancer lesson gets a quiz under its text. This finishes the first full lesson: read, watch, then answer. A reader can:

- answer one question at a time, with a progress bar and "Question k of n";
- pick one option, pick several, or put items in order with up and down buttons;
- submit and see a score, whether they passed, and for each question whether they got it right, why a wrong pick was wrong, and the explanation;
- press "Show me in the diagram" on a question to play the diagram step that explains it;
- press Retake to start again with no answers.

Passing throws hand-drawn confetti. With reduced motion turned on there is no confetti.

Progress is not saved in this step. Step 12 records quiz results.

## How the quiz behaves

Read this before the code.

- **One question at a time.** The quiz starts on question 1. The button under a question says "Next", and on the last question it says "Submit". There is no Back button. A reader who wants to change an answer presses Retake after submitting.
- **The button is disabled until the question has an answer.** A choice question has an answer once an option is picked. A multi question has an answer while at least one box is checked. Unchecking the last box takes the answer away again. An order question always has an answer, because the items are always in some order.
- **Order questions start shuffled.** The lesson file lists the items in the right order. The quiz shows them in the order `shuffledOrder(items.length, `${slug}:${index}`)` gives, where `index` is the question's position in the quiz. That function already exists and never returns the right order, so an order question is never solved before the reader touches it. The same seed gives the same order every time, including after Retake.
- **Options show in the order the lesson file lists them.** Only order questions are shuffled.
- **Submit grades the whole quiz with `grade`.** The UI never decides on its own whether an answer is right.
- **A quiz passes when the share of right answers is at least `PASS_RATIO`, which is 0.7.** For the 4-question load-balancer quiz that means 3 right.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Under `src/content`, change only `quiz.ts`, `quiz.test.ts` and `index.ts`. Do not edit the lesson file.
- Do not edit anything under `src/scene`, `src/lib/ink`, `vendor`, `package.json` or `pnpm-lock.yaml`. The add command below writes four files under `src/lib/ink/recipes/`. Commit those as they come.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.
- From `src/app`, import lesson code only from `@/content` and scene code only from `@/scene`. `src/boundaries.test.ts` fails otherwise.
- Select elements in Playwright by role, `data-testid` or `data-*` attributes. Never by CSS class.

## Add the components

Run this from the repo root:

```bash
yes n | pnpm dlx shadcn@latest add @looseleaf/radio-group @looseleaf/checkbox @looseleaf/progress @looseleaf/confetti -y
```

The command prints "Updating src/index.css" but leaves it unchanged. After it runs, `git diff` on tracked files must be empty. `git status` must show exactly these 9 new files:

- `src/components/ui/radio-group.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/confetti.tsx`
- `src/hooks/use-live-motion.ts`
- `src/lib/ink/recipes/radio-group-ink.ts`
- `src/lib/ink/recipes/checkbox-ink.ts`
- `src/lib/ink/recipes/progress-ink.ts`
- `src/lib/ink/recipes/confetti-ink.ts`

Do not edit them. I ran this command on a copy of the repo, and `pnpm build` still passed with these files added.

## Files

You write or change exactly these 6 files, plus the 9 generated files above:

| File | Change |
| :--- | :--- |
| `src/content/quiz.ts` | add `Answer`, `QuestionResult`, `QuizResult`, `PASS_RATIO` and `grade` |
| `src/content/quiz.test.ts` | add 6 tests |
| `src/content/index.ts` | export `grade` and `PASS_RATIO`, and the types `Answer`, `QuestionResult` and `QuizResult` |
| `src/app/QuizView.tsx` | new |
| `src/app/LessonPage.tsx` | render `QuizView` |
| `e2e/quiz.spec.ts` | new, 5 tests |

Nothing else changes.

### `src/content/quiz.ts`

Keep everything already in the file. Add:

```ts
export type Answer = number | readonly number[]

export interface QuestionResult {
  readonly correct: boolean
  readonly picked: Answer | null
}

export interface QuizResult {
  readonly perQuestion: readonly QuestionResult[]
  readonly correct: number
  readonly total: number
  readonly needed: number
  readonly passed: boolean
}

export const PASS_RATIO = 0.7

export function grade(quiz: Quiz, answers: readonly (Answer | null)[]): QuizResult
```

What an answer means for each kind:

| Kind | Answer | Right when |
| :--- | :--- | :--- |
| `choice` | a number, the index of the picked option in `options` | the option at that index has `correct: true` |
| `multi` | an array of option indices | the set of picked indices equals the set of indices with `correct: true`. The order of the array does not matter. |
| `order` | an array of item indices, in the order the reader arranged them | the array is exactly `[0, 1, ..., items.length - 1]` |

Rules for `grade`:

- `perQuestion` has one entry per question in `quiz`, in the same order. `answers[i]` is the answer to `quiz[i]`.
- A missing answer (`null`, or `answers` shorter than the quiz) is wrong, and its `picked` is `null`.
- An answer of the wrong shape is wrong. A number for a `multi` or `order` question is wrong, and so is an array for a `choice` question. Its `picked` is the answer as given.
- `correct` is how many entries are right. `total` is `quiz.length`.
- `needed` is the smallest whole number `k` from 0 to `total` with `k / total >= PASS_RATIO`. For 4 questions it is 3. For 10 it is 7. For an empty quiz it is 0.
- `passed` is `total > 0 && correct >= needed`.
- `grade` does not change its inputs, and the same inputs always give an equal result.

`needed` is not in `docs/design/sketch/content/quiz.ts`. It is there so the result card can say "You need 3 of 4" without working out the pass mark a second time in the UI.

### `src/content/quiz.test.ts`

Keep the 8 existing tests. Add these 6, with these names. Reuse `goodChoice`, `goodMulti` and `goodOrder` from the top of the file where they fit.

1. `grade choice right/wrong`. For `[goodChoice, goodMulti, goodOrder]`, answers `[0, [0], [0, 1, 2]]` give 3 right and `passed` true. Answer `1` to the choice question makes `perQuestion[0].correct` false and its `picked` 1. Answer `[0]` to the choice question is also wrong.
2. `unanswered is wrong`. Answers `[null, null, null]` give 3 wrong entries, each with `picked` null, and `correct` 0. Answers `[]` give the same 3 wrong entries.
3. `multi needs exact set`. A multi question with options x (correct), y, z (correct). `[0, 2]` and `[2, 0]` are right. `[0]`, `[0, 1, 2]`, `[]` and the number `0` are wrong.
4. `order needs identity`. For `goodOrder`, `[0, 1, 2]` is right. `[1, 0, 2]`, `[0, 1]`, `[0, 1, 2, 2]` and the number `0` are wrong.
5. `passed at exactly PASS_RATIO`. `PASS_RATIO` is 0.7. Build a quiz of 10 choice questions, each with option 0 correct, using distinct prompts. With 7 answered `0` and 3 answered `1`, `correct` is 7, `needed` is 7 and `passed` is true. With 6 right, `passed` is false. For a 4-question quiz, `needed` is 3.
6. `grade is pure (same input twice equal)`. Freeze the answers array and each array inside it with `Object.freeze`. Calling `grade` twice with the same quiz and answers gives results that are `toEqual`, and nothing throws.

### `src/content/index.ts`

Change the quiz lines to:

```ts
export { grade, PASS_RATIO, shuffledOrder } from "./quiz"
export type { Answer, Option, Question, QuestionResult, Quiz, QuizResult } from "./quiz"
```

### `src/app/QuizView.tsx` (new)

Exports `QuizView({ slug, quiz }: { slug: string; quiz: Quiz })`. Imports lesson code from `@/content` and `useSceneCue` from `@/scene`.

**State.** Model it as one tagged union in a single `useState`, not as separate flags:

```ts
type QuizState =
  | { readonly phase: "answering"; readonly index: number; readonly answers: readonly (Answer | null)[] }
  | { readonly phase: "result"; readonly answers: readonly (Answer | null)[]; readonly result: QuizResult }
```

The first state is `{ phase: "answering", index: 0, answers }`. In `answers`, each `order` question starts as its shuffled order from `shuffledOrder(question.items.length, `${slug}:${i}`)`, and every other question starts as `null`. Write one function that builds this first state. Both the initial `useState` value and Retake use it.

**Layout.** A `section` with `id="quiz"`, `data-testid="quiz"`, `data-phase={state.phase}` and class `relative`. It starts with a Looseleaf `H2` reading "Quiz". The `id` makes `#/learn/load-balancer/quiz` scroll to the quiz for free, through the section scroll that step 8 built.

**While answering**, show:

- `<p data-testid="quiz-count">Question {index + 1} of {quiz.length}</p>`;
- a Looseleaf `Progress` with `value={index + 1}` and `max={quiz.length}`, and `aria-label="Quiz progress"`;
- the current question, as a `fieldset` with `data-testid="quiz-question"` and `data-kind={question.kind}`, holding a `legend` with the prompt. Give the question component `key={index}`, so its `useId` and inputs start fresh on each question;
- a Looseleaf `Button` reading "Next", or "Submit" on the last question, with `disabled` when the current answer is missing (see "How the quiz behaves"). "Next" moves to `index + 1`. "Submit" sets `{ phase: "result", answers, result: grade(quiz, answers) }`.

The three question kinds:

- **choice.** A Looseleaf `RadioGroup` with `value={typeof answer === "number" ? String(answer) : ""}`. `onValueChange` stores `Number(value)`. One `RadioGroupItem` per option with `value={String(i)}` and `id={`${id}-${i}`}`, where `id` comes from `React.useId()`, and a native `<label htmlFor={`${id}-${i}`}>` with the option text. The label gives the radio its accessible name, so Playwright finds it with `getByRole("radio", { name })`.
- **multi.** One Looseleaf `Checkbox` per option, with an `id` and a native `label` the same way. `checked` is true when the answer array holds `i`. Checking adds `i`, unchecking removes it. Store the indices sorted ascending, and store `null` when none are left.
- **order.** An `ol` with `data-testid="quiz-order"`. One `li` per entry of the answer array, in that order, with `data-item={itemIndex}` and the item text. Each `li` has two Looseleaf `Button`s with `size="icon-sm"` and `variant="outline"`: `aria-label={`Move "${text}" up`}` showing "↑", and `aria-label={`Move "${text}" down`}` showing "↓". Up is disabled on the first row and down on the last. A click swaps the entry with its neighbor.

**After Submit**, show a Looseleaf `Card` with `data-testid="quiz-result"` holding:

- `<p data-testid="quiz-score">{result.correct}/{result.total}</p>`;
- `<p data-testid="quiz-verdict" data-passed={String(result.passed)}>` reading "Passed" when passed, or `Not passed yet. You need {needed} of {total}.` when not;
- an `ol` with one `li` per question, with `data-testid="quiz-answer"`, `data-index={i}` and `data-correct={String(perQuestion[i].correct)}`. Each `li` shows the prompt, then "Right" or "Wrong", then:
  - for choice and multi, the `why` of every picked option that is not correct and has a `why`;
  - for a wrong order question, "The right order:" and an `ol` of the items as the lesson file lists them;
  - the question's `explain`;
  - when the question has `replay`, a `ShowMe` button (below);
- a Looseleaf `Button` reading "Retake", which sets the first state again;
- `<Confetti active={result.passed} />` from `@/components/ui/confetti`. It covers the section, which is why the section is `relative`. The component already does nothing when reduced motion is on, so do not check motion yourself.

**`ShowMe`.** A small component in the same file: `function ShowMe({ step }: { step: string })`. It calls `useSceneCue(step)` and renders a Looseleaf `Button` with `variant="outline"` reading "Show me in the diagram", with `onClick={play}`. It is its own component because a hook cannot be called inside the `map` over questions. `play` already sends `goto` for the step and scrolls the diagram into view (step 10). The quiz adds nothing to that.

### `src/app/LessonPage.tsx`

Render `<QuizView slug={lesson.slug} quiz={lesson.quiz} />` right after `<ProseView prose={lesson.body} />`, before the attribution section. It sits inside `SceneProvider`, which `ShowMe` needs. `SceneProvider` already has `key={lesson.slug}`, so moving to another lesson resets the quiz too.

### `e2e/quiz.spec.ts` (new)

Import `test`, `expect` and `gotoReady` from `./fixtures`. Open `/#/learn/load-balancer` in every test. The fixture fails any test that logs a console error.

The load-balancer quiz has 4 questions, in this order:

1. choice. "Server A fails its health checks. What does the load balancer do?" Right option: "Stops routing to Server A and keeps using the others". `replay: "fail"`.
2. choice. "Which balancer can route /video and /billing to different servers?" Right option: "Layer 7".
3. multi. Right options: "Servers keep no per-user session in memory" and "Sessions live in a shared store". Wrong option: "Every server has more RAM than the last".
4. order. 4 items. `replay: "reply"`.

Write a helper `solveOrder(page)` in the spec file. It reads the `data-item` values of `[data-testid="quiz-order"] li` in DOM order. Then for each target position `p` from 0 up, it finds the row whose `data-item` is `p` and clicks its "Move ... up" button until that row is at position `p`. Re-read the rows after each click. After it runs, the rows' `data-item` values are `0, 1, 2, 3`.

Write exactly these 5 tests with these names:

1. `answering all correctly shows 4/4 and passed`. Pick the right radio on question 1 and click Next. Do the same on question 2. Check both right boxes on question 3 and click Next. Call `solveOrder`, then click Submit. `quiz-score` reads "4/4". `quiz-verdict` reads "Passed" and has `data-passed="true"`. All 4 `quiz-answer` items have `data-correct="true"`.
2. `a wrong choice shows its why`. On question 1 pick "Restarts Server A". Answer the rest any way that enables the button, and submit. The `quiz-answer` with `data-index="0"` has `data-correct="false"` and contains "Restarting is an orchestrator's job, not the balancer's."
3. `'show me' on the health-check question sets the scene to step fail`. Submit the quiz with any answers. Inside the `quiz-answer` with `data-index="0"`, click "Show me in the diagram". `[data-testid="scene"]` gets `data-step-id="fail"` and `data-mode="playing"`, and is in the viewport.
4. `Retake clears answers`. Pick an option on question 1, answer the rest, and submit. Click Retake. `data-phase` is "answering", `quiz-count` reads "Question 1 of 4", no radio has `aria-checked="true"`, and Next is disabled.
5. `Next and Submit are disabled until the question is answered`. On question 1, Next is disabled. After picking a radio it is enabled. Click Next. Pick a radio on question 2 and click Next. On question 3, Next is disabled. Checking one box enables it, and unchecking that box disables it again. Check a box and click Next. On question 4, Submit is enabled before anything is touched.

The design notes named the last test "Submit is disabled until the question is answered". The button reads "Next" on every question but the last, so the name now covers both.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run shows 68 tests passing, the 62 from before plus the 6 new quiz tests.
3. `pnpm test` shows 157 tests passing in 12 files.
4. `pnpm e2e` shows 32 tests passing: the 27 from before plus these 5. Run it 3 times in a row. All 3 runs must pass.

## Done means

- All four commands pass.
- `git status` shows only the 9 generated files and the 6 files in the Files table.
- Each of these planted bugs makes the named test fail. Check each one, then put the code back:
  - grading `multi` as right when every picked option is correct (so `[0]` passes) fails unit test `multi needs exact set`;
  - using `>` instead of `>=` against `PASS_RATIO` when working out `needed` fails unit test `passed at exactly PASS_RATIO`;
  - removing `disabled` from the Next/Submit button fails e2e test 5;
  - making Retake keep the old answers (set `phase` and `index` but reuse `answers`) fails e2e test 4;
  - removing `onClick={play}` from `ShowMe` fails e2e test 3.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4 (all three e2e runs). Paste the failing output of the five planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
