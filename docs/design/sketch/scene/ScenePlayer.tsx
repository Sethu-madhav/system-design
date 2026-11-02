// src/scene/ScenePlayer.tsx
//
// Owns: the browser shell around the pure scene core. Thin by design: a reducer,
// a rAF clock, a frame from frameAt, and DOM. Three exports:
//
//   <SceneProvider timeline>   one player per lesson page; holds PlayerState
//   <ScenePlayer />            stage + caption + controls, reads the provider
//   useSceneCue(stepId)        { active, play } for anything outside the stage
//                              that points at a step: prose cues, quiz "show me"
//
// Prose and quiz never see PlayerState or dispatch; they only get a step's
// active flag and a play function. That keeps the reducer the single writer.

import * as React from "react"
import type { Timeline, Frame, Motion } from "./timeline"
import type { PlayerState, PlayerEvent } from "./player"

interface SceneContextValue {
  readonly timeline: Timeline
  readonly motion: Motion
  readonly state: PlayerState
  readonly frame: Frame
  readonly dispatch: (e: PlayerEvent) => void
}

const SceneContext = React.createContext<SceneContextValue | null>(null)

export interface SceneProviderProps {
  readonly timeline: Timeline
  /** Called once when the learner reaches the last step's end (progress fact). */
  readonly onFinish?: () => void
  readonly children: React.ReactNode
}

export function SceneProvider(_p: SceneProviderProps): React.ReactElement {
  // TODO:
  // motion = useMotion()  (matchMedia("(prefers-reduced-motion: reduce)") OR InkContext.motion === "reduced")
  // [state, dispatch] = useReducer((s, e) => reducePlayer(timeline, s, e), initialPlayer)
  // useClock(state.mode !== "paused", dt => dispatch({type: "tick", dt}))   // rAF, dt capped at 100 ms
  // frame = useMemo(() => frameAt(timeline, state.t, motion), [timeline, state.t, motion])
  // effect: when frame.stepIndex === last && state.mode === "paused" && t === duration -> onFinish once
  throw new Error("not implemented")
}

/**
 * Stage + caption + controls.
 * Stage: `relative isolate` box, width from useInkBox; layout = layoutScene(timeline, width).
 *   <SceneEdge> per edge, <SceneNode> per node, <ScenePacket> per frame.packets entry
 *   (transform: translate(pointOn(...))). Hosts carry data-visible / data-focus /
 *   data-down / data-active / data-entering; CSS shows/hides layers from those.
 * Caption: aria-live="polite", text = frame.caption, "Step i of n".
 * Controls (Looseleaf button, slider, kbd): first, prev, play/pause, next, last, scrubber.
 * Keys on the focused player: Space toggle, ArrowLeft prev, ArrowRight next, Home, End.
 * Test hooks on the root: data-testid="scene", data-step-id, data-mode, data-motion.
 */
export function ScenePlayer(): React.ReactElement {
  throw new Error("not implemented")
}

export interface SceneCue {
  readonly active: boolean
  readonly play: () => void // dispatch({type: "goto", step: index of stepId})
}

export function useSceneCue(_stepId: string): SceneCue {
  void SceneContext
  throw new Error("not implemented")
}
