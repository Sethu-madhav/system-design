// src/scene/timeline.ts
//
// Owns: time. `compile` turns a Scene into a Timeline once per lesson load;
// `frameAt` answers "what is on screen at time t" as a pure function. Because a
// frame depends only on (timeline, t, motion), play, pause, step back, and scrub
// are all just "set t". Nothing is replayed, nothing is mutated, and every case is
// a Vitest unit test with no browser.
//
// Durations are derived, not authored:
//   SEND_MS per sequential send (parallel group = one SEND_MS)
//   step length = max(LEAD_MS + motion + SETTLE_MS, reading time of caption)
//   reading time = clamp(words * READ_MS_PER_WORD, MIN_STEP_MS, MAX_STEP_MS)

import type { EdgeId, NodeDef, PacketTone, Scene } from "./model"

export const SEND_MS = 800
export const LEAD_MS = 200
export const SETTLE_MS = 400
export const READ_MS_PER_WORD = 230
export const MIN_STEP_MS = 1600
export const MAX_STEP_MS = 6000

export type Motion = "full" | "reduced"

export interface NodeState {
  readonly visible: boolean
  readonly status: "up" | "down"
}

export interface EdgeDef<N extends string> {
  readonly id: EdgeId
  readonly a: N // a < b lexically
  readonly b: N
  /** Arrowheads derived from which directions any send uses. */
  readonly heads: "a->b" | "b->a" | "both"
}

/** A packet's flight, relative to timeline start. */
export interface Flight<N extends string> {
  readonly key: string // `${stepIndex}:${n}` stable React key
  readonly edge: EdgeId
  readonly from: N
  readonly to: N
  readonly label: string
  readonly tone: PacketTone
  readonly t0: number
  readonly t1: number
}

export interface TimedStep<N extends string, S extends string> {
  readonly id: S
  readonly index: number
  readonly caption: string
  readonly start: number
  readonly end: number
  /** World after this step's persistent actions; precomputed so frameAt is O(nodes). */
  readonly world: Readonly<Record<N, NodeState>>
  /** Nodes that become visible at this step; the view draws them on. */
  readonly entering: readonly N[]
  readonly flights: readonly Flight<N>[]
  readonly focus: readonly N[]
  readonly notes: readonly { readonly node: N; readonly text: string }[]
}

export interface Timeline<N extends string = string, S extends string = string> {
  readonly nodes: Readonly<Record<N, NodeDef>>
  readonly edges: readonly EdgeDef<N>[]
  readonly steps: readonly TimedStep<N, S>[]
  readonly duration: number
}

export interface PacketView {
  readonly key: string
  readonly edge: EdgeId
  /** 0 at `from`, 1 at `to`, eased. */
  readonly u: number
  readonly from: string
  readonly to: string
  readonly label: string
  readonly tone: PacketTone
}

export interface Frame {
  readonly t: number
  readonly stepIndex: number
  readonly stepId: string
  readonly caption: string
  readonly nodes: Readonly<Record<string, NodeState & { readonly focus: boolean; readonly note?: string; readonly entering: boolean }>>
  /** visible when both ends visible; active when a packet uses it in this step. */
  readonly edges: Readonly<Record<EdgeId, { readonly visible: boolean; readonly active: boolean }>>
  /** Empty in reduced motion: packets do not travel; active edges carry the meaning. */
  readonly packets: readonly PacketView[]
}

export class SceneError extends Error {}

/**
 * Validates and times a scene. Throws SceneError on: zero steps, step id not
 * kebab-case starting with a letter, send between the same node, send touching a
 * node not visible in that step, two nodes in one cell, show of a visible node,
 * down of a down node.
 */
export function compile<N extends string, S extends string>(_scene: Scene<N, S>): Timeline<N, S> {
  // TODO:
  // world0 = nodes mapped to {visible: !hidden, status: "up"}
  // t = 0; for each step i:
  //   world = fold persistent actions over previous world (validate as listed)
  //   entering = nodes visible now but not before
  //   cursor = start + LEAD_MS; for each transient action in order:
  //     send -> flight [cursor, cursor + SEND_MS], cursor += SEND_MS
  //     parallel -> one flight per send, all [cursor, cursor + SEND_MS], cursor += SEND_MS
  //     focus/note -> collected
  //   length = max(cursor - start + SETTLE_MS, readingTime(caption))
  //   end = start + length; next start = end
  // edges = unique unordered pairs over all flights, heads from directions seen
  throw new Error("not implemented")
}

/** Index of the step containing t. t == end of step i belongs to step i+1, except at duration. */
export function stepIndexAt(_tl: Timeline, _t: number): number {
  throw new Error("not implemented")
}

/**
 * The frame at time t (clamped to [0, duration]).
 * reduced: no packets; edges of the step's flights are active for the whole step;
 * `entering` is still reported (the CSS draw-on is already 0 ms under reduced motion).
 */
export function frameAt(_tl: Timeline, _t: number, _motion: Motion): Frame {
  // TODO: i = stepIndexAt; step = steps[i]; nodes from step.world + focus/notes/entering;
  // packets = flights with t0 <= t < t1 mapped to u = easeInOut((t - t0) / (t1 - t0)).
  throw new Error("not implemented")
}

export function readingTime(_caption: string): number {
  throw new Error("not implemented")
}
