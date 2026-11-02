import { describe, expect, it } from "vitest"
import { fixture } from "./fixtures"
import { initialPlayer, reducePlayer, type PlayerEvent, type PlayerState } from "./player"

const paused = (t: number): PlayerState => ({ mode: "paused", t })
const playing = (t: number): PlayerState => ({ mode: "playing", t })
const stepping = (t: number, stopAt: number): PlayerState => ({ mode: "stepping", t, stopAt })

const parkMiller = () => {
  let seed = 42

  return () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
}

describe("reducePlayer", () => {
  it("toggle from paused plays", () => {
    expect(reducePlayer(fixture, paused(500), { type: "toggle" })).toEqual(playing(500))
  })

  it("toggle while playing pauses", () => {
    expect(reducePlayer(fixture, playing(500), { type: "toggle" })).toEqual(paused(500))
  })

  it("toggle while stepping pauses", () => {
    expect(reducePlayer(fixture, stepping(2000, 3440), { type: "toggle" })).toEqual(paused(2000))
  })

  it("toggle at duration restarts from 0 playing", () => {
    expect(reducePlayer(fixture, paused(7240), { type: "toggle" })).toEqual(playing(0))
  })

  it("pause keeps t in every mode", () => {
    expect(reducePlayer(fixture, paused(900), { type: "pause" })).toEqual(paused(900))
    expect(reducePlayer(fixture, playing(900), { type: "pause" })).toEqual(paused(900))
    expect(reducePlayer(fixture, stepping(900, 1600), { type: "pause" })).toEqual(paused(900))
  })

  it("tick advances t only when not paused", () => {
    expect(reducePlayer(fixture, playing(100), { type: "tick", dt: 16 })).toEqual(playing(116))

    const state = paused(100)

    expect(reducePlayer(fixture, state, { type: "tick", dt: 16 })).toBe(state)
  })

  it("tick ignores a dt that is not positive", () => {
    const state = playing(100)

    expect(reducePlayer(fixture, state, { type: "tick", dt: 0 })).toBe(state)
    expect(reducePlayer(fixture, state, { type: "tick", dt: -5 })).toBe(state)
    expect(reducePlayer(fixture, state, { type: "tick", dt: NaN })).toBe(state)
  })

  it("playing stops and pauses at duration", () => {
    expect(reducePlayer(fixture, playing(7000), { type: "tick", dt: 500 })).toEqual(paused(7240))
    expect(reducePlayer(fixture, playing(7000), { type: "tick", dt: 240 })).toEqual(paused(7240))
  })

  it("stepping stops at stopAt", () => {
    const first = reducePlayer(fixture, stepping(1600, 3440), { type: "tick", dt: 1000 })

    expect(first).toEqual(stepping(2600, 3440))
    expect(reducePlayer(fixture, first, { type: "tick", dt: 1000 })).toEqual(paused(3440))
    expect(reducePlayer(fixture, first, { type: "tick", dt: 840 })).toEqual(paused(3440))
  })

  it("next from step 1 -> stepping at step 2 start with stopAt step 2 end", () => {
    expect(reducePlayer(fixture, paused(2000), { type: "next" })).toEqual(stepping(3440, 5640))
  })

  it("next exactly at a step start plays that step", () => {
    expect(reducePlayer(fixture, paused(1600), { type: "next" })).toEqual(stepping(1600, 3440))
    expect(reducePlayer(fixture, initialPlayer, { type: "next" })).toEqual(stepping(0, 1600))
  })

  it("next after each step finishes plays every step in order", () => {
    let state: PlayerState = initialPlayer
    const played: number[] = []

    for (let press = 0; press < 5; press += 1) {
      state = reducePlayer(fixture, state, { type: "next" })
      if (state.mode === "stepping") played.push(state.t)
      while (state.mode !== "paused") state = reducePlayer(fixture, state, { type: "tick", dt: 16 })
    }

    expect(played).toEqual([0, 1600, 3440, 5640])
    expect(state).toEqual(paused(7240))
  })

  it("next on the last step goes to duration paused", () => {
    expect(reducePlayer(fixture, paused(6000), { type: "next" })).toEqual(paused(7240))
    expect(reducePlayer(fixture, paused(7240), { type: "next" })).toEqual(paused(7240))
  })

  it("prev within grace goes to the previous step start", () => {
    expect(reducePlayer(fixture, paused(2199), { type: "prev" })).toEqual(paused(0))
  })

  it("prev after grace goes to this step's start", () => {
    expect(reducePlayer(fixture, paused(2200), { type: "prev" })).toEqual(paused(1600))
    expect(reducePlayer(fixture, playing(7000), { type: "prev" })).toEqual(paused(5640))
  })

  it("prev at 0 stays at 0", () => {
    expect(reducePlayer(fixture, paused(0), { type: "prev" })).toEqual(paused(0))
    expect(reducePlayer(fixture, paused(300), { type: "prev" })).toEqual(paused(0))
  })

  it("seek clamps and pauses", () => {
    expect(reducePlayer(fixture, playing(100), { type: "seek", t: 3000 })).toEqual(paused(3000))
    expect(reducePlayer(fixture, playing(100), { type: "seek", t: -10 })).toEqual(paused(0))
    expect(reducePlayer(fixture, playing(100), { type: "seek", t: 1e9 })).toEqual(paused(7240))
    expect(reducePlayer(fixture, playing(100), { type: "seek", t: NaN })).toEqual(paused(0))
  })

  it("seek twice equals seek once", () => {
    const once = reducePlayer(fixture, playing(100), { type: "seek", t: 3000 })
    const twice = reducePlayer(fixture, once, { type: "seek", t: 3000 })

    expect(twice).toEqual(once)
  })

  it("goto plays exactly that step", () => {
    const start = reducePlayer(fixture, paused(0), { type: "goto", step: 2 })
    const middle = reducePlayer(fixture, start, { type: "tick", dt: 2000 })
    const end = reducePlayer(fixture, middle, { type: "tick", dt: 1000 })

    expect(start).toEqual(stepping(3440, 5640))
    expect(middle).toEqual(stepping(5440, 5640))
    expect(end).toEqual(paused(5640))
  })

  it("goto clamps the step index", () => {
    expect(reducePlayer(fixture, paused(0), { type: "goto", step: -1 })).toEqual(stepping(0, 1600))
    expect(reducePlayer(fixture, paused(0), { type: "goto", step: 99 })).toEqual(stepping(5640, 7240))
    expect(reducePlayer(fixture, paused(0), { type: "goto", step: 1.7 })).toEqual(stepping(1600, 3440))
    expect(reducePlayer(fixture, paused(0), { type: "goto", step: NaN })).toEqual(stepping(0, 1600))
  })

  it("first/last", () => {
    expect(reducePlayer(fixture, playing(3000), { type: "first" })).toEqual(paused(0))
    expect(reducePlayer(fixture, playing(3000), { type: "last" })).toEqual(paused(7240))
  })

  it("every event keeps t inside the timeline", () => {
    const random = parkMiller()
    const ends = fixture.steps.map((step) => step.end)
    const types: PlayerEvent["type"][] = [
      "toggle",
      "pause",
      "next",
      "prev",
      "seek",
      "goto",
      "first",
      "last",
      "tick",
    ]
    const counts: Record<PlayerEvent["type"], number> = {
      toggle: 0,
      pause: 0,
      next: 0,
      prev: 0,
      seek: 0,
      goto: 0,
      first: 0,
      last: 0,
      tick: 0,
    }
    let state = initialPlayer

    for (let n = 0; n < 2000; n += 1) {
      const kind = Math.floor(random() * types.length)
      let event: PlayerEvent

      if (kind === 0) {
        event = { type: "toggle" }
      } else if (kind === 1) {
        event = { type: "pause" }
      } else if (kind === 2) {
        event = { type: "next" }
      } else if (kind === 3) {
        event = { type: "prev" }
      } else if (kind === 4) {
        event = { type: "seek", t: -500 + random() * 9500 }
      } else if (kind === 5) {
        event = { type: "goto", step: -1 + random() * 6 }
      } else if (kind === 6) {
        event = { type: "first" }
      } else if (kind === 7) {
        event = { type: "last" }
      } else {
        event = { type: "tick", dt: -50 + random() * 400 }
      }

      counts[event.type] += 1
      state = reducePlayer(fixture, state, event)

      expect(Number.isFinite(state.t)).toBe(true)
      expect(state.t).toBeGreaterThanOrEqual(0)
      expect(state.t).toBeLessThanOrEqual(fixture.duration)

      if (state.mode === "stepping") {
        expect(ends).toContain(state.stopAt)
        expect(state.t).toBeLessThan(state.stopAt)
      }
    }

    for (const type of types) expect(counts[type]).toBeGreaterThanOrEqual(100)
  })
})
