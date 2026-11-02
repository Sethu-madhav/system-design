// src/scene/player.ts
//
// Owns: playback state. A pure reducer over a timeline. The React hook
// runs a rAF clock that dispatches `tick`; everything else is user input. The
// state is only `t` plus a mode, so it cannot disagree with the timeline.
//
// Modes:
//   paused   - t is still
//   playing  - t advances to duration, then paused
//   stepping - t advances to `stopAt` (the end of one step), then paused.
//              "Step forward" and "click a cue in the text" use this mode, so the
//              learner sees exactly one step play and stop.
//
// Reduced motion needs nothing here: t still advances, but frameAt(..., "reduced")
// returns the same still frame for every t inside a step, so the view changes
// only at step boundaries. One rule, owned by frameAt.

import type { Timeline } from "./timeline"

export type PlayerState =
  | { readonly mode: "paused"; readonly t: number }
  | { readonly mode: "playing"; readonly t: number }
  | { readonly mode: "stepping"; readonly t: number; readonly stopAt: number }

export type PlayerEvent =
  | { readonly type: "toggle" } // play/pause; at duration, restarts from 0
  | { readonly type: "pause" }
  | { readonly type: "next" } // jump to start of next step and play it through (stepping)
  | { readonly type: "prev" } // within RESTART_GRACE_MS of a step start -> previous step start, else this step's start; paused
  | { readonly type: "seek"; readonly t: number } // scrubber; pauses; clamps
  | { readonly type: "goto"; readonly step: number } // cue click / quiz "show me"; plays that step (stepping)
  | { readonly type: "first" }
  | { readonly type: "last" }
  | { readonly type: "tick"; readonly dt: number } // ms since previous tick; ignored when paused

export const RESTART_GRACE_MS = 600

export const initialPlayer: PlayerState = { mode: "paused", t: 0 }

/** Pure and total: every event is valid in every state. Applying the same seek/goto twice is a no-op the second time. */
export function reducePlayer(_tl: Timeline, _s: PlayerState, _e: PlayerEvent): PlayerState {
  // TODO: see mode table above. tick: t += dt; stop (paused) at stopAt or duration.
  // The reducer does not know about motion at all.
  throw new Error("not implemented")
}
