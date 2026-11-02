// src/scene/ink.ts
//
// Owns: how scene pieces look in ink. Module-scope recipes only (defineRecipe
// bumps a global revision). Each scene element is its own small ink host, so the
// ink for a node or edge is generated once per (kind, size bucket, seed) and then
// served from the LRU. Nothing step-dependent or time-dependent is ever a param:
//   - visibility, focus, down, active  -> data attributes + CSS on the host
//   - packet position                  -> CSS transform on a DOM element
//   - draw-on when a node enters       -> the reveal() mask + ll-draw keyframe,
//                                         which --ll-motion already zeroes
//
// Adding a NodeKind is a tsc error here until it has a shape (exhaustive Record).

import { defineRecipe, type Ink, type Box } from "@/lib/ink"
import type { NodeKind, PacketTone } from "./model"

type DrawNode = (ink: Ink, box: Box) => void

/** One shape per kind. Uses box/loopLines/cloudLines/... from @/lib/ink/shapes; db and queue are composed here. */
const NODE_SHAPES: Record<NodeKind, DrawNode> = {
  client: () => { throw new Error("not implemented") }, // box + small screen line
  internet: () => { throw new Error("not implemented") }, // cloud
  dns: () => { throw new Error("not implemented") }, // box with tab
  cdn: () => { throw new Error("not implemented") }, // cloud, dashed
  lb: () => { throw new Error("not implemented") }, // loop (ellipse)
  proxy: () => { throw new Error("not implemented") }, // loop, dashed
  server: () => { throw new Error("not implemented") }, // box with two rack lines
  service: () => { throw new Error("not implemented") }, // box, rounded
  cache: () => { throw new Error("not implemented") }, // box + lightning squiggle
  db: () => { throw new Error("not implemented") }, // cylinder: two loops + two lines
  queue: () => { throw new Error("not implemented") }, // box with vertical dividers
  worker: () => { throw new Error("not implemented") }, // box + gear asterisk
  storage: () => { throw new Error("not implemented") }, // bucket
}

export interface NodeInkParams {
  readonly kind: NodeKind
}

/** Layers: rest (the shape), focus (a loose circle, shown by CSS when data-focus). reveal() mask on rest for draw-on. */
export const sceneNodeRecipe = defineRecipe<NodeInkParams>({
  id: "scene-node",
  layers: ["rest", "focus"],
  pad: 14,
  draw(_ink, _box, _params, _ctx) {
    void NODE_SHAPES
    throw new Error("not implemented")
  },
})

export interface EdgeInkParams {
  /** Endpoints relative to the edge host, integers. */
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
  readonly heads: "a->b" | "b->a" | "both"
}

/** Layers: rest (pencil arrow), checked (heavier ink arrow, shown by CSS when data-active). */
export const sceneEdgeRecipe = defineRecipe<EdgeInkParams>({
  id: "scene-edge",
  layers: ["rest", "checked"],
  pad: 10,
  draw(_ink, _box, _params, _ctx) {
    throw new Error("not implemented")
  },
})

export interface PacketInkParams {
  readonly tone: PacketTone
}

/** A small envelope or dot; tone picks pen colour. Fixed size host (28x20). */
export const scenePacketRecipe = defineRecipe<PacketInkParams>({
  id: "scene-packet",
  layers: ["rest"],
  pad: 6,
  draw(_ink, _box, _params, _ctx) {
    throw new Error("not implemented")
  },
})

/** The red cross drawn over a node that is down. Separate host so the node ink is untouched. */
export const sceneDownRecipe = defineRecipe({
  id: "scene-down",
  layers: ["rest"],
  pad: 8,
  draw(_ink, _box, _params, _ctx) {
    throw new Error("not implemented")
  },
})
