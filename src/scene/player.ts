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

const paused = (t: number): PlayerState => ({ mode: "paused", t })

export function reducePlayer(timeline: Timeline, state: PlayerState, event: PlayerEvent): PlayerState {
  const duration = timeline.duration
  const steps = timeline.steps
  const last = steps.length - 1

  switch (event.type) {
    case "toggle":
      if (state.mode === "paused") {
        return { mode: "playing", t: state.t >= duration ? 0 : state.t }
      }

      return paused(state.t)

    case "pause":
      return paused(state.t)

    case "tick": {
      if (state.mode === "paused" || !(event.dt > 0)) return state

      const next = state.t + event.dt

      if (state.mode === "playing") {
        return next >= duration ? paused(duration) : { mode: "playing", t: next }
      }

      return next >= state.stopAt ? paused(state.stopAt) : { mode: "stepping", t: next, stopAt: state.stopAt }
    }

    case "next": {
      const index = stepIndexAt(timeline, state.t)
      const target = state.t === steps[index].start ? index : index + 1

      if (target > last) return paused(duration)

      const step = steps[target]

      return { mode: "stepping", t: step.start, stopAt: step.end }
    }

    case "prev": {
      const index = stepIndexAt(timeline, state.t)
      const step = steps[index]

      if (index > 0 && state.t - step.start < RESTART_GRACE_MS) return paused(steps[index - 1].start)

      return paused(step.start)
    }

    case "seek": {
      const t = Number.isNaN(event.t) ? 0 : Math.min(Math.max(event.t, 0), duration)

      return paused(t)
    }

    case "goto": {
      const raw = Number.isNaN(event.step) ? 0 : Math.trunc(event.step)
      const index = Math.min(Math.max(raw, 0), last)
      const step = steps[index]

      return { mode: "stepping", t: step.start, stopAt: step.end }
    }

    case "first":
      return paused(0)

    case "last":
      return paused(duration)
  }
}
