# Step 6: player reducer

## Goal

The scene player's state is a time `t` plus a mode. This step adds `reducePlayer`, a pure function that takes a timeline, the current state and one event, and returns the next state. Every button and key, plus the clock, becomes one event:

- play and pause;
- next and previous step;
- first and last;
- scrubbing to a time;
- clicking a cue in the lesson text to play one step;
- the clock's tick.

The reducer does not know about reduced motion. `frameAt(..., "reduced")` from step 5 already shows a still frame for each step, so the reducer works the same way in both modes.

Nothing changes in the browser. Step 10 connects the reducer to React and a clock.

## Before you start

- Read `Instructions.md`. Use `pnpm` and `pnpm dlx` only. Never use `npm`, `npx`, `yarn` or `bun`.
- Load the tdd skill at `vendor/pstack/skills/tdd/SKILL.md` and follow it. Write `src/scene/player.test.ts` first and watch it fail.
- Run `pnpm install` first.
- Create only the two files listed below. Do not edit any other file, `package.json` and the other `src/scene/` files included.
- Do not add any dependency.
- Do not add code comments.

## Files

### `src/scene/player.ts` (new)

Export exactly these names: `PlayerState`, `PlayerEvent`, `RESTART_GRACE_MS`, `initialPlayer` and `reducePlayer`.

```ts
import { stepIndexAt, type Timeline } from "./timeline"

export type PlayerState =
  | { readonly mode: "paused"; readonly t: number }
  | { readonly mode: "playing"; readonly t: number }
  | { readonly mode: "stepping"; readonly t: number; readonly stopAt: number }

export type PlayerEvent =
  | { readonly type: "toggle" }
  | { readonly type: "pause" }
  | { readonly type: "next" }
  | { readonly type: "prev" }
  | { readonly type: "seek"; readonly t: number }
  | { readonly type: "goto"; readonly step: number }
  | { readonly type: "first" }
  | { readonly type: "last" }
  | { readonly type: "tick"; readonly dt: number }

export const RESTART_GRACE_MS = 600

export const initialPlayer: PlayerState = { mode: "paused", t: 0 }

export function reducePlayer(timeline: Timeline, state: PlayerState, event: PlayerEvent): PlayerState
```

The three modes:

- `paused` means `t` does not move.
- `playing` means `t` moves forward to the end of the timeline, then the player pauses there.
- `stepping` means `t` moves forward to `stopAt`, the end of one step, then the player pauses there. Next and cue clicks use it, so the learner sees exactly one step play and stop.

`reducePlayer` never throws. It accepts every event in every state. In the rules below, `duration` is `timeline.duration`, `steps` is `timeline.steps`, and `last` is `steps.length - 1`. "Paused at `x`" means `{ mode: "paused", t: x }`. "Stepping step `k`" means `{ mode: "stepping", t: steps[k].start, stopAt: steps[k].end }`.

| Event | Result |
| :--- | :--- |
| `toggle` | From `paused`, it gives `{ mode: "playing", t }`. If `t >= duration`, it restarts from 0 instead, so the result is `{ mode: "playing", t: 0 }`. From `playing` or `stepping`, it gives paused at `t`. |
| `pause` | Paused at `t`, from any mode. |
| `tick` | If the mode is `paused`, or `dt` is not greater than 0 (this includes `NaN`), return the same `state` object unchanged. Otherwise let `next = t + dt`. In `playing`, `next >= duration` gives paused at `duration`, and anything else gives `{ mode: "playing", t: next }`. In `stepping`, `next >= stopAt` gives paused at `stopAt`, and anything else gives the same mode and `stopAt` with `t: next`. |
| `next` | Let `i = stepIndexAt(timeline, t)`. If `t` equals `steps[i].start`, the target is `i`. Otherwise the target is `i + 1`. If the target is past `last`, the result is paused at `duration`. Otherwise it is stepping the target step. Stepping pauses at a step's end, which is the next step's start, so pressing next again plays that next step and never skips one. |
| `prev` | Let `i = stepIndexAt(timeline, t)`. If `i > 0` and `t - steps[i].start < RESTART_GRACE_MS`, the result is paused at `steps[i - 1].start`. Otherwise it is paused at `steps[i].start`. |
| `seek` | Paused at `event.t`, clamped to between 0 and `duration`. `NaN` becomes 0. |
| `goto` | Stepping step `k`. To get `k`, `NaN` becomes 0, then `Math.trunc` drops the fraction, then the result is clamped to between 0 and `last`. |
| `first` | Paused at 0. |
| `last` | Paused at `duration`. |

`prev` matches a music player's back button. Pressed early in a step, it goes back one more step. Pressed later, it restarts the current step.

Use a `switch` on `event.type` with one `case` per event and no `default`. Every branch except the unchanged `tick` returns a new object. The file has no `as` cast, no `any` and no `!` non-null assertion.

### `src/scene/player.test.ts` (new)

Vitest, node environment. Import `fixture` from `./fixtures` and use it for every test. Its steps start at 0, 1600, 3440 and 5640, and `duration` is 7240. Compare states with `toEqual` unless a test says otherwise. Use these exact test names:

1. `toggle from paused plays`. Paused at 500 gives `{ mode: "playing", t: 500 }`.
2. `toggle while playing pauses`. Playing at 500 gives paused at 500.
3. `toggle while stepping pauses`. Stepping at 2000 with `stopAt` 3440 gives paused at 2000.
4. `toggle at duration restarts from 0 playing`. Paused at 7240 gives `{ mode: "playing", t: 0 }`.
5. `pause keeps t in every mode`. Paused, playing and stepping at 900 all give paused at 900.
6. `tick advances t only when not paused`. Playing at 100 with `dt` 16 gives playing at 116. Paused at 100 with `dt` 16 returns the same object, checked with `toBe`.
7. `tick ignores a dt that is not positive`. Playing at 100 with `dt` 0, with `dt` -5 and with `dt` `NaN` each return the same object, checked with `toBe`.
8. `playing stops and pauses at duration`. Playing at 7000 with `dt` 500 gives paused at 7240. Playing at 7000 with `dt` 240 also gives paused at 7240.
9. `stepping stops at stopAt`. Stepping at 1600 with `stopAt` 3440 and `dt` 1000 gives stepping at 2600 with `stopAt` 3440. A second tick of 1000 gives paused at 3440, and so does a second tick of exactly 840.
10. `next from step 1 -> stepping at step 2 start with stopAt step 2 end`. Paused at 2000 gives `{ mode: "stepping", t: 3440, stopAt: 5640 }`.
11. `next exactly at a step start plays that step`. Paused at 1600 gives stepping at 1600 with `stopAt` 3440. `initialPlayer` gives stepping at 0 with `stopAt` 1600.
12. `next after each step finishes plays every step in order`. From `initialPlayer`, press next five times. After each press, tick by 16 until paused. The stepping starts are 0, 1600, 3440 and 5640, and the final state is paused at 7240.
13. `next on the last step goes to duration paused`. Paused at 6000 gives paused at 7240. Paused at 7240 also gives paused at 7240.
14. `prev within grace goes to the previous step start`. Paused at 2199 gives paused at 0.
15. `prev after grace goes to this step's start`. Paused at 2200 gives paused at 1600. Playing at 7000 gives paused at 5640.
16. `prev at 0 stays at 0`. Paused at 0 and paused at 300 both give paused at 0.
17. `seek clamps and pauses`. From playing at 100, a seek to 3000 gives paused at 3000. Seeks to -10, to 1e9 and to `NaN` give paused at 0, 7240 and 0.
18. `seek twice equals seek once`. From playing at 100, applying a seek to 3000 twice equals applying it once.
19. `goto plays exactly that step`. A goto of 2 from paused at 0 gives stepping at 3440 with `stopAt` 5640. A tick of 2000 gives stepping at 5440. A tick of 1000 then gives paused at 5640, not later.
20. `goto clamps the step index`. Gotos of -1, 99, 1.7 and `NaN` give stepping step 0, 3, 1 and 0.
21. `first/last`. From playing at 3000, `first` gives paused at 0 and `last` gives paused at 7240.
22. `every event keeps t inside the timeline`. Starting from `initialPlayer`, apply 2000 random events. Use the Park-Miller generator with seed 42, `seed = (seed * 16807) % 2147483647`. Pick each event type with equal chance. A seek's `t` is between -500 and 9000, a goto's `step` is between -1 and 5, and a tick's `dt` is between -50 and 350. After every event, check these three things:
    - `t` is a finite number from 0 to 7240;
    - in `stepping`, `stopAt` is one of the fixture's step ends;
    - in `stepping`, `t` is less than `stopAt`.

    Count the event types the generator picked, and assert that each of the nine types came up at least 100 times.

## Commands that must pass

Run each one from the worktree root and paste its full output in your report:

1. `pnpm install`
2. `pnpm build`
3. `pnpm test`, which shows 6 files and 105 tests passing.
4. `pnpm e2e`, which shows 4 tests passing.

## Done means

- All four commands exit 0.
- `git status` shows only `src/scene/player.ts` and `src/scene/player.test.ts`, both new.
- `package.json` and `pnpm-lock.yaml` are unchanged.
- `src/scene/player.ts` has no `as` cast, no `any`, no `!` non-null assertion, no `default` case and no comments.

## Report

List every file you changed. Paste the output of commands 2, 3 and 4. Show the first failing run of `player.test.ts`, from before `player.ts` existed. Say whether you hit anything the spec did not cover, and what you did about it.
