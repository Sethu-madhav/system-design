# Step 10: playback, scrubbing, reduced motion and cues

## Goal

The diagram plays. A reader of the load-balancer lesson can:

- press Play and watch requests travel along the arrows as small labelled envelopes;
- pause, step forward and back, jump to the first or last step, or drag a scrubber;
- use the keyboard when the player has focus;
- click a highlighted phrase in the text to play its step;
- open a link like `#/learn/load-balancer/step/scale` and land on that step.

With reduced motion turned on, nothing moves. Steps still change, as still pictures.

## How playback behaves

Read this before the code. Steps 5 and 6 already built and tested these rules. This step only adds a clock that sends `tick` events.

- **A step plays from its start to its end, then the player pauses.** The end of step k is the start of step k+1. So once step k finishes, the caption shows step k+1 and waits. Pressing Next then plays step k+1. Each press of Next animates the caption the reader just read.
- **Next sends `next`.** When the player sits exactly at a step's start, `next` plays that step. Anywhere else it jumps to the following step and plays it.
- **Prev sends `prev`.** Within 600 ms of a step's start it goes back to the previous step's start, paused. Later than that, it restarts the current step, paused.
- **A cue sends `goto`.** That plays the cue's step from its start.
- **A deep link sends `seek` to the step's start.** The player lands on that step and stays paused, so the reader can read the caption first.

Step 9's buttons sent `goto` to the step before or after. Do not keep that. Once a clock runs, `goto(i + 1)` after a finished step skips a whole step. For example, step 1 finishes and shows step 2, and then `goto(3)` plays step 3, so step 2 never animates.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Run `pnpm install` first.
- Do not edit anything under `src/content`, `src/lib/ink`, `vendor`, `package.json` or `pnpm-lock.yaml`. The add command below writes two files under `src/lib/ink/recipes/`. Commit those as they come.
- Do not change `src/scene/player.ts`, `src/scene/timeline.ts`, `src/scene/layout.ts`, `src/scene/ink.ts` or `src/scene/model.ts`.
- Do not add code comments. Do not use `any`, `as` casts or non-null assertions (`!`) in the files you write.
- From `src/app`, import scene code only from `@/scene`. `src/boundaries.test.ts` fails otherwise.
- Select elements in Playwright by role, `data-testid` or `data-*` attributes. Never by CSS class.

## Add the components

Run this from the repo root:

```bash
yes n | pnpm dlx shadcn@latest add @looseleaf/slider @looseleaf/kbd -y
```

After it runs, `git diff` on tracked files must be empty. `git status` must show exactly these 4 new files:

- `src/components/ui/slider.tsx`
- `src/components/ui/kbd.tsx`
- `src/lib/ink/recipes/slider-ink.ts`
- `src/lib/ink/recipes/kbd-ink.ts`

Do not edit them. The design notes also named `@looseleaf/tooltip`. Leave it out, because nothing in this step needs it.

## Files

You write or change exactly these 7 files, plus the 4 generated files above:

| File | Change |
| :--- | :--- |
| `src/scene/ScenePlayer.tsx` | clock, motion, packets, controls, scrubber, keyboard, cue `play`, deep-link `step` prop |
| `src/scene/scene.css` | one reduced-motion rule |
| `src/scene/timeline.test.ts` | +1 test |
| `src/app/ProseView.tsx` | each cue becomes a button |
| `src/app/LessonPage.tsx` | pass `route.step` to `SceneProvider` |
| `e2e/scene-static.spec.ts` | rewrite tests 2 to 6 to use deep links |
| `e2e/scene-play.spec.ts` | new, 10 tests |

`src/scene/index.ts` does not change. It already exports `SceneProvider`, `ScenePlayer` and `useSceneCue`.

### `src/scene/ScenePlayer.tsx`

Keep everything step 9 built: the measure wrapper, the stage, the node and edge hosts, the labels and notes, and `layoutScene(timeline, box.w - 2)`. Change only what this section names.

**Motion.** Add a `useMotion(): Motion` hook. `Motion` comes from `./timeline`.

```ts
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function useMotion(): Motion {
  const system = React.useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED_QUERY).matches, () => false)
  const ink = useInkContext().motion
  return system || ink === "reduced" ? "reduced" : "full"
}
```

Import `useInkContext` from `@/lib/ink`.

**Clock.** Add a `useClock(running, dispatch)` hook. While `running` is true it sends one `tick` per animation frame. Cap `dt` at 100 ms, so a background tab does not jump through several steps when it comes back.

```ts
const MAX_TICK_MS = 100

function useClock(running: boolean, dispatch: React.Dispatch<PlayerEvent>) {
  React.useEffect(() => {
    if (!running) return
    let last = performance.now()
    let id = 0
    const loop = (now: number) => {
      dispatch({ type: "tick", dt: Math.min(now - last, MAX_TICK_MS) })
      last = now
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [running, dispatch])
}
```

A negative `dt` can happen on the first frame. The reducer already ignores it.

**`SceneProvider`.** New props `{ timeline: Timeline; step?: string; children: React.ReactNode }`.

- `const motion = useMotion()`.
- Keep the `useReducer`.
- Call `useClock(state.mode !== "paused", dispatch)`.
- `frame = React.useMemo(() => frameAt(timeline, state.t, motion), [timeline, state.t, motion])`. Step 9 passed `"reduced"` here. Now pass `motion`.
- `const stage = React.useRef<HTMLElement | null>(null)`. `ScenePlayer` puts it on its root.
- Deep link. A `React.useEffect` keyed on `[timeline, step]`. When `step` is set and `timeline.steps` has a step with that id, it dispatches `{ type: "seek", t: thatStep.start }`. An unknown id does nothing.
- The scene context value is `{ timeline, motion, state, frame, dispatch, stage }`, memoized on `[timeline, motion, state, frame]`.
- **Add a second context for cues**, `SceneCueContext`. Its value is `{ stepId: frame.stepId, play }`, memoized on `[timeline, frame.stepId]`. `play(id: string)` finds the step index for `id`. If there is none it does nothing. Otherwise it dispatches `{ type: "goto", step: index }` and calls `stage.current?.scrollIntoView({ block: "nearest" })`.
  - Why a second context? The scene context changes on every animation frame. Cues read only the step id. With their own context, the 8 cues in the text re-render on a step change, not 60 times a second.
- Render the scene context provider around the cue context provider around `children`.

**`useSceneCue(stepId)`** reads `SceneCueContext` and returns `{ active: ctx.stepId === stepId, play: () => ctx.play(stepId) }`. Outside a provider it throws, like `useScene` does.

**`ScenePlayer` root.** Keep the `figure`. It gets:

- `ref={stage}`;
- `data-testid="scene"` and `data-step-id={frame.stepId}`, as before;
- `data-mode={state.mode}`, which is `paused`, `playing` or `stepping`;
- `data-motion={motion}`, which is `full` or `reduced`;
- `tabIndex={0}`, `aria-label="Diagram player"`, `aria-keyshortcuts="Space ArrowLeft ArrowRight Home End"`, and a visible focus ring (`outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-sm`);
- `onKeyDown`, below.

**Keyboard.** A module-level map from key to event:

```ts
const KEYS: ReadonlyMap<string, PlayerEvent> = new Map<string, PlayerEvent>([
  [" ", { type: "toggle" }],
  ["ArrowRight", { type: "next" }],
  ["ArrowLeft", { type: "prev" }],
  ["Home", { type: "first" }],
  ["End", { type: "last" }],
])
```

`onKeyDown` returns early when `event.target !== event.currentTarget`. A focused button or the scrubber thumb handles its own keys. Otherwise it looks up `event.key`. On a hit it calls `event.preventDefault()`, so Space does not scroll the page, and dispatches the event.

**Packets.** Render after the node hosts, inside the stage, one element per `frame.packets` entry:

- Find the edge with `timeline.edges.find((edge) => edge.id === packet.edge)`. Skip the packet if there is none.
- Compute `const [x, y] = pointOn(layout.edges[packet.edge], edge.a === packet.from, packet.u)`. Import `pointOn` from `./layout`.
- The element is a `div` with:
  - `key={packet.key}`;
  - `data-scene-packet={packet.key}` and `data-tone={packet.tone}`;
  - `aria-hidden`;
  - `className={`pointer-events-none absolute left-0 top-0 min-w-4 whitespace-nowrap rounded-sm border border-ink px-1 text-center font-hand text-xs leading-tight shadow-sm ${TONE_CLASS[packet.tone]}`}`;
  - `style={{ transform: `translate(${x}px, ${y}px) translate(-50%, -50%)` }}`;
  - `{packet.label}` as its text.
- Move packets only with `transform`. Do not set `left` or `top` per frame.
- `TONE_CLASS` is a module-level `Readonly<Record<PacketTone, string>>`: `request` is `bg-sticky-yellow`, `response` is `bg-sticky-blue`, `data` is `bg-sticky-green` and `error` is `bg-sticky-pink`. Import `PacketTone` from `./model`. Typing it as a `Record` means a new tone fails `tsc` until it gets a color.
- Packets use no ink. Ink markup must not change during play.

**Below the stage, in this order:**

1. Caption. A `div` with `aria-live="polite"` and `className="text-center"`, holding `p data-testid="step-count"` ("Step {i} of {n}") and `p data-testid="caption"`, as in step 9.
2. Controls. A `div` with `role="group"`, `aria-label="Playback"` and `className="flex flex-wrap items-center justify-center gap-2"`, holding five `Button variant="outline" size="sm"`:

   | Text | `aria-label` | Sends | Disabled when |
   | :--- | :--- | :--- | :--- |
   | First | First step | `first` | `frame.t === 0` |
   | Prev | Previous step | `prev` | `frame.stepIndex === 0` |
   | Play or Pause | Play or Pause | `toggle` | never |
   | Next | Next step | `next` | `frame.t === timeline.duration` |
   | Last | Last step | `last` | `frame.t === timeline.duration` |

   The Play button shows "Play" with `aria-label="Play"` when `state.mode === "paused"`, else "Pause" with `aria-label="Pause"`. Give it `variant="default"` so it stands out.
3. Scrubber. A `div className="relative px-0"` holding:
   - `<Slider data-testid="scrubber" className="will-change-transform" aria-label="Scrub through the diagram" min={0} max={timeline.duration} step={10} value={[frame.t]} getValueText={() => `Step ${frame.stepIndex + 1} of ${timeline.steps.length}`} onValueChange={(values) => dispatch({ type: "seek", t: values[0] ?? 0 })} />`. Import `Slider` from `@/components/ui/slider`.
   - One tick per step boundary, for `timeline.steps.slice(1)`: `<span key={step.id} data-step-tick={step.id} aria-hidden className="pointer-events-none absolute top-full mt-0.5 h-2 w-px -translate-x-1/2 bg-pencil" style={{ left: `calc(10px + (100% - 20px) * ${step.start / timeline.duration})` }} />`. The 10px and 20px match the slider's 20px thumb, so a tick sits where the thumb centre lands at that step's start.

   `will-change-transform` puts the slider on its own compositor layer. Without it, the thumb moving on every frame makes Chromium repaint the hand-drawn buttons next to it, and playback runs at 20 frames a second (measured: every frame 50.1 ms while playing, 16.8 ms while paused). With it, playback measured 91 frames in 1.5 s with a worst gap of 16.8 ms.

   Every step's start and end is a multiple of 10 ms, so `step={10}` can reach every boundary and the end.
4. Key hint. `<p className="hidden text-center text-sm text-pencil-text md:block"><Kbd>Space</Kbd> play or pause, <Kbd>←</Kbd> <Kbd>→</Kbd> step</p>`. Import `Kbd` from `@/components/ui/kbd`.

### `src/scene/scene.css`

Add one rule, so nodes and edges swap at once instead of fading when motion is reduced:

```css
[data-motion="reduced"] [data-scene-node],
[data-motion="reduced"] [data-scene-edge] {
  transition: none;
}
```

### `src/scene/timeline.test.ts`

Add one test named `frameAt is referentially cheap: 10k calls < 50 ms`. Use the `fixture` timeline the file already imports from `./fixtures`. Do not import lesson content, because `src/scene` must not depend on `src/content`. Make 1,000 warm-up calls, then time 10,000 calls of `frameAt(fixture, (i * 7) % fixture.duration, "full")` with `performance.now()`, and expect under 50 ms. I measured 2.5 to 8.7 ms for 10,000 calls on the larger load-balancer timeline on this machine, so the limit catches a slowdown of about 6x or more without failing on a busy run.

The count goes from 150 to 151.

### `src/app/ProseView.tsx`

`Cue` becomes:

```tsx
function Cue({ step, text }: { step: string; text: string }) {
  const { active, play } = useSceneCue(step)
  return (
    <button type="button" data-cue={step} data-active={active ? "" : undefined} onClick={play} className="cursor-pointer text-left [font:inherit]">
      <Highlight seed={step}>{text}</Highlight>
    </button>
  )
}
```

`data-cue` and `data-active` move from the `Highlight` to the button. The count of `[data-cue]` stays 8, and the step 8 test still passes. Enter and Space work on a button with no extra code.

### `src/app/LessonPage.tsx`

Change only the provider line, to `<SceneProvider key={lesson.slug} timeline={lesson.timeline} step={route.step}>`.

### `e2e/scene-static.spec.ts`

Rapid clicks on Next no longer give a fixed step, because `next` now depends on the clock. Tests 2 to 6 use deep links instead, which land paused on a known step. Keep test 1 as it is. Replace tests 2 to 6 with these, in this order:

2. `deep link to 'fail' shows server A down`. Open `/#/learn/load-balancer`. Server A has no `data-down`. Then open `/#/learn/load-balancer/step/fail`. The scene has `data-step-id="fail"` and `data-mode="paused"`, and server A has `data-down`.
3. `deep link to 'reroute' hides server C and 'scale' shows it`. Open `/step/reroute`. Server C has `data-visible="false"`. Open `/step/scale`. Server C has `data-visible="true"`.
4. `caption text matches the step`. On load, "Step 1 of 8" and the `arrive` caption. Open `/step/pick`. "Step 2 of 8" and the caption "The balancer picks a healthy server, here by round robin, and forwards the request."
5. `Prev returns to the previous caption`. On load, Previous step is disabled. Open `/step/reply` and click Previous step. The caption is the `pick` caption and `data-mode` is `paused`.
6. `the cue for the current step has data-active`. On load, exactly one `[data-cue][data-active]` exists, and it is `arrive`. Open `/step/pick`. `pick` has `data-active` and `arrive` does not.

Use `gotoReady` for every page open. A second open of the same lesson changes only the hash. The provider stays mounted and the `step` effect seeks.

### `e2e/scene-play.spec.ts` (new)

Import `test`, `expect` and `gotoReady` from `./fixtures`. `scene` below means `page.getByTestId("scene")`, and `packet` means `scene.locator("[data-scene-packet]").first()`. Write exactly these 10 tests:

1. `Play sets data-mode=playing and a packet moves`. Open `/#/learn/load-balancer/step/next`, a step with two sends in a row, so packets are on screen from 200 ms to 1800 ms after Play. Click Play. `data-mode` is `playing`. Wait for `packet` to be visible. Read its `boundingBox()`, wait 100 ms, read it again. The two `x` values differ.
2. `Pause freezes the packet position`. Same start. Click Play, wait for `packet` to be visible, click Pause. `data-mode` is `paused`. Read the box, wait 300 ms, read it again. The boxes are equal.
3. `Space toggles play when the player has focus`. Open the lesson. `await scene.focus()`. Press Space. `data-mode` is `playing`. Press Space again. `data-mode` is `paused`.
4. `ArrowRight plays one step then returns to paused at the next step`. Open the lesson. Focus the scene and press ArrowRight. `data-mode` is `stepping`. Then, with a 10 s timeout, `data-mode` is `paused` and `data-step-id` is `pick`.
5. `dragging the slider to the end shows the last caption`. Open the lesson. Call `scrubber.scrollIntoViewIfNeeded()` first, because at the default 720 px viewport the scrubber sits below the fold and mouse events there go nowhere. Find the thumb with `page.getByTestId("scrubber").getByRole("slider")`. With `page.mouse`, press at the thumb's centre, move to 40 px past the right edge of the scrubber's box, and release. The step count is "Step 8 of 8", the caption is the `stateless` caption, and `data-mode` is `paused`.
6. `clicking the cue 'stops sending requests to unhealthy servers' sets data-step-id=fail`. Set the viewport to 1280 by 900, then open the lesson. Click `page.getByTestId("prose").locator('[data-cue="fail"]')`. The scene has `data-step-id="fail"` and `data-mode="stepping"`, and `await expect(scene).toBeInViewport({ ratio: 0.9 })` passes.
7. `deep link #/learn/load-balancer/step/scale opens at scale`. Open `/#/learn/load-balancer/step/scale` directly. `data-step-id` is `scale`, `data-mode` is `paused`, and the step count is "Step 7 of 8".
8. `with emulateMedia reducedMotion=reduce: data-motion=reduced, no packet elements during Play, and captions still advance`. Call `page.emulateMedia({ reducedMotion: "reduce" })` before opening the lesson. The scene has `data-motion="reduced"`. Click Play. In `page.evaluate`, on every animation frame for 3000 ms, read `document.querySelectorAll("[data-scene-packet]").length` and return the largest value. It is 0. Then, with a 6 s timeout, `data-step-id` becomes `pick`. Do not use `toHaveCount(0)` for the packet check. It retries for 5 s and passes the first moment no packet is on screen, which happens between flights even when packets do render, so it cannot catch the planted `"full"` bug.
9. `frame budget: during 3 s of play, the longest rAF gap < 50 ms`. Open the lesson, click Play, and wait for `data-mode="playing"`. In `page.evaluate`, sample `requestAnimationFrame` timestamps for 3000 ms and return the largest gap between frames. It is under 50.
10. `ink is not regenerated during play`. Open the lesson. Wait until `[data-scene-node="sessions"] svg[data-ink]` is attached. Click Play and wait for `packet` to be visible. In `page.evaluate`, on each of 30 animation frames, record `${count}:${totalLength}`. Here `count` is the number of `[data-testid="stage"] svg[data-ink]` elements and `totalLength` is the sum of their `innerHTML.length`. All 30 records are equal.

## Commands that must pass

1. `pnpm install`
2. `pnpm build` exits 0. Its content run shows 62 tests passing.
3. `pnpm test` shows 151 tests passing in 12 files.
4. `pnpm e2e` shows 27 tests passing: the 17 that exist today, with 5 of them rewritten, plus these 10.

## Done means

- All four commands pass.
- `git status` shows only the 4 generated files and the 7 files in the Files table.
- Each of these planted bugs makes the named test fail. Check each one, then put the code back:
  - passing `"full"` instead of `motion` to `frameAt` fails scene-play test 8;
  - removing `onClick={play}` from the cue button fails scene-play test 6;
  - making the deep-link effect dispatch `goto` instead of `seek` fails scene-play test 7;
  - removing the `useClock` call fails scene-play tests 1 and 4.
- No comments, `any`, `as` casts or `!` assertions in the files you wrote.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Paste the failing output of the four planted bugs. Say whether you hit anything the spec did not cover, and what you did about it.
