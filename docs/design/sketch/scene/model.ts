// src/scene/model.ts
//
// Owns: how an animated system diagram is described. A scene is data, built by a
// two-stage typed builder so node ids and step ids are literal unions:
//
//   defineScene({ client: {...}, lb: {...} })   // fixes N = "client" | "lb"
//     .steps((s) => ({ arrive: s.step("caption", s.send("client", "lb")) }))  // fixes S
//
// Steps are an object, not an array: key order is play order (JS keeps insertion
// order for non-integer keys; compile() rejects integer-like ids), and a duplicate
// step id is a TS error. Edges are not authored. They are derived from sends, one
// per unordered node pair, so there is no edge list to keep in sync.

export type NodeKind =
  | "client"
  | "internet"
  | "dns"
  | "cdn"
  | "lb"
  | "proxy"
  | "server"
  | "service"
  | "cache"
  | "db"
  | "queue"
  | "worker"
  | "storage"

/** Grid cell, not pixels. layout.ts maps cells to pixels for the host width. */
export type Cell = readonly [col: number, row: number]

export interface NodeDef {
  readonly kind: NodeKind
  readonly label: string
  readonly at: Cell
  /** Starts hidden; a later `show` draws it on. */
  readonly hidden?: true
}

export type PacketTone = "request" | "response" | "data" | "error"

/** Persistent actions change world state from their step onward. */
export type PersistentAction<N extends string> =
  | { readonly a: "show"; readonly nodes: readonly N[] }
  | { readonly a: "hide"; readonly nodes: readonly N[] }
  | { readonly a: "down"; readonly node: N }
  | { readonly a: "up"; readonly node: N }

/** Transient actions exist only during their step. */
export type SendAction<N extends string> = {
  readonly a: "send"
  readonly from: N
  readonly to: N
  readonly label: string
  readonly tone: PacketTone
}

export type TransientAction<N extends string> =
  | SendAction<N>
  | { readonly a: "parallel"; readonly sends: readonly SendAction<N>[] }
  | { readonly a: "focus"; readonly node: N }
  | { readonly a: "note"; readonly node: N; readonly text: string }

export type Action<N extends string> = PersistentAction<N> | TransientAction<N>

export interface StepDef<N extends string> {
  readonly caption: string
  readonly actions: readonly Action<N>[]
}

/** Author-facing helpers. Every function returns plain data. */
export interface StepKit<N extends string> {
  step(caption: string, ...actions: Action<N>[]): StepDef<N>
  /** Sequential within a step: the second send starts when the first lands. */
  send(from: N, to: N, label?: string, tone?: PacketTone): SendAction<N>
  /** Sends that travel at the same time (fan-out, replication). */
  parallel(...sends: SendAction<N>[]): TransientAction<N>
  show(...nodes: N[]): PersistentAction<N>
  hide(...nodes: N[]): PersistentAction<N>
  down(node: N): PersistentAction<N>
  up(node: N): PersistentAction<N>
  focus(node: N): TransientAction<N>
  note(node: N, text: string): TransientAction<N>
}

export interface Scene<N extends string = string, S extends string = string> {
  readonly nodes: Readonly<Record<N, NodeDef>>
  /** In play order. */
  readonly steps: readonly { readonly id: S; readonly def: StepDef<N> }[]
}

export interface SceneBuilder<N extends string> {
  steps<const T extends Record<string, StepDef<N>>>(fn: (s: StepKit<N>) => T): Scene<N, Extract<keyof T, string>>
}

export function defineScene<const T extends Record<string, NodeDef>>(_nodes: T): SceneBuilder<Extract<keyof T, string>> {
  throw new Error("not implemented")
}

/** Identity for an undirected node pair; derived, sorted, so a->b and b->a share an edge. */
export type EdgeId = `${string}~${string}`

export function edgeId<N extends string>(_a: N, _b: N): EdgeId {
  throw new Error("not implemented")
}
