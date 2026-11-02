import { edgeId, type EdgeId, type NodeDef, type PacketTone, type Scene, type SendAction } from "./model"

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
  readonly a: N
  readonly b: N
  readonly heads: "a->b" | "b->a" | "both"
}

export interface Flight<N extends string> {
  readonly key: string
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
  readonly world: Readonly<Record<N, NodeState>>
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
  readonly u: number
  readonly from: string
  readonly to: string
  readonly label: string
  readonly tone: PacketTone
}

export interface FrameNode extends NodeState {
  readonly focus: boolean
  readonly entering: boolean
  readonly note?: string
}

export interface Frame {
  readonly t: number
  readonly stepIndex: number
  readonly stepId: string
  readonly caption: string
  readonly nodes: Readonly<Record<string, FrameNode>>
  readonly edges: Readonly<Record<EdgeId, { readonly visible: boolean; readonly active: boolean }>>
  readonly packets: readonly PacketView[]
}

export class SceneError extends Error {}

const ID = /^[a-z][a-z0-9-]*$/

export function compile<N extends string, S extends string>(scene: Scene<N, S>): Timeline<N, S>
export function compile(scene: Scene<string, string>): Timeline<string, string> {
  if (scene.steps.length === 0) throw new SceneError("scene has no steps")

  const ids = Object.keys(scene.nodes)

  for (const id of ids) {
    if (!ID.test(id)) throw new SceneError(`bad node id ${id}`)
  }

  for (const step of scene.steps) {
    if (!ID.test(step.id)) throw new SceneError(`bad step id ${step.id}`)
  }

  for (const id of ids) {
    const cell: readonly number[] = scene.nodes[id].at

    if (cell.length !== 2 || !Number.isInteger(cell[0]) || !Number.isInteger(cell[1]) || cell[0] < 0 || cell[1] < 0) {
      throw new SceneError(`bad cell for ${id}`)
    }
  }

  const cells = new Map<string, string>()

  for (const id of ids) {
    const [col, row] = scene.nodes[id].at
    const key = `${col},${row}`
    const other = cells.get(key)

    if (other !== undefined) throw new SceneError(`${other} and ${id} share a cell`)

    cells.set(key, id)
  }

  const state: Record<string, NodeState> = {}

  for (const id of ids) {
    state[id] = { visible: scene.nodes[id].hidden !== true, status: "up" }
  }

  const steps: TimedStep<string, string>[] = []
  let start = 0

  const requireVisible = (node: string, step: string) => {
    if (!state[node].visible) throw new SceneError(`${node} is not visible in step ${step}`)
  }

  for (let index = 0; index < scene.steps.length; index += 1) {
    const entry = scene.steps[index]
    const before: Record<string, NodeState> = { ...state }

    for (const action of entry.def.actions) {
      if (action.a === "show") {
        for (const node of action.nodes) {
          if (state[node].visible) throw new SceneError(`show of visible node ${node} in step ${entry.id}`)
          state[node] = { ...state[node], visible: true }
        }
      } else if (action.a === "hide") {
        for (const node of action.nodes) {
          if (!state[node].visible) throw new SceneError(`hide of hidden node ${node} in step ${entry.id}`)
          state[node] = { ...state[node], visible: false }
        }
      } else if (action.a === "down") {
        const node = state[action.node]

        if (!node.visible || node.status === "down") throw new SceneError(`down of ${action.node} in step ${entry.id}`)

        state[action.node] = { ...node, status: "down" }
      } else if (action.a === "up") {
        const node = state[action.node]

        if (!node.visible || node.status === "up") throw new SceneError(`up of ${action.node} in step ${entry.id}`)

        state[action.node] = { ...node, status: "up" }
      }
    }

    const entering = ids.filter((id) => state[id].visible && !before[id].visible)
    const flights: Flight<string>[] = []
    const focus: string[] = []
    const notes: { node: string; text: string }[] = []
    let cursor = start + LEAD_MS
    let count = 0

    const addFlight = (send: SendAction<string>, t0: number) => {
      flights.push({
        key: `${index}:${count}`,
        edge: edgeId(send.from, send.to),
        from: send.from,
        to: send.to,
        label: send.label,
        tone: send.tone,
        t0,
        t1: t0 + SEND_MS,
      })
      count += 1
    }

    for (const action of entry.def.actions) {
      if (action.a === "send") {
        requireVisible(action.from, entry.id)
        requireVisible(action.to, entry.id)
        if (action.from === action.to) throw new SceneError(`send from ${action.from} to itself in step ${entry.id}`)
        addFlight(action, cursor)
        cursor += SEND_MS
      } else if (action.a === "parallel") {
        if (action.sends.length === 0) throw new SceneError(`empty parallel in step ${entry.id}`)

        for (const send of action.sends) {
          requireVisible(send.from, entry.id)
          requireVisible(send.to, entry.id)
          if (send.from === send.to) throw new SceneError(`send from ${send.from} to itself in step ${entry.id}`)
        }

        for (const send of action.sends) addFlight(send, cursor)

        cursor += SEND_MS
      } else if (action.a === "focus") {
        requireVisible(action.node, entry.id)
        if (!focus.includes(action.node)) focus.push(action.node)
      } else if (action.a === "note") {
        requireVisible(action.node, entry.id)
        if (notes.some((note) => note.node === action.node)) {
          throw new SceneError(`two notes on ${action.node} in step ${entry.id}`)
        }
        notes.push({ node: action.node, text: action.text })
      }
    }

    const end = start + Math.max(cursor - start + SETTLE_MS, readingTime(entry.def.caption))

    steps.push({
      id: entry.id,
      index,
      caption: entry.def.caption,
      start,
      end,
      world: { ...state },
      entering,
      flights,
      focus,
      notes,
    })

    start = end
  }

  const used: { id: EdgeId; a: string; b: string; ab: boolean; ba: boolean }[] = []
  const byId = new Map<EdgeId, (typeof used)[number]>()

  for (const step of steps) {
    for (const flight of step.flights) {
      let record = byId.get(flight.edge)

      if (record === undefined) {
        const separator = flight.edge.indexOf("~")
        record = {
          id: flight.edge,
          a: flight.edge.slice(0, separator),
          b: flight.edge.slice(separator + 1),
          ab: false,
          ba: false,
        }
        byId.set(flight.edge, record)
        used.push(record)
      }

      if (flight.from === record.a) {
        record.ab = true
      } else {
        record.ba = true
      }
    }
  }

  const edges = used.map((record): EdgeDef<string> => ({
    id: record.id,
    a: record.a,
    b: record.b,
    heads: record.ab && record.ba ? "both" : record.ab ? "a->b" : "b->a",
  }))

  return {
    nodes: scene.nodes,
    edges,
    steps,
    duration: steps[steps.length - 1].end,
  }
}

export function stepIndexAt(timeline: Timeline, t: number): number {
  if (!(t >= 0)) return 0

  for (let index = 0; index < timeline.steps.length; index += 1) {
    if (t < timeline.steps[index].end) return index
  }

  return timeline.steps.length - 1
}

export function frameAt(timeline: Timeline, t: number, motion: Motion): Frame {
  const clamped = Number.isNaN(t) ? 0 : Math.min(Math.max(t, 0), timeline.duration)
  const stepIndex = stepIndexAt(timeline, clamped)
  const step = timeline.steps[stepIndex]
  const packets: PacketView[] = []

  if (motion === "full") {
    for (const flight of step.flights) {
      if (flight.t0 <= clamped && clamped < flight.t1) {
        packets.push({
          key: flight.key,
          edge: flight.edge,
          u: ease((clamped - flight.t0) / (flight.t1 - flight.t0)),
          from: flight.from,
          to: flight.to,
          label: flight.label,
          tone: flight.tone,
        })
      }
    }
  }

  const nodes: Record<string, FrameNode> = {}

  for (const id of Object.keys(timeline.nodes)) {
    const state = step.world[id]
    const focus = step.focus.includes(id)
    const entering = step.entering.includes(id)
    const note = step.notes.find((entry) => entry.node === id)

    if (note === undefined) {
      nodes[id] = { visible: state.visible, status: state.status, focus, entering }
    } else {
      nodes[id] = { visible: state.visible, status: state.status, focus, entering, note: note.text }
    }
  }

  const edges: Record<EdgeId, { readonly visible: boolean; readonly active: boolean }> = {}

  for (const edge of timeline.edges) {
    const visible = step.world[edge.a].visible && step.world[edge.b].visible
    const active =
      motion === "full"
        ? packets.some((packet) => packet.edge === edge.id)
        : step.flights.some((flight) => flight.edge === edge.id)

    edges[edge.id] = { visible, active }
  }

  return {
    t: clamped,
    stepIndex,
    stepId: step.id,
    caption: step.caption,
    nodes,
    edges,
    packets,
  }
}

export function readingTime(caption: string): number {
  const words = caption.split(/\s+/).filter(Boolean).length

  return Math.min(Math.max(words * READ_MS_PER_WORD, MIN_STEP_MS), MAX_STEP_MS)
}

export function ease(p: number): number {
  return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
}
