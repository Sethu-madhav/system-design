export type NodeKind =
  | "client" | "internet" | "dns" | "cdn" | "lb" | "proxy" | "server"
  | "service" | "cache" | "db" | "queue" | "worker" | "storage"

export type Cell = readonly [col: number, row: number]

export interface NodeDef {
  readonly kind: NodeKind
  readonly label: string
  readonly at: Cell
  readonly hidden?: true
}

export type PacketTone = "request" | "response" | "data" | "error"

export type PersistentAction<N extends string> =
  | { readonly a: "show"; readonly nodes: readonly N[] }
  | { readonly a: "hide"; readonly nodes: readonly N[] }
  | { readonly a: "down"; readonly node: N }
  | { readonly a: "up"; readonly node: N }

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

export interface StepKit<N extends string> {
  step(caption: string, ...actions: Action<N>[]): StepDef<N>
  send(from: N, to: N, label?: string, tone?: PacketTone): SendAction<N>
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
  readonly steps: readonly { readonly id: S; readonly def: StepDef<N> }[]
}

export interface SceneBuilder<N extends string> {
  steps<const T extends Record<string, StepDef<N>>>(fn: (s: StepKit<N>) => T): Scene<N, Extract<keyof T, string>>
}

export type EdgeId = `${string}~${string}`

export function defineScene<const T extends Record<string, NodeDef>>(nodes: T): SceneBuilder<Extract<keyof T, string>>
export function defineScene(nodes: Record<string, NodeDef>): SceneBuilder<string> {
  const kit: StepKit<string> = {
    step: (caption, ...actions) => ({ caption, actions }),
    send: (from, to, label = "", tone = "request") => ({ a: "send", from, to, label, tone }),
    parallel: (...sends) => ({ a: "parallel", sends }),
    show: (...nodes) => ({ a: "show", nodes }),
    hide: (...nodes) => ({ a: "hide", nodes }),
    down: (node) => ({ a: "down", node }),
    up: (node) => ({ a: "up", node }),
    focus: (node) => ({ a: "focus", node }),
    note: (node, text) => ({ a: "note", node, text }),
  }

  return {
    steps: <T extends Record<string, StepDef<string>>>(fn: (s: StepKit<string>) => T) => {
      const defs = fn(kit)

      return {
        nodes,
        steps: Object.entries(defs).map(([id, def]) => ({ id: id as Extract<keyof T, string>, def })),
      }
    },
  }
}

export function edgeId(a: string, b: string): EdgeId {
  return a < b ? `${a}~${b}` : `${b}~${a}`
}
