# Build plan

This plan builds a personal web app for learning system design. Each lesson has text, an animated hand-drawn diagram and a quiz. Lesson text adapts `donnemartin/system-design-primer` under CC BY 4.0 and links to the other repos listed in `docs/sources.md`. The UI uses Looseleaf components and the ink engine in `src/lib/ink`.

The app is built in 15 steps. The first complete lesson (text, diagram and quiz for load balancers) works at step 11. After step 15 the app is on GitHub Pages, and each later step adds one lesson.

## Where the design lives

- `docs/design/architecture.md` has the module map, the shape, the tradeoffs, the alternatives that lost and the open risks.
- `docs/design/steps.md` has every step's goal, files, named tests, Playwright scenarios and what you see in the browser.
- `docs/design/sketch/` has the types and function signatures. Bodies are `throw new Error("not implemented")`. Each step's spec quotes the sketch files it fills in.
- `docs/design/example-lesson/lesson.ts` is the load-balancer lesson in the final format. Step 7 copies it into `src/`.

`docs/design/` is not compiled. `tsconfig.json` includes only `src` and `vite.config.ts`.

## How one step runs

Every step goes through the same five stages. You type the words in the right column.

| Stage | Who | What happens | You type |
| :--- | :--- | :--- | :--- |
| 1. Spec | Opus | Writes `docs/steps/NN-<name>.md` from `docs/design/steps.md` and the sketch. The spec lists files, exact types, named tests and the commands that must pass. | `write the spec for step N` |
| 2. Read the spec | You | Read it. Ask about anything unclear. Opus fixes the spec, not the code. | `approve the spec` |
| 3. Code | Codex `gpt-6-luna`, `high` | Runs in its own worktree. Loads the **tdd** skill, writes the tests first, then the code, then runs `pnpm build`, `pnpm test` and `pnpm e2e`. | nothing, Opus starts it |
| 4. Verify | Opus | Runs the three commands again in the worktree. Reads the whole diff against the spec. Runs `/code-review`, the **blast-radius** check and the **no-comments** check. For a step with UI, opens the page in the T3 preview. Sends every finding back to the same Codex thread to fix, then verifies again. | `/code-review`, `/blast-radius`, `/no-comments` when Opus asks |
| 5. Approve | You | Open the page in the preview, or read the test output for a step with no UI. | `approve step N` |

After you approve, Opus commits the step as one commit on `main` and logs it in `docs/decisions.tsv`. Opus never pushes without asking.

## The steps

| # | Step | What you check |
| :--- | :--- | :--- |
| 1 | Vitest and Playwright, one smoke test each | `pnpm test` and `pnpm e2e` pass. The page is unchanged. |
| 2 | Hash router and app shell | A paper page titled "Learn system design". `#/anything` shows not found. |
| 3 | Source registry and the license type | Test output. Opus shows that adapting a link-only repo fails the build. |
| 4 | Prose parser (`md` template) | Test output. Images, HTML and tables in lesson text fail. |
| 5 | Scene model and timeline | Test output. Any frame is a pure function of time. |
| 6 | Player reducer | Test output. Play, pause, step and seek rules. |
| 7 | Lesson pipeline and the first lesson file | `pnpm build` type-checks the load-balancer lesson and runs its content checks. |
| 8 | Home, lesson text and sidebar | Index cards per track. The lesson text with cue highlights and the primer attribution. |
| 9 | Static diagram | The ink diagram beside the text, with Prev and Next. Server A gets crossed out. |
| 10 | Playback, scrubbing, reduced motion, cues | Requests move along the arrows. Clicking a phrase plays its step. Reduced motion shows stills. |
| 11 | Quiz | The full read, watch and answer loop for load balancers. |
| 12 | Progress | Check marks and a Continue card that survive a reload. |
| 13 | Search palette | Cmd-K finds a lesson, a section or a diagram step. |
| 14 | Navigation and accessibility | Breadcrumbs, contents list, phone layout, axe passes. |
| 15 | Deploy | The site on GitHub Pages. This step needs your GitHub login and your go-ahead to push. |

Steps 3 to 7 change nothing in the browser. You check them by reading the test names and output that Opus pastes.

## Lessons after step 15

Each lesson is one spec and one file, `src/content/lessons/<slug>/lesson.ts`, in the same shape as the load-balancer lesson. Opus writes the lesson text, scene and quiz in the spec. Codex adds the file and one Playwright line. Opus then checks the text against the primer and against `docs/sources.md`.

Lessons follow the primer's topic order in these batches: foundations, edge, application, data, cache, async, communication, security, estimation, then case studies. A lesson has exactly one diagram. A case study that needs several diagrams becomes several lessons, such as Pastebin write path and Pastebin read path.

## Verification rules

- Unit logic runs in Vitest in the node environment. React components are tested only in Playwright.
- Playwright runs against `pnpm build && pnpm preview` on port 4173, in Chromium only. A fixture waits for the remote fonts before each test.
- Tests select by `data-testid` and `data-*` state attributes, never by CSS class.
- Only step 10 has a performance gate. During 3 seconds of playback the longest gap between animation frames stays under 50 ms, and the ink SVG markup does not change.
- No review video and no cloud VM lanes. The pstack multi-phase playbook calls for both. They are scaled down for a one-person app to the Playwright suite plus Opus looking at the T3 preview.
- `check-plan.mjs` from the multi-phase playbook is skipped. This plan does not use that playbook's file format.

## Decisions already made

- A lesson is one TypeScript file. The alternative was MDX with YAML, a scene JSON file and a quiz YAML file. It lost because a typo in a cue or a node id would only fail at runtime, and the license rule would need a custom Vite plugin.
- Adapting a link-only repo is a compile error. `SourceRef` with `use: "adapted"` accepts only repos whose rule is Adapt, and a test fails the build when `src/content/sources.ts` and `docs/sources.md` disagree. Paraphrase of a link-only repo can't be caught by a test, so Opus reviews every lesson's text.
- Progress lives in localStorage under `sd.progress`. Each write merges with what is already stored, so two tabs never erase each other. There is no live sync, and another tab sees new progress after a reload.
- A lesson counts as done when its quiz is passed. Watching the diagram is recorded but not required.
- Routing is by hash, such as `#/learn/load-balancer/step/pick`. GitHub Pages then needs no 404 fallback.
- Dark mode is out of scope. The ink engine has no dark tokens.

## Risks

- Playback may drop frames on a slow phone when many requests move at once. The step 10 frame gate measures this on a desktop only.
- Fonts load from a remote URL, so a test may start before they arrive. The font fixture in step 1 waits for them.
- On a narrow screen the diagram shrinks to a minimum cell size and then scrolls sideways. Step 14 checks this at 390 by 844.

## Model roles

Opus 5.5 writes this plan, every spec and all lesson content, and does all verification. Codex `gpt-6-luna` at `high` writes code and tests from a spec, in a new thread and worktree per step. DeepSeek v4.1 flash wrote steps 1 to 9 and the start of step 10, and is no longer used. No step compares models or asks one model to judge another.
